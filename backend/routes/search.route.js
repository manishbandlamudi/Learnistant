import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
});

// Initialize Google Gemini (COMPLETELY FREE)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("Gemini Key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

// Encode image
const encodeImageToBase64 = (filePath) => {
  try {
    return fs.readFileSync(filePath).toString("base64");
  } catch (error) {
    console.error("Error reading image file:", error);
    return null;
  }
};

// Get media type
const getImageMediaType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mediaTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mediaTypes[ext] || "image/jpeg";
};

// Chat endpoint
router.post("/chat", upload.single("image"), async (req, res) => {
  try {
    const { message } = req.body;
    const imageFile = req.file;

    if (!message && !imageFile) {
      return res.status(400).json({ error: "Message or image is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Gemini API key not configured. Get free API key at https://ai.google.dev/" 
      });
    }

    // Choose model based on whether we have an image
    const model = genAI.getGenerativeModel({ 
      model: imageFile ? "gemini-1.5-flash" : "gemini-1.5-flash" 
    });

    let prompt = [];

    // Add text message
    if (message?.trim()) {
      prompt.push(message.trim());
    }

    // Add image if provided
    if (imageFile) {
      const base64Image = encodeImageToBase64(imageFile.path);
      const mediaType = getImageMediaType(imageFile.path);
      
      if (base64Image) {
        prompt.push({
          inlineData: {
            data: base64Image,
            mimeType: mediaType,
          },
        });

        // Add default prompt if no text message
        if (!message?.trim()) {
          prompt.unshift("Please analyze this image and describe what you see in detail.");
        }
      }

      // Clean up uploaded file
      fs.unlink(imageFile.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Call Google Gemini API (COMPLETELY FREE)
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text() || "I could not generate a response.";

    res.json({
      success: true,
      response: responseText,
      hasImage: !!imageFile,
      messageLength: message?.length || 0,
      model: imageFile ? "gemini-1.5-flash" : "gemini-1.5-flash",
      provider: "Google Gemini (Free)"
    });

  } catch (error) {
    console.error("Gemini API Error:", error);

    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    if (error.message?.includes('quota')) {
      return res.status(429).json({
        error: "Gemini rate limit exceeded. Please try again in a few minutes.",
      });
    }

    res.status(500).json({
      error: error.message || "Internal server error",
      provider: "Google Gemini"
    });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "search-api",
    provider: "Google Gemini (100% Free)",
    gemini: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});
export default router;
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// ✅ Configure Cloudinary using environment variables for security
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) {
      console.warn("⚠️ No file path provided to uploadOnCloudinary");
      return null;
    }

    // Check if file exists before attempting upload
    if (!fs.existsSync(filePath)) {
      console.error("❌ File does not exist:", filePath);
      return null;
    }

    console.log("📤 Uploading file to Cloudinary:", filePath);

    // Upload the file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: 'assistants', // Optional: organize uploads in a folder
      transformation: [
        { width: 500, height: 500, crop: 'fill' }, // Optional: resize images
        { quality: 'auto' } // Optional: optimize quality
      ]
    });

    console.log("✅ Cloudinary upload successful:", uploadResult.secure_url);

    // File has been uploaded successfully - remove the temporary file
    try {
      fs.unlinkSync(filePath);
      console.log("🗑️ Temporary file cleaned up:", filePath);
    } catch (cleanupError) {
      console.warn("⚠️ Failed to clean up temporary file:", cleanupError);
      // Don't throw error for cleanup failure
    }

    return uploadResult.secure_url;

  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error);

    // Clean up the temporary file even if upload failed
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🗑️ Temporary file cleaned up after error:", filePath);
      }
    } catch (cleanupError) {
      console.warn("⚠️ Failed to clean up temporary file after error:", cleanupError);
    }

    return null; // Return null on failure
  }
};

export default uploadOnCloudinary;
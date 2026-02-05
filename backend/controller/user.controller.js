import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";

// Get current logged-in user
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ getCurrentUser success:", user._id);
    
    // ✅ Return plain user object
    return res.status(200).json(user);
  } catch (error) {
    console.error("❌ getCurrentUser error:", error);
    return res.status(500).json({ message: "Failed to fetch current user" });
  }
};

// Update assistant name & image
export const updateUser = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { assistantName, imageUrl } = req.body;
    
    // Validate assistant name
    if (!assistantName || !assistantName.trim()) {
      return res.status(400).json({ message: "Assistant name is required" });
    }

    let assistantImage = imageUrl || "";

    console.log("📝 Update request:", {
      userId,
      assistantName: assistantName.trim(),
      hasFile: !!req.file,
      imageUrl
    });

    // If file uploaded → upload to Cloudinary
    if (req.file) {
      console.log("📤 Uploading to Cloudinary...");
      try {
        assistantImage = await uploadOnCloudinary(req.file.path);
        if (!assistantImage) {
          return res.status(500).json({ message: "Failed to upload image to Cloudinary" });
        }
        console.log("✅ Cloudinary upload success:", assistantImage);
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        assistantName: assistantName.trim(), 
        assistantImage 
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found for update" });
    }

    console.log("✅ User updated successfully:", {
      userId: updatedUser._id,
      assistantName: updatedUser.assistantName,
      assistantImage: updatedUser.assistantImage
    });

    // ✅ Return plain user object
    return res.status(200).json(updatedUser);
    
  } catch (error) {
    console.error("❌ updateUser error:", error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        details: error.message 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    return res.status(500).json({ message: "Update Assistant Error" });
  }
};
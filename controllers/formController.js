const axios = require("axios");
const cloudinary = require("../config/cloud");
const { insertSubmission } = require("../models/submissionModel");
const { faceSwapAPI } = require("../services/faceSwapService");

// Upload swapped image to Cloudinary
async function uploadSwappedImageToCloudinary(swappedUrl) {
  try {
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1e9);
    const publicId = `face-swap/swapped/swapped-${timestamp}-${randomNum}`;

    const uploadResult = await cloudinary.uploader.upload(swappedUrl, {
      public_id: publicId,
      folder: "face-swap/swapped",
      resource_type: "image",
    });

    console.log("✅ Swapped image uploaded:", uploadResult.secure_url);
    return uploadResult.secure_url;
  } catch (error) {
    console.error("❌ Failed to upload swapped image:", error.message);
    return swappedUrl; // fallback
  }
}

const submitForm = async (req, res) => {
  try {
    const { name, email, phone, terms } = req.body;
    const file = req.file;

    if (!file || !file.secure_url) {
      throw new Error("Original image upload failed");
    }

    const originalUrl = file.secure_url; // Use secure_url for display
    const styleUrl = process.env.STYLE_IMAGE_URL;

    console.log("🔗 URLs:", { originalUrl, styleUrl });

    // Perform face swap
    let swappedUrl;
    try {
      const apiResult = await faceSwapAPI(originalUrl, styleUrl);
      swappedUrl = await uploadSwappedImageToCloudinary(apiResult.outputUrl);
    } catch (err) {
      console.error("❌ Face swap failed:", err.message);
      throw new Error(`Face swap failed: ${err.message}`);
    }

    const submission = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      termsAccepted: terms === "on" || terms === true,
      originalImage: originalUrl, // secure_url
      swappedImage: swappedUrl, // secure_url
      createdAt: new Date(),
    };

    await insertSubmission(submission);
    return res.redirect("/submissions");
  } catch (err) {
    console.error("💥 submitForm error:", err.message);
    return res.status(500).render("form", {
      errors: [{ param: "server", msg: `Submission failed: ${err.message}` }],
      old: req.body || {},
    });
  }
};

module.exports = { submitForm };

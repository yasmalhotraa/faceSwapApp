// controllers/formController.js
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { insertSubmission } = require("../models/submissionModel");
const { faceSwapAPI } = require("../services/faceSwapService");

// Function to download and save swapped image locally
async function downloadSwappedImage(swappedUrl, originalFilename) {
  try {
    console.log("📥 Downloading swapped image from:", swappedUrl);

    // Create swapped directory if it doesn't exist
    const swappedDir = path.join(__dirname, "../public/uploads/swapped");
    if (!fs.existsSync(swappedDir)) {
      fs.mkdirSync(swappedDir, { recursive: true });
    }

    // Generate filename for swapped image
    const ext = path.extname(originalFilename) || ".jpg";
    const baseName = path.basename(originalFilename, ext);
    const swappedFilename = `swapped-${baseName}${ext}`;
    const swappedPath = path.join(swappedDir, swappedFilename);

    // Download the image
    const response = await axios.get(swappedUrl, {
      responseType: "stream",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FaceSwapApp/1.0)",
      },
    });

    // Save the image
    const writer = fs.createWriteStream(swappedPath);
    response.data.pipe(writer);

    // Wait for the download to complete
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log("✅ Swapped image saved locally:", swappedPath);

    // Return local URL
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    return `${baseUrl}/uploads/swapped/${swappedFilename}`;
  } catch (error) {
    console.error("❌ Failed to download swapped image:", error.message);
    return swappedUrl; // Return original URL as fallback
  }
}

const submitForm = async (req, res) => {
  try {
    const { name, email, phone, terms } = req.body;
    const file = req.file;

    console.log("📝 Form submission received:");
    console.log("- Name:", name);
    console.log("- Email:", email);
    console.log("- Phone:", phone);
    console.log("- Terms:", terms);
    console.log(
      "- File:",
      file
        ? {
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path,
          }
        : "No file"
    );

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const originalUrl = `${baseUrl}/uploads/original/${file.filename}`;
    const styleUrl = process.env.STYLE_IMAGE_URL;

    console.log("🔗 URLs:");
    console.log("- Original:", originalUrl);
    console.log("- Style:", styleUrl);

    let swappedUrl;

    // TEMPORARILY DISABLE FALLBACK TO SEE THE REAL ERROR
    try {
      console.log("🎭 Starting face swap process...");
      const apiResult = await faceSwapAPI(file.path, styleUrl);
      const externalSwappedUrl = apiResult.outputUrl;
      console.log("✅ Face swap successful:", externalSwappedUrl);

      // Download and save the swapped image locally
      swappedUrl = await downloadSwappedImage(
        externalSwappedUrl,
        file.filename
      );
      console.log("💾 Swapped image saved locally:", swappedUrl);
    } catch (err) {
      console.error("❌ Face swap failed with error:", err.message);
      throw new Error(`Face swap failed: ${err.message}`);

      // UNCOMMENT THIS BLOCK ONCE FACE SWAP IS WORKING:
      /*
      console.warn("Face swap failed, using placeholder copy.");
      const swappedFilename = `swapped-${file.filename}`;
      const originalPath = path.join(
        __dirname,
        "../public/uploads/original",
        file.filename
      );
      const swappedPath = path.join(
        __dirname,
        "../public/uploads/swapped",
        swappedFilename
      );
      
      // Ensure swapped directory exists
      const swappedDir = path.dirname(swappedPath);
      if (!fs.existsSync(swappedDir)) {
        fs.mkdirSync(swappedDir, { recursive: true });
      }
      
      fs.copyFileSync(originalPath, swappedPath);
      swappedUrl = `${baseUrl}/uploads/swapped/${swappedFilename}`;
      */
    }

    const submission = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      termsAccepted: terms === "on" || terms === true,
      originalImage: originalUrl,
      swappedImage: swappedUrl,
      createdAt: new Date(),
    };

    console.log("💾 Saving submission to database:", submission);
    await insertSubmission(submission);

    console.log(
      "✅ Submission saved successfully, redirecting to /submissions"
    );
    return res.redirect("/submissions");
  } catch (err) {
    console.error("💥 submitForm error:", err.message);
    console.error("Stack trace:", err.stack);

    // Clean up uploaded file if submission fails
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("🗑️ Cleaned up uploaded file");
      } catch (cleanupErr) {
        console.error("Failed to cleanup file:", cleanupErr.message);
      }
    }

    return res.status(500).render("form", {
      errors: [{ param: "server", msg: `Submission failed: ${err.message}` }],
      old: req.body || {},
    });
  }
};

module.exports = { submitForm };

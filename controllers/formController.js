const path = require("path");
const fs = require("fs");
const { insertSubmission } = require("../models/submissionModel");

// This is a placeholder for face swap logic
async function faceSwap(originalPath, swappedPath) {
  // For now, let's just copy the file as a placeholder
  fs.copyFileSync(originalPath, swappedPath);
  return swappedPath;
}

const submitForm = async (req, res) => {
  try {
    const { name, email, phone, terms } = req.body;
    const originalImage = req.file.filename;

    const swappedFilename = `swapped-${originalImage}`;
    const originalPath = path.join(
      __dirname,
      "../public/uploads/original",
      originalImage
    );
    const swappedPath = path.join(
      __dirname,
      "../public/uploads/swapped",
      swappedFilename
    );

    // Call face swap logic
    await faceSwap(originalPath, swappedPath);

    // Save submission in DB
    const submission = {
      name,
      email,
      phone,
      termsAccepted: terms === "on",
      originalImage,
      swappedImage: swappedFilename,
      createdAt: new Date(),
    };

    const id = await insertSubmission(submission);

    res.send({ message: "Submission saved successfully!", id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Submission failed!");
  }
};

module.exports = { submitForm };

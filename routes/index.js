const express = require("express");
const router = express.Router();
const { insertSubmission } = require("../models/submissionModel");
const { uploadWithCloudinary } = require("../middlewares/upload");
const formController = require("../controllers/formController");
const { submitValidationRules } = require("../middlewares/validate");
const submissionController = require("../controllers/submissionController");
const axios = require("axios");

// Home form
router.get("/", (req, res) => {
  res.render("form", { errors: null, old: {} });
});

// Terms & Conditions page
router.get("/terms", (req, res) => {
  res.render("terms");
});

// Cloudinary download proxy route
router.get("/download", async (req, res) => {
  const { url, name } = req.query;

  if (!url || !name) return res.status(400).send("Missing URL or filename");

  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    res.set({
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Type": "image/jpeg",
    });
    res.send(buffer);
  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).send("Failed to download image");
  }
});

// Handle form submission
router.post(
  "/submit",
  ...uploadWithCloudinary("image"),
  submitValidationRules,
  formController.submitForm
);

// List all submissions
router.get("/submissions", submissionController.getSubmissionsPage);

module.exports = router;

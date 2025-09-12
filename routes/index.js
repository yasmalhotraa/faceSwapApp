//routes/index.js
const express = require("express");
const router = express.Router();
const connectToDB = require("../config/db");
const {
  insertSubmission,
  getAllSubmissions,
} = require("../models/submissionModel");
const upload = require("../middlewares/upload");
const formController = require("../controllers/formController");
const { submitValidationRules } = require("../middlewares/validate");

// Temporary GET /
router.get("/", (req, res) => {
  res.render("form", { errors: null, old: {} });
});

// Test DB connection
router.get("/testdb", async (req, res) => {
  try {
    const db = await connectToDB();
    const testCollection = db.collection("test");
    const result = await testCollection.insertOne({
      message: "Hello MongoDB!",
      createdAt: new Date(),
    });
    res.send(`Inserted test document with ID: ${result.insertedId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Test Failed");
  }
});

router.get("/test-submission", async (req, res) => {
  try {
    const newSubmission = {
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      termsAccepted: true,
      originalImage: "original.jpg",
      swappedImage: "swapped.jpg",
      createdAt: new Date(),
    };

    const id = await insertSubmission(newSubmission);
    const all = await getAllSubmissions();
    res.send({ insertedId: id, submissions: all });
  } catch (err) {
    console.error(err);
    res.status(500).send("Test Submission Failed");
  }
});

// POST /submit route with upload and validation middlewares
router.post(
  "/submit",
  upload.single("image"),
  submitValidationRules,
  formController.submitForm
);

router.get("/submissions", async (req, res) => {
  const submissions = await getAllSubmissions();
  res.render("submissions", { submissions });
});

module.exports = router;

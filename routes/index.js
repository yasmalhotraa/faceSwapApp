const express = require("express");
const router = express.Router();
const connectToDB = require("../config/db");
const {
  insertSubmission,
  getAllSubmissions,
} = require("../models/submissionModel");
const upload = require("../middlewares/upload");
const formController = require("../controllers/formController");

// Temporary GET /
router.get("/", (req, res) => {
  res.render("form", { errors: null });
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

router.post("/submit", upload.single("image"), formController.submitForm);

module.exports = router;

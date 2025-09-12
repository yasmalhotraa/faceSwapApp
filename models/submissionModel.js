// models/submissionModel.js
const { ObjectId } = require("mongodb");
const connectToDB = require("../config/db");

// Insert a new submission
async function insertSubmission(submission) {
  const db = await connectToDB();
  const result = await db.collection("submissions").insertOne(submission);
  return result.insertedId;
}

// Get all submissions
async function getAllSubmissions() {
  const db = await connectToDB();
  return db.collection("submissions").find().sort({ createdAt: -1 }).toArray();
}

// Get one submission by ID
async function getSubmissionById(id) {
  const db = await connectToDB();
  return db.collection("submissions").findOne({ _id: new ObjectId(id) });
}

module.exports = {
  insertSubmission,
  getAllSubmissions,
  getSubmissionById,
};

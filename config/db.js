// config/db.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

let db; // Singleton for DB connection

async function connectToDB() {
  if (db) return db; // Return existing connection if exists

  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect(); // Connect to MongoDB Atlas
    console.log("✅ Connected to MongoDB Atlas");

    db = client.db(process.env.DB_NAME); // Use DB_NAME from .env
    return db;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Stop app if DB fails
  }
}

module.exports = connectToDB;

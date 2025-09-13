// config/db.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

let db;

async function connectToDB() {
  if (db) return db;

  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect(); // Connect to MongoDB Atlas
    console.log("✅ Connected to MongoDB Atlas");

    db = client.db(process.env.DB_NAME); // Using DB_NAME from .env
    return db;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // This will stop the application if DB fails
  }
}

module.exports = connectToDB;

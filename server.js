require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const multer = require("multer");
const routes = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// ✅ Security & Body Parsing
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("public/uploads")); // serve uploaded files

// ✅ View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Routes
app.use("/", routes);

// ✅ Centralized Error Handler (AFTER all routes)
app.use(errorHandler);

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);

require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const multer = require("multer");

const app = express();

// Middleware
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded files as static URLs
app.use("/uploads", express.static("public/uploads"));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
const routes = require("./routes/index");
app.use("/", routes);

// Error handling middleware (after all routes)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === "LIMIT_FILE_SIZE" ? "Image must be <= 2 MB" : err.message;
    return res
      .status(400)
      .render("form", { errors: [{ param: "image", msg }], old: req.body });
  }
  console.error(err);
  return res.status(500).render("form", {
    errors: [{ param: "server", msg: "Server error" }],
    old: req.body,
  });
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);

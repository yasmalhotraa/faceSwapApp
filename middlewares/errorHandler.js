const multer = require("multer");

// Centralized error handler middleware
function errorHandler(err, req, res, next) {
  console.error("❌ Error Handler:", err);

  // ✅ Handle Multer errors (like file size limits)
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === "LIMIT_FILE_SIZE" ? "Image must be ≤ 2 MB" : err.message;

    return res.status(400).render("form", {
      errors: [{ param: "image", msg }],
      old: req.body,
    });
  }

  // ✅ Handle custom app errors (if you throw {status, message})
  if (err.status) {
    return res.status(err.status).render("form", {
      errors: [{ param: "server", msg: err.message }],
      old: req.body,
    });
  }

  // ✅ Fallback to generic 500
  return res.status(500).render("form", {
    errors: [{ param: "server", msg: "Internal Server Error" }],
    old: req.body,
  });
}

module.exports = errorHandler;

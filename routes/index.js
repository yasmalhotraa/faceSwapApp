const express = require("express");
const router = express.Router();

// Temporary GET /
router.get("/", (req, res) => {
  res.render("form", { errors: null });
});

module.exports = router;

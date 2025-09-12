// middlewares/validate.js
const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");

/**
 * Validation + sanitization
 * - Validates name, email, phone, terms
 * - Ensures req.file exists (Multer should run before this)
 * - Sanitizes textual fields using sanitize-html (no tags allowed)
 * - If errors: renders the form view with errors (server-rendered flow)
 */

const submitValidationRules = [
  // Name: alphabet + spaces only, length 4-30
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 4, max: 30 })
    .withMessage("Name must be 4-30 characters")
    .matches(/^[A-Za-z ]+$/)
    .withMessage("Name must contain letters and spaces only"),

  // Email: required + valid
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  // Phone: exactly 10 digits
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .matches(/^\d{10}$/)
    .withMessage("Phone must be exactly 10 digits"),

  // Terms: must be checked
  body("terms").custom((val) => {
    if (val === "on" || val === true || val === "true") return true;
    throw new Error("Terms must be accepted");
  }),

  // After validations above, check results and sanitize
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Convert to simple array for the view
      const extractedErrors = errors
        .array()
        .map((err) => ({ param: err.param, msg: err.msg }));
      // render the form again with errors and old values (server-rendered)
      return res
        .status(400)
        .render("form", { errors: extractedErrors, old: req.body });
    }

    // Ensure file uploaded (Multer runs before this middleware)
    if (!req.file) {
      return res
        .status(400)
        .render("form", {
          errors: [{ param: "image", msg: "Image is required" }],
          old: req.body,
        });
    }

    // Sanitization: strip HTML tags completely and ensure strings
    req.body.name = sanitizeHtml(String(req.body.name || ""), {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
    req.body.email = sanitizeHtml(String(req.body.email || ""), {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
    req.body.phone = sanitizeHtml(String(req.body.phone || ""), {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    // Normalize terms to boolean for later use
    req.body.terms =
      req.body.terms === "on" ||
      req.body.terms === true ||
      req.body.terms === "true";

    return next();
  },
];

module.exports = {
  submitValidationRules,
};

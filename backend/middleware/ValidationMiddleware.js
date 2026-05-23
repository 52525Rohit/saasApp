const { validationResult, body } = require("express-validator");
const { AppError } = require("../Utilities/appError");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors
      .array()
      .map((e) => ({ field: e.path, message: e.msg }));
    return next(new AppError("Validation failed", 422, formatted));
  }
  next();
};

// ─── Auth validators ─────────────────────────────────────────────────────────
const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"), // ✅ was firstName/lastName
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password min 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
];

const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
];

const forgotPasswordRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
];

const resetPasswordRules = [
  body("token").notEmpty().withMessage("Token required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password min 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
];

const changePasswordRules = [
  body("currentPassword").notEmpty().withMessage("Current password required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password min 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
];

const updateProfileRules = [
  body("name").optional().trim().isLength({ min: 1, max: 100 }), // ✅ was firstName/lastName
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
  updateProfileRules,
};

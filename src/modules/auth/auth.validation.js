const { body } = require("express-validator");
const allowedRoles = ["farmer", "buyer", "supplier"];

exports.registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Please include a valid email").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(allowedRoles).withMessage("Invalid role"),
  body("roles").optional().isArray({ min: 1 }).withMessage("Choose at least one valid role"),
  body("roles.*").optional().isIn(allowedRoles).withMessage("Invalid role"),
];

exports.loginValidation = [
  body("email").trim().isEmail().withMessage("Please include a valid email").normalizeEmail(),
  body("password").exists().withMessage("Password is required"),
];

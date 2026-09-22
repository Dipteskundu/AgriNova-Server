const { body } = require("express-validator");

const ALL_ROLES = ["farmer", "buyer", "supplier", "inspector", "logistics", "support", "admin"];
const SELF_REGISTER_ROLES = ["farmer", "buyer", "supplier"];

exports.registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please include a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("roles")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Roles must be a non-empty array"),
  body("roles.*")
    .optional()
    .isIn(ALL_ROLES)
    .withMessage(`Invalid role. Allowed: ${SELF_REGISTER_ROLES.join(", ")}`),
  body("role")
    .optional()
    .isIn(SELF_REGISTER_ROLES)
    .withMessage(`Invalid role. Allowed: ${SELF_REGISTER_ROLES.join(", ")}`),
];

exports.loginValidation = [
  body("email").isEmail().withMessage("Please include a valid email"),
  body("password").exists().withMessage("Password is required"),
];

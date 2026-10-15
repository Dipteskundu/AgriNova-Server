const express = require("express");
const { validationResult } = require("express-validator");
const router = express.Router();
const authController = require("./auth.controller");
const auth = require("../../middleware/auth.middleware");
const { registerValidation, loginValidation } = require("./auth.validation");

const rejectInvalidRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  next();
};

router.post("/register", registerValidation, rejectInvalidRequest, authController.register);
router.post("/login", loginValidation, rejectInvalidRequest, authController.login);
router.post("/social", authController.socialAuth);
router.get("/me", auth, authController.getMe);

module.exports = router;

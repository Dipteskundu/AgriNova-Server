const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const auth = require("../../middleware/auth.middleware");
const { registerValidation, loginValidation } = require("./auth.validation");
const validate = require("../../middleware/validate.middleware");

router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);
router.get("/me", auth, authController.getMe);

module.exports = router;

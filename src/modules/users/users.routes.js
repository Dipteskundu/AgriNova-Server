const express = require("express");
const router = express.Router();
const multer = require("multer");
const usersController = require("./users.controller");
const auth = require("../../middleware/auth.middleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

router.get("/profile", auth, usersController.getProfile);
router.put("/profile", auth, usersController.updateProfile);
router.post("/avatar", auth, upload.single("avatar"), usersController.uploadAvatar);

module.exports = router;

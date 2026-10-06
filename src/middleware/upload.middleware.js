const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    /**
     * Never echo the client's filename into the path.
     *
     * `file.originalname` is attacker-controlled and may carry `../` (or a
     * Windows separator), which would let an upload land outside `uploads/`.
     * A random hex plus the *validated* extension below is both
     * collision-proof and traversal-proof.
     */
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Images only. This middleware's sole consumer is the produce-photo upload
  // (`POST /api/marketplace/upload`), so documents are rejected here rather
  // than reaching disk and being rejected downstream.
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only JPEG, PNG, GIF or WebP images are allowed"));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

module.exports = upload;

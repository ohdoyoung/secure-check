const multer = require("multer");

const allowedMimeTypes = new Set(["image/png", "image/jpeg"]);
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 1024 * 1024 },
  fileFilter(req, file, cb) {
    cb(null, allowedMimeTypes.has(file.mimetype));
  }
});

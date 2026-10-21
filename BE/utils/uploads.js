// Everything about uploaded image files lives here.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const multer = require("multer");
const { AppError } = require("../middleware/errorHandler");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

// Allowed MIME types and the extension we save them with
const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // Random name: never trust the original file name from the user
  filename: (req, file, cb) =>
    cb(null, crypto.randomUUID() + ALLOWED_TYPES[file.mimetype]),
});

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
  cb(new AppError(400, "Validation failed", { image: "Image must be a JPG, PNG or WebP file" }));
}

// Middleware: expects one optional file in a form field named "image"
const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
}).single("image");

// The MIME type comes from the client and can be faked.
// So we also check the first bytes of the saved file.
function hasImageSignature(filePath) {
  const buffer = Buffer.alloc(12);
  const fd = fs.openSync(filePath, "r");
  try {
    fs.readSync(fd, buffer, 0, 12, 0);
  } finally {
    fs.closeSync(fd);
  }
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer
    .subarray(0, 8)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return isJpeg || isPng || isWebp;
}

// Delete a file that multer just saved (used when the request fails)
function removeUploadedFile(file) {
  if (file) fs.rmSync(file.path, { force: true });
}

// Delete the image of an item, given the imageUrl stored in the database
function removeStoredImage(imageUrl) {
  if (typeof imageUrl !== "string" || !imageUrl.startsWith("/uploads/")) return;
  // path.basename blocks tricks like "/uploads/../../secret"
  fs.rmSync(path.join(UPLOAD_DIR, path.basename(imageUrl)), { force: true });
}

module.exports = {
  UPLOAD_DIR,
  uploadImage,
  hasImageSignature,
  removeUploadedFile,
  removeStoredImage,
};
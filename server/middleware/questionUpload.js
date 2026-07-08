const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "questions"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const extensionByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension =
      extensionByMimeType[file.mimetype];

    const uniqueName = [
      Date.now(),
      Math.round(Math.random() * 1e9),
    ].join("-");

    callback(
      null,
      `${uniqueName}${extension}`
    );
  },
});

function fileFilter(req, file, callback) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return callback(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        file.fieldname
      )
    );
  }

  callback(null, true);
}

const questionUpload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },

  fileFilter,
});

module.exports = questionUpload;
require('dotenv').config();
const multer = require("multer");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");

const cors = require('cors');
const express        = require('express');
const questionRoutes = require('./routes/questionRoutes');
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/questions', questionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'PulseOpinion API is running.' });
});
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

app.use((err, req, res, next) => {
  console.error("[Error]", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message:
          "Attachment is too large. Maximum size is 10 MB.",
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message:
          "Only one attachment is allowed per question.",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message:
          "Unsupported attachment. Upload a JPEG, PNG, WebP, or PDF file.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Attachment upload failed.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});
module.exports = app;
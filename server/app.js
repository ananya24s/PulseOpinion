require('dotenv').config();
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
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

module.exports = app;
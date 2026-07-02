// app.js
//
// Responsibility: configure and export the Express application.
// server.js imports this and starts listening — keeping those two concerns separate
// makes it easy to test the app without binding a real port.

const express       = require('express');
const cors = require("cors");
const questionRoutes = require('./routes/questionRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────

// All question endpoints are grouped under /api/questions
app.use('/api/questions', questionRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
// Useful for quickly confirming the server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'PulseOpinion API is running.' });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
// Express calls this when next(err) is called anywhere in the app.
// Having it here means controllers don't need their own try/catch for
// unexpected crashes — though we keep try/catch for clean validation messages.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

module.exports = app;

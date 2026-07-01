// server.js
//
// Responsibility: import the configured app and bind it to a port.
// This is the only file that knows about the network.
// Keeping it separate from app.js means app.js can be imported in tests
// without accidentally starting a real server.

const app  = require('./app');

// Use the PORT environment variable if set (useful for deployment),
// otherwise fall back to 5000 so it doesn't clash with Vite on 5173.
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`PulseOpinion API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

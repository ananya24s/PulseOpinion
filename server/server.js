//imports the configured app and bind it to a port.
// This is the only file that knows about the network.
// Keeping it separate from app.js means app.js can be imported in tests
// without accidentally starting a real server.

const app  = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`PulseOpinion API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

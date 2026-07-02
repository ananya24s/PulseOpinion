// config/db.js
//
// Responsibility: create and export a single shared MySQL connection pool.
// Every model imports this pool and calls pool.execute() directly.
// Using a pool (not a single connection) means multiple simultaneous requests
// each get their own connection from the pool instead of queuing behind one.

const mysql = require('mysql2/promise');

// mysql2/promise reads these values from process.env, which dotenv
// populates from .env before this module is ever required.
const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,

  // How many connections the pool may open at once.
  // 10 is a safe default for a development/small-production server.
  connectionLimit:    10,

  // Return JS Date objects for DATETIME/TIMESTAMP columns instead of strings.
  // This keeps createdAt consistent with what the in-memory model returned.
  dateStrings:        false,

  // Automatically re-establish dropped connections (e.g. after MySQL restarts).
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
});

module.exports = pool;

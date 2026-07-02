const pool = require("../config/db");

// Find a user by email
async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  return rows[0] || null;
}

// Create a new user
async function createUser({ name, email, passwordHash }) {
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash)
     VALUES (?, ?, ?)`,
    [name, email, passwordHash]
  );

  return {
    id: result.insertId,
    name,
    email,
  };
}

module.exports = {
  findUserByEmail,
  createUser,
};
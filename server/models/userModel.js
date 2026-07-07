const pool = require("../config/db");

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  return rows[0] || null;
}

async function findUserByGoogleId(googleId) {
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE google_id = ? LIMIT 1",
    [googleId]
  );

  return rows[0] || null;
}

async function createUser(name, email, passwordHash) {
  const [result] = await pool.execute(
    `INSERT INTO users
      (name, email, password_hash, auth_provider)
     VALUES (?, ?, ?, 'local')`,
    [name, email, passwordHash]
  );

  return {
    id: result.insertId,
    name,
    email,
    role: "user",
    auth_provider: "local",
  };
}

async function createGoogleUser(name, email, googleId) {
  const [result] = await pool.execute(
    `INSERT INTO users
      (name, email, password_hash, auth_provider, google_id)
     VALUES (?, ?, NULL, 'google', ?)`,
    [name, email, googleId]
  );

  return {
    id: result.insertId,
    name,
    email,
    role: "user",
    auth_provider: "google",
    google_id: googleId,
  };
}

async function linkGoogleAccount(userId, googleId) {
  await pool.execute(
    `UPDATE users
     SET google_id = ?
     WHERE id = ?`,
    [googleId, userId]
  );

  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [userId]
  );

  return rows[0] || null;
}

module.exports = {
  findUserByEmail,
  findUserByGoogleId,
  createUser,
  createGoogleUser,
  linkGoogleAccount,
};
// const pool = require("../config/db");

// async function findUserByEmail(email) {
//   const [rows] = await pool.execute(
//     "SELECT * FROM users WHERE email = ?",
//     [email]
//   );

//   return rows[0] || null;
// }

// async function createUser({ name, email, passwordHash }) {
//   const [result] = await pool.execute(
//     `INSERT INTO users (name, email, password_hash)
//      VALUES (?, ?, ?)`,
//     [name, email, passwordHash]
//   );

//   return {
//     id: result.insertId,
//     name,
//     email,
//   };
// }

// module.exports = {
//   findUserByEmail,
//   createUser,
// }
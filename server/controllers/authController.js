//Auth Controller
const bcrypt = require("bcrypt");
const {
  findUserByEmail,
  createUser,
} = require("../models/userModel");

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Save user
    const user = await createUser({
      name,
      email,
      passwordHash,
    });

    return res.status(201).json({
      success: true,
      data: user,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to register user.",
    });
  }
}

module.exports = {
  register,
};
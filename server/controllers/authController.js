const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const {
  findUserByEmail,
  findUserByGoogleId,
  createUser,
  createGoogleUser,
  linkGoogleAccount,
} = require("../models/userModel");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function register(req, res) {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email
      ?.trim()
      .toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email, and password are required.",
      });
    }

    const existingUser =
      await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const user = await createUser(
      name,
      email,
      passwordHash
    );

    const token = generateToken(user);

    return res.status(201).json({
      message: "Account created successfully.",
      data: {
        user: publicUser(user),
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Could not create account.",
    });
  }
}

async function login(req, res) {
  try {
    const email = req.body.email
      ?.trim()
      .toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        message:
          "This account uses Google sign-in. Continue with Google instead.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Signed in successfully.",
      data: {
        user: publicUser(user),
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Could not sign in.",
    });
  }
}

async function googleLogin(req, res) {
  try {
    const credential = req.body.credential;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required.",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error(
        "GOOGLE_CLIENT_ID is not configured."
      );

      return res.status(500).json({
        message:
          "Google sign-in is not configured.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        message:
          "Google account could not be verified.",
      });
    }

    const googleId = payload.sub;
    const email = payload.email
      .trim()
      .toLowerCase();
    const name =
      payload.name?.trim() ||
      email.split("@")[0];

    let user =
      await findUserByGoogleId(googleId);

    if (!user) {
      const existingUser =
        await findUserByEmail(email);

      if (existingUser) {
        user = await linkGoogleAccount(
          existingUser.id,
          googleId
        );
      } else {
        user = await createGoogleUser(
          name,
          email,
          googleId
        );
      }
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Signed in with Google.",
      data: {
        user: publicUser(user),
        token,
      },
    });
  } catch (error) {
    console.error(
      "Google sign-in error:",
      error
    );

    return res.status(401).json({
      message:
        "Google sign-in failed. Please try again.",
    });
  }
}

module.exports = {
  register,
  login,
  googleLogin,
};

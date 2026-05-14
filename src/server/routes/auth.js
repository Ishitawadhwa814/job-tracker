// src/server/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const pool = require("../config/database");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function makeToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

// Email sending completely disabled
async function sendMail({ to, subject, html }) {
  // Silently disabled - no console output
  return Promise.resolve();
}

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      email_verification_token_hash TEXT,
      email_verification_expires TIMESTAMP,
      reset_password_token_hash TEXT,
      reset_password_expires TIMESTAMP,
      google_sub TEXT,
      linkedin_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token_hash TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_id TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();`);
}

// Email verification completely disabled
async function sendVerificationEmail({ email, token }) {
  // Silently disabled - no console output
  return Promise.resolve();
}

async function sendResetPasswordEmail({ email, token }) {
  // Silently disabled - no console output
  return Promise.resolve();
}

// Ensure table exists
(async () => {
  try {
    await ensureUsersTable();
    console.log("users table is ready");
  } catch (err) {
    console.error("Failed to ensure users table:", err);
  }
})();

// Signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows[0]) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = makeToken(32);
    const verificationTokenHash = sha256(verificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, email_verified, email_verification_token_hash, email_verification_expires)
       VALUES ($1, $2, $3, FALSE, $4, $5)
       RETURNING id, name, email, email_verified as "emailVerified"`,
      [name || null, email, hashedPassword, verificationTokenHash, verificationExpires]
    );

    try {
      await sendVerificationEmail({ email, token: verificationToken });
    } catch (mailErr) {
      console.error("Failed to send verification email:", mailErr);
    }

    res.status(201).json({ message: "User created", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Email already exists or DB error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Email verification check disabled for development
    // if (!user.email_verified) {
    //   return res.status(403).json({
    //     error: "Email not verified",
    //     code: "EMAIL_NOT_VERIFIED",
    //   });
    // }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login successful", token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Email verification
router.get("/verify-email", async (req, res) => {
  const token = String(req.query.token || "");
  if (!token) return res.status(400).json({ error: "token is required" });

  try {
    const tokenHash = sha256(token);
    const { rows } = await pool.query(
      `SELECT id, email_verification_expires
       FROM users
       WHERE email_verification_token_hash = $1`,
      [tokenHash]
    );

    const row = rows[0];
    if (!row) return res.status(400).json({ error: "Invalid or expired token" });

    if (row.email_verification_expires && new Date(row.email_verification_expires).getTime() < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           email_verification_token_hash = NULL,
           email_verification_expires = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [row.id]
    );

    res.json({ message: "Email verified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/resend-verification", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email is required" });

  try {
    const { rows } = await pool.query(
      `SELECT id, email_verified
       FROM users
       WHERE email = $1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(200).json({ message: "If your email exists, a verification email has been sent" });
    if (user.email_verified) return res.status(200).json({ message: "Email is already verified" });

    const verificationToken = makeToken(32);
    const verificationTokenHash = sha256(verificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET email_verification_token_hash = $1,
           email_verification_expires = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [verificationTokenHash, verificationExpires, user.id]
    );

    await sendVerificationEmail({ email, token: verificationToken });
    res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Forgot / Reset password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email is required" });

  try {
    const { rows } = await pool.query("SELECT id, email FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user) {
      return res.json({ message: "If your email exists, a reset link has been sent" });
    }

    const resetToken = makeToken(32);
    const resetTokenHash = sha256(resetToken);
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET reset_password_token_hash = $1,
           reset_password_expires = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [resetTokenHash, resetExpires, user.id]
    );

    await sendResetPasswordEmail({ email: user.email, token: resetToken });
    res.json({ message: "If your email exists, a reset link has been sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: "token and newPassword are required" });
  }

  try {
    const tokenHash = sha256(String(token));
    const { rows } = await pool.query(
      `SELECT id, reset_password_expires
       FROM users
       WHERE reset_password_token_hash = $1`,
      [tokenHash]
    );
    const user = rows[0];
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    if (user.reset_password_expires && new Date(user.reset_password_expires).getTime() < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users
       SET password = $1,
           reset_password_token_hash = NULL,
           reset_password_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// OAuth: Google (ID Token)
router.post("/oauth/google", async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) return res.status(400).json({ error: "idToken is required" });
  if (!googleClient) return res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured" });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      return res.status(400).json({ error: "Invalid Google token" });
    }

    const googleSub = payload.sub;
    const email = payload.email;
    const name = payload.name || null;

    const existing = await pool.query(
      `SELECT * FROM users WHERE google_sub = $1 OR email = $2 LIMIT 1`,
      [googleSub, email]
    );

    let user = existing.rows[0];
    if (!user) {
      const created = await pool.query(
        `INSERT INTO users (name, email, password, email_verified, google_sub)
         VALUES ($1, $2, NULL, TRUE, $3)
         RETURNING *`,
        [name, email, googleSub]
      );
      user = created.rows[0];
    } else {
      await pool.query(
        `UPDATE users
         SET google_sub = COALESCE(google_sub, $1),
             email_verified = TRUE,
             updated_at = NOW()
         WHERE id = $2`,
        [googleSub, user.id]
      );
      const refreshed = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);
      user = refreshed.rows[0];
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// OAuth: LinkedIn (Auth Code)
router.post("/oauth/linkedin", async (req, res) => {
  const { code, redirectUri } = req.body || {};
  if (!code || !redirectUri) return res.status(400).json({ error: "code and redirectUri are required" });

  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    return res.status(500).json({ error: "LinkedIn OAuth is not configured" });
  }

  if (typeof fetch !== "function") {
    return res.status(500).json({ error: "Global fetch is not available in this Node runtime" });
  }

  try {
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      return res.status(400).json({ error: "LinkedIn token exchange failed", detail: tokenJson });
    }

    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return res.status(400).json({ error: "LinkedIn token exchange failed" });
    }

    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = await meRes.json();
    if (!meRes.ok) {
      return res.status(400).json({ error: "LinkedIn profile fetch failed", detail: me });
    }

    const linkedinId = me.sub || me.id;
    const email = me.email;
    const name = me.name || null;

    if (!linkedinId || !email) {
      return res.status(400).json({ error: "LinkedIn did not return required user info" });
    }

    const existing = await pool.query(
      `SELECT * FROM users WHERE linkedin_id = $1 OR email = $2 LIMIT 1`,
      [linkedinId, email]
    );

    let user = existing.rows[0];
    if (!user) {
      const created = await pool.query(
        `INSERT INTO users (name, email, password, email_verified, linkedin_id)
         VALUES ($1, $2, NULL, TRUE, $3)
         RETURNING *`,
        [name, email, linkedinId]
      );
      user = created.rows[0];
    } else {
      await pool.query(
        `UPDATE users
         SET linkedin_id = COALESCE(linkedin_id, $1),
             email_verified = TRUE,
             updated_at = NOW()
         WHERE id = $2`,
        [linkedinId, user.id]
      );
      const refreshed = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);
      user = refreshed.rows[0];
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

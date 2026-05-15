// import express from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import bodyParser from "body-parser";
// import cors from "cors";

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // TEMP storage - replace with DB (MongoDB/MySQL/SQLite/etc.)
// const users = [];
// const SECRET_KEY = "your-secret-key";

// // Signup
// app.post("/api/auth/signup", (req, res) => {
//   const { email, password } = req.body;
//   const hashedPassword = bcrypt.hashSync(password, 8);
//   users.push({ email, password: hashedPassword });
//   res.json({ message: "User registered successfully" });
// });

// // Login
// app.post("/api/auth/login", (req, res) => {
//   const { email, password } = req.body;
//   const user = users.find((u) => u.email === email);
//   if (!user || !bcrypt.compareSync(password, user.password)) {
//     return res.status(401).json({ message: "Invalid credentials" });
//   }
//   const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: "1h" });
//   res.json({ token });
// });

// // Start server
// app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
// server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const resumeRoutes = require('./src/server/routes/resume');
const authRoutes = require('./src/server/routes/auth');

const app = express();

// --------------------
// MIDDLEWARE
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// POSTGRESQL CONNECTION
// --------------------
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'tracker_job',
  password: process.env.PGPASSWORD || 'H@rshu79733',
  port: process.env.PGPORT || 5432,
});

// Test DB connection
pool.connect()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error:', err));

// Make pool accessible in routes (optional but useful)
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// --------------------
// AUTH ROUTES (direct)
// --------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      [email, hashedPassword]
    );

    return res.status(201).json({ message: 'Account created successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    return res.status(200).json({ message: 'Login successful' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --------------------
// ROUTES (modular)
// --------------------
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);

// --------------------
// STATIC FRONTEND (React build)
// --------------------
// const buildPath = path.join(__dirname, '../../build');

// app.use(express.static(buildPath));

// app.use(express.static(path.join(__dirname, "dist")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });

app.use(express.static(path.join(__dirname, "dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// SAFE fallback (NO ROUTE PARSING AT ALL)
app.use((req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
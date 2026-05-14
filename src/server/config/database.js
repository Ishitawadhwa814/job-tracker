// src/server/config/database.js
const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'jobtracker',
  password: process.env.PGPASSWORD || 'Palakgarg',
  port: Number(process.env.PGPORT || 5432),
});

// Test connection
pool.connect()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error:', err));

module.exports = pool;

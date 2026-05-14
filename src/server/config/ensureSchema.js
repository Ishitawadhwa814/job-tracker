const pool = require("./database");

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP;`);
  await pool.query(`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS remind_1day_notified BOOLEAN NOT NULL DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS remind_1day_notified_at TIMESTAMP;`);
}

module.exports = { ensureSchema };

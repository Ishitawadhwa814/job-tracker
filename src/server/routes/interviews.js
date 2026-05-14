const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// Ensure table exists
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mock_interviews (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        datetime TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("mock_interviews table is ready");
  } catch (err) {
    console.error("Failed to ensure mock_interviews table:", err);
  }
})();

// Allowed status values
const ALLOWED_STATUS = new Set(['scheduled', 'in-progress', 'completed', 'cancelled']);

// Get user's interviews
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT id, type, datetime, duration, notes, status, created_at as "createdAt", updated_at as "updatedAt" FROM mock_interviews WHERE user_id = $1 ORDER BY datetime ASC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mock interviews' });
  }
});

// Create interview
router.post('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { type, datetime, duration, notes } = req.body || {};
  if (!type || !datetime || !duration) {
    return res.status(400).json({ error: 'type, datetime and duration are required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO mock_interviews (user_id, type, datetime, duration, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, datetime, duration, notes, status, created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, type, new Date(datetime), Number(duration), notes || null]
    );
    res.status(201).json({ message: 'Interview scheduled', interview: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// Update interview
router.patch('/:userId/:id', async (req, res) => {
  const { userId, id } = req.params;
  const updates = req.body || {};
  const fields = [];
  const values = [];
  let idx = 1;
  for (const [k, v] of Object.entries(updates)) {
    let col = k;
    if (k === 'status') {
      if (!ALLOWED_STATUS.has(v)) return res.status(400).json({ error: 'invalid status' });
    }
    fields.push(`${col} = $${idx++}`);
    values.push(k === 'datetime' ? new Date(v) : v);
  }
  values.push(new Date());
  fields.push(`updated_at = $${idx++}`);
  values.push(userId);
  values.push(id);
  const sql = `UPDATE mock_interviews SET ${fields.join(', ')} WHERE user_id = $${idx++} AND id = $${idx} RETURNING id, type, datetime, duration, notes, status, created_at as "createdAt", updated_at as "updatedAt"`;
  try {
    const { rows } = await pool.query(sql, values);
    if (!rows[0]) return res.status(404).json({ error: 'Interview not found' });
    res.json({ message: 'Interview updated', interview: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// Delete interview
router.delete('/:userId/:id', async (req, res) => {
  const { userId, id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM mock_interviews WHERE user_id = $1 AND id = $2', [userId, id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Interview not found' });
    res.json({ message: 'Interview deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

module.exports = router;

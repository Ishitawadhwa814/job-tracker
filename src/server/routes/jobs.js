const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// Ensure table exists
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'applied',
        applied_date DATE NOT NULL,
        link TEXT,
        notes TEXT,
        is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Add is_favorite column if it doesn't exist (for existing tables)
    await pool.query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;`);
    
    console.log("job_applications table is ready");
  } catch (err) {
    console.error("Failed to ensure job_applications table:", err);
  }
})();

// Allowed status values
const ALLOWED_STATUS = new Set(['applied', 'interviewing', 'offered', 'rejected', 'accepted']);

// Get all job applications for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { favoritesOnly } = req.query;
  
  try {
    let query = 'SELECT id, company, position, location, status, applied_date as "appliedDate", link, notes, is_favorite as "isFavorite", created_at as "createdAt", updated_at as "updatedAt" FROM job_applications WHERE user_id = $1';
    let params = [userId];
    
    if (favoritesOnly === 'true') {
      query += ' AND is_favorite = TRUE';
    }
    
    query += ' ORDER BY is_favorite DESC, created_at DESC';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch job applications' });
  }
});

// Delete a job application
router.delete('/:userId/:jobId', async (req, res) => {
  const { userId, jobId } = req.params;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM job_applications WHERE user_id = $1 AND id = $2',
      [userId, jobId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete job application' });
  }
});

// Create a new job application for a user
router.post('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { company, position, location, status = 'applied', appliedDate, link, notes, isFavorite = false } = req.body;

  if (!company || !position) {
    return res.status(400).json({ error: 'company and position are required' });
  }

  if (!ALLOWED_STATUS.has(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO job_applications (user_id, company, position, location, status, applied_date, link, notes, is_favorite)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, company, position, location, status, applied_date as "appliedDate", link, notes, is_favorite as "isFavorite", created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, company, position, location || null, status, appliedDate || new Date(), link || null, notes || null, isFavorite]
    );
    res.status(201).json({ message: 'Job application added', job: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add job application' });
  }
});

// Update a job application status/fields
router.patch('/:userId/:jobId', async (req, res) => {
  const { userId, jobId } = req.params;
  const updates = req.body || {};

  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    let column = key;
    if (key === 'appliedDate') column = 'applied_date';
    if (key === 'isFavorite') column = 'is_favorite';
    if (key === 'status' && !ALLOWED_STATUS.has(value)) {
      return res.status(400).json({ error: 'invalid status' });
    }
    fields.push(`${column} = $${idx++}`);
    values.push(value);
  }
  values.push(new Date());
  fields.push(`updated_at = $${idx++}`);

  values.push(userId);
  values.push(jobId);

  const sql = `UPDATE job_applications SET ${fields.join(', ')} WHERE user_id = $${idx++} AND id = $${idx} RETURNING id, company, position, location, status, applied_date as "appliedDate", link, notes, is_favorite as "isFavorite", created_at as "createdAt", updated_at as "updatedAt"`;

  try {
    const { rows } = await pool.query(sql, values);
    if (!rows[0]) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job updated', job: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update job application' });
  }
});

// Toggle favorite status for a job
router.patch('/:userId/:jobId/favorite', async (req, res) => {
  const { userId, jobId } = req.params;
  const { isFavorite } = req.body;

  if (typeof isFavorite !== 'boolean') {
    return res.status(400).json({ error: 'isFavorite must be a boolean' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE job_applications 
       SET is_favorite = $1, updated_at = NOW()
       WHERE user_id = $2 AND id = $3
       RETURNING id, company, position, location, status, applied_date as "appliedDate", link, notes, is_favorite as "isFavorite", created_at as "createdAt", updated_at as "updatedAt"`,
      [isFavorite, userId, jobId]
    );
    
    if (!rows[0]) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Favorite status updated', job: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update favorite status' });
  }
});

module.exports = router;

const pool = require("../config/database");

async function createNotification({ userId, message, type }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, message, type)
     VALUES ($1, $2, $3)
     RETURNING id, user_id as "userId", message, type, is_read as "isRead", created_at as "createdAt"`,
    [userId, message, type]
  );
  return rows[0];
}

async function listNotifications(userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id as "userId", message, type, is_read as "isRead", created_at as "createdAt"
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function markRead(id) {
  const { rows } = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1
     RETURNING id, user_id as "userId", message, type, is_read as "isRead", created_at as "createdAt"`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { createNotification, listNotifications, markRead };

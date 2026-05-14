const notificationService = require("../services/notificationService");

async function getNotifications(req, res) {
  const { userId } = req.params;
  try {
    const notifications = await notificationService.listNotifications(userId);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

async function markNotificationRead(req, res) {
  const { id } = req.params;
  try {
    const updated = await notificationService.markRead(id);
    if (!updated) return res.status(404).json({ error: "Notification not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
}

async function createNotification(req, res) {
  const { userId, message, type } = req.body;
  try {
    const notification = await notificationService.createNotification({ userId, message, type });
    res.status(201).json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create notification" });
  }
}

module.exports = { getNotifications, markNotificationRead, createNotification };

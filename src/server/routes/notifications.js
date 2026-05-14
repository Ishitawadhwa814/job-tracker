const express = require("express");
const { getNotifications, markNotificationRead, createNotification } = require("../controllers/notificationsController");

const router = express.Router();

router.post("/", createNotification);
router.get("/:userId", getNotifications);
router.put("/read/:id", markNotificationRead);

module.exports = router;

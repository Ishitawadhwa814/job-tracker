const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const jobsRoutes = require("./routes/jobs");
const resumeRoutes = require("./routes/resume");
const interviewsRoutes = require("./routes/interviews");
const notificationsRoutes = require("./routes/notifications");

const { ensureSchema } = require("./config/ensureSchema");
const { startInterviewReminderCron } = require("./cron/interviewReminderCron");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interviews", interviewsRoutes);
app.use("/api/notifications", notificationsRoutes);

// React Build
app.use(express.static(path.join(__dirname, "../../build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../../build", "index.html"));
});

(async () => {
  try {
    await ensureSchema();
  } catch (err) {
    console.error("Failed to ensure DB schema:", err);
  }
})();

startInterviewReminderCron();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
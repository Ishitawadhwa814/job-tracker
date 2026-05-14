const pool = require("../config/database");
const { sendEmail } = require("../services/emailService");
const { createNotification } = require("../services/notificationService");

function formatInterviewDate(dt) {
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

function interviewEmailHtml({ interviewType, datetime }) {
  const { date, time } = formatInterviewDate(datetime);
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5">
      <h2 style="margin:0 0 12px">Interview Reminder</h2>
      <p style="margin:0 0 10px">You have an upcoming <b>${String(interviewType)}</b> interview.</p>
      <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;display:inline-block">
        <div><b>Date:</b> ${date}</div>
        <div><b>Time:</b> ${time}</div>
      </div>
      <p style="margin:12px 0 0;color:#6b7280;font-size:12px">This is an automated reminder from CareerPortal.</p>
    </div>
  `;
}

async function findUserEmail(userId) {
  const { rows } = await pool.query(
    `SELECT email
     FROM users
     WHERE id::text = $1 OR email = $1
     LIMIT 1`,
    [userId]
  );
  return rows[0]?.email || null;
}

async function processOneHourReminders() {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const { rows } = await pool.query(
    `SELECT id, user_id, type, datetime
     FROM mock_interviews
     WHERE status = 'scheduled'
       AND notified = FALSE
       AND datetime > $1
       AND datetime <= $2
     ORDER BY datetime ASC`,
    [now, inOneHour]
  );

  for (const interview of rows) {
    try {
      const email = await findUserEmail(interview.user_id);
      if (!email) {
        await pool.query(
          `UPDATE mock_interviews
           SET notified = TRUE, notified_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [interview.id]
        );
        continue;
      }

      await sendEmail({
        to: email,
        subject: "Interview Reminder (in 1 hour)",
        html: interviewEmailHtml({ interviewType: interview.type, datetime: interview.datetime }),
      });

      await createNotification({
        userId: interview.user_id,
        type: "INTERVIEW_REMINDER_1H",
        message: `Reminder: Your ${interview.type} interview is scheduled within 1 hour.`,
      });

      await pool.query(
        `UPDATE mock_interviews
         SET notified = TRUE, notified_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [interview.id]
      );
    } catch (err) {
      console.error("[InterviewReminderCron] Failed processing interview", interview?.id, err);
    }
  }
}

async function processOneDayReminders() {
  const enabled = String(process.env.REMIND_1DAY_ENABLED || "false") === "true";
  if (!enabled) return;

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { rows } = await pool.query(
    `SELECT id, user_id, type, datetime
     FROM mock_interviews
     WHERE status = 'scheduled'
       AND remind_1day_notified = FALSE
       AND datetime > $1
       AND datetime <= $2
     ORDER BY datetime ASC`,
    [in24h, in25h]
  );

  for (const interview of rows) {
    try {
      const email = await findUserEmail(interview.user_id);
      if (email) {
        await sendEmail({
          to: email,
          subject: "Interview Reminder (tomorrow)",
          html: interviewEmailHtml({ interviewType: interview.type, datetime: interview.datetime }),
        });
      }

      await createNotification({
        userId: interview.user_id,
        type: "INTERVIEW_REMINDER_1D",
        message: `Reminder: Your ${interview.type} interview is scheduled tomorrow.`,
      });

      await pool.query(
        `UPDATE mock_interviews
         SET remind_1day_notified = TRUE, remind_1day_notified_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [interview.id]
      );
    } catch (err) {
      console.error("[InterviewReminderCron] Failed 1-day reminder", interview?.id, err);
    }
  }
}

function startInterviewReminderCron() {
  let cron = null;
  try {
    cron = require("node-cron");
  } catch (err) {
    console.warn("[InterviewReminderCron] node-cron is not installed. Interview reminders are disabled.");
    return;
  }

  cron.schedule("* * * * *", async () => {
    try {
      await processOneHourReminders();
      await processOneDayReminders();
    } catch (err) {
      console.error("[InterviewReminderCron] tick failed", err);
    }
  });
}

module.exports = { startInterviewReminderCron };

// Email service completely disabled
async function sendEmail({ to, subject, html }) {
  // Silently disabled - no console output
  return Promise.resolve();
}

module.exports = { sendEmail };

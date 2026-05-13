const nodemailer = require("nodemailer");
const config = require("../Config/index");
const logger = require("../Config/logger");

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: { user: config.email.user, pass: config.email.pass },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: config.email.from, to, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error("Email send failed:", err);
    throw err;
  }
};

const sendVerificationEmail = (email, firstName, token) => {
  const url = `${config.frontend.url}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#6366f1">Welcome to SaaS App!</h1>
        <p>Hi ${firstName}, please verify your email by clicking below:</p>
        <a href="${url}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;font-weight:600">
          Verify Email
        </a>
        <p style="color:#888;font-size:13px">This link expires in 24 hours.</p>
      </div>`,
  });
};

const sendPasswordResetEmail = (email, firstName, token) => {
  const url = `${config.frontend.url}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#6366f1">Password Reset</h1>
        <p>Hi ${firstName}, click below to reset your password:</p>
        <a href="${url}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;font-weight:600">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>`,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };

import nodemailer from 'nodemailer';
import logger from './logger.js';

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,
    maxConnections: 5,
    rateDelta: 20000,
    rateLimit: 5,
  });

const transporter = createTransporter();

const emailTemplates = {
  verification: (name, url) => ({
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome, ${name}!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Verify Email
        </a>
        <p style="color:#888;margin-top:20px;font-size:13px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        <p style="color:#aaa;font-size:12px;">Or copy this link: ${url}</p>
      </div>
    `,
  }),

  resetPassword: (name, url) => ({
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${name}, click below to reset your password:</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#EF4444;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Reset Password
        </a>
        <p style="color:#888;margin-top:20px;font-size:13px;">This link expires in 10 minutes. If you didn't request this, ignore this email and your password remains unchanged.</p>
        <p style="color:#aaa;font-size:12px;">Or copy: ${url}</p>
      </div>
    `,
  }),

  passwordChanged: (name) => ({
    subject: 'Your Password Has Been Changed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Changed</h2>
        <p>Hi ${name}, your password was successfully changed.</p>
        <p style="color:#888;">If you didn't make this change, contact support immediately.</p>
      </div>
    `,
  }),
};

export const sendEmail = async ({ to, templateName, templateData, subject, html }) => {
  try {
    let emailContent = { subject, html };
    if (templateName && emailTemplates[templateName]) {
      emailContent = emailTemplates[templateName](...Object.values(templateData));
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      ...emailContent,
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email send failed to ${to}: ${err.message}`);
    throw err;
  }
};

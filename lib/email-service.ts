/**
 * Email Service for sending OTP and password reset emails
 * Uses Nodemailer for SMTP or can be extended for other providers
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Placeholder for email sending
 * To implement: Install nodemailer and configure SMTP
 * npm install nodemailer
 * npm install -D @types/nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email service is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.warn('[Email Service] SMTP not configured. Email features disabled.');
      return false;
    }

    // TODO: Implement actual email sending with nodemailer
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   host: smtpHost,
    //   port: parseInt(smtpPort),
    //   secure: process.env.SMTP_SECURE === 'true',
    //   auth: {
    //     user: smtpUser,
    //     pass: smtpPass,
    //   },
    // });
    //
    // await transporter.sendMail({
    //   from: process.env.SMTP_FROM || smtpUser,
    //   to: options.to,
    //   subject: options.subject,
    //   text: options.text,
    //   html: options.html,
    // });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Email] To: ${options.to}`);
      console.log(`[Email] Subject: ${options.subject}`);
      console.log(`[Email] Text: ${options.text}`);
    }

    return true;
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    return false;
  }
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'SmartSpecs';

  return sendEmail({
    to: email,
    subject: `${siteName} - Password Reset OTP`,
    text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="letter-spacing: 5px; color: #059669; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666;">This OTP is valid for 15 minutes.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} ${siteName}. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<boolean> {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'SmartSpecs';

  return sendEmail({
    to: email,
    subject: `${siteName} - Password Reset`,
    text: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link is valid for 1 hour.\n\nIf you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <div style="margin: 20px 0;">
          <a href="${resetLink}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666;">Or copy this link: <a href="${resetLink}" style="color: #059669;">${resetLink}</a></p>
        <p style="color: #666;">This link is valid for 1 hour.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} ${siteName}. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'SmartSpecs';
  const userName = name || email.split('@')[0];

  return sendEmail({
    to: email,
    subject: `Welcome to ${siteName}!`,
    text: `Welcome to ${siteName}, ${userName}!\n\nYou can now log in and start getting personalized PC component recommendations.\n\nHappy building!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to ${siteName}!</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for joining us! You can now log in and start getting personalized PC component recommendations.</p>
        <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 4px;">
          <p style="color: #166534; margin: 0;">
            Get started by describing your PC needs or budget, and our AI will recommend the best components for you.
          </p>
        </div>
        <p>Happy building!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} ${siteName}. All rights reserved.
        </p>
      </div>
    `,
  });
}

// Update to src/utils/emailService.js
// Modified sendDiaryEmail function to include sender's name in the From field

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: process.env.EMAIL_PORT,
  secure: false, // TLS requires secure:false with port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // Add this to properly handle TLS negotiation
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false,
    // Force the use of TLSv1.2
    minVersion: 'TLSv1.2'
  }
});

// Send invitation email
export const sendInvitationEmail = async (email, senderName, invitationLink) => {
  try {
    const info = await transporter.sendMail({
      from: `"EMBER ON" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${senderName} invites you to join EMBER ON!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to EMBER ON!</h2>
          <p>${senderName} has invited you to join EMBER ON - a platform to track and share your progress.</p>
          <p>Click the link below to register and start sharing:</p>
          <p><a href="${invitationLink}" style="display: inline-block; background-color: #ff6f00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join EMBER ON</a></p>
          <p>This invitation will expire in 7 days.</p>
          <p>If you have any questions, please contact support.</p>
        </div>
      `
    });
    // console.log('Invitation email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
};

// Send OTP verification email
export const sendOTPEmail = async (email, name, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"EMBER ON" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Verification Code for EMBER ON`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to EMBER ON, ${name}!</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    });
    // console.log('OTP email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// Send password reset OTP email
export const sendPasswordResetOTPEmail = async (email, name, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"EMBER ON" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Password Reset Code for EMBER ON`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password.</p>
          <p>Your password reset code is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      `
    });
    // console.log('Password reset email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

/**
 * Send diary as attachment to a friend
 * @param {Object} options - Email options
 * @param {String} options.recipientEmail - Recipient's email address
 * @param {String} options.senderName - Sender's name
 * @param {String} options.senderEmail - Sender's email address
 * @param {String} options.filePath - Path to the CSV file
 * @param {String} options.fileName - Name of the file for attachment
 * @returns {Promise<Boolean>} - Success status
 */
export const sendDiaryEmail = async ({ recipientEmail, senderName, senderEmail, filePath, fileName }) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }

    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const info = await transporter.sendMail({
      from: `"${senderName} via EMBER ON" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `${senderName} shared their supplement diary with you`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Shared Supplement Diary</h2>
          <p>${senderName} (${senderEmail}) has shared their supplement diary with you.</p>
          <p>You can find their diary for the last month attached to this email.</p>
          <p>The diary contains their supplement intake records from ${formattedDate} going back one month.</p>
          <p>If you'd like to track your own supplements, consider joining EMBER ON!</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          path: filePath,
          contentType: 'text/csv'
        }
      ]
    });

    // console.log('Diary email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending diary email:', error);
    return false;
  }
};
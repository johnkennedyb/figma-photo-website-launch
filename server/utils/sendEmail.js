const axios = require('axios');

/**
 * Send an email using the Maileroo HTTP Email API.
 * This replaces the previous SMTP-based Nodemailer implementation.
 *
 * Expected env vars:
 * - MAILEROO_SENDING_KEY: Maileroo Sending Key (required)
 * - MAILEROO_FROM_EMAIL: Default from email, e.g. mail@match.quluub.com (optional)
 * - MAILEROO_FROM_NAME:  Default from name, e.g. Quluub (optional)
 */
const sendEmail = async (options) => {
  const apiKey = process.env.MAILEROO_SENDING_KEY;
  if (!apiKey) {
    throw new Error('Email configuration is missing. Please configure MAILEROO_SENDING_KEY in your environment variables.');
  }

  const fromEmail = process.env.MAILEROO_FROM_EMAIL || 'mail@match.quluub.com';
  const fromName = process.env.MAILEROO_FROM_NAME || 'Quluub';

  const payload = {
    from: `${fromName} <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await axios.post('https://smtp.maileroo.com/api/v2/emails', payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  });
};

module.exports = sendEmail;

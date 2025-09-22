const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if email configuration is available
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration is missing. Please configure EMAIL_HOST, EMAIL_USERNAME, and EMAIL_PASSWORD in your environment variables.');
  }

  // 1) Create a transporter using Mailtrap for development
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Quluub Admin <admin@quluub.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.html // You can also pass HTML content
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

const sendEmail = async (options) => {
  // In a real app, you would use a service like Nodemailer or SendGrid
  // For this project, we'll just log the email to the console
  console.log('====================');
  console.log('📧  Email Sent 📧');
  console.log('====================');
  console.log(`To: ${options.email}`);
  console.log(`From: noreply@quluub.com`);
  console.log(`Subject: ${options.subject}`);
  console.log('--------------------');
  console.log(`Message: ${options.message}`);
  console.log('====================');
  // In a real implementation, the link would be part of the message:
  // console.log(`Verification Link: ${options.verificationUrl}`);
};

module.exports = sendEmail;

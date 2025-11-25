const sendEmail = require('./sendEmail');

// Helper to wrap body with a basic HTML layout.
// If you have a dedicated matchmaking header/footer helper, you can
// replace this implementation with that function to ensure identical styling.
const wrapWithLayout = (body, options = {}) => {
  const rawTitle = options.subject || 'Quluub';
  const headerTitle = typeof rawTitle === 'string' ? rawTitle.replace(/\s*-\s*Quluub$/i, '') : 'Quluub';
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0; padding:0; background-color:#f6f7f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f6f7f9;" data-quluub-email-wrapper="1">
      <tr>
        <td align="center" style="padding:0;">
          <!-- Header Banner (Full Width, Image Background) -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0ea5a8;">
            <tr>
              <td align="center" style="padding:0;">
                <!--[if gte mso 9]>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:1000px;height:140px;">
                  <v:fill type="frame" src="https://res.cloudinary.com/dw7w2at8k/image/upload/v1763992958/Copy_of_Quluub_Email_Header_y8f1ln.png" color="#0ea5a8" />
                  <v:textbox inset="0,0,0,0">
                <![endif]-->
                <div style="background-image:url('https://res.cloudinary.com/dw7w2at8k/image/upload/v1763992958/Copy_of_Quluub_Email_Header_y8f1ln.png'); background-color:#0ea5a8; background-size:cover; background-position:center; background-repeat:no-repeat; min-height:140px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; margin:0 auto;">
                    <tr>
                      <td align="center" style="height:140px; padding:0 20px; color:#ffffff; font-family: Arial, sans-serif; font-size:24px; font-weight:bold; vertical-align:middle;">
                        ${headerTitle}
                      </td>
                    </tr>
                  </table>
                </div>
                <!--[if gte mso 9]>
                  </v:textbox>
                </v:rect>
                <![endif]-->
              </td>
            </tr>
          </table>
          
          <!-- Email Content Container -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; margin:0 auto; background-color:#ffffff;">
            <tr>
              <td style="padding:30px 24px; font-family: Arial, sans-serif; font-size:16px; line-height:1.6; color:#222222;">
                ${body}
              </td>
            </tr>
          </table>

          <!-- Footer Banner (Full Width, Image Background) -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fff7ed; margin-top:20px;">
            <tr>
              <td align="center" style="padding:0;">
                <!--[if gte mso 9]>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:1000px;height:160px;">
                  <v:fill type="frame" src="https://res.cloudinary.com/dw7w2at8k/image/upload/v1763992958/Copy_of_Quluub_Email_Header_1_wnflbn.png" color="#fff7ed" />
                  <v:textbox inset="0,0,0,0">
                <![endif]-->
                <div style="background-image:url('https://res.cloudinary.com/dw7w2at8k/image/upload/v1763992958/Copy_of_Quluub_Email_Header_1_wnflbn.png'); background-color:#fff7ed; background-size:cover; background-position:center; background-repeat:no-repeat; min-height:160px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; margin:0 auto;">
                    <tr>
                      <td align="center" valign="middle" style="height:160px; padding:0 20px;">
                        <!-- Social Icons on banner -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                          <tr>
                            <td align="center" valign="middle" style="padding:0 6px;">
                              <a href="https://x.com/_Quluub">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                                  <tr>
                                    <td width="32" height="32" align="center" valign="middle" style="border-radius:16px; background:#ffffff; text-align:center;">
                                      <img src="https://res.cloudinary.com/dw7w2at8k/image/upload/v1764086149/twitter-removebg-preview_qxwtfr.png" width="20" height="20" alt="Twitter" style="display:block; border:0; outline:none; text-decoration:none;" />
                                    </td>
                                  </tr>
                                </table>
                              </a>
                            </td>
                            <td align="center" valign="middle" style="padding:0 6px;">
                              <a href="https://www.tiktok.com/@_quluub">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                                  <tr>
                                    <td width="32" height="32" align="center" valign="middle" style="border-radius:16px; background:#ffffff; text-align:center;">
                                      <img src="https://res.cloudinary.com/dw7w2at8k/image/upload/v1764085476/tik-tok-removebg-preview_idlwaj.png" width="20" height="20" alt="TikTok" style="display:block; border:0; outline:none; text-decoration:none;" />
                                    </td>
                                  </tr>
                                </table>
                              </a>
                            </td>
                            <td align="center" valign="middle" style="padding:0 6px;">
                              <a href="https://web.facebook.com/Quluubplatform">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                                  <tr>
                                    <td width="32" height="32" align="center" valign="middle" style="border-radius:16px; background:#ffffff; text-align:center;">
                                      <img src="https://res.cloudinary.com/dw7w2at8k/image/upload/v1764086124/facebook-removebg-preview_obhfrj.png" width="20" height="20" alt="Facebook" style="display:block; border:0; outline:none; text-decoration:none;" />
                                    </td>
                                  </tr>
                                </table>
                              </a>
                            </td>
                            <td align="center" valign="middle" style="padding:0 6px;">
                              <a href="https://www.youtube.com/@quluubplatform">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                                  <tr>
                                    <td width="32" height="32" align="center" valign="middle" style="border-radius:16px; background:#ffffff; text-align:center;">
                                      <img src="https://res.cloudinary.com/dw7w2at8k/image/upload/v1764085486/youtube-removebg-preview_v0tmln.png" width="20" height="20" alt="YouTube" style="display:block; border:0; outline:none; text-decoration:none;" />
                                    </td>
                                  </tr>
                                </table>
                              </a>
                            </td>
                          </tr>
                        </table>
                        <div style="font-size:12px; color:#0f172a; font-family: Arial, sans-serif; margin-top:10px;">
                          © 2024 Quluub. All rights reserved.
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
                <!--[if gte mso 9]>
                  </v:textbox>
                </v:rect>
                <![endif]-->
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

exports.wrapWithLayout = wrapWithLayout;

// -------------------- CLIENT EMAILS --------------------

exports.sendClientWelcomeEmail = async ({ email, first_name }) => {
  const subject = `Welcome to Quluub Counselling, ${first_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nWelcome to Quluub — where every heart finds a home. We are honoured to be part of your journey toward a marriage built on sincerity, faith, and understanding.\n\nTo get started, log into your dashboard, explore available counsellors, and begin when you’re ready. Your path to healing, clarity, and growth begins here, in shaa Allah.\n\nYou can also join our WhatsApp channel by clicking the link below:\nhttps://whatsapp.com/channel/0029VaqaEwjL7UVYhsQind1M\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>Welcome to Quluub — where every heart finds a home. We are honoured to be part of your journey toward a marriage built on sincerity, faith, and understanding.</p>
    <p>To get started, log into your dashboard, explore available counsellors, and begin when you’re ready. Your path to healing, clarity, and growth begins here, in shaa Allah.</p>
    <p>You can also join our WhatsApp channel by clicking the link below:<br/>
    <a href="https://whatsapp.com/channel/0029VaqaEwjL7UVYhsQind1M">Join our WhatsApp channel</a></p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientEmailOtp = async ({ email, first_name, otp }) => {
  const subject = 'Verify your Quluub counselling account';
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nTo secure your account, please verify your email address. Enter the OTP below:\n\n${otp}\n\nThis code is valid for the next 10 minutes. If you didn’t request this, please ignore this message.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>To secure your account, please verify your email address. Enter the OTP below:</p>
    <p><strong>${otp}</strong></p>
    <p>This code is valid for the next 10 minutes. If you didn’t request this, please ignore this message.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientRequestSent = async ({ email, first_name, counsellor_name }) => {
  const subject = `Your counselling request has been sent to ${counsellor_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nYour counselling request has been successfully sent to ${counsellor_name}. You will be notified as soon as they accept or decline your request, in shaa Allah.\n\nIn the meantime, you may continue browsing or save other counsellors to your favourites.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>Your counselling request has been successfully sent to ${counsellor_name}. You will be notified as soon as they accept or decline your request, in shaa Allah.</p>
    <p>In the meantime, you may continue browsing or save other counsellors to your favourites.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientRequestAccepted = async ({ email, first_name, counsellor_name }) => {
  const subject = `Good news – ${counsellor_name} accepted your request`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nGood news! ${counsellor_name} has accepted your request. You may now begin chatting and arrange your first discounted session.\n\nWe pray this journey brings benefit, clarity, and healing.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>Good news! ${counsellor_name} has accepted your request. You may now begin chatting and arrange your first discounted session.</p>
    <p>We pray this journey brings benefit, clarity, and healing.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientRequestRejected = async ({ email, first_name, counsellor_name }) => {
  const subject = `Update on your request to ${counsellor_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nUnfortunately, ${counsellor_name} was unable to accept your request at this time. You may wish to try again later or browse and connect with another counsellor.\n\nWe pray you find the support you seek, bi idhnillah.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>Unfortunately, ${counsellor_name} was unable to accept your request at this time. You may wish to try again later or browse and connect with another counsellor.</p>
    <p>We pray you find the support you seek, bi idhnillah.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientCounsellorNoResponseReminder = async ({ email, first_name, counsellor_name }) => {
  const subject = `Reminder: Your request to ${counsellor_name} is still pending`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nJust a quick reminder that your request to ${counsellor_name} is still pending. If you need quicker support, you may cancel the request and try another available counsellor.\n\nWe are here to assist you on your journey.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>Just a quick reminder that your request to ${counsellor_name} is still pending. If you need quicker support, you may cancel the request and try another available counsellor.</p>
    <p>We are here to assist you on your journey.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientSessionReminder = async ({ email, first_name, counsellor_name, date, time }) => {
  const subject = `Session reminder with ${counsellor_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nThis is a gentle reminder that you have a session booked with ${counsellor_name} on ${date} at ${time}.\n\nPlease ensure you are logged in and ready to begin on time, in shaa Allah.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>This is a gentle reminder that you have a session booked with ${counsellor_name} on ${date} at ${time}.</p>
    <p>Please ensure you are logged in and ready to begin on time, in shaa Allah.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientPaymentConfirmation = async ({ email, first_name, counsellor_name, date, time }) => {
  const subject = `Payment received for your session with ${counsellor_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nWe have received your payment for your upcoming session with ${counsellor_name}.\n\nYour session details:\nDate: ${date}\nTime: ${time}\n\nWe look forward to supporting you through this process.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>We have received your payment for your upcoming session with ${counsellor_name}.</p>
    <p><strong>Your session details:</strong><br/>
    Date: ${date}<br/>
    Time: ${time}</p>
    <p>We look forward to supporting you through this process.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientSessionFeedbackRequest = async ({ email, first_name, counsellor_name, feedbackLink }) => {
  const subject = `How was your session with ${counsellor_name}?`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nWe hope your recent session with ${counsellor_name} was beneficial. Kindly take a moment to share your feedback. Your response helps us improve and maintain quality.\n\n${feedbackLink}\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>We hope your recent session with ${counsellor_name} was beneficial. Kindly take a moment to share your feedback. Your response helps us improve and maintain quality.</p>
    <p><a href="${feedbackLink}">Leave feedback</a></p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientAutoMatchNotification = async ({ email, first_name, counsellor_name }) => {
  const subject = `You’ve been auto-matched with ${counsellor_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nYou’ve been auto-matched with ${counsellor_name}, based on your preferences and availability.\n\nPlease log in to review their profile and choose to accept or decline the match.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>You’ve been auto-matched with ${counsellor_name}, based on your preferences and availability.</p>
    <p>Please log in to review their profile and choose to accept or decline the match.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientInactivityReminder = async ({ email, first_name }) => {
  const subject = 'We’ve missed you on Quluub';
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nWe noticed you haven’t been active on Quluub recently. If you’re still seeking support, your matched counsellors are waiting for you.\n\nLog in today and take the next step, in shaa Allah.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>We noticed you haven’t been active on Quluub recently. If you’re still seeking support, your matched counsellors are waiting for you.</p>
    <p>Log in today and take the next step, in shaa Allah.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendClientSubscriptionExpiryReminder = async ({ email, first_name, expiry_date }) => {
  const subject = `Your Quluub subscription expires on ${expiry_date}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nYour Quluub premium subscription is set to expire on ${expiry_date}.\n\nTo continue enjoying full access, kindly renew before the expiry date.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>Your Quluub premium subscription is set to expire on ${expiry_date}.</p>
    <p>To continue enjoying full access, kindly renew before the expiry date.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

// -------------------- COUNSELLOR EMAILS --------------------

exports.sendCounsellorWelcomeEmail = async ({ email, first_name, termsLink }) => {
  const subject = `Welcome to Quluub Counselling, ${first_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nWelcome to Quluub. We’re honoured to have you join our counselling platform dedicated to serving the ummah through compassionate, faith-based guidance.\n\nPlease log in to complete your profile, set your availability, and begin supporting clients in need.\n\nKindly go through our Terms and Conditions below:\n${termsLink}\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>Welcome to Quluub. We’re honoured to have you join our counselling platform dedicated to serving the ummah through compassionate, faith-based guidance.</p>
    <p>Please log in to complete your profile, set your availability, and begin supporting clients in need.</p>
    <p>Kindly go through our Terms and Conditions below:<br/>
    <a href="${termsLink}">View Terms and Conditions</a></p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendCounsellorEmailOtp = async ({ email, first_name, otp }) => {
  const subject = 'Verify your Quluub counsellor account';
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nPlease verify your email address by entering the following OTP:\n\n${otp}\n\nThis code is valid for the next 10 minutes.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>Please verify your email address by entering the following OTP:</p>
    <p><strong>${otp}</strong></p>
    <p>This code is valid for the next 10 minutes.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendCounsellorNewRequest = async ({ email, first_name, client_name }) => {
  const subject = `New counselling request from ${client_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nYou’ve received a new counselling request from ${client_name}.\n\nPlease log in to your dashboard to accept or decline the request within the next 48 hours.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>You’ve received a new counselling request from ${client_name}.</p>
    <p>Please log in to your dashboard to accept or decline the request within the next 48 hours.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendCounsellorRequestReminder = async ({ email, first_name, client_name }) => {
  const subject = `Reminder: Pending request from ${client_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nThis is a friendly reminder to respond to the counselling request from ${client_name}. Kindly accept or decline the request at your earliest convenience.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>This is a friendly reminder to respond to the counselling request from ${client_name}. Kindly accept or decline the request at your earliest convenience.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendCounsellorRequestAcceptedConfirmation = async ({ email, first_name, client_name }) => {
  const subject = `You accepted a request from ${client_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nYou have successfully accepted the request from ${client_name}. You can now begin chatting and arrange your first session.\n\nWe ask Allah to place barakah in your efforts.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>You have successfully accepted the request from ${client_name}. You can now begin chatting and arrange your first session.</p>
    <p>We ask Allah to place barakah in your efforts.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendCounsellorSessionReminder = async ({ email, first_name, client_name, date, time }) => {
  const subject = `Session reminder with ${client_name}`;
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nThis is a reminder that you have a session scheduled with ${client_name} on ${date} at ${time}.\n\nPlease ensure your availability and preparation before the session.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>This is a reminder that you have a session scheduled with ${client_name} on ${date} at ${time}.</p>
    <p>Please ensure your availability and preparation before the session.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

// Not wired for now, but template is available if needed.
exports.sendCounsellorNewReviewNotification = async ({ email, first_name }) => {
  const subject = 'New feedback on your recent session';
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nA client has submitted feedback on your recent session. You can view the anonymised review in your dashboard.\n\nThank you for your continued dedication.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>A client has submitted feedback on your recent session. You can view the anonymised review in your dashboard.</p>
    <p>Thank you for your continued dedication.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendCounsellorInactivityWarning = async ({ email, first_name }) => {
  const subject = 'We’ve noticed some inactivity on your Quluub account';
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nWe noticed a period of inactivity on your account. If you’re still available to counsel clients, please update your availability or respond to pending requests.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>We noticed a period of inactivity on your account. If you’re still available to counsel clients, please update your availability or respond to pending requests.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

exports.sendCounsellorPayoutNotification = async ({ email, first_name }) => {
  const subject = 'Your Quluub earnings have been processed';
  const text = `Dear ${first_name},\nSalaamun alaekum,\n\nYour recent earnings have been processed. Payment for your completed sessions will be transferred to your account shortly.\n\nFor a breakdown of your earnings, please log into your dashboard.\n\nJazaakumuLlahu khairan,\nThe Quluub Team`;
  const htmlBody = `
    <p>Dear ${first_name},</p>
    <p>Salaamun alaekum,</p>
    <p>Your recent earnings have been processed. Payment for your completed sessions will be transferred to your account shortly.</p>
    <p>For a breakdown of your earnings, please log into your dashboard.</p>
    <p>JazaakumuLlahu khairan,<br/>The Quluub Team</p>
  `;

  await sendEmail({ email, subject, message: text, html: wrapWithLayout(htmlBody, { subject }) });
};

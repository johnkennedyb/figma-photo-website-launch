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

  // Maileroo expects 'to' as a single email object or an array of email objects
  // with shape: { address: 'user@example.com', name?: 'User' }
  const toField = Array.isArray(options.email)
    ? options.email.map(e => (typeof e === 'string' ? { address: e } : (
        e.address ? e : { address: e.email || e.to || String(e), name: e.name }
      )))
    : (typeof options.email === 'object' && options.email && (options.email.address || options.email.email)
        ? { address: options.email.address || options.email.email, name: options.email.name }
        : { address: options.email, name: options.name });

  const payload = {
    from: { address: fromEmail, name: fromName },
    to: Array.isArray(toField) ? toField : [toField],
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Inline CID assets when referenced in HTML
  if (options.html && typeof options.html === 'string') {
    const needsHeader = options.html.includes('cid:header.png');
    const needsFooter = options.html.includes('cid:footer.png');
    const needsIconX = options.html.includes('cid:x.png');
    const needsIconTikTok = options.html.includes('cid:tiktok.png');
    const needsIconFacebook = options.html.includes('cid:facebook.png');
    const needsIconYouTube = options.html.includes('cid:youtube.png');

    const assets = [];
    const addAsset = (cid, url, fileName, contentType = 'image/png') => {
      assets.push({ cid, url, fileName, contentType });
    };

    if (needsHeader) addAsset('header.png', 'https://res.cloudinary.com/dw7w2at8k/image/upload/v1763992958/Copy_of_Quluub_Email_Header_y8f1ln.png', 'header.png');
    if (needsFooter) addAsset('footer.png', 'https://res.cloudinary.com/dw7w2at8k/image/upload/v1763992958/Copy_of_Quluub_Email_Header_1_wnflbn.png', 'footer.png');
    if (needsIconX) addAsset('x.png', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/X_logo_2023_original.svg/64px-X_logo_2023_original.svg.png', 'x.png');
    if (needsIconTikTok) addAsset('tiktok.png', 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/64px-TikTok_logo.svg.png', 'tiktok.png');
    if (needsIconFacebook) addAsset('facebook.png', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/64px-Facebook_Logo_%282019%29.png', 'facebook.png');
    if (needsIconYouTube) addAsset('youtube.png', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/YouTube_social_white_square_%282017%29.svg/64px-YouTube_social_white_square_%282017%29.svg.png', 'youtube.png');

    if (assets.length) {
      const downloads = await Promise.allSettled(
        assets.map(a => axios.get(a.url, { responseType: 'arraybuffer' }))
      );

      const attachments = [];
      for (let i = 0; i < assets.length; i++) {
        const result = downloads[i];
        if (result.status === 'fulfilled') {
          const base64 = Buffer.from(result.value.data).toString('base64');
          const respCT = (result.value.headers && (result.value.headers['content-type'] || result.value.headers['Content-Type'])) || assets[i].contentType;
          attachments.push({
            file_name: assets[i].fileName,
            content_type: respCT,
            content: base64,
            inline: true,
            content_id: assets[i].cid, // use same as file_name for broad compatibility
          });
        }
      }

      if (attachments.length) {
        payload.attachments = attachments;
      }
    }
  }

  await axios.post('https://smtp.maileroo.com/api/v2/emails', payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  });
};

module.exports = sendEmail;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
require('dotenv').config();

/**
 * NOTE: This is a very small scaffold to get a Zoom meeting created from the backend.
 * In development or if the Zoom credentials are missing, we simply return a dummy URL so
 * the rest of the flow can be tested locally without hitting Zoom.  
 *
 * Required env variables for production mode:
 *   ZOOM_ACCOUNT_ID   – your Zoom account ID (for OAuth)
 *   ZOOM_CLIENT_ID    – Zoom OAuth client id
 *   ZOOM_CLIENT_SECRET – Zoom OAuth client secret
 *   ZOOM_JWT          – **OR** a legacy JWT App token if you still use JWT apps
 */

// util: generate a JWT header for legacy apps; if you are on OAuth you would
// instead exchange a refresh_token for an access_token and cache it.
const getZoomAuthHeader = () => {
  if (process.env.ZOOM_JWT) {
    return { Authorization: `Bearer ${process.env.ZOOM_JWT}` };
  }
  // fallback – no creds
  return null;
};

// @route   POST api/zoom/create-meeting
// @desc    Counselor creates an ad-hoc meeting for a client & returns join info
// @access  Private (Counselor)
router.post('/create-meeting', auth, async (req, res) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ msg: 'Only counselors can create meetings.' });
  }

  const { topic = 'Counseling Session', clientEmail } = req.body;

  // Development shortcut – skip real API call
  if (process.env.NODE_ENV !== 'production' || !process.env.ZOOM_JWT) {
    const dummyMeetingId = Math.floor(Math.random() * 1e11).toString();
    return res.json({
      meetingId: dummyMeetingId,
      joinUrl: `https://zoom.us/j/${dummyMeetingId}`,
      meetingPasscode: '123456',
      // Front-end can embed with Web SDK but we also return full URL for convenience
    });
  }

  try {
    const authHeader = getZoomAuthHeader();
    if (!authHeader) {
      return res.status(500).json({ msg: 'Zoom credentials are not configured.' });
    }

    const zoomRes = await axios.post('https://api.zoom.us/v2/users/me/meetings',
      {
        topic,
        type: 1, // instant meeting
        settings: {
          waiting_room: false,
          participant_video: true,
          host_video: true,
        },
      },
      { headers: { 'Content-Type': 'application/json', ...authHeader } },
    );

    const { id, join_url, password } = zoomRes.data;

    // Optionally you could add clientEmail as a registrant here

    return res.json({ meetingId: id.toString(), joinUrl: join_url, meetingPasscode: password || '' });
  } catch (err) {
    console.error('Zoom create-meeting error', err.response?.data || err.message);
    return res.status(500).json({ msg: 'Failed to create Zoom meeting' });
  }
});

module.exports = router;

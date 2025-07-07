const axios = require('axios');

/**
 * Creates a Whereby video call room for a session.
 * @param {object} session - The session object from the database.
 * @returns {Promise<string>} The URL of the created video call room.
 */
const createVideoCall = async (session) => {
  try {
    // The meeting will be available from the session time and expire 2 hours after it starts.
    const sessionStart = new Date(session.date);
    const sessionEnd = new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

    console.log(`[VideoCallHelper] Creating Whereby meeting for session ${session._id}...`);

    const response = await axios.post(
      'https://api.whereby.dev/v1/meetings',
      {
        startDate: sessionStart.toISOString(),
        endDate: sessionEnd.toISOString(),
        roomMode: 'group', // 'group' allows more than 2 participants if needed in future
        fields: ['roomUrl'],
        roomNamePattern: 'personal',
        roomNamePrefix: `session-${session._id.toString().slice(-6)}` // Creates a more identifiable room name
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[VideoCallHelper] Successfully created Whereby meeting. Room URL: ${response.data.roomUrl}`);
    return response.data.roomUrl;
  } catch (error) {
    console.error(
      '[VideoCallHelper] Whereby API error:',
      error.response ? error.response.data : error.message
    );
    // Re-throw the error to be handled by the calling function
    throw new Error('Failed to create video call room.');
  }
};

module.exports = { createVideoCall };

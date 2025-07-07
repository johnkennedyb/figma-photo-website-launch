const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

// @route   POST api/whereby/create-meeting
// @desc    Create a Whereby video call meeting
// @access  Private
router.post('/create-meeting', auth, async (req, res) => {
  try {
    // The API call creates a temporary room that expires in 2 hours.
    const response = await axios.post(
      'https://api.whereby.dev/v1/meetings',
      {
        endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Expires in 2 hours
        fields: ['roomUrl'],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      'Whereby API error:',
      error.response ? error.response.data : error.message
    );
    res.status(500).send('Server error creating video meeting');
  }
});

module.exports = router;

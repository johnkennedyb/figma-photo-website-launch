const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Request = require('../models/Request');
const User = require('../models/User');
const Session = require('../models/Session');

// @route   POST api/requests
// @desc    Create a connection request
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { counselorId } = req.body;
    const client = await User.findById(req.user.id);
    const counselor = await User.findById(counselorId);

    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ msg: 'Counselor not found' });
    }

    // Check if a request already exists
    let existingRequest = await Request.findOne({
      client: req.user.id,
      counselor: counselorId,
    });

    if (existingRequest) {
      return res.status(400).json({ msg: 'Request already sent' });
    }

    const newRequest = new Request({
      client: req.user.id,
      counselor: counselorId,
    });

    await newRequest.save();
    res.json(newRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/requests
// @desc    Get all requests for a counselor
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'counselor') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { status } = req.query;

    if (!status || !['pending', 'accepted', 'declined'].includes(status)) {
      return res.status(400).json({ msg: 'A valid status is required' });
    }

    const requests = await Request.find({ counselor: req.user.id, status })
      .populate('client', 'firstName lastName');

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/requests/:id
// @desc    Accept or decline a request
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    if (request.counselor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    request.status = status;
    await request.save();

    // If the request is accepted, create a 'pending' session to enable chat.
    if (status === 'accepted') {
      const existingSession = await Session.findOne({
        client: request.client,
        counselor: request.counselor,
      });

      if (!existingSession) {
        const newSession = new Session({
          client: request.client,
          counselor: request.counselor,
          status: 'pending', // This status signifies that chat is allowed, but the session isn't fully booked.
        });
        await newSession.save();
      }
    }

    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/requests/status/:counselorId
// @desc    Get the status of a request between a client and a counselor
// @access  Private
router.get('/status/:counselorId', auth, async (req, res) => {
  try {
    const request = await Request.findOne({
      client: req.user.id,
      counselor: req.params.counselorId,
    });

    if (!request) {
      // No request has been sent yet
      return res.json({ status: 'not_sent' });
    }

    res.json({ status: request.status });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

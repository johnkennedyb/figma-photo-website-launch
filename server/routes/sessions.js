const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

// @route   GET api/sessions
// @desc    Get all sessions for a user (client or counselor)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let sessions;

    if (user.role === 'client') {
      sessions = await Session.find({ client: req.user.id })
        .populate('counselor', 'name email specialty');
    } else if (user.role === 'counselor') {
      sessions = await Session.find({ counselor: req.user.id })
        .populate('client', 'name email');
    }

    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/sessions/list-for-counselor
// @desc    Get all sessions for the logged-in counselor
// @access  Private
router.get('/list-for-counselor', auth, async (req, res) => {
  try {
    // The user object (including role) is attached by the auth middleware
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ msg: 'User is not a counselor' });
    }
    const sessions = await Session.find({ counselor: req.user.id })
      .populate('client', 'name email')
      .sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/sessions/:id
// @desc    Get a single session by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('client', 'name email')
      .populate('counselor', 'name email');

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Security check: ensure the user requesting is part of the session
    if (session.client._id.toString() !== req.user.id && session.counselor._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to view this session' });
    }

    res.json(session);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Session not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/sessions/:id/complete
// @desc    Mark a session as completed and credit the counselor's wallet
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Ensure the user is part of the session
    if (session.client.toString() !== req.user.id && session.counselor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ msg: 'Session already completed' });
    }

    // Only paid sessions can be completed
    if (session.status !== 'paid') {
      return res.status(400).json({ msg: 'Session has not been paid for' });
    }

    session.status = 'completed';
    await session.save();

    // Credit counselor's wallet
    const counselorWallet = await Wallet.findOne({ user: session.counselor });
    if (!counselorWallet) {
        const newWallet = new Wallet({ user: session.counselor, balance: session.price });
        await newWallet.save();
    } else {
        counselorWallet.balance += session.price;
        await counselorWallet.save();
    }

    res.json(session);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/sessions/:id/reschedule
// @desc    Reschedule a session
// @access  Private
router.put('/:id/reschedule', auth, async (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ msg: 'Date is required' });
  }

  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Security check: ensure the user requesting is part of the session
    if (session.client.toString() !== req.user.id && session.counselor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to reschedule this session' });
    }

    // Add any business logic here, e.g., prevent rescheduling too close to the session time

    session.date = date;
    await session.save();

    // Optional: Notify the other user about the reschedule

    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/sessions
// @desc    Book a new session
// @access  Private
router.post('/', auth, async (req, res) => {
  const { counselorId, date, price } = req.body;

  if (!counselorId || !date || !price) {
    return res.status(400).json({ msg: 'Counselor, date, and price are required' });
  }

  try {
    const client = await User.findById(req.user.id);
    const counselor = await User.findById(counselorId);

    if (!client || client.role !== 'client') {
      return res.status(403).json({ msg: 'User is not a client' });
    }
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ msg: 'Counselor not found' });
    }

    // Check client's wallet balance
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet || wallet.balance < price) {
      return res.status(400).json({ msg: 'Insufficient funds' });
    }

    // Deduct from wallet
    wallet.balance -= price;
    await wallet.save();

    const newSession = new Session({
      client: req.user.id,
      counselor: counselorId,
      date,
      price,
      status: 'paid',
    });

    const session = await newSession.save();

    // Notify counselor via Socket.IO
    const io = req.io;
    const userSocketMap = req.userSocketMap;
    const counselorSocketId = userSocketMap[counselorId];
    if (counselorSocketId) {
      io.to(counselorSocketId).emit('new-session-booked', session);
    }

    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

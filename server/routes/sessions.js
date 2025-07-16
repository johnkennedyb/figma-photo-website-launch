const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const Counselor = require('../models/Counselor');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Review = require('../models/Review');

// @route   GET api/sessions
// @desc    Get all sessions for a user (client or counselor)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let sessions = []; // Initialize to empty array

    if (user.role === 'client') {
      sessions = await Session.find({ client: req.user.id })
        .populate('counselor', 'firstName lastName profilePicture');
    } else if (user.role === 'counselor') {
      sessions = await Session.find({ counselor: req.user.id })
        .populate('client', 'firstName lastName email');
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
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ msg: 'User is not a counselor' });
    }
    const sessions = await Session.find({ counselor: req.user.id })
      .populate('client', 'firstName lastName email')
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
      .populate('client', 'firstName lastName email')
      .populate('counselor', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

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

    if (session.client.toString() !== req.user.id && session.counselor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ msg: 'Session already completed' });
    }

    if (session.status !== 'paid') {
      return res.status(400).json({ msg: 'Session has not been paid for' });
    }

    session.status = 'completed';
    await session.save();

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

    if (session.client.toString() !== req.user.id && session.counselor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to reschedule this session' });
    }

    session.date = date;
    await session.save();

    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/sessions/schedule
// @desc    Schedule a new session (creates a pending session before payment)
// @access  Private
router.post('/schedule', auth, async (req, res) => {
  console.log('[Schedule Session] Received request with body:', req.body);
  const { date, counselorId, clientId } = req.body;
  const requester = req.user;

  try {
    console.log(`[Schedule Session] Requester ID: ${req.user.id}, Role: ${req.user.role}`);
    let finalClientId, finalCounselorId;

    if (requester.role === 'client') {
      // A client is booking a session for themselves with a counselor.
      if (!counselorId) return res.status(400).json({ msg: 'Counselor ID is required.' });
      finalClientId = requester.id;
      finalCounselorId = counselorId;
    } else if (requester.role === 'counselor') {
      // A counselor is booking a session for a client.
      if (!clientId) return res.status(400).json({ msg: 'Client ID is required.' });
      finalClientId = clientId;
      // The counselor making the request is the one the session is for.
      finalCounselorId = requester.id;
    } else {
      return res.status(403).json({ msg: 'User role is not authorized to schedule sessions.' });
    }

    console.log(`[Schedule Session] Determined Client ID: ${finalClientId}, Counselor ID: ${finalCounselorId}`);

    const counselor = await User.findById(finalCounselorId);
    console.log(`[Schedule Session] Fetched counselor: ${counselor ? counselor.id : 'Not Found'}`);
    if (!counselor || !counselor.sessionRate) {
      console.error(`[Schedule Session] Error: Counselor not found or session rate is missing for counselor ${finalCounselorId}`);
      return res.status(404).json({ msg: 'Counselor profile not found. Could not determine session rate.' });
    }

    const clientUser = await User.findById(finalClientId);
    if (!clientUser || clientUser.role !== 'client') {
      console.error(`[Schedule Session] Error: Client not found or invalid role for client ${finalClientId}`);
      return res.status(404).json({ msg: 'Client user not found.' });
    }

    const newSession = new Session({
      client: finalClientId,
      counselor: finalCounselorId,
      date,
      status: 'pending_payment',
      price: counselor.sessionRate, // Correct field name
      currency: (counselor.currency || 'usd').toLowerCase(), // Correct enum value
    });

    await newSession.save();
    res.status(201).json(newSession);

  } catch (err) {
    console.error('Error scheduling session:', err.message);
    res.status(500).send('Server Error');
  }
});

// This endpoint has been removed to prevent duplication.
// All scheduling requests should go to POST /api/sessions/schedule.


// @route   POST api/sessions/:id/rate
// @desc    Rate a session
// @access  Private (Client only)
router.post('/:id/rate', auth, async (req, res) => {
  const { rating, comment } = req.body;
  const { id: sessionId } = req.params;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ msg: 'A rating between 1 and 5 is required.' });
  }

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found.' });
    }

    if (session.client.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You are not authorized to rate this session.' });
    }

    if (session.status !== 'completed') {
        return res.status(400).json({ msg: 'Only completed sessions can be rated.' });
    }

    const existingReview = await Review.findOne({ session: sessionId });
    if (existingReview) {
        return res.status(400).json({ msg: 'This session has already been rated.' });
    }

    const newReview = new Review({
      session: sessionId,
      client: req.user.id,
      counselor: session.counselor,
      rating,
      comment,
    });
    await newReview.save();

    session.status = 'rated';
    await session.save();

    const counselor = await User.findById(session.counselor);
    if (counselor) {
        const oldTotalRating = counselor.averageRating * counselor.reviewsCount;
        const newReviewsCount = counselor.reviewsCount + 1;
        const newAverageRating = (oldTotalRating + rating) / newReviewsCount;
        
        counselor.averageRating = newAverageRating;
        counselor.reviewsCount = newReviewsCount;
        
        await counselor.save();
    }

    res.status(201).json({ msg: 'Rating submitted successfully.', review: newReview });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Session = require('../models/Session');
const Setting = require('../models/Setting');
const sendEmail = require('../utils/sendEmail');

// @route   POST api/admin/login
// @desc    Authenticate admin & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Not an admin.' });
      }

      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/admin/dashboard-overview
// @desc    Get a comprehensive overview for the admin dashboard
// @access  Private, Admin
router.get('/dashboard-overview', [auth, admin], async (req, res) => {
  try {
    // 1. User Stats
    const totalClients = await User.countDocuments({ role: 'client' });
    const activeClients = await User.countDocuments({ role: 'client', isSuspended: false });
    const totalCounselors = await User.countDocuments({ role: 'counselor' });
    const activeCounselors = await User.countDocuments({ role: 'counselor', isSuspended: false });

    // 2. Session Statistics
    const sessionStats = await Session.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const completedCount = sessionStats.find(s => s._id === 'completed')?.count || 0;
    const ongoingCount = (sessionStats.find(s => s._id === 'paid')?.count || 0) + (sessionStats.find(s => s._id === 'upcoming')?.count || 0);
    const canceledCount = sessionStats.find(s => s._id === 'canceled')?.count || 0;

    const avgDurationResult = await Session.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
    ]);
    const averageSessionDuration = avgDurationResult[0]?.avgDuration || 0;

    // 3. Payment & Revenue Reports
    const revenueReport = await Session.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$currency', total: { $sum: '$price' } } },
    ]);

    const totalRevenue = revenueReport.reduce((acc, curr) => {
        acc[curr._id] = curr.total;
        return acc;
    }, {});

    // 4. User Engagement Metrics (Most Active Counselors)
    const mostActiveCounselors = await Session.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$counselor', sessionCount: { $sum: 1 } } },
        { $sort: { sessionCount: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'counselorDetails'
            }
        },
        { $unwind: '$counselorDetails' },
        {
            $project: {
                _id: 0,
                counselorId: '$_id',
                name: { $concat: ['$counselorDetails.firstName', ' ', '$counselorDetails.lastName'] },
                sessionCount: '$sessionCount'
            }
        }
    ]);

    // 5. Reports & Complaints Overview
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

    const overview = {
      userStats: {
        totalClients,
        activeClients,
        inactiveClients: totalClients - activeClients,
        totalCounselors,
        activeCounselors,
        inactiveCounselors: totalCounselors - activeCounselors,
      },
      sessionStats: {
        completed: completedCount,
        ongoing: ongoingCount,
        canceled: canceledCount,
        averageDuration: averageSessionDuration,
      },
      revenueReport: totalRevenue,
      userEngagement: {
        mostActiveCounselors,
      },
      complaints: {
        pending: pendingComplaints,
      },
    };

    res.json(overview);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/users
// @desc    Get all users, with optional filtering by role, country, activity, subscriptionStatus, and reported
// @access  Private, Admin
router.get('/users', [auth, admin], async (req, res) => {
  try {
    const { role, country, activity, subscriptionStatus, reported } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (country) filter.country = country;
    if (subscriptionStatus) filter.subscriptionStatus = subscriptionStatus;
    if (activity) {
      // Example: filter by last login or session count, adjust as needed
      // For now, skip unless you have activity tracking fields
    }

    let users = await User.find(filter).select('-password');

    // If reported=true, filter users with complaints
    if (reported === 'true') {
      const complaints = await Complaint.find({ status: 'pending' });
      const reportedUserIds = complaints.map(c => c.reportedUser); // adjust field as needed
      users = users.filter(u => reportedUserIds.some(id => id.equals(u._id)));
    }

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id
// @desc    Update a user's details
// @access  Private, Admin
router.put('/users/:id', [auth, admin], async (req, res) => {
  const { name, email, role } = req.body;

  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update fields if they are provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user
// @access  Private, Admin
router.delete('/users/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Optional: Add logic here to handle related data, like re-assigning sessions
    // or deleting related documents if necessary.

    await user.deleteOne();

    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/sessions
// @desc    Get all sessions
// @access  Private, Admin
router.get('/sessions', [auth, admin], async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('client', 'name email')
      .populate('counselor', 'name email')
      .sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/transactions
// @desc    Get all completed transactions (paid sessions)
// @access  Private, Admin
router.get('/transactions', [auth, admin], async (req, res) => {
  try {
    const transactions = await Session.find({
      status: { $in: ['paid', 'completed'] }
    })
      .populate('client', 'firstName lastName email')
      .populate('counselor', 'firstName lastName email')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/chat/:user1Id/:user2Id
// @desc    Get chat history between two users
// @access  Private, Admin
router.get('/chat/:user1Id/:user2Id', [auth, admin], async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: user1Id, receiver: user2Id },
        { sender: user2Id, receiver: user1Id },
      ],
    })
    .populate('sender', 'name role')
    .populate('receiver', 'name role')
    .sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   PUT api/admin/users/:id/verify
// @desc    Verify a counselor
// @access  Private, Admin
router.put('/users/:id/verify', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (user.role !== 'counselor') {
      return res.status(400).json({ msg: 'This action is only applicable to counselors' });
    }

    user.isVerified = true;
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/counselors/:id/rate
// @desc    Update counselor session rates
// @access  Private, Admin
router.put('/counselors/:id/rate', [auth, admin], async (req, res) => {
  try {
    const { sessionRate, ngnSessionRate } = req.body;
    if (sessionRate == null && ngnSessionRate == null) {
      return res.status(400).json({ msg: 'Provide at least one rate (sessionRate or ngnSessionRate).' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'Counselor not found' });
    if (user.role !== 'counselor') {
      return res.status(400).json({ msg: 'User is not a counselor' });
    }

    if (sessionRate != null) user.sessionRate = Number(sessionRate);
    if (ngnSessionRate != null) user.ngnSessionRate = Number(ngnSessionRate);

    await user.save();
    res.json({ msg: 'Rates updated', counselor: user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id/suspend
// @desc    Suspend or un-suspend a user
// @access  Private, Admin
router.put('/users/:id/suspend', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Use findByIdAndUpdate to avoid validation issues on save for older documents
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isSuspended: !user.isSuspended } },
      { new: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/counselors
// @desc    Get all counselors with optional filtering
// @access  Private, Admin
router.get('/counselors', [auth, admin], async (req, res) => {
  try {
    const { location, specialization, experience } = req.query;
    const filter = { role: 'counselor' };

    if (location) {
      filter.country = location;
    }
    if (specialization) {
      // Assuming specialization is a comma-separated string
      filter.specialization = { $in: specialization.split(',') };
    }
    if (experience) {
      // Assuming experience is stored in years
      filter.yearsOfExperience = { $gte: parseInt(experience, 10) };
    }

    const counselors = await User.find(filter)
      .select('-password');

    res.json(counselors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/complaints
// @desc    Get all complaints
// @access  Admin
router.get('/complaints', [auth, admin], async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/complaints/:id/status
// @desc    Update complaint status
// @access  Admin
router.put('/complaints/:id/status', [auth, admin], async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ msg: 'Invalid status provided.' });
  }

  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    complaint.status = status;
    await complaint.save();

    const populatedComplaint = await Complaint.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email');

    res.json(populatedComplaint);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/counselors/:id/visibility
// @desc    Toggle counselor visibility on the platform
// @access  Private, Admin
router.put('/counselors/:id/visibility', [auth, admin], async (req, res) => {
  try {
    const counselor = await User.findById(req.params.id);
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ msg: 'Counselor not found' });
    }

    counselor.isVisible = !counselor.isVisible;
    await counselor.save();

    res.json(counselor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/sessions/:id/override-match
// @desc    Override a client-counselor match by re-assigning the counselor
// @access  Private, Admin
router.put('/sessions/:id/override-match', [auth, admin], async (req, res) => {
  const { counselorId } = req.body;

  if (!counselorId) {
    return res.status(400).json({ msg: 'New counselor ID is required.' });
  }

  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ msg: 'Session not found.' });
    }

    const newCounselor = await User.findById(counselorId);
    if (!newCounselor || newCounselor.role !== 'counselor') {
      return res.status(404).json({ msg: 'The provided ID does not belong to a valid counselor.' });
    }

    session.counselor = newCounselor._id;
    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate('client', 'name email')
      .populate('counselor', 'name email');

    res.json(populatedSession);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/counselors
// @desc    Get all counselors with optional filters
// @access  Private, Admin
router.get('/counselors', [auth, admin], async (req, res) => {
  try {
    const { specialty, country, experience, pending } = req.query;
    const filter = { role: 'counselor' };
    if (specialty) filter.specialty = specialty;
    if (country) filter.country = country;
    if (experience) {
      // Example: filter by yearsOfExperience range
      const [min, max] = experience.split('-');
      if (max) {
        filter.yearsOfExperience = { $gte: Number(min), $lte: Number(max) };
      } else if (min.endsWith('+')) {
        filter.yearsOfExperience = { $gte: Number(min.replace('+', '')) };
      }
    }
    if (pending === 'true') filter.isVerified = false;

    const counselors = await User.find(filter).select('-password');
    res.json(counselors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/sessions/live
// @desc    Get live session status
// @access  Private, Admin
router.get('/sessions/live', [auth, admin], async (req, res) => {
  try {
    const sessions = await Session.find({ status: { $in: ['paid', 'completed'] } })
      .populate('client', 'firstName lastName email')
      .populate('counselor', 'firstName lastName email')
      .sort({ date: -1 })
      .limit(50); // Limit to last 50 sessions for performance

    const liveSessions = sessions.map(session => ({
      _id: session._id,
      client: {
        _id: session.client._id,
        name: `${session.client.firstName} ${session.client.lastName}`,
        email: session.client.email
      },
      counselor: {
        _id: session.counselor._id,
        name: `${session.counselor.firstName} ${session.counselor.lastName}`,
        email: session.counselor.email
      },
      date: session.date,
      duration: session.duration,
      status: session.status,
      videoCallUrl: session.videoCallUrl,
      lastUpdated: session.updatedAt
    }));

    res.json({ sessions: liveSessions });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/sessions/:id/override
// @desc    Override session counselor match
// @access  Private, Admin
router.put('/sessions/:id/override', [auth, admin], async (req, res) => {
  try {
    const { counselorId } = req.body;
    if (!counselorId) {
      return res.status(400).json({ msg: 'Counselor ID is required' });
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    const counselor = await User.findById(counselorId);
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ msg: 'Counselor not found' });
    }

    session.counselor = counselor._id;
    session.videoCallUrl = null; // Reset video call URL as it needs to be recreated
    await session.save();

    res.json({ msg: 'Session match overridden successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/sessions/:id/cancel
// @desc    Cancel a session
// @access  Private, Admin
router.put('/sessions/:id/cancel', [auth, admin], async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    session.status = 'canceled';
    await session.save();

    res.json({ msg: 'Session canceled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/sessions/:id/extend
// @desc    Extend session duration
// @access  Private, Admin
router.put('/sessions/:id/extend', [auth, admin], async (req, res) => {
  try {
    const { minutes } = req.body;
    if (!minutes || isNaN(minutes)) {
      return res.status(400).json({ msg: 'Minutes must be a number' });
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.status !== 'paid') {
      return res.status(400).json({ msg: 'Can only extend active sessions' });
    }

    session.duration += minutes;
    await session.save();

    res.json({ msg: 'Session duration extended successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/settings/matching-algorithm
// @desc    Get the current matching algorithm setting
// @access  Private, Admin
router.get('/settings/matching-algorithm', [auth, admin], async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'matching_algorithm' });

    if (!setting) {
      // Default to 'auto' if not set
      setting = new Setting({ key: 'matching_algorithm', value: 'auto' });
      await setting.save();
    }

    res.json(setting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/settings/matching-algorithm
// @desc    Update the matching algorithm setting
// @access  Private, Admin
router.put('/settings/matching-algorithm', [auth, admin], async (req, res) => {
  const { value } = req.body;
  const allowedValues = ['auto', 'manual'];

  if (!value || !allowedValues.includes(value)) {
    return res.status(400).json({ msg: 'Invalid value provided. Must be one of: ' + allowedValues.join(', ') });
  }

  try {
    let setting = await Setting.findOneAndUpdate(
      { key: 'matching_algorithm' },
      { value },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(setting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

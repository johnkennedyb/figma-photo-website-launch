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
    const totalCounselors = await User.countDocuments({ role: 'counselor' });

    // 2. Session Statistics
    const sessionStats = await Session.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const completedCount = sessionStats.find(s => s._id === 'completed')?.count || 0;
    const ongoingCount = (sessionStats.find(s => s._id === 'paid')?.count || 0) + (sessionStats.find(s => s._id === 'upcoming')?.count || 0);
    const canceledCount = sessionStats.find(s => s._id === 'canceled')?.count || 0;

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
                name: '$counselorDetails.name',
                sessionCount: '$sessionCount'
            }
        }
    ]);

    // 5. Reports & Complaints Overview
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

    const overview = {
      userStats: {
        totalClients,
        totalCounselors,
      },
      sessionStats: {
        completed: completedCount,
        ongoing: ongoingCount,
        canceled: canceledCount,
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
// @desc    Get all users, with optional filtering by role
// @access  Private, Admin
router.get('/users', [auth, admin], async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-password');
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
      .populate('client', 'name email')
      .populate('counselor', 'name email')
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

// @route   PUT api/admin/users/:id/suspend
// @desc    Suspend or un-suspend a user
// @access  Private, Admin
router.put('/users/:id/suspend', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.isSuspended = !user.isSuspended; // Toggle suspension status
    await user.save();
    res.json(user);
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

module.exports = router;

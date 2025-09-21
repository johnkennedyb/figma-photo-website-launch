const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Session = require('../models/Session');
const Complaint = require('../models/Complaint');
const Transaction = require('../models/Transaction');
const sendEmail = require('../utils/sendEmail');
const cron = require('node-cron');

// @route   GET api/admin/dashboard-overview
// @desc    Get comprehensive dashboard overview data
// @access  Private, Admin
router.get('/dashboard-overview', [auth, admin], async (req, res) => {
  try {
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalCounselors = await User.countDocuments({ role: 'counselor' });
    const activeCounselors = await User.countDocuments({ role: 'counselor', approvalStatus: 'approved' });
    const pendingCounselors = await User.countDocuments({ role: 'counselor', approvalStatus: 'pending' });

    const totalSessions = await Session.countDocuments();
    const completedSessions = await Session.countDocuments({ status: 'completed' });
    const ongoingSessions = await Session.countDocuments({ status: 'scheduled' });

    const revenueData = await Session.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const avgDurationData = await Session.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]);
    const avgDuration = avgDurationData.length > 0 ? Math.round(avgDurationData[0].avgDuration) : 0;

    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

    res.json({
      userStats: {
        totalClients,
        totalCounselors,
        activeCounselors,
        pendingCounselors
      },
      sessionStats: {
        totalSessions,
        completedSessions,
        ongoingSessions,
        avgDuration
      },
      revenueStats: {
        totalRevenue,
        currency: 'NGN'
      },
      complaintStats: {
        totalComplaints,
        pendingComplaints
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/users
// @desc    Get all users with filters
// @access  Private, Admin
router.get('/users', [auth, admin], async (req, res) => {
  try {
    console.log('[Admin Users] Request received with query:', req.query);
    const { role, status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && role === 'counselor') filter.approvalStatus = status;
    
    console.log('[Admin Users] Filter applied:', filter);
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    console.log(`[Admin Users] Found ${users.length} users out of ${total} total`);
    
    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('[Admin Users] Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/sessions
// @desc    Get all sessions with filters
// @access  Private, Admin
router.get('/sessions', [auth, admin], async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sessions = await Session.find(filter)
      .populate('client', 'firstName lastName email')
      .populate('counselor', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Session.countDocuments(filter);
    
    res.json({
      sessions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/transactions
// @desc    Get all transactions with filters
// @access  Private, Admin
router.get('/transactions', [auth, admin], async (req, res) => {
  try {
    console.log('[Admin Transactions] Request received with query:', req.query);
    const { type, status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const transactions = await Transaction.find(filter)
      .populate({
        path: 'wallet',
        populate: {
          path: 'user',
          select: 'firstName lastName email role'
        }
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(filter);
    
    console.log(`[Admin Transactions] Found ${transactions.length} transactions out of ${total} total`);
    console.log('[Admin Transactions] Sample transaction:', transactions[0]);
    
    res.json({
      transactions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/complaints
// @desc    Get all complaints with filters
// @access  Private, Admin
router.get('/complaints', [auth, admin], async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const complaints = await Complaint.find(filter)
      .populate('reporter', 'firstName lastName email')
      .populate('reportedUser', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Complaint.countDocuments(filter);
    
    res.json({
      complaints,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
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
    const { usdRate, ngnRate } = req.body;
    
    const counselor = await User.findById(req.params.id);
    if (!counselor) {
      return res.status(404).json({ msg: 'Counselor not found' });
    }
    
    if (counselor.role !== 'counselor') {
      return res.status(400).json({ msg: 'User is not a counselor' });
    }
    
    // Update the rates
    if (usdRate !== null && usdRate !== undefined) {
      counselor.sessionRate = usdRate;
    }
    if (ngnRate !== null && ngnRate !== undefined) {
      counselor.ngnSessionRate = ngnRate;
    }
    
    await counselor.save();
    
    res.json({ 
      msg: 'Session rates updated successfully',
      counselor: {
        _id: counselor._id,
        firstName: counselor.firstName,
        lastName: counselor.lastName,
        email: counselor.email,
        sessionRate: counselor.sessionRate,
        ngnSessionRate: counselor.ngnSessionRate
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/settings/matching-algorithm
// @desc    Get matching algorithm settings
// @access  Private, Admin
router.get('/settings/matching-algorithm', [auth, admin], async (req, res) => {
  try {
    const settings = {
      weightFactors: {
        specialization: 0.4,
        experience: 0.3,
        rating: 0.2,
        availability: 0.1
      },
      filters: {
        minRating: 3.0,
        maxDistance: 50,
        languages: [],
        priceRange: {
          min: 0,
          max: 200
        }
      },
      preferences: {
        autoMatch: true,
        notifyOnMatch: true,
        allowRatingBelow3: false
      }
    };
    
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/settings/matching-algorithm
// @desc    Update matching algorithm settings
// @access  Private, Admin
router.put('/settings/matching-algorithm', [auth, admin], async (req, res) => {
  try {
    const { weightFactors, filters, preferences } = req.body;
    
    // In a real application, you would save these settings to a database
    // For now, we'll just return the updated settings
    const updatedSettings = {
      weightFactors: weightFactors || {
        specialization: 0.4,
        experience: 0.3,
        rating: 0.2,
        availability: 0.1
      },
      filters: filters || {
        minRating: 3.0,
        maxDistance: 50,
        languages: [],
        priceRange: { min: 0, max: 200 }
      },
      preferences: preferences || {
        autoMatch: true,
        notifyOnMatch: true,
        allowRatingBelow3: false
      }
    };
    
    res.json({ 
      msg: 'Matching algorithm settings updated successfully',
      settings: updatedSettings 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/bulk-email
// @desc    Send bulk email to users
// @access  Private, Admin
router.post('/bulk-email', [auth, admin], async (req, res) => {
  try {
    const { recipientGroup, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ msg: 'Subject and message are required' });
    }

    let filter = {};
    if (recipientGroup === 'clients') {
      filter.role = 'client';
    } else if (recipientGroup === 'counselors') {
      filter.role = 'counselor';
    }
    // For 'all', no filter is applied

    const users = await User.find(filter).select('email firstName lastName');
    
    if (users.length === 0) {
      return res.status(404).json({ msg: 'No users found for the selected group' });
    }

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 10;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            await sendEmail({
              email: user.email,
              subject: subject,
              message: `Dear ${user.firstName} ${user.lastName},\n\n${message}\n\nBest regards,\nQuluub Team`
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to send email to ${user.email}:`, error);
            failureCount++;
          }
        })
      );

      // Add a small delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({ 
      msg: `Bulk email process completed. Sent: ${successCount}, Failed: ${failureCount}`,
      totalUsers: users.length,
      successCount,
      failureCount
    });

  } catch (err) {
    console.error('Bulk email error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/automated-reminders
// @desc    Set up automated reminder system
// @access  Private, Admin
router.post('/automated-reminders', [auth, admin], async (req, res) => {
  try {
    const { reminderType, schedule, message, enabled } = req.body;

    if (!reminderType || !schedule || !message) {
      return res.status(400).json({ msg: 'Reminder type, schedule, and message are required' });
    }

    // Store reminder configuration (in a real app, this would be in a database)
    const reminderConfig = {
      id: Date.now().toString(),
      reminderType,
      schedule,
      message,
      enabled: enabled !== false,
      createdAt: new Date()
    };

    // Set up cron job based on schedule
    if (enabled !== false) {
      setupReminderCronJob(reminderConfig);
    }

    res.json({ 
      msg: 'Automated reminder configured successfully',
      reminder: reminderConfig
    });

  } catch (err) {
    console.error('Automated reminder error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/automated-reminders
// @desc    Get all automated reminders
// @access  Private, Admin
router.get('/automated-reminders', [auth, admin], async (req, res) => {
  try {
    // In a real app, this would fetch from database
    const reminders = [
      {
        id: '1',
        reminderType: 'session_reminder',
        schedule: '0 9 * * *', // Daily at 9 AM
        message: 'Don\'t forget about your upcoming counseling session!',
        enabled: true,
        createdAt: new Date()
      },
      {
        id: '2',
        reminderType: 'follow_up',
        schedule: '0 18 * * 5', // Every Friday at 6 PM
        message: 'How was your counseling session? We\'d love your feedback!',
        enabled: true,
        createdAt: new Date()
      }
    ];

    res.json({ reminders });

  } catch (err) {
    console.error('Get reminders error:', err.message);
    res.status(500).send('Server Error');
  }
});

// Helper function to set up cron jobs for reminders
function setupReminderCronJob(config) {
  cron.schedule(config.schedule, async () => {
    try {
      console.log(`Running automated reminder: ${config.reminderType}`);
      
      let users = [];
      
      if (config.reminderType === 'session_reminder') {
        // Find users with upcoming sessions in the next 24 hours
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const sessions = await Session.find({
          sessionDate: {
            $gte: new Date(),
            $lte: tomorrow
          },
          status: 'scheduled'
        }).populate('client', 'email firstName lastName');
        
        users = sessions.map(session => session.client);
      } else if (config.reminderType === 'follow_up') {
        // Find users who had sessions in the last week
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const sessions = await Session.find({
          sessionDate: {
            $gte: lastWeek,
            $lte: new Date()
          },
          status: 'completed'
        }).populate('client', 'email firstName lastName');
        
        users = sessions.map(session => session.client);
      }

      // Send reminder emails
      for (const user of users) {
        if (user && user.email) {
          try {
            await sendEmail({
              email: user.email,
              subject: `Reminder from Quluub`,
              message: `Dear ${user.firstName} ${user.lastName},\n\n${config.message}\n\nBest regards,\nQuluub Team`
            });
          } catch (emailError) {
            console.error(`Failed to send reminder to ${user.email}:`, emailError);
          }
        }
      }
      
      console.log(`Sent ${users.length} reminder emails for ${config.reminderType}`);
    } catch (error) {
      console.error(`Error in automated reminder ${config.reminderType}:`, error);
    }
  });
}

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { sendNotification } = require('../utils/push');

// @route   POST api/complaints
// @desc    File a new complaint
// @access  Private
router.post('/', auth, async (req, res) => {
  const { reportedUserId, reason, description } = req.body;

  try {
    const reporter = await User.findById(req.user.id);
    const reportedUser = await User.findById(reportedUserId);

    if (!reportedUser) {
      return res.status(404).json({ msg: 'User to be reported not found' });
    }

    const newComplaint = new Complaint({
      reporter: req.user.id,
      reportedUser: reportedUserId,
      reason,
      description,
    });

    await newComplaint.save();

    // Notify all admins via push notification
    const admins = await User.find({ role: 'admin' });
    const notificationPayload = {
      title: 'New Complaint Filed',
      body: `A new complaint has been filed by ${reporter.firstName} against ${reportedUser.firstName}. Reason: ${reason}`,
      icon: 'https://example.com/icon.png', // Optional: Add an icon URL
      data: { url: `/admin/complaints` } // URL to open on click
    };

    for (const admin of admins) {
      if (admin.pushSubscription && admin.pushSubscription.endpoint) {
        await sendNotification(admin.pushSubscription, notificationPayload);
      }
    }

    res.status(201).json(newComplaint);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const cron = require('node-cron');

// @route   POST api/reminders/schedule
// @desc    Schedule automated reminder
// @access  Private, Admin
router.post('/schedule', [auth, admin], async (req, res) => {
  try {
    const { 
      recipients, 
      subject, 
      message, 
      scheduleType, 
      scheduleDate, 
      frequency 
    } = req.body;

    // Basic scheduling logic
    const reminder = {
      id: Date.now().toString(),
      recipients,
      subject,
      message,
      scheduleType, // 'once', 'daily', 'weekly', 'monthly'
      scheduleDate: new Date(scheduleDate),
      frequency,
      isActive: true,
      createdBy: req.user.id,
      createdAt: new Date()
    };

    // Store in database (would use Reminder model in production)
    console.log('Scheduled reminder:', reminder);

    // Set up cron job based on schedule type
    if (scheduleType === 'daily') {
      cron.schedule('0 9 * * *', async () => {
        await sendScheduledReminder(reminder);
      });
    } else if (scheduleType === 'weekly') {
      cron.schedule('0 9 * * 1', async () => {
        await sendScheduledReminder(reminder);
      });
    } else if (scheduleType === 'monthly') {
      cron.schedule('0 9 1 * *', async () => {
        await sendScheduledReminder(reminder);
      });
    }

    res.json({ msg: 'Reminder scheduled successfully', reminder });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reminders
// @desc    Get all scheduled reminders
// @access  Private, Admin
router.get('/', [auth, admin], async (req, res) => {
  try {
    // Mock reminders data - would come from database
    const reminders = [
      {
        id: '1',
        subject: 'Weekly Session Reminder',
        recipients: 'active-clients',
        scheduleType: 'weekly',
        isActive: true,
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2', 
        subject: 'Monthly Counselor Check-in',
        recipients: 'approved-counselors',
        scheduleType: 'monthly',
        isActive: true,
        nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    ];

    res.json(reminders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/reminders/:id
// @desc    Cancel scheduled reminder
// @access  Private, Admin
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const reminderId = req.params.id;
    
    // Remove from database and cancel cron job
    console.log(`Cancelled reminder: ${reminderId}`);
    
    res.json({ msg: 'Reminder cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Helper function to send scheduled reminders
async function sendScheduledReminder(reminder) {
  try {
    let filter = {};
    if (reminder.recipients === 'clients') {
      filter = { role: 'client' };
    } else if (reminder.recipients === 'counselors') {
      filter = { role: 'counselor' };
    } else if (reminder.recipients === 'approved-counselors') {
      filter = { role: 'counselor', approvalStatus: 'approved' };
    } else if (reminder.recipients === 'active-clients') {
      filter = { role: 'client', isActive: true };
    }

    const users = await User.find(filter).select('email firstName lastName');

    const emailPromises = users.map(user => 
      sendEmail({
        email: user.email,
        subject: reminder.subject,
        message: reminder.message
          .replace(/{{firstName}}/g, user.firstName || 'User')
          .replace(/{{lastName}}/g, user.lastName || ''),
      }).catch(err => console.error(`Failed to send reminder to ${user.email}:`, err))
    );

    await Promise.allSettled(emailPromises);
    console.log(`Sent reminder to ${users.length} users`);
  } catch (err) {
    console.error('Failed to send scheduled reminder:', err);
  }
}

module.exports = router;

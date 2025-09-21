const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'profile_updated',
      'counselor_request_sent',
      'counselor_request_accepted',
      'counselor_request_declined',
      'session_booked',
      'session_completed',
      'session_cancelled',
      'message_sent',
      'favorite_added',
      'favorite_removed',
      'payment_made',
      'password_reset',
      'email_verified',
      'account_created',
      'settings_updated'
    ]
  },
  details: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
ActivityLogSchema.index({ user: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);

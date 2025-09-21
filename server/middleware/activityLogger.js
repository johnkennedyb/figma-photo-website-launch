const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, details, metadata = {}, req = null) => {
  try {
    const activityLog = new ActivityLog({
      user: userId,
      action,
      details,
      metadata,
      ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
      userAgent: req ? req.get('User-Agent') : null
    });

    await activityLog.save();
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Middleware function to attach logActivity to req object
const activityLoggerMiddleware = (req, res, next) => {
  req.logActivity = (action, details, metadata = {}) => {
    if (req.user && req.user.id) {
      logActivity(req.user.id, action, details, metadata, req);
    }
  };
  next();
};

module.exports = { logActivity, activityLoggerMiddleware };

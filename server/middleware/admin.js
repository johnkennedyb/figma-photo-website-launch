const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    // The auth middleware should have already run and attached the user id
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Authentication error, user not found.' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. You do not have admin privileges.' });
    }

    // If the user is an admin, proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error('Admin middleware error:', err.message);
    res.status(500).send('Server Error');
  }
};

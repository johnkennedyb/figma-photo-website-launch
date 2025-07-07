const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
require('dotenv').config();

module.exports = async function (req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user?.id || decoded.id;

    if (!userId) {
      return res.status(401).json({ msg: 'Token is missing user ID' });
    }

    // Fetch the full user object from DB to get the role
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    req.user = user; // Attach the full user object (with role) to the request
    next();
  } catch (err) {
    res.status(401).json({ msg: `Token is not valid: ${err.message}` });
  }
};

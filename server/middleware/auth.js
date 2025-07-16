const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
require('dotenv').config();

module.exports = async function (req, res, next) {
    console.log('[Auth Middleware] Checking for token...');
  const token = req.header('x-auth-token');
  console.log(`[Auth Middleware] Token: ${token}`);

    if (!token) {
    console.log('[Auth Middleware] No token found, denying authorization.');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
        console.log('[Auth Middleware] Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`[Auth Middleware] Token decoded:`, decoded);
    const userId = decoded.user.id;

    if (!userId) {
      console.error('[Auth Middleware] Token is missing user ID after decoding.');
      return res.status(401).json({ msg: 'Token is missing user ID' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.error(`[Auth Middleware] User not found for ID: ${userId}`);
      return res.status(401).json({ msg: 'User not found' });
    }

    req.user = user; // Attach the full user object to the request
    console.log(`[Auth Middleware] Authenticated user ID: ${req.user.id}, Role: ${req.user.role}`);
    next();
  } catch (err) {
        console.error(`[Auth Middleware] Token verification failed: ${err.message}`);
    res.status(401).json({ msg: `Token is not valid: ${err.message}` });
  }
};

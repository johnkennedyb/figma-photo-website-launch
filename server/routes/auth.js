require('dotenv').config();
const express = require('express');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Counselor = require('../models/Counselor');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

// @route   GET api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Fetch the user from the database to ensure we have the latest data
    let user = await User.findById(req.user.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // If the user is a counselor, fetch their counselor profile and merge it
    if (user.role === 'counselor') {
      const counselorProfile = await Counselor.findOne({ user: req.user.id }).lean();
      if (counselorProfile) {
        user = { ...user, ...counselorProfile };
      }
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/signup
// @desc    Register a user and send verification email
// @access  Public
router.post('/signup',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // For counselors, require email verification. For clients, auto-verify as before.
      const isCounselor = role === 'counselor';

      user = new User({
        firstName,
        lastName,
        email,
        password,
        role,
        isVerified: isCounselor ? false : true,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const clientBase = process.env.CLIENT_URL || 'http://localhost:8080';

      if (isCounselor) {
        // Generate email verification token and send email
        const verificationToken = user.createEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        const verifyURL = `${clientBase}/counselor-verify-email?token=${verificationToken}`;
        const message = `Welcome to Quluub! Please verify your email by clicking the link below to activate your counselor account.\n\n${verifyURL}\n\nThis link expires in 10 minutes.`;

        try {
          await sendEmail({
            email: user.email,
            subject: 'Verify Your Counselor Email - Quluub',
            message,
          });
        } catch (e) {
          // If email fails, clean up the verification fields
          user.emailVerificationToken = undefined;
          user.emailVerificationTokenExpires = undefined;
          await user.save({ validateBeforeSave: false });
          return res.status(500).json({ msg: 'Verification email could not be sent' });
        }

        return res.status(201).json({ msg: 'Verification email sent. Please check your inbox to activate your account.' });
      }

      // Auto-verified (client) -> issue token directly
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.status(201).json({ token });
        }
      );

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);




// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Require counselor email verification
    if (user.role === 'counselor' && !user.isVerified) {
      return res.status(403).json({ msg: 'Please verify your email to continue.' });
    }

    // Check if counselor is approved
    if (user.role === 'counselor' && user.approvalStatus !== 'approved') {
      let message = 'Your counselor account is pending approval.';
      if (user.approvalStatus === 'rejected') {
        message = 'Your counselor account has been rejected. Please contact support.';
      }
      return res.status(403).json({ msg: message });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 36000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'No user found with that email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiration (10 minutes)
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Create reset URL (use counselor-specific route for counselors)
    const clientBase = process.env.CLIENT_URL || 'http://localhost:8080';
    const resetPath = user.role === 'counselor' ? '/counselor-reset-password' : '/reset-password';
    const resetURL = `${clientBase}${resetPath}?token=${resetToken}`;

    const message = `You requested a password reset. Please click the link below to reset your password:\n\n${resetURL}\n\nIf you didn't request this, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request - Quluub',
        message,
      });

      res.status(200).json({ msg: 'Password reset email sent' });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      console.error('Email send error:', err);
      return res.status(500).json({ msg: 'Email could not be sent' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ msg: 'Token and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
  }

  try {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Token is invalid or has expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ msg: 'Password reset successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/verify-email/:token
// @desc    Verify email with token
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Token is invalid or has expired' });
    }

    // Verify the user
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ msg: 'Email verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:8080';

// @route   GET api/auth/google
// @desc    Google OAuth redirect
// @access  Public
router.get('/google', (req, res) => {
  const { role } = req.query;
  const state = role || 'client';
  
  const googleAuthURL = 'https://accounts.google.com/o/oauth2/v2/auth?' + querystring.stringify({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
    scope: 'openid email profile',
    response_type: 'code',
    state: state,
    access_type: 'offline',
    prompt: 'consent'
  });
  
  res.redirect(googleAuthURL);
});

// @route   GET api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const role = state || 'client';
  
  if (!code) {
    return res.redirect(`${CLIENT_URL}/login?error=oauth_cancelled`);
  }

  try {
    // Exchange code for tokens
    const tokenData = await exchangeCodeForTokens(code, req);
    const { access_token, id_token } = tokenData;
    
    // Verify and decode the ID token
    const userInfo = await verifyGoogleToken(id_token);
    
    if (!userInfo) {
      return res.redirect(`${CLIENT_URL}/login?error=invalid_token`);
    }

    // Find or create user
    let user = await User.findOne({ email: userInfo.email });
    
    if (!user) {
      // Create new user
      user = new User({
        firstName: userInfo.given_name || userInfo.name.split(' ')[0] || 'User',
        lastName: userInfo.family_name || userInfo.name.split(' ').slice(1).join(' ') || '',
        email: userInfo.email,
        password: crypto.randomBytes(32).toString('hex'), // Random password for OAuth users
        role: role,
        isVerified: true, // Google accounts are pre-verified
      });
      await user.save();
    }

    // Check counselor approval
    if (user.role === 'counselor' && user.approvalStatus !== 'approved') {
      const redirectPath = user.role === 'counselor' ? '/counselor-login' : '/login';
      const message = user.approvalStatus === 'rejected' 
        ? 'Your counselor account has been rejected. Please contact support.'
        : 'Your counselor account is pending approval.';
      return res.redirect(`${CLIENT_URL}${redirectPath}?error=${encodeURIComponent(message)}`);
    }

    // Generate JWT token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 36000 });
    
    // Redirect to appropriate page with token
    const redirectPath = user.role === 'counselor' ? '/counselor-login' : '/login';
    res.redirect(`${CLIENT_URL}${redirectPath}?token=${token}`);
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    const redirectPath = role === 'counselor' ? '/counselor-login' : '/login';
    res.redirect(`${CLIENT_URL}${redirectPath}?error=oauth_failed`);
  }
});

// Helper function to exchange code for tokens
async function exchangeCodeForTokens(code, req) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`
    });

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        try {
          const tokenData = JSON.parse(data);
          if (tokenData.error) {
            reject(new Error(tokenData.error_description || tokenData.error));
          } else {
            resolve(tokenData);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    request.on('error', reject);
    request.write(postData);
    request.end();
  });
}

// Helper function to verify Google ID token
async function verifyGoogleToken(idToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: `/tokeninfo?id_token=${idToken}`,
      method: 'GET'
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        try {
          const tokenInfo = JSON.parse(data);
          if (tokenInfo.error || tokenInfo.aud !== GOOGLE_CLIENT_ID) {
            resolve(null);
          } else {
            resolve(tokenInfo);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    request.on('error', () => resolve(null));
    request.end();
  });
}

// @route   POST api/auth/create-admin
// @desc    Create admin user (one-time setup)
// @access  Public (but protected by environment check)
router.post('/create-admin', async (req, res) => {
  try {
    // Only allow in development or if no admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ msg: 'Admin user already exists' });
    }

    // Create admin user
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@quluub.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
      onboardingCompleted: true,
      approvalStatus: 'approved'
    };

    // Hash password
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    // Create and save admin user
    const admin = new User(adminData);
    await admin.save();

    res.json({ 
      msg: 'Admin user created successfully',
      email: 'admin@quluub.com',
      password: 'admin123',
      note: 'Please change the password after first login'
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/auth/admin/login
// @desc    Admin login endpoint
// @access  Public
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 36000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

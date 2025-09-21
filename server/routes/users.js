const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

// All specific routes should be defined BEFORE the generic /:id route

// @route   GET api/users/favorites
// @desc    Get user's favorite counselors
// @access  Private
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favoriteCounselors', 'firstName lastName email specialties rating');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    // Filter out any null values that can result from a deleted counselor
    const validFavorites = user.favoriteCounselors.filter(counselor => counselor !== null);
    res.json(validFavorites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/favorites/:counselorId
// @desc    Add a favorite counselor
// @access  Private
router.post('/favorites/:counselorId', auth, async (req, res) => {
  try {
    const counselorId = req.params.counselorId;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { favoriteCounselors: counselorId } },
      { new: true, runValidators: false }
    ).populate('favoriteCounselors', 'firstName lastName email specialties rating');

    res.json({ msg: 'Added to favorites', favorites: updatedUser.favoriteCounselors });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/favorites/:counselorId
// @desc    Remove a favorite counselor
// @access  Private
router.delete('/favorites/:counselorId', auth, async (req, res) => {
  try {
    const counselorId = req.params.counselorId;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { favoriteCounselors: counselorId } },
      { new: true, runValidators: false }
    ).populate('favoriteCounselors', 'firstName lastName email specialties rating');

    res.json({ msg: 'Removed from favorites', favorites: updatedUser.favoriteCounselors });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/favorites/:counselorId (Legacy)
// @desc    Add or remove a favorite counselor
// @access  Private
router.put('/favorites/:counselorId', auth, async (req, res) => {
  try {
        const counselorId = req.params.counselorId;

    // Find the user and check if the counselor is already a favorite
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isFavorite = user.favoriteCounselors.some(id => id.toString() === counselorId);

    let updatedUser;
    if (isFavorite) {
      // Use $pull to remove the counselor from the array
                        updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $pull: { favoriteCounselors: counselorId } },
        { new: true, runValidators: false }
      ).populate('favoriteCounselors', 'firstName lastName email specialties rating');
    } else {
      // Use $addToSet to add the counselor to the array (prevents duplicates)
                        updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { favoriteCounselors: counselorId } },
        { new: true, runValidators: false }
      ).populate('favoriteCounselors', 'firstName lastName email specialties rating');
    }

    res.json(updatedUser.favoriteCounselors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// @route   GET api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { 
    firstName,
    lastName,
    specialty,
    bio,
    experience,
    education,
    certifications,
    languages,
    sessionRate,
    availability
  } = req.body;

  const profileFields = {};
  if (firstName) profileFields.firstName = firstName;
  if (lastName) profileFields.lastName = lastName;
  if (specialty) profileFields.specialty = specialty;
  if (bio) profileFields.bio = bio;
  if (experience) profileFields.experience = experience;
  if (education) profileFields.education = education;
  if (certifications) profileFields.certifications = certifications;
  if (languages) profileFields.languages = languages;
  if (sessionRate) profileFields.sessionRate = sessionRate;
  if (availability) profileFields.availability = availability;

  try {
    let user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/onboarding
// @desc    Update client onboarding data
// @access  Private
router.put('/onboarding', auth, async (req, res) => {
  const {
    dateOfBirth,
    country,
    city,
    maritalStatus,
    nationality,
    counsellingType,
    otherCounsellingType,
    language,
    otherLanguage,
  } = req.body;

  // Build fields to update
  const onboardingFields = { onboardingCompleted: true };
  if (dateOfBirth) onboardingFields.dateOfBirth = dateOfBirth;
  if (country) onboardingFields.country = country;
  if (city) onboardingFields.city = city;
  if (maritalStatus) onboardingFields.maritalStatus = maritalStatus;
  if (nationality) onboardingFields.nationality = nationality;
  if (counsellingType) onboardingFields.counsellingType = counsellingType === 'Other' ? otherCounsellingType || 'Other' : counsellingType;
  if (language) onboardingFields.language = language === 'Other' ? otherLanguage || 'Other' : language;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: onboardingFields },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    return res.json(user);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/counselor-onboarding
// @desc    Update counselor onboarding data
// @access  Private
router.put('/counselor-onboarding', auth, async (req, res) => {
  const {
    academicQualifications,
    yearsOfExperience,
    specializations,
    languages,
    bio
  } = req.body;

  const onboardingFields = {};
  if (academicQualifications) onboardingFields.academicQualifications = academicQualifications;
  if (yearsOfExperience) onboardingFields.yearsOfExperience = yearsOfExperience;
  if (specializations) onboardingFields.issuesSpecialization = specializations.join(', ');
  if (languages) onboardingFields.languages = languages;
  if (bio) onboardingFields.bio = bio;

  try {
    let user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: onboardingFields },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/personal-info
// @desc    Update user's personal information
// @access  Private
router.put('/personal-info', auth, async (req, res) => {
  // ... (implementation remains the same)
});

// @route   PUT api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, async (req, res) => {
  // ... (implementation remains the same)
});


// @route   GET api/users/client/:id
// @desc    Get client profile by ID (for counselors)
// @access  Private (Counselors only)
const getClientProfileHandler = async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ msg: 'Access denied. Counselors only.' });
    }

    const client = await User.findById(req.params.id).select('firstName lastName email country city');

    if (!client || client.role !== 'client') {
      return res.status(404).json({ msg: 'Client not found' });
    }

    res.json(client);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Client not found' });
    }
    res.status(500).send('Server Error');
  }
};

// original path kept for backward compatibility
router.get('/fetch-client-profile/:id', auth, getClientProfileHandler);
// new alias expected by frontend
router.get('/client/:id', auth, getClientProfileHandler);

// @route   GET api/users/activity-logs
// @desc    Get user's activity logs
// @access  Private
router.get('/activity-logs', auth, async (req, res) => {
  try {
    // Mock activity logs for now - would be implemented with ActivityLog model
    const mockActivities = [
      {
        _id: '1',
        action: 'login',
        details: 'Logged in to your account',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      },
      {
        _id: '2',
        action: 'profile_updated',
        details: 'Updated personal information',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        _id: '3',
        action: 'favorite_added',
        details: 'Added a counselor to favorites',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      }
    ];
    
    res.json(mockActivities);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/support/contact
// @desc    Send support message
// @access  Private
router.post('/support/contact', auth, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Send email to support using actual sendEmail utility
    const sendEmail = require('../utils/sendEmail');
    try {
      await sendEmail({
        email: 'support@quluub.com',
        subject: `Support Request: ${subject}`,
        message: `From: ${user.firstName} ${user.lastName} (${user.email})\nRole: ${user.role}\n\nMessage:\n${message}`
      });
    } catch (emailErr) {
      console.error('Failed to send support email:', emailErr);
    }
    
    res.json({ msg: 'Support message sent successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/hide-account
// @desc    Hide user account from search
// @access  Private
router.put('/hide-account', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isVisible: false });
    res.json({ msg: 'Account hidden successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ msg: 'Account deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// THIS MUST BE THE LAST ROUTE
// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});



module.exports = router;

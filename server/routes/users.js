const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/users/counselors
// @desc    Get all counselors
// @access  Private
router.get('/counselors', auth, async (req, res) => {
  try {
    // Use .lean() for better performance as we are only reading data
    const counselors = await User.find({ role: 'counselor' }).select('-password').lean();

    // Transform the data to match the frontend's expectations
    const transformedCounselors = counselors.map(counselor => ({
      ...counselor,
      name: counselor.name, // Ensure name is explicitly included
      // Rename 'issuesSpecialization' to 'specialties' and split string into an array
      specialties: counselor.issuesSpecialization
        ? counselor.issuesSpecialization.split(',').map(s => s.trim())
        : [],
    }));

    res.json(transformedCounselors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    console.log(`[GET /api/users/:id] Received request for user ID: ${req.params.id}`);
    const user = await User.findById(req.params.id).select('-password').lean();
    console.log(`[GET /api/users/:id] Mongoose query result: ${JSON.stringify(user)}`);

    if (!user) {
      console.log(`[GET /api/users/:id] User with ID ${req.params.id} not found in database.`);
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log(`[GET /api/users/:id] Successfully found user, returning profile.`);
    res.json(user);
  } catch (err) {
    console.error(`[GET /api/users/:id] Error fetching user: ${err.message}`);
    if (err.kind === 'ObjectId') {
      console.log(`[GET /api/users/:id] Invalid ObjectId format for ID: ${req.params.id}`);
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/profile
// @desc    Update counselor profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const {
    name,
    specialty,
    bio,
    experience,
    education,
    certifications,
    languages,
    sessionRate,
    availability,
  } = req.body;

  const profileFields = { 
    name, 
    specialty, 
    bio, 
    experience, 
    education, 
    certifications, 
    languages, 
    sessionRate, 
    availability 
  };

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Ensure the user is a counselor
    if (user.role !== 'counselor') {
      return res.status(403).json({ msg: 'User is not a counselor' });
    }

    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');

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
  } = req.body;

  const onboardingFields = {
    dateOfBirth,
    country,
    city,
    maritalStatus,
    nationality,
  };

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: onboardingFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/counselor-onboarding
// @desc    Update counselor onboarding data
// @access  Private
router.put('/counselor-onboarding', auth, async (req, res) => {
  const {
    name,
    nationality,
    countryOfResidence,
    cityOfResidence,
    maritalStatus,
    academicQualifications,
    relevantPositions,
    yearsOfExperience,
    issuesSpecialization,
    affiliations,
    bio,
    experience,
    education,
    certifications,
    languageProficiency,
    sessionRate,
    ngnSessionRate,
    availability,
  } = req.body;

  // Build a fields object to only update provided fields
  const onboardingFields = {};
  if (name !== undefined) onboardingFields.name = name;
  if (nationality !== undefined) onboardingFields.nationality = nationality;
  if (countryOfResidence !== undefined) onboardingFields.countryOfResidence = countryOfResidence;
  if (cityOfResidence !== undefined) onboardingFields.cityOfResidence = cityOfResidence;
  if (maritalStatus !== undefined) onboardingFields.maritalStatus = maritalStatus;
  if (academicQualifications !== undefined) onboardingFields.academicQualifications = academicQualifications;
  if (relevantPositions !== undefined) onboardingFields.relevantPositions = relevantPositions;
  if (yearsOfExperience !== undefined) onboardingFields.yearsOfExperience = yearsOfExperience;
  if (issuesSpecialization !== undefined) {
    onboardingFields.issuesSpecialization = issuesSpecialization;
    onboardingFields.specialties = issuesSpecialization.split(',').map(s => s.trim());
  }
  if (affiliations !== undefined) onboardingFields.affiliations = affiliations;
  
  // Add extended profile fields
  if (bio !== undefined) onboardingFields.bio = bio;
  if (experience !== undefined) onboardingFields.experience = experience;
  if (education !== undefined) onboardingFields.education = education;
  if (certifications !== undefined) onboardingFields.certifications = certifications;
  if (languageProficiency) {
    const spokenLanguages = Object.entries(languageProficiency)
      .filter(([lang, isSpoken]) => lang !== 'other' && isSpoken)
      .map(([lang]) => lang);

    if (languageProficiency.other) {
      const otherLangs = languageProficiency.other.split(',').map(l => l.trim()).filter(Boolean);
      spokenLanguages.push(...otherLangs);
    }
    onboardingFields.languages = spokenLanguages;
  }
  if (sessionRate !== undefined) onboardingFields.sessionRate = sessionRate;
  if (ngnSessionRate !== undefined) onboardingFields.ngnSessionRate = ngnSessionRate;
  if (availability !== undefined) onboardingFields.availability = availability;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: onboardingFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(`Counselor onboarding error: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/personal-info
// @desc    Update user's personal information
// @access  Private
router.put('/personal-info', auth, async (req, res) => {
  const {
    name,
    phone,
    dateOfBirth,
    country,
    city,
    maritalStatus,
    nationality,
  } = req.body;

  const updatedFields = {};
  if (name !== undefined) updatedFields.name = name;
  if (phone !== undefined) updatedFields.phone = phone;
  if (dateOfBirth !== undefined) updatedFields.dateOfBirth = dateOfBirth;
  if (country !== undefined) updatedFields.country = country;
  if (city !== undefined) updatedFields.city = city;
  if (maritalStatus !== undefined) updatedFields.maritalStatus = maritalStatus;
  if (nationality !== undefined) updatedFields.nationality = nationality;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updatedFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  [
    auth,
    [
      check('currentPassword', 'Current password is required').not().isEmpty(),
      check('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid current password' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ msg: 'Password updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;

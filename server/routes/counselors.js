const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// @route   POST api/counselors/onboarding
// @desc    Complete counselor onboarding
// @access  Private
router.post('/onboarding', auth, async (req, res) => {
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
    languages,
    sessionRate,
    ngnSessionRate,
  } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role !== 'counselor') {
      return res.status(403).json({ msg: 'User is not a counselor' });
    }

    // Update fields
    if (name) user.name = name;
    if (nationality) user.nationality = nationality;
    if (countryOfResidence) user.countryOfResidence = countryOfResidence;
    if (cityOfResidence) user.cityOfResidence = cityOfResidence;
    if (maritalStatus) user.maritalStatus = maritalStatus;
    if (academicQualifications) user.academicQualifications = academicQualifications;
    if (relevantPositions) user.relevantPositions = relevantPositions;
    if (yearsOfExperience) user.yearsOfExperience = yearsOfExperience;
    if (issuesSpecialization) user.issuesSpecialization = issuesSpecialization;
    if (affiliations) user.affiliations = affiliations;
    if (languages) user.languages = languages;
    if (sessionRate) user.sessionRate = sessionRate;
    if (ngnSessionRate) user.ngnSessionRate = ngnSessionRate;

    const updatedUser = await user.save();

    const userResponse = { ...updatedUser.toObject() };
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/counselors
// @desc    Get all counselors
// @access  Public
router.get('/', async (req, res) => {
  try {
    const counselors = await User.find({ role: 'counselor' }).select('-password');
    res.json(counselors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/counselors/chats
// @desc    Get all chats for a counselor
// @access  Private
router.get('/chats', auth, async (req, res) => {
  try {
    const counselorId = req.user.id;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(counselorId) },
            { receiver: new mongoose.Types.ObjectId(counselorId) },
          ],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $addFields: {
          withUserId: {
            $cond: {
              if: { $eq: ['$sender', new mongoose.Types.ObjectId(counselorId)] },
              then: '$receiver',
              else: '$sender',
            },
          },
        },
      },
      {
        $group: {
          _id: '$withUserId',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'withUserArray',
        },
      },
      {
        $unwind: '$withUserArray',
      },
      {
        $project: {
          _id: 0,
          lastMessage: 1,
          withUser: {
            _id: '$withUserArray._id',
            name: '$withUserArray.name',
            role: '$withUserArray.role',
            profilePicture: '$withUserArray.profilePicture',
          },
        },
      },
       {
        $sort: { 'lastMessage.timestamp': -1 },
      },
    ]);

    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/counselors/:id
// @desc    Get counselor profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const counselor = await User.findOne({ _id: req.params.id, role: 'counselor' }).select('-password');
    if (!counselor) {
      return res.status(404).json({ msg: 'Counselor not found' });
    }

    // Map database fields to the fields expected by the frontend, with fallbacks
    const counselorProfile = {
      _id: counselor._id,
      name: counselor.name,
      specialty: counselor.issuesSpecialization || (counselor.specialties && counselor.specialties.join(', ')) || 'Not specified',
      rating: counselor.rating || 4.5,
      experience: counselor.yearsOfExperience || counselor.experience || 'N/A',
      bio: counselor.bio || 'No bio available.',
      education: counselor.academicQualifications || counselor.education || 'N/A',
      certifications: counselor.certifications || (counselor.affiliations ? [counselor.affiliations] : []),
      languages: counselor.languages || [],
      sessionRate: counselor.sessionRate ? `$${counselor.sessionRate}` : 'N/A',
      availability: counselor.availability || [],
    };

    res.json(counselorProfile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Counselor not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;

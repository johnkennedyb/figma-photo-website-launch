const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Counselor = require('../models/Counselor');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// @route   POST api/counselors/onboarding
// @desc    Complete counselor onboarding
// @access  Private
router.post('/onboarding', auth, async (req, res) => {
  const {
    nationality,
    countryOfResidence,
    cityOfResidence,
    maritalStatus,
    dateOfBirth,
    university,
    licenseNumber,
    fieldOfSpecialization,
    yearsOfExperience,
    specialization,
    otherSpecialization,
    language,
    otherLanguage,
    bio,
  } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (user.role !== 'counselor') {
      return res.status(403).json({ msg: 'Access denied. User is not a counselor.' });
    }

    // Process specializations and languages
    const finalSpecialization = specialization === 'Other' ? otherSpecialization : specialization;
    const finalLanguage = language === 'Other' ? otherLanguage : language;

    // Update user fields directly since all counselor data is stored in User model
    user.nationality = nationality;
    user.countryOfResidence = countryOfResidence;
    user.cityOfResidence = cityOfResidence;
    user.maritalStatus = maritalStatus;
    user.dateOfBirth = dateOfBirth;
    user.academicQualifications = university;
    user.yearsOfExperience = yearsOfExperience;
    user.issuesSpecialization = finalSpecialization;
    user.languages = finalLanguage ? [finalLanguage] : [];
    user.bio = bio;
    user.onboardingCompleted = true;

    await user.save();

    // Return the updated user without password
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/counselors
// @desc    Get all counselors with optional search and filtering
// @access  Public
router.get('/', auth, async (req, res) => {
  try {
    const { search, expertise, specialty, country, state, city } = req.query;
    
    // Build search filter - only show approved counselors
    let filter = { 
      role: 'counselor',
      approvalStatus: 'approved'
    };
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add expertise search across multiple fields
    if (expertise) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { issuesSpecialization: { $regex: expertise, $options: 'i' } },
          { academicQualifications: { $regex: expertise, $options: 'i' } },
          { bio: { $regex: expertise, $options: 'i' } },
          { languages: { $in: [new RegExp(expertise, 'i')] } },
          { specialties: { $in: [new RegExp(expertise, 'i')] } }
        ]
      });
    }
    
    // Add location filters
    if (country) filter.countryOfResidence = country;
    if (state) filter.state = state;
    if (city) filter.cityOfResidence = city;
    
    // Add specialty filter
    if (specialty) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { issuesSpecialization: { $regex: specialty, $options: 'i' } },
          { specialties: { $in: [new RegExp(specialty, 'i')] } }
        ]
      });
    }
    
    const counselorsData = await User.find(filter).select('-password');

    // Ensure data consistency for the frontend
    const counselors = counselorsData.map(c => {
      const counselorObj = c.toObject();
      return {
        ...counselorObj,
        _id: counselorObj._id,
        name: `${counselorObj.firstName || 'Counselor'} ${counselorObj.lastName || ''}`.trim(),
        firstName: counselorObj.firstName,
        lastName: counselorObj.lastName,
        specialty: counselorObj.issuesSpecialization || 'General Wellness',
        profilePicture: counselorObj.profilePicture || '',
        averageRating: counselorObj.averageRating || 0,
        sessionRate: counselorObj.sessionRate || 50,
        ngnSessionRate: counselorObj.ngnSessionRate || 25000,
        country: counselorObj.countryOfResidence || 'N/A',
        city: counselorObj.cityOfResidence || 'N/A',
        state: counselorObj.state || 'N/A',
        yearsOfExperience: counselorObj.yearsOfExperience || 'N/A',
        education: counselorObj.academicQualifications || counselorObj.education || 'N/A',
        languages: counselorObj.languages || [],
      };
    });

    console.log('[Counselors API] Returning counselors:', counselors.length);
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
            firstName: '$withUserArray.firstName',
            lastName: '$withUserArray.lastName',
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
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('[Counselor Profile] Requested ID:', req.params.id);
    const counselor = await User.findOne({ _id: req.params.id, role: 'counselor' }).select('-password').lean();
    console.log('[Counselor Profile] Found counselor:', counselor ? 'Yes' : 'No');
    if (!counselor) {
      return res.status(404).json({ msg: 'Counselor not found' });
    }

    // Sanitize session rates to ensure they are numbers
    if (counselor.sessionRate) {
        counselor.sessionRate = parseFloat(String(counselor.sessionRate).replace(/[^\d.]/g, '')) || 0;
    }
    if (counselor.ngnSessionRate) {
        counselor.ngnSessionRate = parseFloat(String(counselor.ngnSessionRate).replace(/[^\d.]/g, '')) || 0;
    }
    const counselorProfile = {
      ...counselor,
      name: `${counselor.firstName || 'Counselor'} ${counselor.lastName || ''}`.trim(),
      firstName: counselor.firstName,
      lastName: counselor.lastName,
      specialty: counselor.issuesSpecialization || (counselor.specialties && counselor.specialties.join(', ')) || 'Not specified',
      rating: counselor.rating || 4.5,
      averageRating: counselor.averageRating || 0,
      experience: counselor.yearsOfExperience || counselor.experience || 'N/A',
      yearsOfExperience: counselor.yearsOfExperience || 'N/A',
      education: counselor.academicQualifications || counselor.education || 'N/A',
      certifications: counselor.certifications || (counselor.affiliations ? [counselor.affiliations] : []),
      sessionRate: parseFloat(String(counselor.sessionRate).replace(/[^\d.]/g, '')) || 50,
      ngnSessionRate: parseFloat(String(counselor.ngnSessionRate).replace(/[^\d.]/g, '')) || 25000,
      country: counselor.countryOfResidence || 'N/A',
      city: counselor.cityOfResidence || 'N/A',
      languages: counselor.languages || [],
    };
    delete counselorProfile.password; // ensure password is not sent

    console.log('[Counselor Profile] Returning profile for:', counselorProfile.firstName, counselorProfile.lastName);
    res.json(counselorProfile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Counselor not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/counselors/profile
// @desc    Update counselor profile (onboarding)
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const {
    firstName,
    lastName,
    nationality,
    countryOfResidence,
    cityOfResidence,
    maritalStatus,
    academicQualifications,
    yearsOfExperience,
    specializations,
    languages,
    bio,
    relevantPositions,
    issuesSpecialization,
    affiliations,
  } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role !== 'counselor') {
      return res.status(403).json({ msg: 'User is not a counselor' });
    }

    // Update personal info fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.nationality = nationality || user.nationality;
    user.countryOfResidence = countryOfResidence || user.countryOfResidence;
    user.cityOfResidence = cityOfResidence || user.cityOfResidence;
    user.maritalStatus = maritalStatus || user.maritalStatus;

    // Update professional info fields
    user.academicQualifications = academicQualifications || user.academicQualifications;
    user.yearsOfExperience = yearsOfExperience || user.yearsOfExperience;
    user.specialties = specializations || user.specialties;
    user.languages = languages || user.languages;
    user.bio = bio || user.bio;
    user.relevantPositions = relevantPositions || user.relevantPositions;
    user.issuesSpecialization = issuesSpecialization || user.issuesSpecialization;
    user.affiliations = affiliations || user.affiliations;

    await user.save();

    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



module.exports = router;

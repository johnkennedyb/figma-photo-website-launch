const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createTestCounselor = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if test counselor already exists
    const existingUser = await User.findOne({ email: 'testcounselor@example.com' });
    if (existingUser) {
      console.log('Test counselor already exists, updating approval status to pending...');
      existingUser.approvalStatus = 'pending';
      await existingUser.save();
      console.log('Updated existing test counselor to pending status');
      process.exit(0);
    }

    // Create test counselor with pending approval status
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('testpassword123', salt);

    const testCounselor = new User({
      firstName: 'Test',
      lastName: 'Counselor',
      email: 'testcounselor@example.com',
      password: hashedPassword,
      role: 'counselor',
      isVerified: true,
      approvalStatus: 'pending', // This is the key - pending approval
      onboardingCompleted: true,
      phoneNumber: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'other',
      country: 'United States',
      state: 'California',
      city: 'San Francisco',
      specialty: 'anxiety',
      issuesSpecialization: ['anxiety', 'depression'],
      academicQualifications: 'PhD in Psychology',
      yearsOfExperience: 5,
      languages: ['English'],
      bio: 'Test counselor for approval demonstration',
      isVisible: true
    });

    await testCounselor.save();
    console.log('Created test counselor with pending approval status:');
    console.log(`Email: ${testCounselor.email}`);
    console.log(`Approval Status: ${testCounselor.approvalStatus}`);
    console.log(`Is Verified: ${testCounselor.isVerified}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createTestCounselor();

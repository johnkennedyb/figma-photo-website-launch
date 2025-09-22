// Direct database script to create admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@quluub.com');
      console.log('Password: admin123');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@quluub.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      onboardingCompleted: true,
      approvalStatus: 'approved'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@quluub.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createAdmin();

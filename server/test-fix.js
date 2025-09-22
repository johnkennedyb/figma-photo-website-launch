const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function testFix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== TESTING FIXED SORTING ===');
    
    // Test the new sorting approach
    const users = await User.find({ role: 'counselor' })
      .select('-password')
      .sort({ createdAt: -1, _id: -1 })
      .skip(0)
      .limit(10);
    
    console.log('First page results with new sorting:');
    users.forEach((user, index) => {
      const isTarget = user.email === 'blessing3313@outlook.com';
      console.log(`${index + 1}. ${user.firstName || 'undefined'} ${user.lastName || 'undefined'} - ${user.email} ${isTarget ? '⭐ TARGET FOUND!' : ''}`);
    });
    
    const targetFound = users.find(u => u.email === 'blessing3313@outlook.com');
    console.log(`\n${targetFound ? '✅ SUCCESS: blessing3313@outlook.com now appears on page 1!' : '❌ Still not found on page 1'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFix();

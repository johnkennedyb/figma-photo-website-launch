const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkCounselors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const allCounselors = await User.find({ role: 'counselor' }).select('firstName lastName email approvalStatus onboardingCompleted createdAt').sort({ createdAt: -1 });
    console.log('\n=== ALL COUNSELORS ===');
    console.log('Total counselors:', allCounselors.length);
    
    allCounselors.forEach((counselor, index) => {
      console.log(`${index + 1}. ${counselor.firstName} ${counselor.lastName} (${counselor.email})`);
      console.log(`   Status: ${counselor.approvalStatus}, Onboarding: ${counselor.onboardingCompleted}, Created: ${counselor.createdAt}`);
      console.log('');
    });
    
    const pendingCounselors = await User.countDocuments({ role: 'counselor', approvalStatus: 'pending' });
    const approvedCounselors = await User.countDocuments({ role: 'counselor', approvalStatus: 'approved' });
    
    console.log('Pending counselors:', pendingCounselors);
    console.log('Approved counselors:', approvedCounselors);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCounselors();

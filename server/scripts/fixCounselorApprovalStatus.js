const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const fixCounselorApprovalStatus = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all counselors
    const counselors = await User.find({ role: 'counselor' });
    console.log(`Found ${counselors.length} counselors`);

    let updatedCount = 0;

    for (const counselor of counselors) {
      let needsUpdate = false;
      const updates = {};

      // If counselor is verified but approval status is pending, set to approved
      if (counselor.isVerified && counselor.approvalStatus === 'pending') {
        updates.approvalStatus = 'approved';
        needsUpdate = true;
        console.log(`Updating ${counselor.email}: Setting approvalStatus to 'approved'`);
      }

      // If counselor has no approval status, set default based on verification
      if (!counselor.approvalStatus) {
        updates.approvalStatus = counselor.isVerified ? 'approved' : 'pending';
        needsUpdate = true;
        console.log(`Updating ${counselor.email}: Setting approvalStatus to '${updates.approvalStatus}'`);
      }

      if (needsUpdate) {
        await User.findByIdAndUpdate(counselor._id, updates);
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} counselors`);

    // Show final status
    const finalCounselors = await User.find({ role: 'counselor' }).select('email approvalStatus isVerified');
    console.log('\nFinal counselor status:');
    finalCounselors.forEach(c => {
      console.log(`${c.email}: approvalStatus=${c.approvalStatus}, isVerified=${c.isVerified}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixCounselorApprovalStatus();

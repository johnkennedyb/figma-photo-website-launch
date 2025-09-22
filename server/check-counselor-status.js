require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkCounselors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const totalCounselors = await User.countDocuments({ role: 'counselor' });
    const approvedCounselors = await User.countDocuments({ role: 'counselor', approvalStatus: 'approved' });
    const pendingCounselors = await User.countDocuments({ role: 'counselor', approvalStatus: 'pending' });
    const rejectedCounselors = await User.countDocuments({ role: 'counselor', approvalStatus: 'rejected' });
    const nullApproval = await User.countDocuments({ role: 'counselor', approvalStatus: null });
    const undefinedApproval = await User.countDocuments({ role: 'counselor', approvalStatus: { $exists: false } });
    
    console.log('\n=== Counselor Statistics ===');
    console.log('Total counselors:', totalCounselors);
    console.log('Approved counselors:', approvedCounselors);
    console.log('Pending counselors:', pendingCounselors);
    console.log('Rejected counselors:', rejectedCounselors);
    console.log('Null approval status:', nullApproval);
    console.log('Undefined approval status:', undefinedApproval);
    
    // Show sample of counselors with their approval status
    const sampleCounselors = await User.find({ role: 'counselor' }).select('firstName lastName email approvalStatus').limit(10);
    console.log('\n=== Sample Counselors ===');
    sampleCounselors.forEach((c, i) => {
      console.log(`${i+1}. ${c.firstName} ${c.lastName} (${c.email}) - Status: ${c.approvalStatus || 'undefined'}`);
    });
    
    // If no approved counselors, let's approve some for testing
    if (approvedCounselors === 0 && totalCounselors > 0) {
      console.log('\n=== No approved counselors found. Approving first 3 counselors for testing ===');
      const counselorsToApprove = await User.find({ role: 'counselor' }).limit(3);
      
      for (const counselor of counselorsToApprove) {
        counselor.approvalStatus = 'approved';
        await counselor.save();
        console.log(`✅ Approved: ${counselor.firstName} ${counselor.lastName} (${counselor.email})`);
      }
      
      console.log('\n=== Updated Statistics ===');
      const newApprovedCount = await User.countDocuments({ role: 'counselor', approvalStatus: 'approved' });
      console.log('Approved counselors:', newApprovedCount);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCounselors();

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function debugCounselorVisibility() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== DEBUGGING COUNSELOR VISIBILITY ===');
    
    // 1. Check the specific user
    const targetUser = await User.findOne({ email: 'blessing3313@outlook.com' });
    console.log('\n1. TARGET USER (blessing3313@outlook.com):');
    if (targetUser) {
      console.log('✅ Found in database');
      console.log('Name:', `${targetUser.firstName} ${targetUser.lastName}`);
      console.log('Role:', targetUser.role);
      console.log('Approval Status:', targetUser.approvalStatus);
      console.log('Is Verified:', targetUser.isVerified);
      console.log('Is Suspended:', targetUser.isSuspended);
      console.log('Created At:', targetUser.createdAt);
      console.log('ID:', targetUser._id);
    } else {
      console.log('❌ Not found in database');
    }
    
    // 2. Test the exact same query that the API uses
    console.log('\n2. TESTING API QUERY (role=counselor, no status filter):');
    const apiQuery1 = { role: 'counselor' };
    const apiResults1 = await User.find(apiQuery1)
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${apiResults1.length} counselors with role filter`);
    const targetInResults1 = apiResults1.find(u => u.email === 'blessing3313@outlook.com');
    console.log('Target user in results:', targetInResults1 ? '✅ YES' : '❌ NO');
    
    // 3. Test with approved status filter
    console.log('\n3. TESTING API QUERY (role=counselor, status=approved):');
    const apiQuery2 = { role: 'counselor', approvalStatus: 'approved' };
    const apiResults2 = await User.find(apiQuery2)
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${apiResults2.length} approved counselors`);
    const targetInResults2 = apiResults2.find(u => u.email === 'blessing3313@outlook.com');
    console.log('Target user in results:', targetInResults2 ? '✅ YES' : '❌ NO');
    
    // 4. Show first 5 results from each query
    console.log('\n4. SAMPLE RESULTS FROM QUERIES:');
    console.log('\nAll counselors (first 5):');
    apiResults1.slice(0, 5).forEach((u, i) => {
      console.log(`${i+1}. ${u.firstName} ${u.lastName} - ${u.email} (${u.approvalStatus})`);
    });
    
    console.log('\nApproved counselors (first 5):');
    apiResults2.slice(0, 5).forEach((u, i) => {
      console.log(`${i+1}. ${u.firstName} ${u.lastName} - ${u.email} (${u.approvalStatus})`);
    });
    
    // 5. Check if there are any null/undefined issues
    console.log('\n5. CHECKING FOR DATA ISSUES:');
    const counselorsWithIssues = await User.find({ 
      role: 'counselor',
      $or: [
        { firstName: { $in: [null, undefined, ''] } },
        { lastName: { $in: [null, undefined, ''] } },
        { approvalStatus: { $in: [null, undefined] } }
      ]
    }).select('firstName lastName email approvalStatus');
    
    console.log(`Found ${counselorsWithIssues.length} counselors with data issues:`);
    counselorsWithIssues.forEach((u, i) => {
      console.log(`${i+1}. "${u.firstName}" "${u.lastName}" - ${u.email} (status: ${u.approvalStatus})`);
    });
    
    // 6. Check pagination - maybe the user is on a different page
    console.log('\n6. PAGINATION CHECK:');
    const totalCounselors = await User.countDocuments({ role: 'counselor' });
    const approvedCounselors = await User.countDocuments({ role: 'counselor', approvalStatus: 'approved' });
    console.log(`Total counselors: ${totalCounselors}`);
    console.log(`Approved counselors: ${approvedCounselors}`);
    
    // Find the position of our target user
    const allCounselorsOrdered = await User.find({ role: 'counselor' })
      .select('firstName lastName email approvalStatus')
      .sort({ createdAt: -1 });
    
    const targetPosition = allCounselorsOrdered.findIndex(u => u.email === 'blessing3313@outlook.com');
    if (targetPosition >= 0) {
      const page = Math.floor(targetPosition / 10) + 1;
      console.log(`Target user is at position ${targetPosition + 1}, should be on page ${page}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugCounselorVisibility();

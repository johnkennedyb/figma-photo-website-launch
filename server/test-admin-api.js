const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function testAdminAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== TESTING ADMIN API LOGIC ===');
    
    // Simulate the exact API call parameters
    const queryParams = {
      role: 'counselor',
      page: '1',
      limit: '10'
    };
    
    console.log('Query params:', queryParams);
    
    // Replicate the exact logic from admin.js
    const { role, status, page = 1, limit = 10 } = queryParams;
    
    let filter = {};
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    // Apply approval status filter for counselors
    if (role === 'counselor' && status && status !== 'all') {
      filter.approvalStatus = status;
    }
    
    console.log('Filter applied:', filter);
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    console.log('Skip:', skip, 'Limit:', parseInt(limit));
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    console.log(`\nFound ${users.length} users out of ${total} total`);
    console.log('Pages:', Math.ceil(total / parseInt(limit)));
    
    console.log('\n=== FIRST PAGE RESULTS ===');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName || 'undefined'} ${user.lastName || 'undefined'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.approvalStatus}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   ID: ${user._id}`);
      console.log('');
    });
    
    // Check if our target user is in the first page
    const targetUser = users.find(u => u.email === 'blessing3313@outlook.com');
    console.log('Target user in first page results:', targetUser ? '✅ YES' : '❌ NO');
    
    if (targetUser) {
      console.log('Target user details:');
      console.log('- Name:', `${targetUser.firstName} ${targetUser.lastName}`);
      console.log('- Email:', targetUser.email);
      console.log('- Status:', targetUser.approvalStatus);
    }
    
    // Test with approved filter
    console.log('\n=== TESTING WITH APPROVED FILTER ===');
    const approvedFilter = { role: 'counselor', approvalStatus: 'approved' };
    const approvedUsers = await User.find(approvedFilter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(10);
    
    console.log(`Found ${approvedUsers.length} approved users on first page`);
    const targetInApproved = approvedUsers.find(u => u.email === 'blessing3313@outlook.com');
    console.log('Target user in approved results:', targetInApproved ? '✅ YES' : '❌ NO');
    
    // Check all pages to find our target user
    console.log('\n=== SEARCHING ALL PAGES FOR TARGET USER ===');
    const allCounselors = await User.find({ role: 'counselor' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log('First 15 counselors with their createdAt:');
    allCounselors.slice(0, 15).forEach((user, index) => {
      console.log(`${index}. ${user.firstName || 'undefined'} ${user.lastName || 'undefined'} - ${user.email} - Created: ${user.createdAt}`);
    });
    
    const targetIndex = allCounselors.findIndex(u => u.email === 'blessing3313@outlook.com');
    if (targetIndex !== -1) {
      const pageNumber = Math.floor(targetIndex / 10) + 1;
      console.log(`\n✅ Target user found at index ${targetIndex} (page ${pageNumber})`);
      console.log('Target user details:');
      console.log('- Name:', `${allCounselors[targetIndex].firstName} ${allCounselors[targetIndex].lastName}`);
      console.log('- Email:', allCounselors[targetIndex].email);
      console.log('- Status:', allCounselors[targetIndex].approvalStatus);
      console.log('- Created:', allCounselors[targetIndex].createdAt);
      
      // Check if it should be on page 1
      if (targetIndex < 10) {
        console.log('🔍 This user SHOULD be on page 1 but is not showing up!');
        console.log('Let me test the exact query with skip/limit...');
        
        const testQuery = await User.find({ role: 'counselor' })
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(0)
          .limit(10);
        
        console.log('\nActual first page query results:');
        testQuery.forEach((user, index) => {
          const isTarget = user.email === 'blessing3313@outlook.com';
          console.log(`${index}. ${user.firstName || 'undefined'} ${user.lastName || 'undefined'} - ${user.email} ${isTarget ? '⭐ TARGET' : ''}`);
        });
      }
    } else {
      console.log('❌ Target user not found in any page');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAdminAPI();

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function debugPagination() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== DEBUGGING PAGINATION ISSUE ===');
    
    // Check for duplicate emails
    const duplicateCheck = await User.aggregate([
      { $match: { email: 'blessing3313@outlook.com' } },
      { $group: { _id: '$email', count: { $sum: 1 }, users: { $push: '$$ROOT' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicateCheck.length > 0) {
      console.log('🚨 DUPLICATE EMAILS FOUND:');
      duplicateCheck.forEach(dup => {
        console.log(`Email: ${dup._id}, Count: ${dup.count}`);
        dup.users.forEach((user, index) => {
          console.log(`  ${index + 1}. ID: ${user._id}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
        });
      });
    } else {
      console.log('✅ No duplicate emails found');
    }
    
    // Check all blessing3313@outlook.com users
    const allBlessingUsers = await User.find({ email: 'blessing3313@outlook.com' });
    console.log(`\nFound ${allBlessingUsers.length} users with email blessing3313@outlook.com:`);
    allBlessingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.approvalStatus}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Test different sorting approaches
    console.log('\n=== TESTING DIFFERENT SORTING APPROACHES ===');
    
    // 1. Sort by _id instead of createdAt
    console.log('1. Sorting by _id (descending):');
    const byId = await User.find({ role: 'counselor' })
      .select('firstName lastName email approvalStatus')
      .sort({ _id: -1 })
      .limit(10);
    
    const targetInId = byId.find(u => u.email === 'blessing3313@outlook.com');
    console.log(`Target user in _id sort: ${targetInId ? '✅ YES' : '❌ NO'}`);
    
    // 2. Sort by email
    console.log('\n2. Sorting by email:');
    const byEmail = await User.find({ role: 'counselor' })
      .select('firstName lastName email approvalStatus')
      .sort({ email: 1 })
      .limit(10);
    
    const targetInEmail = byEmail.find(u => u.email === 'blessing3313@outlook.com');
    console.log(`Target user in email sort: ${targetInEmail ? '✅ YES' : '❌ NO'}`);
    
    // 3. No sorting
    console.log('\n3. No sorting (natural order):');
    const noSort = await User.find({ role: 'counselor' })
      .select('firstName lastName email approvalStatus')
      .limit(10);
    
    const targetInNoSort = noSort.find(u => u.email === 'blessing3313@outlook.com');
    console.log(`Target user in natural order: ${targetInNoSort ? '✅ YES' : '❌ NO'}`);
    
    if (targetInNoSort) {
      console.log('✅ FOUND! User appears in natural order, issue is with createdAt sorting');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugPagination();

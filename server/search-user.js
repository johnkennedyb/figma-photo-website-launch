const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function searchUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const email = 'blessing3313@outlook.com';
    console.log(`\n=== SEARCHING FOR USER: ${email} ===`);
    
    const user = await User.findOne({ email: email });
    
    if (user) {
      console.log('✅ USER FOUND:');
      console.log('ID:', user._id);
      console.log('Name:', `${user.firstName} ${user.lastName}`);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Approval Status:', user.approvalStatus);
      console.log('Is Verified:', user.isVerified);
      console.log('Is Suspended:', user.isSuspended);
      console.log('Onboarding Completed:', user.onboardingCompleted);
      console.log('Created At:', user.createdAt);
      console.log('Phone:', user.phoneNumber);
      console.log('Date of Birth:', user.dateOfBirth);
      
      if (user.role === 'counselor') {
        console.log('\n--- COUNSELOR SPECIFIC INFO ---');
        console.log('Specialization:', user.issuesSpecialization);
        console.log('Academic Qualifications:', user.academicQualifications);
        console.log('Experience Years:', user.experienceYears);
        console.log('Languages:', user.languages);
        console.log('Country:', user.country);
        console.log('State:', user.state);
        console.log('City:', user.city);
        console.log('Bio:', user.bio);
        console.log('Specialties:', user.specialties);
      }
    } else {
      console.log('❌ USER NOT FOUND');
      
      // Search for similar emails
      console.log('\n=== SEARCHING FOR SIMILAR EMAILS ===');
      const similarUsers = await User.find({ 
        email: { $regex: 'blessing', $options: 'i' } 
      }).select('firstName lastName email role approvalStatus');
      
      if (similarUsers.length > 0) {
        console.log(`Found ${similarUsers.length} users with "blessing" in email:`);
        similarUsers.forEach((u, index) => {
          console.log(`${index + 1}. ${u.firstName} ${u.lastName} - ${u.email} (${u.role}, ${u.approvalStatus})`);
        });
      } else {
        console.log('No similar emails found');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

searchUser();

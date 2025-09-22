require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testCounselorsAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Simulate the exact query from the counselors route
    const filter = { 
      role: 'counselor',
      approvalStatus: 'approved'
    };
    
    console.log('Filter being used:', JSON.stringify(filter, null, 2));
    
    const counselorsData = await User.find(filter).select('-password');
    console.log(`\nFound ${counselorsData.length} counselors`);
    
    if (counselorsData.length === 0) {
      console.log('❌ No counselors returned - this explains the undefined error!');
      
      // Let's check what's actually in the database
      const allCounselors = await User.find({ role: 'counselor' }).select('firstName lastName email approvalStatus').limit(5);
      console.log('\nFirst 5 counselors in database:');
      allCounselors.forEach((c, i) => {
        console.log(`${i+1}. ${c.firstName} ${c.lastName} (${c.email}) - Status: ${c.approvalStatus}`);
      });
      
      process.exit(1);
    }
    
    // Transform the data like the API does
    const counselors = counselorsData.map(c => {
      const counselorObj = c.toObject();
      return {
        ...counselorObj,
        _id: counselorObj._id,
        name: `${counselorObj.firstName || 'Counselor'} ${counselorObj.lastName || ''}`.trim(),
        firstName: counselorObj.firstName,
        lastName: counselorObj.lastName,
        specialty: counselorObj.issuesSpecialization || 'General Wellness',
        profilePicture: counselorObj.profilePicture || '',
        averageRating: counselorObj.averageRating || 0,
        sessionRate: counselorObj.sessionRate || 50,
        ngnSessionRate: counselorObj.ngnSessionRate || 25000,
        country: counselorObj.countryOfResidence || 'N/A',
        city: counselorObj.cityOfResidence || 'N/A',
        state: counselorObj.state || 'N/A',
        yearsOfExperience: counselorObj.yearsOfExperience || 'N/A',
        education: counselorObj.academicQualifications || counselorObj.education || 'N/A',
        languages: counselorObj.languages || [],
      };
    });
    
    console.log('\n=== Sample transformed counselor data ===');
    console.log('First counselor:', JSON.stringify(counselors[0], null, 2));
    
    console.log('\n=== API Response Structure ===');
    console.log('Response would be:', {
      status: 'success',
      count: counselors.length,
      data: 'Array of counselors...'
    });
    
    console.log('\n✅ API should return data successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCounselorsAPI();

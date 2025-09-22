const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/quluub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkPendingCounselors() {
  try {
    console.log('Checking for pending counselors...');
    
    const pendingCounselors = await User.find({ 
      role: 'counselor', 
      approvalStatus: 'pending' 
    }).select('firstName lastName email approvalStatus createdAt');
    
    console.log(`Found ${pendingCounselors.length} pending counselors:`);
    
    pendingCounselors.forEach((counselor, index) => {
      console.log(`${index + 1}. ${counselor.firstName} ${counselor.lastName}`);
      console.log(`   Email: ${counselor.email}`);
      console.log(`   Status: ${counselor.approvalStatus}`);
      console.log(`   Registered: ${counselor.createdAt}`);
      console.log('');
    });
    
    if (pendingCounselors.length === 0) {
      console.log('No pending counselors found.');
    }
    
  } catch (error) {
    console.error('Error checking pending counselors:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkPendingCounselors();

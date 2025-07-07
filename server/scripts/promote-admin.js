const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const promoteUserToAdmin = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('Error: Please provide the email address of the user to promote.');
    console.log('Usage: node scripts/promote-admin.js <user-email>');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected successfully.');

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { role: 'admin' } },
      { new: true }
    );

    if (!user) {
      console.error(`Error: No user found with the email '${email}'.`);
    } else {
      console.log(`Success! User '${user.name}' (${user.email}) has been promoted to admin.`);
    }

  } catch (error) {
    console.error('An error occurred while promoting the user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

promoteUserToAdmin();

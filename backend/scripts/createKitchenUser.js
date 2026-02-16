const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

// Load env vars
dotenv.config();

const createKitchenUser = async () => {
  try {
    await connectDB();

    // Check if kitchen user already exists
    const existingUser = await User.findOne({ email: 'kitchen@foodhub.com' });
    
    if (existingUser) {
      console.log('❌ Kitchen user already exists');
      process.exit(0);
    }

    // Create kitchen staff user
    const kitchenUser = await User.create({
      name: 'Kitchen Staff',
      email: 'kitchen@foodhub.com',
      password: 'Kitchen123!',
      role: 'kitchen',
      phone: '5555551234',
    });

    console.log('✅ Kitchen staff user created successfully');
    console.log('📧 Email: kitchen@foodhub.com');
    console.log('🔑 Password: Kitchen123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating kitchen user:', error);
    process.exit(1);
  }
};

createKitchenUser();
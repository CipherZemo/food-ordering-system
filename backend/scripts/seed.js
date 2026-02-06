const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const MenuItem = require('../models/MenuItem');
const { menuItems } = require('../utils/seedData');

// Load env vars
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to DB
    await connectDB();

    // Clear existing data
    await MenuItem.deleteMany();
    console.log('🗑️  Cleared existing menu items');

    // Insert seed data
    await MenuItem.insertMany(menuItems);
    console.log('✅ Menu items seeded successfully');

    console.log(`📊 Total items inserted: ${menuItems.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
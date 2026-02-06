const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide item name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide item description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide item price'],
      min: 0,
    },
    category: {
      type: String,
      required: [true, 'Please provide item category'],
      enum: ['appetizer', 'main-course', 'dessert', 'beverage', 'sides'],
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/300x200?text=Food+Item',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 15,
    },
    ingredients: [
      {
        type: String,
      },
    ],
    allergens: [
      {
        type: String,
      },
    ],
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
    customizationOptions: [
      {
        name: String, // e.g., "Spice Level", "Size"
        choices: [String], // e.g., ["Mild", "Medium", "Hot"]
        required: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports=mongoose.model('MenuItem',menuItemSchema);
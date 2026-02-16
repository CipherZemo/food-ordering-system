const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

// Registration validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
    .escape(),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already in use');
      }
      return true;
    }),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address too long')
    .escape(),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City name too long')
    .escape(),

  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State name too long')
    .escape(),

  body('address.zipCode')
    .optional()
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid ZIP code format (use 12345 or 12345-6789)'),

  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country name too long')
    .escape(),

  validate,
];

// Login validation rules
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password').trim().notEmpty().withMessage('Password is required'),

  validate,
];

// Order creation validation rules
const orderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be at least 1'),

  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('deliveryAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required')
    .isLength({ max: 100 })
    .withMessage('Street address too long')
    .escape(),

  body('deliveryAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 50 })
    .withMessage('City name too long')
    .escape(),

  body('deliveryAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ max: 50 })
    .withMessage('State name too long')
    .escape(),

  body('deliveryAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid ZIP code format'),

  body('deliveryAddress.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ max: 50 })
    .withMessage('Country name too long')
    .escape(),

  validate,
];

// Payment intent validation
const paymentIntentValidation = [
  body('amount')
    .isFloat({ min: 0.5 })
    .withMessage('Amount must be at least $0.50'),

  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
  orderValidation,
  paymentIntentValidation,
};
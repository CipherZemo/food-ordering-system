const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation } = require('../middleware/validators');

// POST /api/auth/register - Register a new user
router.post('/register', authLimiter, registerValidation, register);

// POST /api/auth/login - Login user
router.post('/login', authLimiter, loginValidation, login);

// GET /api/auth/me - Get current logged in user
router.get('/me', protect, getMe);

// PUT /api/auth/profile - Update user profile
router.put('/profile', protect, updateProfile);

// PUT /api/auth/change-password - Change password
router.put('/change-password', protect, changePassword);

module.exports = router;
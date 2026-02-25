const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/adminMiddleware');

// @desc    Check if user is admin
// @route   GET /api/admin/verify
// @access  Private
router.get('/verify', protect, adminAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin verified',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
    },
  });
});

module.exports = router;
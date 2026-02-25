const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/adminMiddleware');
const upload = require('../config/upload');
const {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  bulkDeleteItems,
  bulkToggleAvailability,
  getCategories,
} = require('../controllers/menuController');

// Public routes
router.get('/', getAllMenuItems);
router.get('/categories', getCategories);
router.get('/:id', getMenuItemById);

// Admin routes (protected)
router.post('/', protect, adminAuth, upload.single('image'), createMenuItem);
router.put('/:id', protect, adminAuth, upload.single('image'), updateMenuItem);
router.delete('/:id', protect, adminAuth, deleteMenuItem);
router.patch('/:id/availability', protect, adminAuth, toggleAvailability);
router.post('/bulk-delete', protect, adminAuth, bulkDeleteItems);
router.post('/bulk-toggle', protect, adminAuth, bulkToggleAvailability);

module.exports = router;
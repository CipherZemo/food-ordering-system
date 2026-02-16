const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/kitchenController');

// All kitchen routes require authentication and kitchen/admin role
router.use(protect);
router.use(authorize('kitchen', 'admin'));

// GET /api/kitchen/orders - Get all orders for kitchen
router.get('/orders', getAllOrders);

// PUT /api/kitchen/orders/:id/status - Update order status
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;
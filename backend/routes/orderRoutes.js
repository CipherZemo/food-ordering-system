const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { paymentLimiter, orderLimiter } = require('../middleware/rateLimiter');
const { paymentIntentValidation, orderValidation } = require('../middleware/validators');
const { createRazorpayOrder, verifyPayment, getMyOrders, getOrderById } = require('../controllers/orderController');

// POST /api/orders/create-razorpay-order
router.post('/create-razorpay-order', protect, paymentLimiter, paymentIntentValidation, createRazorpayOrder);

// POST /api/orders/verify-payment
router.post('/verify-payment', protect, orderLimiter, verifyPayment);

// GET /api/orders/my-orders
router.get('/my-orders', protect, getMyOrders);

// GET /api/orders/:id
router.get('/:id', protect, getOrderById);

module.exports = router;
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { paymentLimiter, orderLimiter } = require('../middleware/rateLimiter');
const { paymentIntentValidation,orderValidation } = require('../middleware/validators');
const { createPaymentIntent,createOrder,getMyOrders,getOrderById } = require('../controllers/orderController');

// POST /api/orders/create-payment-intent
router.post('/create-payment-intent', protect, paymentLimiter, paymentIntentValidation, createPaymentIntent);

// POST /api/orders
router.post('/', protect, orderLimiter, orderValidation, createOrder);

// GET /api/orders/my-orders
router.get('/my-orders', protect, getMyOrders);

// GET /api/orders/:id
router.get('/:id', protect, getOrderById);

module.exports = router;
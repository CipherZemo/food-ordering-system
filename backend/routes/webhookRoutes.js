const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/webhookController');

// Stripe webhook - needs RAW body, not JSON parsed
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
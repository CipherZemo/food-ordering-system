const crypto = require('crypto');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// @desc    Handle Razorpay webhooks
// @route   POST /api/webhooks/razorpay
// @access  Public (but verified with Razorpay signature)
const handleRazorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const webhookSignature = req.headers['x-razorpay-signature'];

  try {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('Webhook signature verification failed');
      return res.status(400).send('Webhook Error: Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle the event
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;

      case 'order.paid':
        await handleOrderPaid(payload.order.entity, payload.payment.entity);
        break;

      default:
        console.log(`Unhandled event type ${event}`);
    }

    // Return a response to acknowledge receipt of the event
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Handle successful payment capture
const handlePaymentCaptured = async (payment) => {
  try {
    console.log('✅ Payment captured:', payment.id);

    // Check if order already exists (prevent duplicates)
    const existingOrder = await Order.findOne({
      razorpayPaymentId: payment.id,
    });

    if (existingOrder) {
      console.log('Order already exists for this payment');
      return;
    }

    // Note: For webhook-based order creation, you would need to store
    // order data somewhere accessible or retrieve from payment notes
    // For now, we're handling order creation through the verify-payment endpoint
    // This webhook is primarily for monitoring and backup

    console.log('Payment captured successfully, order should be created via verify-payment endpoint');
  } catch (error) {
    console.error('Error handling payment capture:', error);
  }
};

// Handle failed payment
const handlePaymentFailed = async (payment) => {
  console.log('❌ Payment failed:', payment.id);
  console.log('Reason:', payment.error_description);
  // TODO: Notify customer of failed payment
  // TODO: Log failure for analytics
};

// Handle order paid event
const handleOrderPaid = async (order, payment) => {
  try {
    console.log('✅ Order paid:', order.id);
    console.log('Payment ID:', payment.id);

    // This is a backup - the main order creation happens in verify-payment endpoint
    // You can add additional logic here if needed
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
};

module.exports = {
  handleRazorpayWebhook,
};
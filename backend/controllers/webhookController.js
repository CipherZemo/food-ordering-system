const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// @desc    Handle Stripe webhooks
// @route   POST /api/webhooks/stripe
// @access  Public (but verified with Stripe signature)
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
};

// Handle successful payment
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    console.log('✅ Payment succeeded:', paymentIntent.id);

    // Check if order already exists (prevent duplicates)
    const existingOrder = await Order.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (existingOrder) {
      console.log('Order already exists for this payment intent');
      return;
    }

    // Get order data from payment intent metadata
    const orderData = JSON.parse(paymentIntent.metadata.orderData || '{}');

    if (!orderData.customerId || !orderData.items) {
      console.error('Invalid order data in payment intent metadata');
      return;
    }

    // Validate items and recalculate total
    const orderItems = await Promise.all(
      orderData.items.map(async (item) => {
        const menuItem = await MenuItem.findById(item.menuItemId);

        if (!menuItem) {
          throw new Error(`Menu item ${item.name} not found`);
        }

        if (!menuItem.isAvailable) {
          throw new Error(`${menuItem.name} is currently unavailable`);
        }

        // Calculate price with customizations
        let finalPrice = menuItem.price;
        
        if (item.customizations && menuItem.customizationOptions) {
          menuItem.customizationOptions.forEach((option) => {
            const selectedValue = item.customizations[option.name];
            if (!selectedValue) return;

            if (Array.isArray(selectedValue)) {
              selectedValue.forEach((value) => {
                const choice = option.choices.find((c) =>
                  typeof c === 'string' ? c === value : c.name === value
                );
                if (choice && typeof choice === 'object' && choice.price) {
                  finalPrice += choice.price;
                }
              });
            } else {
              const choice = option.choices.find((c) =>
                typeof c === 'string' ? c === selectedValue : c.name === selectedValue
              );
              if (choice && typeof choice === 'object' && choice.price) {
                finalPrice += choice.price;
              }
            }
          });
        }

        return {
          menuItem: menuItem._id,
          name: menuItem.name,
          price: finalPrice,
          quantity: item.quantity,
          customizations: item.customizations || {},
          specialInstructions: item.specialInstructions || '',
          subtotal: finalPrice * item.quantity,
        };
      })
    );

    // Calculate total
    const calculatedTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalWithTax = calculatedTotal * 1.1;

    // Verify amount matches (allow 1 cent difference for rounding)
    const paidAmount = paymentIntent.amount / 100;
    if (Math.abs(paidAmount - totalWithTax) > 0.01) {
      console.error('Payment amount mismatch:', {
        paid: paidAmount,
        expected: totalWithTax,
      });
      // Still create order but flag it
    }

    // Calculate estimated pickup time
    const maxPrepTime = Math.max(
      ...orderItems.map(() => 15) // Default 15 min, could be calculated from items
    );
    const estimatedPickupTime = new Date(Date.now() + (maxPrepTime + 10) * 60000);

    // Create order
    const order = await Order.create({
      customer: orderData.customerId,
      items: orderItems,
      totalAmount: paidAmount,
      deliveryAddress: orderData.deliveryAddress,
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      status: 'received',
      estimatedPickupTime,
    });

    console.log('✅ Order created:', order.orderNumber);

    // TODO: Send email notification to customer
    // TODO: Notify kitchen dashboard via WebSocket

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
};

// Handle failed payment
const handlePaymentIntentFailed = async (paymentIntent) => {
  console.log('❌ Payment failed:', paymentIntent.id);
  // TODO: Notify customer of failed payment
  // TODO: Log failure for analytics
};

module.exports = {
  handleStripeWebhook,
};
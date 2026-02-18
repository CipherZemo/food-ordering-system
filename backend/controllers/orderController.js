const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order with server-side validation
// @route   POST /api/orders/create-razorpay-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, items, deliveryAddress } = req.body;

    // Validate items exist
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided',
      });
    }

    // SERVER-SIDE VALIDATION: Recalculate total from database
    let serverTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item._id);

      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Menu item "${item.name}" not found`,
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `"${menuItem.name}" is currently unavailable`,
        });
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

      const itemTotal = finalPrice * item.quantity;
      serverTotal += itemTotal;

      validatedItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: finalPrice,
        quantity: item.quantity,
        customizations: item.customizations || {},
        specialInstructions: item.specialInstructions || '',
      });
    }

    // Add tax
    const serverTotalWithTax = serverTotal * 1.1;

    // SECURITY CHECK: Compare client total with server total
    if (Math.abs(serverTotalWithTax - amount) > 0.01) {
      console.error('Price mismatch detected:', {
        clientTotal: amount,
        serverTotal: serverTotalWithTax,
        difference: Math.abs(serverTotalWithTax - amount),
      });

      return res.status(400).json({
        success: false,
        message: 'Price mismatch detected. Please refresh and try again.',
        expectedTotal: serverTotalWithTax,
      });
    }

    // Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(serverTotalWithTax * 100), // Razorpay expects amount in paise (smallest currency unit)
      currency: 'INR',
      receipt: `receipt_${req.user._id}_${Date.now()}`,
      notes: {
        customerId: req.user._id.toString(),
        customerEmail: req.user.email,
        orderData: JSON.stringify({
          customerId: req.user._id.toString(),
          items: validatedItems,
          deliveryAddress,
        }),
      },
    });

    res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      validatedTotal: serverTotalWithTax,
      key: process.env.RAZORPAY_KEY_ID, // Send key to frontend
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

// @desc    Verify Razorpay payment and create order
// @route   POST /api/orders/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, totalAmount, deliveryAddress } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // Signature is valid - fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Check if payment is captured/successful
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful',
      });
    }

    // Check if order already exists (prevent duplicates)
    const existingOrder = await Order.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: 'Order already exists',
        data: existingOrder,
      });
    }

    // Process order items
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const menuItem = await MenuItem.findById(item._id);

        if (!menuItem) {
          throw new Error(`Menu item ${item.name} not found`);
        }

        if (!menuItem.isAvailable) {
          throw new Error(`${menuItem.name} is currently unavailable`);
        }

        return {
          menuItem: menuItem._id,
          name: menuItem.name,
          price: item.finalPrice,
          quantity: item.quantity,
          customizations: item.customizations || {},
          specialInstructions: item.specialInstructions || '',
          subtotal: item.finalPrice * item.quantity,
        };
      })
    );

    // Calculate estimated pickup time
    const maxPrepTime = Math.max(
      ...items.map((item) => {
        const menuItem = MenuItem.findById(item._id);
        return menuItem?.preparationTime || 15;
      })
    );
    const estimatedPickupTime = new Date(Date.now() + (maxPrepTime + 10) * 60000);

    // Determine payment method from Razorpay payment
    let paymentMethod = 'card';
    if (payment.method === 'upi') paymentMethod = 'upi';
    else if (payment.method === 'netbanking') paymentMethod = 'netbanking';
    else if (payment.method === 'wallet') paymentMethod = 'wallet';

    // Create order
    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid',
      paymentMethod,
      status: 'received',
      estimatedPickupTime,
    });

    // Populate order with menu item details
    await order.populate('items.menuItem');

    res.status(201).json({
      success: true,
      message: 'Payment verified and order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
    });
  }
};

// @desc    Get current user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem')
      .populate('customer', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order belongs to current user
    if (order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message,
    });
  }
};

module.exports = { createRazorpayOrder,verifyPayment,getMyOrders,getOrderById, };
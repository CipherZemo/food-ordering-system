const Order = require('../models/Order');

// @desc    Get all orders for kitchen (not completed/cancelled)
// @route   GET /api/kitchen/orders
// @access  Private/Kitchen/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['received', 'preparing', 'ready'] },
    })
      .populate('customer', 'name email phone')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/kitchen/orders/:id/status
// @access  Private/Kitchen/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['received', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Update status
    order.status = status;

    // If completed, set completedAt
    if (status === 'completed') {
      order.completedAt = new Date();
    }

    await order.save();

    // Populate before sending response
    await order.populate('customer', 'name email phone');
    await order.populate('items.menuItem');

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

module.exports = {
  getAllOrders,
  updateOrderStatus,
};
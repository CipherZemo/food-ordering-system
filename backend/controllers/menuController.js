const MenuItem = require('../models/MenuItem');
// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
const getAllMenuItems = async (req, res) => {
    try {
        const { category, available } = req.query;

        let filter = {};// Build filter object
        if (category)
            filter.category = category;
        if (available !== undefined)
            filter.isAvailable = available === 'true';

        const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 });
        res.status(200).json({
            success: true,
            count: menuItems.length,
            data: menuItems,
        });

    } catch (err) {
        console.error("Error fetching menu items - ", err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message,
        });
    }
}
// @desc    Get single menu item by ID
// @route   GET /api/menu/:id
// @access  Public
const getMenuItemById = async (req, res) => {
    try {
        const menuItems = await MenuItem.findById(req.params.id);

        if (!menuItems) {
            return res.status(404).json({
                success: false,
                message: 'menu item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: menuItems,
        });

    } catch (err) {
        console.error('Error fetching menu item:', err);

        // Handle invalid ObjectId format
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while fetching menu item',
            error: err.message,
        });
    }
};
// @desc    Create new menu item
// @route   POST /api/menu
// @access  Private/Admin
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, preparationTime, customizationOptions } = req.body;

    // Get image path if uploaded
    const image = req.file ? `/uploads/menu-images/${req.file.filename}` : '/images/default-food.jpg';

    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      category,
      image,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      preparationTime: preparationTime || 15,
      customizationOptions: customizationOptions ? JSON.parse(customizationOptions) : [],
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem,
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item',
      error: error.message,
    });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private/Admin
const updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, preparationTime, customizationOptions } = req.body;

    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Update fields
    menuItem.name = name || menuItem.name;
    menuItem.description = description || menuItem.description;
    menuItem.price = price !== undefined ? price : menuItem.price;
    menuItem.category = category || menuItem.category;
    menuItem.isAvailable = isAvailable !== undefined ? isAvailable : menuItem.isAvailable;
    menuItem.preparationTime = preparationTime || menuItem.preparationTime;
    
    if (customizationOptions) {
      menuItem.customizationOptions = JSON.parse(customizationOptions);
    }

    // Update image if new one uploaded
    if (req.file) {
      menuItem.image = `/uploads/menu-images/${req.file.filename}`;
    }

    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem,
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
      error: error.message,
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private/Admin
const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    await menuItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
      error: error.message,
    });
  }
};

// @desc    Toggle menu item availability
// @route   PATCH /api/menu/:id/availability
// @access  Private/Admin
const toggleAvailability = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'}`,
      data: menuItem,
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle availability',
      error: error.message,
    });
  }
};

// @desc    Bulk delete menu items
// @route   POST /api/menu/bulk-delete
// @access  Private/Admin
const bulkDeleteItems = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No item IDs provided',
      });
    }

    const result = await MenuItem.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} items deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error bulk deleting items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete items',
      error: error.message,
    });
  }
};

// @desc    Bulk toggle availability
// @route   POST /api/menu/bulk-toggle
// @access  Private/Admin
const bulkToggleAvailability = async (req, res) => {
  try {
    const { ids, isAvailable } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No item IDs provided',
      });
    }

    const result = await MenuItem.updateMany(
      { _id: { $in: ids } },
      { isAvailable }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} items updated`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error bulk toggling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update items',
      error: error.message,
    });
  }
};

// @desc    Get all categories
// @route   GET /api/menu/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  bulkDeleteItems,
  bulkToggleAvailability,
  getCategories,
};

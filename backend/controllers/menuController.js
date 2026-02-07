const MenuItem = require('../models/MenuItem');
// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
const getAllMenuItems = async (req, res) => {
    try {
        const { category, available } = req.body;

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

    }catch(err){
        console.error("Error fetching menu items - " ,err);
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
const getMenuItemById= async (req,res)=>{
    try{
        const menuItems= await MenuItem.findById(req.params.id);

        if(!menuItems){
            return res.status(404).json({
                success: false,
                message: 'menu item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: menuItems,
        });

    }catch(err){
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



module.exports={ getAllMenuItems,getMenuItemById };

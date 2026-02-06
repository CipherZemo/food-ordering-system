const express=require('express');
const router=express.Router();

const { getAllMenuItems,getMenuItemById }= require('../controllers/menuController')

// GET /api/menu
router.get('/',getAllMenuItems);
// GET /api/menu
router.get('/:i',getMenuItemById);

module.exports=router;

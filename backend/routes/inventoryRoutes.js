// routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// 查询实时库存列表
router.get('/', inventoryController.getInventory);

module.exports = router;

// routes/stockOutRoutes.js
const express = require('express');
const router = express.Router();
const stockOutController = require('../controllers/stockOutController');

// 获取出库单详情
router.get('/:id', stockOutController.getStockOutDetail);

// 创建出库单接口
router.post('/', stockOutController.createStockOut);

// 更新出库单
router.put('/:id', stockOutController.updateStockOut);

// 删除出库单
router.delete('/:id', stockOutController.deleteStockOut);

module.exports = router;
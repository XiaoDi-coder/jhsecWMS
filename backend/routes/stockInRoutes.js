const express = require('express');
const router = express.Router();
const stockInController = require('../controllers/stockInController');

// 获取入库单详情
router.get('/:id', stockInController.getStockInDetail);

// 创建入库单
router.post('/', stockInController.createStockIn);

// 更新入库单
router.put('/:id', stockInController.updateStockIn);

// 删除入库单
router.delete('/:id', stockInController.deleteStockIn);

module.exports = router;
// routes/salesOrderRoutes.js
const express = require('express');
const router = express.Router();
const salesOrderController = require('../controllers/salesOrderController');

// 获取销售订单详情
router.get('/:id', salesOrderController.getSalesOrderDetail);

// 创建销售订单
router.post('/', salesOrderController.createSalesOrder);

// 更新销售订单
router.put('/:id', salesOrderController.updateSalesOrder);

// 删除销售订单
router.delete('/:id', salesOrderController.deleteSalesOrder);

module.exports = router;
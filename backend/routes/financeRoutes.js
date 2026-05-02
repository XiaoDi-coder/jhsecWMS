// routes/financeRoutes.js
const express = require('express');
const router = express.Router();

// 引入对应的控制器
const financeController = require('../controllers/financeController');

/**
 * 财务流水模块路由定义
 * 基础路径为: /api/finance (在 server.js 中已配置)
 */

// 1. 查询财务流水列表 (带分页、搜索和过滤)
// 实际请求 URL: GET /api/finance
router.get('/', financeController.getTransactions);

// 2. 手工新建一条财务流水
// 实际请求 URL: POST /api/finance
router.post('/', financeController.createTransaction);

// 3. 更新特定流水的状态 (例如将 UNPAID 更新为 PAID)
// :id 是一个动态参数，代表流水记录的 ID
// 实际请求 URL: PUT /api/finance/1/status
router.put('/:id/status', financeController.updateTransactionStatus);

// 4. 添加分次支付记录
// :id 是一个动态参数，代表财务流水记录的 ID
// 实际请求 URL: POST /api/finance/1/payment
router.post('/:id/payment', financeController.addPaymentRecord);

// 5. 获取特定财务流水的支付记录
// :id 是一个动态参数，代表财务流水记录的 ID
// 实际请求 URL: GET /api/finance/1/payments
router.get('/:id/payments', financeController.getPaymentRecords);

// 6. 获取所有财务流水（包含分次支付信息）
// 实际请求 URL: GET /api/finance/detail
router.get('/detail', financeController.getTransactionsWithPayments);

module.exports = router;
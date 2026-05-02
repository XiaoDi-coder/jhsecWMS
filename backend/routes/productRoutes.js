// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 定义路由，将其指向控制器中的 getProducts 方法
// 完整的 URL 将在 server.js 中组合，例如：/api/products
router.get('/', productController.getProducts);

// 新增商品 (POST /api/products)
router.post('/', productController.createProduct);

// 修改商品信息 (PUT /api/products/:id)
// 注意路径中的 :id 是一个动态参数
router.put('/:id', productController.updateProduct);

// 软删除商品 (DELETE /api/products/:id)
router.delete('/:id', productController.deleteProduct);
// 预留其他相关接口的位置...
// router.post('/', productController.createProduct);
// router.put('/:id', productController.updateProduct);
// router.delete('/:id', productController.deleteProduct);

module.exports = router;
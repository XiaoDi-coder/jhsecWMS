// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 登录接口 (不需要鉴权保护)
router.post('/login', authController.login);

module.exports = router;
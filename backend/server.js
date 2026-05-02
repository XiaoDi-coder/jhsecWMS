// server.js
const verifyToken = require('./middlewares/authMiddleware'); // 👉 引入护城河中间件
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 引入数据库配置文件，这会触发内部的连接测试
require('./config/db');
const { bootstrapSystemData } = require('./bootstrap');

const app = express();

// ==========================================
// 全局中间件：精细化配置 CORS (跨域资源共享)
// ==========================================

// 1. 定义允许跨域访问的白名单列表
const allowedOrigins = [
  'http://localhost:5173', // 假设你的 Vite 前端运行在 5173 端口 (本地开发)
  'http://localhost:3000', // 也可以加上前端可能用的其他本地端口
  'http://your-production-domain.com' // 预留：未来线上部署的前端域名
];

// 2. 配置 CORS 选项
const corsOptions = {
  // 校验请求来源是否在白名单中
  origin: function (origin, callback) {
    // !origin 允许没有 origin 的请求 (比如来自 Postman 这样的非浏览器工具)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS 策略拦截：不允许的跨域请求来源'));
    }
  },
  // 允许的 HTTP 请求方法
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // 允许前端发送的自定义请求头 (特别是 Authorization，由于我们用了 JWT)
  allowedHeaders: ['Content-Type', 'Authorization'],
  
  // 允许前端携带凭证信息
  credentials: true,
  
  // 预检请求(OPTIONS)的缓存时间 (秒)，减少浏览器频繁发送预检请求，提升性能
  maxAge: 86400 
};

// 3. 应用精细化配置的 CORS 中间件
app.use(cors(corsOptions));
// 解析 JSON 格式的请求体 (用于解析前端 POST 过来的 data)
app.use(express.json()); 
// 解析 URL-encoded 格式的请求体
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 基础测试路由
// ==========================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WMS 后端服务运行正常！',
    timestamp: new Date()
  });
});

app.use('/api/auth', require('./routes/authRoutes')); // 登录路由必须开放


// ==========================================
// 🛡️ 部署全局护城河 🛡️
// 下面的所有路由，都会先经过 verifyToken 的校验
// ==========================================
app.use('/api', verifyToken);

// ==========================================
// 注册业务路由
// ==========================================
// 将所有以 /api/products 开头的请求，交给 productRoutes 处理
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/warehouses', require('./routes/warehouseRoutes'));
app.use('/api/partners', require('./routes/partnerRoutes'));
// 入库模块路由
app.use('/api/stock-in', require('./routes/stockInRoutes'));
// 出库模块路由
app.use('/api/stock-out', require('./routes/stockOutRoutes'));
// 实时库存查询模块路由
app.use('/api/inventory', require('./routes/inventoryRoutes'));
// 销售订单模块路由
app.use('/api/sales-orders', require('./routes/salesOrderRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));


// 未来这里将引入你各个模块的路由
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/stock', require('./routes/stockRoutes'));

// ==========================================
// 启动服务器
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务已启动，正在监听端口: http://localhost:${PORT}`);
  bootstrapSystemData();
});
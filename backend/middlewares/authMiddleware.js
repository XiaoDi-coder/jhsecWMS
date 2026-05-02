// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * JWT 鉴权拦截中间件
 */
const verifyToken = (req, res, next) => {
  // 1. 获取请求头中的 Token (通常格式为 "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '无访问权限，请提供身份验证令牌 (Token)' 
    });
  }

  // 2. 校验 Token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token 无效或已过期，请重新登录' 
      });
    }

    // 3. 将解密后的用户信息挂载到请求对象上，方便后续路由使用 (例如记录是谁操作的)
    req.user = decoded;
    
    // 4. 放行，继续执行后续的业务逻辑
    next();
  });
};

module.exports = verifyToken;
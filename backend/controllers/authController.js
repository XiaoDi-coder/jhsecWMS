// controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * 用户登录
 * 路径: POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    }

    // 1. 查询用户及关联的角色名称 (注意防范 SQL 注入)
    const sql = `
      SELECT u.*, r.role_name 
      FROM sys_users u 
      LEFT JOIN sys_roles r ON u.role_id = r.id 
      WHERE u.username = ? AND u.status = 1 AND u.is_deleted = 0
    `;
    const [users] = await db.execute(sql, [username]);
    const user = users[0];

    // 2. 验证用户是否存在
    if (!user) {
      return res.status(401).json({ success: false, message: '账号不存在或已被禁用' });
    }

    // 3. 验证密码
    // 注意：这里为了方便你首次测试，如果你数据库里的密码还是明文，你可以暂时用 if(password !== user.password_hash) 替代。
    // 正式环境中必须使用 bcrypt.compare
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }

    // 4. 生成 JWT Token
    // 包含一些不敏感的基础信息，供前端使用
    const payload = {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      roleId: user.role_id,
      roleName: user.role_name
    };

    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 5. 返回 Token 和用户信息
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: payload
      }
    });

  } catch (error) {
    console.error('登录异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误', error: error.message });
  }
};
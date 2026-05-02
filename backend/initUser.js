// initUser.js (临时执行的脚本)
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const [roles] = await db.execute(
    'SELECT id FROM sys_roles WHERE role_name = ? LIMIT 1',
    ['超级管理员']
  );

  let roleId;
  if (roles.length > 0) {
    roleId = roles[0].id;
  } else {
    const [roleResult] = await db.execute(
      'INSERT INTO sys_roles (role_name, permissions) VALUES (?, ?)',
      ['超级管理员', JSON.stringify(['all'])]
    );
    roleId = roleResult.insertId;
  }

  const [users] = await db.execute(
    'SELECT id FROM sys_users WHERE username = ? AND is_deleted = 0 LIMIT 1',
    ['admin']
  );
  if (users.length > 0) {
    console.log('ℹ️ 管理员账号已存在，无需重复创建。');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash('123456', 10);
  await db.execute(
    `INSERT INTO sys_users (username, password_hash, real_name, role_id, status, is_deleted) VALUES (?, ?, ?, ?, 1, 0)`,
    ['admin', passwordHash, '超级管理员', roleId]
  );
  console.log('✅ 测试管理员 admin / 123456 创建成功！');
  process.exit(0);
}
createAdmin();
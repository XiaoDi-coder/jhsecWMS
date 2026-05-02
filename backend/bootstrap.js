const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function ensureDefaultRole() {
  const [roles] = await db.execute(
    'SELECT id FROM sys_roles WHERE role_name = ? LIMIT 1',
    ['超级管理员']
  );

  if (roles.length > 0) {
    return roles[0].id;
  }

  const [result] = await db.execute(
    'INSERT INTO sys_roles (role_name, permissions) VALUES (?, ?)',
    ['超级管理员', JSON.stringify(['all'])]
  );
  return result.insertId;
}

async function ensureDefaultAdmin(roleId) {
  const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || '123456';
  const realName = process.env.DEFAULT_ADMIN_REALNAME || '系统管理员';

  const [users] = await db.execute(
    'SELECT id FROM sys_users WHERE username = ? AND is_deleted = 0 LIMIT 1',
    [username]
  );

  if (users.length > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.execute(
    `
    INSERT INTO sys_users (username, password_hash, real_name, role_id, status, is_deleted)
    VALUES (?, ?, ?, ?, 1, 0)
    `,
    [username, passwordHash, realName, roleId]
  );
  console.log(`✅ 已自动创建默认管理员账号: ${username}`);
}

exports.bootstrapSystemData = async () => {
  try {
    const roleId = await ensureDefaultRole();
    await ensureDefaultAdmin(roleId);
  } catch (error) {
    console.error('❌ 初始化默认系统数据失败:', error.message);
  }
};

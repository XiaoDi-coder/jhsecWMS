// config/db.js
const mysql = require('mysql2');
require('dotenv').config(); // 加载 .env 环境变量

// 创建一个连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // 最大连接数
  queueLimit: 0
});

// 使用 promise() 包装，这样我们后续就可以使用 async/await 来写优雅的 SQL 查询了
const promisePool = pool.promise();

// 测试连接是否成功
promisePool.getConnection()
  .then(connection => {
    console.log('✅ 数据库连接成功！');
    connection.release(); // 测试完毕后释放连接
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
  });

module.exports = promisePool;
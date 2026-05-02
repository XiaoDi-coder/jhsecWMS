// controllers/inventoryController.js
const db = require('../config/db');

/**
 * 获取实时库存列表 (支持联表查询、分页、仓库过滤、商品搜索)
 * 请求方式: GET
 * 路径: /api/inventory
 */
exports.getInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    const warehouseId = req.query.warehouse_id;
    const keyword = req.query.keyword || '';

    // 1. 构建基础的 JOIN 查询子句
    // 我们需要查出库存数量，以及关联的仓库名称和商品详情
    let baseSql = `
      FROM inv_stock s
      LEFT JOIN base_warehouses w ON s.warehouse_id = w.id
      LEFT JOIN base_products p ON s.product_id = p.id
      WHERE 1=1
    `;
    const queryParams = [];

    // 2. 动态拼接 WHERE 过滤条件
    // 按仓库过滤
    if (warehouseId) {
      baseSql += ` AND s.warehouse_id = ?`;
      queryParams.push(warehouseId);
    }

    // 按商品名称或编码模糊搜索
    if (keyword) {
      baseSql += ` AND (p.product_name LIKE ? OR p.product_code LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      queryParams.push(likeKeyword, likeKeyword);
    }

    // 3. 构建完整的查询和计数 SQL
    // 对于数据，我们需要 SELECT 特定的列，避免重名字段冲突 (如 id)
    const selectFields = `
      s.id as inventory_id,
      s.quantity,
      s.updated_at as last_update,
      w.id as warehouse_id,
      w.warehouse_name,
      p.id as product_id,
      p.product_code,
      p.product_name,
      p.category,
      p.unit
    `;

    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    // 按最后更新时间或商品 ID 排序
    const dataSql = `SELECT ${selectFields} ${baseSql} ORDER BY s.updated_at DESC LIMIT ${db.escape(pageSize)} OFFSET ${db.escape(offset)}`;

    // 4. 并行执行查询
    const [countResult, dataResult] = await Promise.all([
      db.execute(countSql, queryParams),
      db.execute(dataSql, queryParams)
    ]);

    // 5. 返回结果
    res.status(200).json({
      success: true,
      message: '获取库存列表成功',
      data: {
        total: countResult[0][0].total,
        page,
        pageSize,
        list: dataResult[0]
      }
    });

  } catch (error) {
    console.error('获取库存列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，获取库存列表失败',
      error: error.message
    });
  }
};
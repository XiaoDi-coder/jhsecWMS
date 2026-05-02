// controllers/warehouseController.js
const db = require('../config/db');

// 1. 查询仓库列表
exports.getWarehouses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const keyword = req.query.keyword || '';

    let baseSql = `FROM base_warehouses WHERE 1=1`;
    const queryParams = [];

    if (keyword) {
      baseSql += ` AND (warehouse_name LIKE ? OR warehouse_code LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      queryParams.push(likeKeyword, likeKeyword);
    }

    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const dataSql = `SELECT * ${baseSql} ORDER BY created_at DESC LIMIT ${db.escape(pageSize)} OFFSET ${db.escape(offset)}`;

    const [countResult, dataResult] = await Promise.all([
      db.execute(countSql, queryParams),
      db.execute(dataSql, queryParams)
    ]);

    res.status(200).json({
      success: true,
      data: { total: countResult[0][0].total, page, pageSize, list: dataResult[0] }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取仓库失败', error: error.message });
  }
};

// 2. 新增仓库
exports.createWarehouse = async (req, res) => {
  try {
    const { warehouse_code, warehouse_name, location } = req.body;
    if (!warehouse_code || !warehouse_name) {
      return res.status(400).json({ success: false, message: '仓库编码和名称不能为空' });
    }

    // 校验编码唯一性
    const [existing] = await db.execute(`SELECT id FROM base_warehouses WHERE warehouse_code = ?`, [warehouse_code]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: '仓库编码已存在' });
    }

    const [result] = await db.execute(
      `INSERT INTO base_warehouses (warehouse_code, warehouse_name, location) VALUES (?, ?, ?)`,
      [warehouse_code, warehouse_name, location || null]
    );

    res.status(201).json({ success: true, message: '新增仓库成功', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: '新增仓库失败', error: error.message });
  }
};

// 3. 更新仓库信息 & 状态
exports.updateWarehouse = async (req, res) => {
  try {
    const { warehouse_name, location, status } = req.body;
    const updates = [];
    const params = [];

    if (warehouse_name !== undefined) { updates.push('warehouse_name = ?'); params.push(warehouse_name); }
    if (location !== undefined) { updates.push('location = ?'); params.push(location); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });

    params.push(req.params.id);
    await db.execute(`UPDATE base_warehouses SET ${updates.join(', ')} WHERE id = ?`, params);

    res.status(200).json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败', error: error.message });
  }
};
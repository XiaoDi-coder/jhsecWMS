// controllers/stockInController.js
const db = require('../config/db'); // 引入数据库连接池

/**
 * 获取入库单详情
 */
exports.getStockInDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取主表信息
    const [mainResult] = await db.execute(`
      SELECT s.*, w.warehouse_name, p.partner_name as supplier_name
      FROM biz_stock_in s
      LEFT JOIN base_warehouses w ON s.warehouse_id = w.id
      LEFT JOIN base_partners p ON s.supplier_id = p.id
      WHERE s.id = ?
    `, [id]);

    if (mainResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该入库单',
      });
    }

    // 获取入库明细
    const [itemResult] = await db.execute(`
      SELECT
        i.id as item_id, i.product_id,
        p.product_name, p.unit,
        i.quantity, i.unit_price, i.total_price
      FROM biz_order_items i
      LEFT JOIN base_products p ON i.product_id = p.id
      WHERE i.order_type = 'STOCK_IN' AND i.order_id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      data: {
        ...mainResult[0],
        items: itemResult,
      },
    });
  } catch (error) {
    console.error('获取入库单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取入库单详情失败',
      error: error.message,
    });
  }
};

/**
 * 更新入库单
 */
exports.updateStockIn = async (req, res) => {
  const { id } = req.params;
  const { stock_in_no, warehouse_id, source_type, supplier_id, items } = req.body;

  // 基础校验
  if (!stock_in_no || !warehouse_id || !items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, message: '入库单号、仓库ID以及入库明细不可为空' });
  }

  const connection = await db.getConnection();

  try {
    // 开启事务
    await connection.beginTransaction();

    // 1. 检查入库单是否存在
    const [existingStockIn] = await connection.execute(
      'SELECT status FROM biz_stock_in WHERE id = ?',
      [id]
    );

    if (existingStockIn.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: '未找到该入库单' });
    }

    // 2. 检查是否允许修改（只允许修改草稿状态）
    if (existingStockIn[0].status !== 'DRAFT') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: '只允许修改草稿状态的入库单' });
    }

    // 3. 获取原有的明细信息，用于回滚库存
    const [oldItems] = await connection.execute(
      'SELECT product_id, quantity FROM biz_order_items WHERE order_type = "STOCK_IN" AND order_id = ?',
      [id]
    );

    // 4. 先回滚原有库存（从现有库存中减去旧的数量）
    for (const item of oldItems) {
      await connection.execute(
        `UPDATE inv_stock
        SET quantity = quantity - ?
        WHERE warehouse_id = (SELECT warehouse_id FROM biz_stock_in WHERE id = ?)
        AND product_id = ?`,
        [item.quantity, id, item.product_id]
      );
    }

    // 5. 删除原有的明细
    await connection.execute(
      'DELETE FROM biz_order_items WHERE order_type = "STOCK_IN" AND order_id = ?',
      [id]
    );

    // 6. 更新主表信息
    await connection.execute(
      `UPDATE biz_stock_in
      SET stock_in_no = ?, warehouse_id = ?, source_type = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [stock_in_no, warehouse_id, source_type || null, supplier_id || null, id]
    );

    // 7. 插入新的明细并更新库存
    let totalAmount = 0;
    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      const price = unit_price || 0;
      const totalPrice = quantity * price;

      totalAmount += totalPrice;

      await connection.execute(
        `INSERT INTO biz_order_items
        (order_type, order_id, product_id, quantity, unit_price, total_price)
        VALUES ('STOCK_IN', ?, ?, ?, ?, ?)`,
        [id, product_id, quantity, price, totalPrice]
      );

      // 更新库存
      await connection.execute(
        `INSERT INTO inv_stock (warehouse_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
        [warehouse_id, product_id, quantity]
      );
    }

    // 提交事务
    await connection.commit();

    res.status(200).json({
      success: true,
      message: '入库单更新成功',
      data: { id, totalAmount },
    });

  } catch (error) {
    await connection.rollback();
    console.error('更新入库单失败:', error);
    res.status(500).json({ success: false, message: '更新入库单失败', error: error.message });
  } finally {
    connection.release();
  }
};

/**
 * 删除入库单
 */
exports.deleteStockIn = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    // 开启事务
    await connection.beginTransaction();

    // 1. 检查入库单是否存在
    const [existingStockIn] = await connection.execute(
      'SELECT status FROM biz_stock_in WHERE id = ?',
      [id]
    );

    if (existingStockIn.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: '未找到该入库单' });
    }

    // 2. 检查是否允许删除
    if (existingStockIn[0].status !== 'DRAFT') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: '只允许删除草稿状态的入库单' });
    }

    // 3. 获取需要回滚的库存
    const [stockItems] = await connection.execute(
      'SELECT product_id, quantity FROM biz_order_items WHERE order_type = "STOCK_IN" AND order_id = ?',
      [id]
    );

    // 4. 回滚库存
    for (const item of stockItems) {
      await connection.execute(
        `UPDATE inv_stock
        SET quantity = quantity - ?
        WHERE warehouse_id = (SELECT warehouse_id FROM biz_stock_in WHERE id = ?)
        AND product_id = ?`,
        [item.quantity, id, item.product_id]
      );
    }

    // 5. 删除明细
    await connection.execute(
      'DELETE FROM biz_order_items WHERE order_type = "STOCK_IN" AND order_id = ?',
      [id]
    );

    // 6. 删除主表
    await connection.execute(
      'DELETE FROM biz_stock_in WHERE id = ?',
      [id]
    );

    // 提交事务
    await connection.commit();

    res.status(200).json({
      success: true,
      message: '入库单删除成功',
    });

  } catch (error) {
    await connection.rollback();
    console.error('删除入库单失败:', error);
    res.status(500).json({ success: false, message: '删除入库单失败', error: error.message });
  } finally {
    connection.release();
  }
};

exports.getStockInList = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const offset = (page - 1) * pageSize;
    const keyword = (req.query.keyword || '').trim();

    let baseSql = `
      FROM biz_stock_in s
      LEFT JOIN base_warehouses w ON s.warehouse_id = w.id
      LEFT JOIN base_partners p ON s.supplier_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      const likeKeyword = `%${keyword}%`;
      baseSql += ` AND (s.stock_in_no LIKE ? OR w.warehouse_name LIKE ? OR p.partner_name LIKE ?)`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }

    const [countRows, listRows] = await Promise.all([
      db.execute(`SELECT COUNT(*) AS total ${baseSql}`, params),
      db.execute(
        `
        SELECT
          s.id,
          s.stock_in_no,
          s.source_type,
          s.status,
          s.created_at,
          w.warehouse_name,
          p.partner_name AS supplier_name
        ${baseSql}
        ORDER BY s.created_at DESC
        LIMIT ${db.escape(pageSize)} OFFSET ${db.escape(offset)}
        `,
        params
      ),
    ]);

    const orders = listRows[0];
    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        data: { total: 0, page, pageSize, list: [] },
      });
    }

    const orderIds = orders.map((o) => o.id);
    const placeholders = orderIds.map(() => '?').join(',');
    const [itemRows] = await db.execute(
      `
      SELECT
        i.order_id,
        i.product_id,
        i.quantity,
        i.unit_price,
        i.total_price,
        p.product_name
      FROM biz_order_items i
      LEFT JOIN base_products p ON i.product_id = p.id
      WHERE i.order_type = 'STOCK_IN' AND i.order_id IN (${placeholders})
      `,
      orderIds
    );

    const itemMap = itemRows.reduce((acc, row) => {
      const key = row.order_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        productId: row.product_id,
        product: row.product_name || '-',
        qty: Number(row.quantity || 0),
        price: Number(row.unit_price || 0),
        totalPrice: Number(row.total_price || 0),
      });
      return acc;
    }, {});

    const normalized = orders.map((o) => ({
      id: o.id,
      orderNo: o.stock_in_no,
      type: o.source_type || '采购入库',
      warehouse: o.warehouse_name || '-',
      supplier: o.supplier_name || '-',
      date: new Date(o.created_at).toISOString().slice(0, 10),
      status: o.status === 'CONFIRMED' ? '已审核' : '待审核',
      items: itemMap[o.id] || [],
      amount: Number((itemMap[o.id] || []).reduce((s, it) => s + it.totalPrice, 0)).toFixed(2),
    }));

    return res.status(200).json({
      success: true,
      data: {
        total: countRows[0][0].total,
        page,
        pageSize,
        list: normalized,
      },
    });
  } catch (error) {
    console.error('获取入库列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取入库列表失败',
      error: error.message,
    });
  }
};

/**
 * 创写入库单并联动更新库存 (使用数据库事务)
 * 请求方式: POST
 * 路径: /api/stock-in
 * 请求体示例:
 * {
 *   "stock_in_no": "IN-20231024-001",
 *   "warehouse_id": 1,
 *   "source_type": "PURCHASE",
 *   "supplier_id": 2,
 *   "items": [
 *     { "product_id": 101, "quantity": 50, "unit_price": 10.5 },
 *     { "product_id": 102, "quantity": 20, "unit_price": 15.0 }
 *   ]
 * }
 */
exports.createStockIn = async (req, res) => {
  const { stock_in_no, warehouse_id, source_type, supplier_id, items } = req.body;

  // 1. 基础校验
  if (!stock_in_no || !warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: '入库单号、仓库ID以及入库明细不可为空' });
  }

  // 2. 从连接池中获取一个独立的连接 (事务必须在同一个连接上执行)
  const connection = await db.getConnection();

  try {
    // 3. 开启事务 🚀
    await connection.beginTransaction();

    // 4. 插入入库主表
    // 假设前端直接确认入库，状态设为 CONFIRMED
    const insertMainSql = `
      INSERT INTO biz_stock_in (stock_in_no, warehouse_id, source_type, supplier_id, status)
      VALUES (?, ?, ?, ?, 'CONFIRMED')
    `;
    const [mainResult] = await connection.execute(insertMainSql, [
      stock_in_no, warehouse_id, source_type || null, supplier_id || null
    ]);
    const orderId = mainResult.insertId;

    let totalAmount = 0; // 用于累计本次入库的总金额

    // 5. 遍历插入明细并联动更新库存
    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      const price = unit_price || 0;
      const totalPrice = quantity * price;

      totalAmount += totalPrice; // 累加金额

      // 5.1 插入明细表
      const insertItemSql = `
        INSERT INTO biz_order_items (order_type, order_id, product_id, quantity, unit_price, total_price)
        VALUES ('STOCK_IN', ?, ?, ?, ?, ?)
      `;
      await connection.execute(insertItemSql, [orderId, product_id, quantity, price, totalPrice]);

      // 5.2 联动更新库存 🚨
      // 使用 INSERT ... ON DUPLICATE KEY UPDATE 语法：
      // 如果该仓库之前没有这个商品，就新建记录；如果已经有了，就把数量累加。
      const updateInventorySql = `
        INSERT INTO inv_stock (warehouse_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `;
      await connection.execute(updateInventorySql, [warehouse_id, product_id, quantity]);
    }

    // ==========================================
    // 新增：自动生成“应付账款”逻辑
    // ==========================================
    if (supplier_id && totalAmount > 0) {
      // 自动生成一个带有 PAY 标识和时间戳的财务单号
      const transactionNo = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const insertFinanceSql = `
        INSERT INTO fin_transactions (transaction_no, trans_type, partner_id, amount, related_order_no, status)
        VALUES (?, 'PAYABLE', ?, ?, ?, 'UNPAID')
      `;
      await connection.execute(insertFinanceSql, [
        transactionNo, supplier_id, totalAmount, stock_in_no
      ]);
    }

    // 6. 提交事务 🎉 (所有操作成功，永久保存)
    await connection.commit();

    res.status(201).json({
      success: true,
      message: '入库单创建成功，库存已更新，财务应付已记录(如适用)',
      data: { orderId, totalAmount }
    });

  } catch (error) {
    await connection.rollback();
    console.error('入库事务执行失败:', error);
    res.status(500).json({ success: false, message: '入库失败，事务已回滚', error: error.message });
  } finally {
    connection.release();
  }
};
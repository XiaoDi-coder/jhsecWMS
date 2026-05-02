// controllers/stockOutController.js
const db = require('../config/db');

/**
 * 获取出库单详情
 */
exports.getStockOutDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取主表信息
    const [mainResult] = await db.execute(`
      SELECT s.*, w.warehouse_name, p.partner_name as customer_name
      FROM biz_stock_out s
      LEFT JOIN base_warehouses w ON s.warehouse_id = w.id
      LEFT JOIN base_partners p ON s.customer_id = p.id
      WHERE s.id = ?
    `, [id]);

    if (mainResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该出库单',
      });
    }

    // 获取出库明细
    const [itemResult] = await db.execute(`
      SELECT
        i.id as item_id, i.product_id,
        p.product_name, p.unit,
        i.quantity, i.unit_price, i.total_price
      FROM biz_order_items i
      LEFT JOIN base_products p ON i.product_id = p.id
      WHERE i.order_type = 'STOCK_OUT' AND i.order_id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      data: {
        ...mainResult[0],
        items: itemResult,
      },
    });
  } catch (error) {
    console.error('获取出库单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取出库单详情失败',
      error: error.message,
    });
  }
};

/**
 * 更新出库单
 */
exports.updateStockOut = async (req, res) => {
  const { id } = req.params;
  const { stock_out_no, warehouse_id, target_type, customer_id, items } = req.body;

  // 基础校验
  if (!stock_out_no || !warehouse_id || !items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, message: '出库单号、仓库ID以及出库明细不可为空' });
  }

  const connection = await db.getConnection();

  try {
    // 开启事务
    await connection.beginTransaction();

    // 1. 检查出库单是否存在
    const [existingStockOut] = await connection.execute(
      'SELECT status FROM biz_stock_out WHERE id = ?',
      [id]
    );

    if (existingStockOut.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: '未找到该出库单' });
    }

    // 2. 检查是否允许修改（只允许修改草稿状态）
    if (existingStockOut[0].status !== 'DRAFT') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: '只允许修改草稿状态的出库单' });
    }

    // 3. 获取原有的明细信息，用于回滚库存
    const [oldItems] = await connection.execute(
      'SELECT product_id, quantity FROM biz_order_items WHERE order_type = "STOCK_OUT" AND order_id = ?',
      [id]
    );

    // 4. 回滚原有库存
    for (const item of oldItems) {
      await connection.execute(
        `UPDATE inv_stock
        SET quantity = quantity + ?
        WHERE warehouse_id = (SELECT warehouse_id FROM biz_stock_out WHERE id = ?)
        AND product_id = ?`,
        [item.quantity, id, item.product_id]
      );
    }

    // 5. 删除原有的明细
    await connection.execute(
      'DELETE FROM biz_order_items WHERE order_type = "STOCK_OUT" AND order_id = ?',
      [id]
    );

    // 6. 更新主表信息
    await connection.execute(
      `UPDATE biz_stock_out
      SET stock_out_no = ?, warehouse_id = ?, target_type = ?, customer_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [stock_out_no, warehouse_id, target_type || null, customer_id || null, id]
    );

    // 7. 校验新库存并插入新明细
    for (const item of items) {
      const { product_id, quantity } = item;
      const requestQty = parseFloat(quantity);

      // 查询当前库存
      const [stockResult] = await connection.execute(
        'SELECT quantity FROM inv_stock WHERE warehouse_id = ? AND product_id = ?',
        [warehouse_id, product_id]
      );

      if (stockResult.length === 0) {
        await connection.rollback();
        throw new Error(`出库失败：仓库中不存在商品 ID 为 ${product_id} 的库存记录`);
      }

      const currentStock = parseFloat(stockResult[0].quantity);
      if (currentStock < requestQty) {
        await connection.rollback();
        throw new Error(`出库失败：商品 ID ${product_id} 库存不足！当前库存：${currentStock}，申请出库：${requestQty}`);
      }
    }

    // 8. 插入新的明细并扣减库存
    let totalAmount = 0;
    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      const price = unit_price || 0;
      const totalPrice = quantity * price;

      totalAmount += totalPrice;

      await connection.execute(
        `INSERT INTO biz_order_items
        (order_type, order_id, product_id, quantity, unit_price, total_price)
        VALUES ('STOCK_OUT', ?, ?, ?, ?, ?)`,
        [id, product_id, quantity, price, totalPrice]
      );

      // 扣减库存
      await connection.execute(
        'UPDATE inv_stock SET quantity = quantity - ? WHERE warehouse_id = ? AND product_id = ?',
        [quantity, warehouse_id, product_id]
      );
    }

    // 提交事务
    await connection.commit();

    res.status(200).json({
      success: true,
      message: '出库单更新成功',
      data: { id, totalAmount },
    });

  } catch (error) {
    await connection.rollback();
    console.error('更新出库单失败:', error);
    const statusCode = error.message.includes('出库失败') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: '更新出库单失败', error: error.message });
  } finally {
    connection.release();
  }
};

/**
 * 删除出库单
 */
exports.deleteStockOut = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    // 开启事务
    await connection.beginTransaction();

    // 1. 检查出库单是否存在
    const [existingStockOut] = await connection.execute(
      'SELECT status FROM biz_stock_out WHERE id = ?',
      [id]
    );

    if (existingStockOut.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: '未找到该出库单' });
    }

    // 2. 检查是否允许删除
    if (existingStockOut[0].status !== 'DRAFT') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: '只允许删除草稿状态的出库单' });
    }

    // 3. 获取需要恢复的库存
    const [stockItems] = await connection.execute(
      'SELECT product_id, quantity FROM biz_order_items WHERE order_type = "STOCK_OUT" AND order_id = ?',
      [id]
    );

    // 4. 恢复库存
    for (const item of stockItems) {
      await connection.execute(
        `UPDATE inv_stock
        SET quantity = quantity + ?
        WHERE warehouse_id = (SELECT warehouse_id FROM biz_stock_out WHERE id = ?)
        AND product_id = ?`,
        [item.quantity, id, item.product_id]
      );
    }

    // 5. 删除明细
    await connection.execute(
      'DELETE FROM biz_order_items WHERE order_type = "STOCK_OUT" AND order_id = ?',
      [id]
    );

    // 6. 删除主表
    await connection.execute(
      'DELETE FROM biz_stock_out WHERE id = ?',
      [id]
    );

    // 提交事务
    await connection.commit();

    res.status(200).json({
      success: true,
      message: '出库单删除成功',
    });

  } catch (error) {
    await connection.rollback();
    console.error('删除出库单失败:', error);
    res.status(500).json({ success: false, message: '删除出库单失败', error: error.message });
  } finally {
    connection.release();
  }
};

exports.getStockOutList = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const offset = (page - 1) * pageSize;
    const keyword = (req.query.keyword || '').trim();

    let baseSql = `
      FROM biz_stock_out s
      LEFT JOIN base_warehouses w ON s.warehouse_id = w.id
      LEFT JOIN base_partners p ON s.customer_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      const likeKeyword = `%${keyword}%`;
      baseSql += ` AND (s.stock_out_no LIKE ? OR w.warehouse_name LIKE ? OR p.partner_name LIKE ?)`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }

    const [countRows, listRows] = await Promise.all([
      db.execute(`SELECT COUNT(*) AS total ${baseSql}`, params),
      db.execute(
        `
        SELECT
          s.id,
          s.stock_out_no,
          s.target_type,
          s.status,
          s.created_at,
          w.warehouse_name,
          p.partner_name AS customer_name
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
      WHERE i.order_type = 'STOCK_OUT' AND i.order_id IN (${placeholders})
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
      orderNo: o.stock_out_no,
      type: o.target_type || '销售出库',
      warehouse: o.warehouse_name || '-',
      customer: o.customer_name || '-',
      date: new Date(o.created_at).toISOString().slice(0, 10),
      status: o.status === 'CONFIRMED' ? '已发货' : '待发货',
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
    console.error('获取出库列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取出库列表失败',
      error: error.message,
    });
  }
};

/**
 * 创建出库单并联动扣减库存 (带并发安全锁和库存充足性校验)
 * 请求方式: POST
 * 路径: /api/stock-out
 * 请求体示例:
 * {
 *   "stock_out_no": "OUT-20231025-001",
 *   "warehouse_id": 1,
 *   "target_type": "SALES",
 *   "customer_id": 3,
 *   "items": [
 *     { "product_id": 101, "quantity": 10, "unit_price": 25.0 }
 *   ]
 * }
 */
exports.createStockOut = async (req, res) => {
  const { stock_out_no, warehouse_id, target_type, customer_id, items } = req.body;

  // 1. 基础非空校验
  if (!stock_out_no || !warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: '出库单号、仓库ID以及出库明细不可为空' });
  }

  // 获取独立连接以执行事务
  const connection = await db.getConnection();

  try {
    // 2. 开启事务 🚀
    await connection.beginTransaction();

    // 3. 【核心环节】：并发安全的库存充足性校验
    for (const item of items) {
      const { product_id, quantity } = item;
      
      // 查询当前库存，并加 FOR UPDATE 排他锁 (防止并发时的超卖现象)
      const checkStockSql = `SELECT quantity FROM inv_stock WHERE warehouse_id = ? AND product_id = ? FOR UPDATE`;
      const [stockResult] = await connection.execute(checkStockSql, [warehouse_id, product_id]);

      // 情况 A：仓库里根本没有这个商品记录
      if (stockResult.length === 0) {
        throw new Error(`出库失败：仓库中不存在商品 ID 为 ${product_id} 的库存记录`);
      }

      const currentStock = parseFloat(stockResult[0].quantity);
      const requestQty = parseFloat(quantity);

      // 情况 B：记录存在，但数量不够
      if (currentStock < requestQty) {
        throw new Error(`出库失败：商品 ID ${product_id} 库存不足！当前库存：${currentStock}，申请出库：${requestQty}`);
      }
    }

    // 4. 库存校验全部通过，开始写单据
    // 4.1 写入出库主表 (状态直接设为 CONFIRMED，假设立即出库)
    const insertMainSql = `
      INSERT INTO biz_stock_out (stock_out_no, warehouse_id, target_type, customer_id, status)
      VALUES (?, ?, ?, ?, 'CONFIRMED')
    `;
    const [mainResult] = await connection.execute(insertMainSql, [
      stock_out_no, warehouse_id, target_type || null, customer_id || null
    ]);
    const orderId = mainResult.insertId;

    let totalAmount = 0; // 累计出库总金额

    // 5. 遍历写明细并扣减真实库存
    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      const price = unit_price || 0;
      const totalPrice = quantity * price;

      totalAmount += totalPrice;

      // 5.1 写入明细表 (order_type 标记为 STOCK_OUT)
      const insertItemSql = `
        INSERT INTO biz_order_items (order_type, order_id, product_id, quantity, unit_price, total_price)
        VALUES ('STOCK_OUT', ?, ?, ?, ?, ?)
      `;
      await connection.execute(insertItemSql, [orderId, product_id, quantity, price, totalPrice]);

      // 5.2 扣减真实库存
      // 由于我们在第 3 步已经查过且锁定了该行，这里直接 update 做减法是非常安全的
      const updateInventorySql = `
        UPDATE inv_stock SET quantity = quantity - ? WHERE warehouse_id = ? AND product_id = ?
      `;
      await connection.execute(updateInventorySql, [quantity, warehouse_id, product_id]);
    }

    // ==========================================
    // 新增：自动生成“应收账款”逻辑
    // ==========================================
    if (customer_id && totalAmount > 0) {
      // 自动生成一个带有 REC 标识和时间戳的财务单号
      const transactionNo = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const insertFinanceSql = `
        INSERT INTO fin_transactions (transaction_no, trans_type, partner_id, amount, related_order_no, status)
        VALUES (?, 'RECEIVABLE', ?, ?, ?, 'UNPAID')
      `;
      await connection.execute(insertFinanceSql, [
        transactionNo, customer_id, totalAmount, stock_out_no
      ]);
    }

    // 6. 提交事务 🎉
    await connection.commit();

    res.status(201).json({
      success: true,
      message: '出库单创建成功，库存已扣减，财务应收已记录(如适用)',
      data: { orderId, totalAmount }
    });

  } catch (error) {
    // 7. 遇到任何异常 (包括库存不足手动抛出的 Error) 都回滚
    await connection.rollback();
    console.error('出库事务执行失败:', error);
    
    // 如果是我们手动抛出的业务错误，返回 400；如果是数据库异常等系统错误，返回 500
    const statusCode = error.message.includes('出库失败') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: '出库处理失败，已撤销操作', error: error.message });
  } finally {
    // 8. 释放连接
    connection.release();
  }
};
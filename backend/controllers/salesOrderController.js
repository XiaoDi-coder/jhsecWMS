// controllers/salesOrderController.js
const db = require('../config/db');

/**
 * 创建销售订单 (使用事务)
 * 请求方式: POST
 * 路径: /api/sales-orders
 */
exports.createSalesOrder = async (req, res) => {
  const { order_no, customer_id, items } = req.body;

  // 1. 基础校验
  if (!order_no || !customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: '订单号、客户ID及订单明细不能为空' });
  }

  const connection = await db.getConnection();

  try {
    // 2. 开启事务
    await connection.beginTransaction();

    // 3. 先插入主表 (此时 total_amount 暂设为 0，状态为 PENDING)
    const insertMainSql = `
      INSERT INTO biz_sales_orders (order_no, customer_id, total_amount, status)
      VALUES (?, ?, 0, 'PENDING')
    `;
    const [mainResult] = await connection.execute(insertMainSql, [order_no, customer_id]);
    const orderId = mainResult.insertId;

    let calculatedTotalAmount = 0;

    // 4. 遍历插入明细表，并由后端精确计算总金额
    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      const qty = parseFloat(quantity);
      const price = parseFloat(unit_price || 0);
      const itemTotal = qty * price;
      
      calculatedTotalAmount += itemTotal;

      const insertItemSql = `
        INSERT INTO biz_order_items (order_type, order_id, product_id, quantity, unit_price, total_price)
        VALUES ('SALES', ?, ?, ?, ?, ?)
      `;
      await connection.execute(insertItemSql, [orderId, product_id, qty, price, itemTotal]);
    }

    // 5. 更新主表的实际总金额
    await connection.execute(
      `UPDATE biz_sales_orders SET total_amount = ? WHERE id = ?`,
      [calculatedTotalAmount, orderId]
    );

    // 6. 提交事务
    await connection.commit();

    res.status(201).json({
      success: true,
      message: '销售订单创建成功',
      data: { orderId, total_amount: calculatedTotalAmount }
    });

  } catch (error) {
    await connection.rollback();
    console.error('创建销售订单失败:', error);
    // 捕获唯一键冲突 (如订单号重复)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: '订单号已存在，请更换' });
    }
    res.status(500).json({ success: false, message: '服务器内部错误，订单创建失败', error: error.message });
  } finally {
    connection.release();
  }
};

/**
 * 获取销售订单详情（包含明细）
 * 请求方式: GET
 * 路径: /api/sales-orders/:id
 */
exports.getSalesOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取主表信息
    const [mainResult] = await db.execute(`
      SELECT o.*, p.partner_name as customer_name
      FROM biz_sales_orders o
      LEFT JOIN base_partners p ON o.customer_id = p.id
      WHERE o.id = ?
    `, [id]);

    if (mainResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该销售订单',
      });
    }

    // 获取订单明细
    const [itemResult] = await db.execute(`
      SELECT
        i.id as item_id, i.product_id,
        p.product_name, p.unit,
        i.quantity, i.unit_price, i.total_price
      FROM biz_order_items i
      LEFT JOIN base_products p ON i.product_id = p.id
      WHERE i.order_type = 'SALES' AND i.order_id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      data: {
        ...mainResult[0],
        items: itemResult,
      },
    });
  } catch (error) {
    console.error('获取销售订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取销售订单详情失败',
      error: error.message,
    });
  }
};

/**
 * 更新销售订单
 * 请求方式: PUT
 * 路径: /api/sales-orders/:id
 */
exports.updateSalesOrder = async (req, res) => {
  const { id } = req.params;
  const { order_no, customer_id, items } = req.body;

  // 基础校验
  if (!order_no || !customer_id || !items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      message: '订单号、客户ID及订单明细不能为空',
    });
  }

  const connection = await db.getConnection();

  try {
    // 开启事务
    await connection.beginTransaction();

    // 1. 检查订单是否存在
    const [existingOrder] = await connection.execute(
      'SELECT status FROM biz_sales_orders WHERE id = ?',
      [id]
    );

    if (existingOrder.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '未找到该销售订单',
      });
    }

    // 2. 检查订单状态是否允许修改
    if (existingOrder[0].status !== 'PENDING') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '只有状态为 PENDING 的订单才能修改',
      });
    }

    // 3. 更新主表信息
    await connection.execute(
      `UPDATE biz_sales_orders
      SET order_no = ?, customer_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [order_no, customer_id, id]
    );

    // 4. 删除原有明细
    await connection.execute(
      'DELETE FROM biz_order_items WHERE order_type = "SALES" AND order_id = ?',
      [id]
    );

    // 5. 重新计算并插入新的明细
    let calculatedTotalAmount = 0;
    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      const qty = parseFloat(quantity);
      const price = parseFloat(unit_price || 0);
      const itemTotal = qty * price;

      calculatedTotalAmount += itemTotal;

      await connection.execute(
        `INSERT INTO biz_order_items
        (order_type, order_id, product_id, quantity, unit_price, total_price)
        VALUES ('SALES', ?, ?, ?, ?, ?)`,
        [id, product_id, qty, price, itemTotal]
      );
    }

    // 6. 更新主表的总金额
    await connection.execute(
      `UPDATE biz_sales_orders
      SET total_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [calculatedTotalAmount, id]
    );

    // 提交事务
    await connection.commit();

    res.status(200).json({
      success: true,
      message: '销售订单更新成功',
      data: { id, total_amount: calculatedTotalAmount },
    });

  } catch (error) {
    await connection.rollback();
    console.error('更新销售订单失败:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: '订单号已存在，请更换',
      });
    }

    res.status(500).json({
      success: false,
      message: '更新销售订单失败',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * 删除销售订单
 * 请求方式: DELETE
 * 路径: /api/sales-orders/:id
 */
exports.deleteSalesOrder = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    // 开启事务
    await connection.beginTransaction();

    // 1. 检查订单是否存在
    const [existingOrder] = await connection.execute(
      'SELECT status FROM biz_sales_orders WHERE id = ?',
      [id]
    );

    if (existingOrder.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '未找到该销售订单',
      });
    }

    // 2. 检查订单状态是否允许删除
    if (existingOrder[0].status !== 'PENDING') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '只有状态为 PENDING 的订单才能删除',
      });
    }

    // 3. 删除订单明细
    await connection.execute(
      'DELETE FROM biz_order_items WHERE order_type = "SALES" AND order_id = ?',
      [id]
    );

    // 4. 删除销售订单主表
    await connection.execute(
      'DELETE FROM biz_sales_orders WHERE id = ?',
      [id]
    );

    // 提交事务
    await connection.commit();

    res.status(200).json({
      success: true,
      message: '销售订单删除成功',
    });

  } catch (error) {
    await connection.rollback();
    console.error('删除销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '删除销售订单失败',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * 获取销售订单列表 (支持联表查客户名、分页、搜索)
 * 请求方式: GET
 * 路径: /api/sales-orders
 */
exports.getSalesOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const keyword = req.query.keyword || '';

    // 联接 base_partners 表获取客户名称
    let baseSql = `
      FROM biz_sales_orders o
      LEFT JOIN base_partners c ON o.customer_id = c.id
      WHERE 1=1
    `;
    const queryParams = [];

    // 根据订单号或客户名称搜索
    if (keyword) {
      baseSql += ` AND (o.order_no LIKE ? OR c.partner_name LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      queryParams.push(likeKeyword, likeKeyword);
    }

    const selectFields = `
      o.id, o.order_no, o.total_amount, o.status, o.created_at,
      c.id as customer_id, c.partner_name as customer_name
    `;

    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const dataSql = `SELECT ${selectFields} ${baseSql} ORDER BY o.created_at DESC LIMIT ${db.escape(pageSize)} OFFSET ${db.escape(offset)}`;

    const [countResult, dataResult] = await Promise.all([
      db.execute(countSql, queryParams),
      db.execute(dataSql, queryParams)
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: countResult[0][0].total,
        page,
        pageSize,
        list: dataResult[0]
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: '获取订单列表失败', error: error.message });
  }
};
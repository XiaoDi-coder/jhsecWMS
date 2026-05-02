const db = require('../config/db');

const ALLOWED_TRANS_TYPES = new Set(['RECEIVABLE', 'PAYABLE']);
const ALLOWED_STATUS = new Set(['UNPAID', 'PARTIAL', 'PAID']);
const ALLOWED_PAYMENT_METHODS = new Set(['CASH', 'BANK_TRANSFER', 'ALIPAY', 'WECHAT', 'OTHER']);

/**
 * 查询财务流水列表
 * GET /api/finance
 */
exports.getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const offset = (page - 1) * pageSize;
    const keyword = (req.query.keyword || '').trim();
    const transType = (req.query.trans_type || '').trim();
    const status = (req.query.status || '').trim();

    let baseSql = `
      FROM fin_transactions t
      LEFT JOIN base_partners p ON t.partner_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (transType) {
      baseSql += ' AND t.trans_type = ?';
      params.push(transType);
    }

    if (status) {
      baseSql += ' AND t.status = ?';
      params.push(status);
    }

    if (keyword) {
      const likeKeyword = `%${keyword}%`;
      baseSql += `
        AND (
          t.transaction_no LIKE ?
          OR t.related_order_no LIKE ?
          OR p.partner_name LIKE ?
        )
      `;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }

    const fields = `
      t.id,
      t.transaction_no,
      t.trans_type,
      t.partner_id,
      t.amount,
      t.status,
      t.related_order_no,
      t.created_at,
      t.updated_at,
      p.partner_name
    `;

    const [countRows, dataRows] = await Promise.all([
      db.execute(`SELECT COUNT(*) AS total ${baseSql}`, params),
      db.execute(
        `SELECT ${fields} ${baseSql} ORDER BY t.created_at DESC LIMIT ${db.escape(pageSize)} OFFSET ${db.escape(offset)}`,
        params
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: '获取财务流水成功',
      data: {
        total: countRows[0][0].total,
        page,
        pageSize,
        list: dataRows[0],
      },
    });
  } catch (error) {
    console.error('获取财务流水失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取财务流水失败',
      error: error.message,
    });
  }
};

/**
 * 新增财务流水
 * POST /api/finance
 */
exports.createTransaction = async (req, res) => {
  try {
    const {
      transaction_no,
      trans_type,
      partner_id,
      amount,
      related_order_no,
      status,
    } = req.body;

    if (!transaction_no || !trans_type || !partner_id || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'transaction_no、trans_type、partner_id、amount 为必填项',
      });
    }

    if (!ALLOWED_TRANS_TYPES.has(trans_type)) {
      return res.status(400).json({
        success: false,
        message: "trans_type 仅支持 'RECEIVABLE' 或 'PAYABLE'",
      });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'amount 必须是大于 0 的数字',
      });
    }

    const normalizedStatus = status || 'UNPAID';
    if (!ALLOWED_STATUS.has(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `status 仅支持 ${Array.from(ALLOWED_STATUS).join(', ')}`,
      });
    }

    const [result] = await db.execute(
      `
      INSERT INTO fin_transactions
      (transaction_no, trans_type, partner_id, amount, status, related_order_no)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        transaction_no,
        trans_type,
        partner_id,
        numericAmount,
        normalizedStatus,
        related_order_no || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: '财务流水创建成功',
      data: { id: result.insertId },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'transaction_no 已存在，请更换',
      });
    }
    console.error('创建财务流水失败:', error);
    return res.status(500).json({
      success: false,
      message: '创建财务流水失败',
      error: error.message,
    });
  }
};

/**
 * 更新财务流水状态
 * PUT /api/finance/:id/status
 */
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !ALLOWED_STATUS.has(status)) {
      return res.status(400).json({
        success: false,
        message: `status 仅支持 ${Array.from(ALLOWED_STATUS).join(', ')}`,
      });
    }

    const [result] = await db.execute(
      'UPDATE fin_transactions SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该财务流水记录',
      });
    }

    return res.status(200).json({
      success: true,
      message: '状态更新成功',
    });
  } catch (error) {
    console.error('更新财务流水状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '更新状态失败',
      error: error.message,
    });
  }
};

/**
 * 添加分次支付记录
 * POST /api/finance/:id/payment
 */
exports.addPaymentRecord = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { payment_no, payment_amount, payment_method, payment_date, remark } = req.body;

    // 基础校验
    if (!payment_no || !payment_amount || !payment_date) {
      return res.status(400).json({
        success: false,
        message: 'payment_no, payment_amount, payment_date 为必填项',
      });
    }

    if (!Number.isFinite(Number(payment_amount)) || Number(payment_amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'payment_amount 必须是大于 0 的数字',
      });
    }

    if (payment_method && !ALLOWED_PAYMENT_METHODS.has(payment_method)) {
      return res.status(400).json({
        success: false,
        message: `payment_method 仅支持 ${Array.from(ALLOWED_PAYMENT_METHODS).join(', ')}`,
      });
    }

    // 开启事务
    await connection.beginTransaction();

    // 1. 获取当前交易信息
    const [transRows] = await connection.execute(
      'SELECT amount, paid_amount, status FROM fin_transactions WHERE id = ?',
      [id]
    );

    if (transRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '未找到该财务流水记录',
      });
    }

    const transaction = transRows[0];
    const newPaidAmount = Number(transaction.paid_amount) + Number(payment_amount);

    // 2. 验证支付金额
    if (newPaidAmount > Number(transaction.amount)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '累计支付金额不能超过总金额',
      });
    }

    // 3. 插入支付记录明细
    await connection.execute(
      `INSERT INTO fin_payment_records
      (transaction_id, payment_no, payment_amount, payment_method, payment_date, remark)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [id, payment_no, payment_amount, payment_method, payment_date, remark || null]
    );

    // 4. 更新财务流水表的已支付金额和状态
    let newStatus = 'UNPAID';
    if (newPaidAmount === Number(transaction.amount)) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIAL';
    }

    await connection.execute(
      'UPDATE fin_transactions SET paid_amount = ?, status = ? WHERE id = ?',
      [newPaidAmount, newStatus, id]
    );

    // 提交事务
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: '支付记录添加成功',
      data: {
        payment_no,
        payment_amount,
        total_paid: newPaidAmount,
        remaining_amount: Number(transaction.amount) - newPaidAmount,
        status: newStatus,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('添加支付记录失败:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: '支付单号已存在，请更换',
      });
    }

    return res.status(500).json({
      success: false,
      message: '添加支付记录失败',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * 获取财务流水的支付记录
 * GET /api/finance/:id/payments
 */
exports.getPaymentRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    // 验证交易是否存在
    const [transRows] = await db.execute(
      'SELECT transaction_no, amount, paid_amount FROM fin_transactions WHERE id = ?',
      [id]
    );

    if (transRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该财务流水记录',
      });
    }

    // 查询支付记录
    const [paymentRows] = await db.execute(
      `SELECT
        id, payment_no, payment_amount, payment_method,
        payment_date, remark, created_at
      FROM fin_payment_records
      WHERE transaction_id = ?
      ORDER BY payment_date DESC, created_at DESC
      LIMIT ? OFFSET ?`,
      [id, pageSize, offset]
    );

    // 获取总数
    const [countRows] = await db.execute(
      'SELECT COUNT(*) as total FROM fin_payment_records WHERE transaction_id = ?',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: '获取支付记录成功',
      data: {
        total: countRows[0][0].total,
        page,
        pageSize,
        payment_records: paymentRows,
        transaction_info: transRows[0],
      },
    });
  } catch (error) {
    console.error('获取支付记录失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取支付记录失败',
      error: error.message,
    });
  }
};

/**
 * 获取所有财务流水（包含分次支付信息）
 * GET /api/finance/detail
 */
exports.getTransactionsWithPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const keyword = (req.query.keyword || '').trim();
    const transType = (req.query.trans_type || '').trim();
    const status = (req.query.status || '').trim();

    let baseSql = `
      FROM fin_transactions t
      LEFT JOIN base_partners p ON t.partner_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (transType) {
      baseSql += ' AND t.trans_type = ?';
      params.push(transType);
    }

    if (status) {
      baseSql += ' AND t.status = ?';
      params.push(status);
    }

    if (keyword) {
      const likeKeyword = `%${keyword}%`;
      baseSql += `
        AND (
          t.transaction_no LIKE ?
          OR t.related_order_no LIKE ?
          OR p.partner_name LIKE ?
        )
      `;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }

    const fields = `
      t.id,
      t.transaction_no,
      t.trans_type,
      t.partner_id,
      t.amount,
      t.paid_amount,
      t.remaining_amount,
      t.status,
      t.related_order_no,
      t.created_at,
      t.updated_at,
      p.partner_name
    `;

    const [countRows, dataRows] = await Promise.all([
      db.execute(`SELECT COUNT(*) AS total ${baseSql}`, params),
      db.execute(
        `SELECT ${fields} ${baseSql} ORDER BY t.created_at DESC LIMIT ${db.escape(pageSize)} OFFSET ${db.escape(offset)}`,
        params
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: '获取财务流水成功',
      data: {
        total: countRows[0][0].total,
        page,
        pageSize,
        list: dataRows[0],
      },
    });
  } catch (error) {
    console.error('获取财务流水失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取财务流水失败',
      error: error.message,
    });
  }
};

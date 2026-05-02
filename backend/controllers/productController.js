// controllers/productController.js
const db = require('../config/db'); // 引入我们之前配置的数据库连接池

/**
 * 获取商品列表 (支持分页、模糊搜索、分类过滤)
 * 请求方式: GET
 * 路径: /api/products
 */
exports.getProducts = async (req, res) => {
  try {
    // 1. 提取并处理前端传来的查询参数
    // 提供默认值：默认第一页，每页10条
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    const keyword = req.query.keyword || ''; // 搜索关键词 (用于名称或编码)
    const category = req.query.category || ''; // 商品分类

    // 2. 初始化 SQL 语句和参数数组
    // 基础查询：只查询未被软删除的数据
    let baseSql = `FROM base_products WHERE is_deleted = 0`;
    const queryParams = [];

    // 3. 动态拼接查询条件
    if (keyword) {
      // 使用 LIKE 进行模糊搜索，? 是占位符，防止 SQL 注入
      baseSql += ` AND (product_name LIKE ? OR product_code LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      queryParams.push(likeKeyword, likeKeyword);
    }

    if (category) {
      baseSql += ` AND category = ?`;
      queryParams.push(category);
    }

    // 4. 并行执行两条 SQL：获取总数 和 获取当前页数据
    // 使用 Promise.all 提升效率
    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    // 注意：LIMIT 和 OFFSET 不能使用占位符，必须直接拼入或使用特定的配置，这里我们为了安全将其转换为数字
    const dataSql = `SELECT * ${baseSql} ORDER BY created_at DESC LIMIT ${db.escape(pageSize)} OFFSET ${db.escape(offset)}`;

    const [countResult, dataResult] = await Promise.all([
      db.execute(countSql, queryParams),
      db.execute(dataSql, queryParams)
    ]);

    // 提取总条数
    const total = countResult[0][0].total;
    // 提取数据列表
    const products = dataResult[0];

    // 5. 格式化并返回成功响应
    res.status(200).json({
      success: true,
      message: '获取商品列表成功',
      data: {
        total,
        page,
        pageSize,
        list: products
      }
    });

  } catch (error) {
    // 6. 异常处理
    console.error('获取商品列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，获取商品列表失败',
      error: error.message
    });
  }
};

/**
 * 新增商品
 * 请求方式: POST
 * 路径: /api/products
 * 请求体 (JSON):
 * {
 *   "product_code": "必填，唯一",
 *   "product_name": "必填",
 *   "category": "选填",
 *   "unit": "选填",
 *   "standard_price": 选填，数字
 * }
 */
exports.createProduct = async (req, res) => {
  try {
    // 1. 获取前端传递的数据
    const { product_code, product_name, category, unit, standard_price } = req.body;

    // 2. 基础数据非空校验
    if (!product_code || !product_name) {
      return res.status(400).json({
        success: false,
        message: '商品编码 (product_code) 和商品名称 (product_name) 不能为空'
      });
    }

    // 3. 唯一性校验：检查商品编码是否已存在
    // 这里我们查询所有记录（包括软删除的 is_deleted = 1），确保编码全局唯一
    const checkSql = `SELECT id FROM base_products WHERE product_code = ? LIMIT 1`;
    const [existingProduct] = await db.execute(checkSql, [product_code]);

    if (existingProduct.length > 0) {
      return res.status(409).json({ // 409 Conflict 状态码表示冲突
        success: false,
        message: `商品编码 '${product_code}' 已存在，请更换`
      });
    }

    // 4. 构建插入数据的 SQL 语句和参数
    // 我们只插入前端提供的字段，如果有可选字段没传，数据库会使用建表时的默认值
    const insertSql = `
      INSERT INTO base_products 
      (product_code, product_name, category, unit, standard_price) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    // 如果没有提供价格，则默认为 0.00
    const price = standard_price ? parseFloat(standard_price) : 0.00;

    const queryParams = [
      product_code, 
      product_name, 
      category || null, 
      unit || null, 
      price
    ];

    // 5. 执行插入操作
    const [result] = await db.execute(insertSql, queryParams);

    // 6. 返回成功响应
    res.status(201).json({ // 201 Created 状态码表示资源创建成功
      success: true,
      message: '商品新增成功',
      data: {
        id: result.insertId, // 返回新插入记录的 ID
        product_code,
        product_name
      }
    });

  } catch (error) {
    console.error('新增商品失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，新增商品失败',
      error: error.message
    });
  }
};

/**
 * 修改商品信息
 * 请求方式: PUT
 * 路径: /api/products/:id
 * 请求体 (JSON): 包含需要修改的字段 (product_name, category, unit, standard_price)
 */
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { product_name, category, unit, standard_price } = req.body;

    // 1. 校验商品是否存在且未被软删除
    const checkSql = `SELECT id FROM base_products WHERE id = ? AND is_deleted = 0 LIMIT 1`;
    const [existing] = await db.execute(checkSql, [productId]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该商品或已被删除'
      });
    }

    // 2. 构建更新 SQL 和参数
    // 动态拼接需要更新的字段，这里假设只允许更新这四个字段
    const updates = [];
    const queryParams = [];

    if (product_name !== undefined) {
      updates.push('product_name = ?');
      queryParams.push(product_name);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      queryParams.push(category);
    }
    if (unit !== undefined) {
      updates.push('unit = ?');
      queryParams.push(unit);
    }
    if (standard_price !== undefined) {
      updates.push('standard_price = ?');
      queryParams.push(parseFloat(standard_price));
    }

    // 如果没有任何需要更新的字段，直接返回
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供需要更新的字段'
      });
    }

    // 拼装完整的 UPDATE 语句
    const updateSql = `UPDATE base_products SET ${updates.join(', ')} WHERE id = ?`;
    queryParams.push(productId);

    // 3. 执行更新
    await db.execute(updateSql, queryParams);

    res.status(200).json({
      success: true,
      message: '商品信息更新成功'
    });

  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，更新失败',
      error: error.message
    });
  }
};

/**
 * 软删除商品
 * 请求方式: DELETE
 * 路径: /api/products/:id
 */
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. 校验商品是否存在且未被软删除
    const checkSql = `SELECT id FROM base_products WHERE id = ? AND is_deleted = 0 LIMIT 1`;
    const [existing] = await db.execute(checkSql, [productId]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该商品或已被删除'
      });
    }

    // 2. 执行软删除 (将 is_deleted 设置为 1)
    const deleteSql = `UPDATE base_products SET is_deleted = 1 WHERE id = ?`;
    await db.execute(deleteSql, [productId]);

    res.status(200).json({
      success: true,
      message: '商品已成功删除'
    });

  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，删除失败',
      error: error.message
    });
  }
};
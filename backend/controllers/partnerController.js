// controllers/partnerController.js
const db = require('../config/db');

// 1. 查询合作伙伴 (支持按类型过滤)
exports.getPartners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const { keyword, partner_type } = req.query;

    let baseSql = `FROM base_partners WHERE is_deleted = 0`;
    const queryParams = [];

    if (partner_type) { // 重要过滤：如只查 CUSTOMER
      baseSql += ` AND partner_type = ?`;
      queryParams.push(partner_type);
    }
    if (keyword) {
      baseSql += ` AND (partner_name LIKE ? OR partner_code LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      queryParams.push(likeKeyword, likeKeyword);
    }

    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const dataSql = `SELECT * ${baseSql} ORDER BY created_at DESC LIMIT ${db.escape(pageSize)} OFFSET ${db.escape(offset)}`;

    const [countResult, dataResult] = await Promise.all([
      db.execute(countSql, queryParams),
      db.execute(dataSql, queryParams)
    ]);

    res.status(200).json({ success: true, data: { total: countResult[0][0].total, list: dataResult[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取伙伴列表失败', error: error.message });
  }
};

// 2. 新增合作伙伴
exports.createPartner = async (req, res) => {
  try {
    const { partner_code, partner_name, partner_type, contact_person, contact_phone } = req.body;
    if (!partner_code || !partner_name || !partner_type) {
      return res.status(400).json({ success: false, message: '编码、名称和类型为必填项' });
    }

    const [existing] = await db.execute(`SELECT id FROM base_partners WHERE partner_code = ?`, [partner_code]);
    if (existing.length > 0) return res.status(409).json({ success: false, message: '编码已存在' });

    const [result] = await db.execute(
      `INSERT INTO base_partners (partner_code, partner_name, partner_type, contact_person, contact_phone) VALUES (?, ?, ?, ?, ?)`,
      [partner_code, partner_name, partner_type, contact_person || null, contact_phone || null]
    );

    res.status(201).json({ success: true, message: '新增成功', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: '新增失败', error: error.message });
  }
};

// 3. 软删除合作伙伴
exports.deletePartner = async (req, res) => {
  try {
    await db.execute(`UPDATE base_partners SET is_deleted = 1 WHERE id = ?`, [req.params.id]);
    res.status(200).json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除失败', error: error.message });
  }
};
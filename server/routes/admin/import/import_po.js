const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// ✅ 기본 import_po 페이지 렌더링
router.get('/', async (req, res) => {
  try {
    const [vendors] = await db.query('SELECT v_name, vd_rate AS v_rate FROM import_vendor');
    const [importPOs] = await db.query('SELECT * FROM import_po WHERE ROUND(balance, 2) != 0 ORDER BY po_date DESC');
    const today = new Date().toISOString().split('T')[0];
    res.render('admin/import/import_po', { vendors, importPOs, today });
  } catch (err) {
    console.error('💥 import_po 조회 오류:', err);
    res.status(500).send('Import PO 조회 실패: ' + err.message);
  }
});

// ✅ 첫 번째 입력 방식: PCS * COST
router.post('/add/po', async (req, res) => {
  try {
    const { po_date, v_name, style, po_no, pcs, cost } = req.body;
    const [vendor] = await db.query('SELECT vd_rate AS v_rate FROM import_vendor WHERE v_name = ?', [v_name]);
    const v_rate = parseFloat(vendor[0].v_rate);
    const n_pcs = parseInt(pcs);
    const n_cost = parseFloat(cost);
    const po_amount = n_pcs * n_cost;
    const dp_amount = po_amount * v_rate / 100;
    const balance = po_amount - dp_amount;

    await db.query(`
      INSERT INTO import_po (po_date, v_name, style, po_no, pcs, cost, po_amount, v_rate, dp_amount, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [po_date, v_name, style, po_no, n_pcs, n_cost, po_amount, v_rate, dp_amount, balance]
    );
    res.redirect('/admin/import_po');
  } catch (err) {
    console.error('💥 add/po 등록 오류:', err);
    res.status(500).send('등록 실패: ' + err.message);
  }
});

// ✅ 두 번째 입력 방식: 고정 금액 입력 (deposit 없는 경우)
router.post('/add/direct', async (req, res) => {
  try {
    const { po_date, v_name, style, cost } = req.body;
    const v_rate = null;
    const pcs = 1;
    const n_cost = parseFloat(cost);
    const po_amount = pcs * n_cost;
    const dp_amount = 0;
    const balance = po_amount;

    await db.query(`
      INSERT INTO import_po (po_date, v_name, style, pcs, cost, po_amount, v_rate, dp_amount, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [po_date, v_name, style, pcs, n_cost, po_amount, v_rate, dp_amount, balance]
    );
    res.redirect('/admin/import_po');
  } catch (err) {
    console.error('💥 add/direct 등록 오류:', err);
    res.status(500).send('등록 실패: ' + err.message);
  }
});

// ✅ 삭제
router.post('/delete/:id', async (req, res) => {
  await db.query('DELETE FROM import_po WHERE id = ?', [req.params.id]);
  res.redirect('/admin/import_po');
});

// ✅ 결과 페이지 라우터 (/result용)
router.get('/result', async (req, res) => {
  try {
    const { v_name, style, po_no, dex_date, bex_date } = req.query;
    let where = [];
    let params = [];

    if (v_name) { where.push('v_name = ?'); params.push(v_name); }
    if (style) { where.push('style = ?'); params.push(style); }
    if (po_no) { where.push('po_no = ?'); params.push(po_no); }
    if (dex_date) { where.push('dex_date = ?'); params.push(dex_date); }
    if (bex_date) { where.push('bex_date = ?'); params.push(bex_date); }

    let query = 'SELECT * FROM import_po';
    if (where.length > 0) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY po_date DESC';

    const [results] = await db.query(query, params);
    const [vendors] = await db.query('SELECT DISTINCT v_name FROM import_po');
    const [styles] = await db.query('SELECT DISTINCT style FROM import_po');
    const [po_nos] = await db.query('SELECT DISTINCT po_no FROM import_po');

    res.render('admin/import/import_po_result', {
      results,
      vendors,
      styles,
      po_nos,
      v_name,
      style,
      po_no,
      dex_date,
      bex_date
    });
  } catch (err) {
    console.error('💥 result 조회 오류:', err);
    res.status(500).send('결과 조회 실패: ' + err.message);
  }
});

module.exports = router;
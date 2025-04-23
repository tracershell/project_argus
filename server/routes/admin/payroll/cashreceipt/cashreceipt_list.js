const express = require('express');
const router = express.Router();
const db = require('../../../../db/mysql');

// 📄 목록 조회
router.get('/', async (req, res) => {
  try {
    const [receipts] = await db.query('SELECT * FROM cash_receipt ORDER BY created_at DESC');
    res.render('admin/payroll/cashreceipt/cashreceipt_list', {
      layout: 'layout',
      title: 'Cash Receipt 관리',
      isAuthenticated: true,
      name: req.session.user?.name || 'Guest',
      receipts
    });
  } catch (err) {
    console.error('조회 오류:', err);
    res.status(500).send('조회 오류');
  }
});

// ➕ 등록
router.post('/add', async (req, res) => {
  const { crname, cramount, category, comment } = req.body;
  try {
    await db.query(`
      INSERT INTO cash_receipt (crname, cramount, category, comment)
      VALUES (?, ?, ?, ?)
    `, [crname, cramount, category, comment]);
    res.redirect('/admin/payroll/cashreceipt/cashreceipt_list');
  } catch (err) {
    console.error('등록 오류:', err);
    res.status(500).send('등록 오류');
  }
});

// ✏ 수정
router.post('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { crname, cramount, category, comment } = req.body;
  try {
    await db.query(`
      UPDATE cash_receipt
      SET crname = ?, cramount = ?, category = ?, comment = ?
      WHERE id = ?
    `, [crname, cramount, category, comment, id]);
    res.redirect('/admin/payroll/cashreceipt/cashreceipt_list');
  } catch (err) {
    console.error('수정 오류:', err);
    res.status(500).send('수정 오류');
  }
});

// 🗑 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM cash_receipt WHERE id = ?', [id]);
    res.redirect('/admin/payroll/cashreceipt/cashreceipt_list');
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).send('삭제 오류');
  }
});

module.exports = router;

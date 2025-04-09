// ✅ File: /server/routes/admin/domestic/domestic_invoice.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// ✅ unpaid invoice 목록 조회
router.get('/', async (req, res) => {
  try {
    const [vendors] = await db.query('SELECT v_name FROM domestic_vendor');
    const [invoices] = await db.query(`
      SELECT * FROM domestic_invoice 
      WHERE ib_amount IS NOT NULL AND ROUND(ib_amount, 2) != 0 
      ORDER BY iv_date DESC
    `);

    const today = new Date().toISOString().split('T')[0];
    res.render('admin/domestic/domestic_invoice', { vendors, invoices, today });
  } catch (err) {
    console.error('💥 unpaid 목록 조회 오류:', err);
    res.status(500).send('Invoice 목록 조회 실패: ' + err.message);
  }
});

// ✅ 등록 처리 - balance(ib_amount) = di_amount - ip_amount
router.post('/add', async (req, res) => {
  try {
    const { iv_date, dv_name, di_no, di_amount, note } = req.body;

    const amount = parseFloat(di_amount);     // 총 청구금액
    const paid = 0.00;                         // 아직 지급 안됨
    const balance = amount - paid;             // 남은 잔액 = 총액 - 지급액

    await db.query(
      `INSERT INTO domestic_invoice 
       (iv_date, dv_name, di_no, di_amount, ip_amount, ib_amount, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [iv_date, dv_name, di_no, amount, paid, balance, note || null]
    );

    res.redirect('/admin/domestic_invoice');
  } catch (err) {
    console.error('💥 인보이스 등록 오류:', err);
    res.status(500).send('등록 실패: ' + err.message);
  }
});

// ✅ 수정 폼
router.get('/edit/:id', async (req, res) => {
  const [[invoice]] = await db.query('SELECT * FROM domestic_invoice WHERE id = ?', [req.params.id]);
  const [vendors] = await db.query('SELECT v_name FROM domestic_vendor');
  res.render('admin/domestic/domestic_invoice_edit', { invoice, vendors });
});

// ✅ 수정 처리 - di_amount 변경 시 잔액(ib_amount) 재계산
router.post('/edit/:id', async (req, res) => {
  const { iv_date, dv_name, di_no, di_amount, note } = req.body;
  const id = req.params.id;

  // 기존 지급 금액 조회
  const [[invoice]] = await db.query('SELECT ip_amount FROM domestic_invoice WHERE id = ?', [id]);
  const ip_amount = parseFloat(invoice.ip_amount);
  const new_di_amount = parseFloat(di_amount);
  const ib_amount = new_di_amount - ip_amount;

  // 업데이트 실행
  await db.query(
    `UPDATE domestic_invoice 
     SET iv_date = ?, dv_name = ?, di_no = ?, di_amount = ?, ib_amount = ?, note = ?
     WHERE id = ?`,
    [iv_date, dv_name, di_no, new_di_amount, ib_amount, note || null, id]
  );

  res.redirect('/admin/domestic_invoice');
});

// ✅ 삭제 처리
router.post('/delete/:id', async (req, res) => {
  await db.query('DELETE FROM domestic_invoice WHERE id = ?', [req.params.id]);
  res.redirect('/admin/domestic_invoice');
});

// ✅ 선택된 인보이스들을 full paid 처리
router.post('/pay', async (req, res) => {
  try {
    const { ip_date, paid_ids } = req.body;

    if (!paid_ids) return res.redirect('/admin/domestic_invoice');

    const ids = Array.isArray(paid_ids) ? paid_ids : [paid_ids];

    for (const id of ids) {
      const [[invoice]] = await db.query(
        'SELECT di_amount FROM domestic_invoice WHERE id = ?', 
        [id]
      );

      const ip_amount = parseFloat(invoice.di_amount); // 전액 지급
      const ib_amount = parseFloat(invoice.di_amount) - ip_amount; // 보통 0

      await db.query(`
        UPDATE domestic_invoice 
        SET ip_date = ?, ip_amount = ?, ib_amount = ?, note = 'full paid'
        WHERE id = ?
      `, [ip_date, ip_amount, ib_amount, id]);
    }

    res.redirect('/admin/domestic_invoice');
  } catch (err) {
    console.error('💥 Paid 처리 중 오류:', err);
    res.status(500).send('Paid 처리 실패: ' + err.message);
  }
});

module.exports = router;
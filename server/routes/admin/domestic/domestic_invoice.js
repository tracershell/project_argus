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

// ✅ HTML 보기 라우터 ==> /views/admin/domestic/domestic_invoice_pdfview.ejs
router.get('/pdfview', async (req, res) => {
  try {
    const { filter_name } = req.query;

    const [invoices] = await db.query(
      filter_name && filter_name !== ''
        ? 'SELECT * FROM domestic_invoice WHERE dv_name = ? ORDER BY iv_date DESC'
        : 'SELECT * FROM domestic_invoice ORDER BY iv_date DESC',
      filter_name ? [filter_name] : []
    );

    const [names] = await db.query('SELECT DISTINCT dv_name FROM domestic_invoice');

    res.render('admin/domestic/domestic_invoice_pdfview', {
      title: 'Domestic Invoice List View',
      invoices,
      names,
      filter_name
    });
  } catch (err) {
    console.error('💥 /pdfview 라우터 오류:', err);
    res.status(500).send('PDF HTML 보기 실패: ' + err.message);
  }
});

// ✅ Domestic invoice result 페이지 라우터 /views/admin/domestic/domestic_invoice_result.ejs
// ✅ Domestic invoice result 페이지 - 다중 필터 검색 라우터
router.get('/result', async (req, res) => {
  try {
    const { dv_name, ip_date, note } = req.query;

    let where = [];
    let params = [];

    if (dv_name) {
      where.push('dv_name = ?');
      params.push(dv_name);
    }

    if (ip_date) {
      where.push('DATE(ip_date) = ?');
      params.push(ip_date);
    }

    if (note) {
      where.push('note = ?');
      params.push(note);
    }

    let query = 'SELECT * FROM domestic_invoice';
    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }
    query += ' ORDER BY iv_date DESC';

    const [results] = await db.query(query, params);

    // 콤보박스용 데이터
    const [vendors] = await db.query('SELECT DISTINCT dv_name FROM domestic_invoice');
    const [dates] = await db.query('SELECT DISTINCT ip_date FROM domestic_invoice WHERE ip_date IS NOT NULL ORDER BY ip_date DESC');
    const [notes] = await db.query('SELECT DISTINCT note FROM domestic_invoice WHERE note IS NOT NULL');

    res.render('admin/domestic/domestic_invoice_result', {
      results,
      vendors,
      dates,
      notes,
      dv_name,
      ip_date,
      note
    });
  } catch (err) {
    console.error('💥 /result 라우터 오류:', err);
    res.status(500).send('Result 조회 실패: ' + err.message);
  }
});



// // ✅ HTML 화면에서 리스트 출력용 라우트 (PDFVIEW)
// router.get('/pdfview', async (req, res) => {
//   const { filter_name } = req.query;
//   const [vendors] = await db.query(
//     filter_name && filter_name !== ''
//       ? 'SELECT * FROM domestic_invoice WHERE v_name = ? ORDER BY date DESC'
//       : 'SELECT * FROM domestic_invoice ORDER BY date DESC',
//     filter_name ? [filter_name] : []
//   );
//   const [names] = await db.query('SELECT DISTINCT v_name FROM import_vendor');

//   res.render('admin/domestic/domestic_invoice_pdfview', {
//     title: 'Vendor List View',
//     vendors,
//     names,
//     filter_name
//   });
// });

// ✅ HTML 화면에서 리스트 출력용 라우트 (PDFVIEW)
router.get('/pdfview', async (req, res) => {
  try {
    const { filter_name } = req.query;

    const [invoices] = await db.query(
      filter_name && filter_name !== ''
        ? 'SELECT * FROM domestic_invoice WHERE dv_name = ? ORDER BY iv_date DESC'
        : 'SELECT * FROM domestic_invoice ORDER BY iv_date DESC',
      filter_name ? [filter_name] : []
    );

    const [names] = await db.query('SELECT DISTINCT dv_name FROM domestic_vendor');

    res.render('admin/domestic/domestic_invoice_pdfview', {
      title: 'Domestic Invoice List View',
      invoices,
      names,
      filter_name
    });
  } catch (err) {
    console.error('💥 PDF View 라우트 오류:', err);
    res.status(500).send('PDF View 출력 실패: ' + err.message);
  }
});

module.exports = router;
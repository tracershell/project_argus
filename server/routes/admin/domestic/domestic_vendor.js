// ✅ Directory: /server/routes/admin/domestic/domestic_vendor.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');

// 목록 보기 + 필터
router.get('/', async (req, res) => {
  const { filter_name } = req.query;
  const [vendors] = await db.query(
    filter_name && filter_name !== ''
      ? 'SELECT * FROM domestic_vendor WHERE v_name = ? ORDER BY date DESC'
      : 'SELECT * FROM domestic_vendor ORDER BY date DESC',
    filter_name ? [filter_name] : []
  );
  const [names] = await db.query('SELECT DISTINCT v_name FROM domestic_vendor');
  res.render('admin/domestic/domestic_vendor', {
    title: 'Domestic Vendor Management',
    vendors,
    names,
    filter_name
  });
});

// 등록
router.post('/add', async (req, res) => {
  const { date, v_name, v_address1, v_address2, v_phone, v_email, v_note } = req.body;
  await db.query(`
    INSERT INTO domestic_vendor (date, v_name, v_address1, v_address2, v_phone, v_email, v_note)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [date, v_name, v_address1, v_address2, v_phone, v_email, v_note]
  );
  res.redirect('/admin/domestic');
});

// 수정
router.get('/edit/:id', async (req, res) => {
  const [[vendor]] = await db.query('SELECT * FROM domestic_vendor WHERE id = ?', [req.params.id]);
  if (!vendor) return res.status(404).send('Vendor not found');
  res.render('admin/domestic/domestic_vendor_edit', {
    title: 'Vendor Edit',
    vendor
  });
});

// 수정 저장 처리
router.post('/edit/:id', async (req, res) => {
  const { date, v_name, v_address1, v_address2, v_phone, v_email, v_note } = req.body;
  const { id } = req.params;

  await db.query(`
    UPDATE domestic_vendor 
    SET date = ?, v_name = ?, v_address1 = ?, v_address2 = ?, v_phone = ?, v_email = ?, v_note = ?
    WHERE id = ?
  `, [date, v_name, v_address1, v_address2, v_phone, v_email, v_note, id]);

  res.redirect('/admin/domestic');
});

// 삭제
router.post('/delete/:id', async (req, res) => {
  await db.query('DELETE FROM domestic_vendor WHERE id = ?', [req.params.id]);
  res.redirect('/admin/domestic');
});

// PDF 미리보기 및 다운로드 라우터
router.get(['/pdf', '/pdfdownload'], async (req, res) => {
  const { filter_name } = req.query;
  const [vendors] = await db.query(
    filter_name && filter_name !== ''
      ? 'SELECT * FROM domestic_vendor WHERE v_name = ? ORDER BY date DESC'
      : 'SELECT * FROM domestic_vendor ORDER BY date DESC',
    filter_name ? [filter_name] : []
  );

  try {
    const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
      return res.status(500).send('폰트 파일이 존재하지 않습니다.');
    }

    const doc = new PDFDocument({ margin: 40, size: 'letter', layout: 'landscape' });
    doc.registerFont('Korean', fontPath).font('Korean');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${req.path.includes('download') ? 'attachment' : 'inline'}; filename=vendor_list.pdf`);
    doc.pipe(res);

    doc.fontSize(11).text('Domestic Vendor List', 20, 20, { align: 'center' });
    doc.fontSize(7);

    const headers = ['Date', 'Vendor Name', 'Address', 'Phone', 'Email', 'Note'];
    const colWidths = [45, 120, 270, 70, 100, 130];

    const drawRow = (rowData, y, isHeader = false) => {
      let x = 20;
      rowData.forEach((text, i) => {
        const colWidth = colWidths[i];
        doc.lineWidth(isHeader ? 1 : 0.5);
        doc.rect(x, y, colWidth, 20).stroke();
        doc.text(text, x + 4, y + 6, {
          width: colWidth - 8,
          align: isHeader ? 'center' : 'left'
        });
        x += colWidth;
      });
    };

    drawRow(headers, 40, true);

    vendors.forEach((v, i) => {
      const y = 60 + 20 * i;
      drawRow([
        v.date.toISOString().split('T')[0],
        v.v_name,
        `${v.v_address1} ${v.v_address2}`,
        v.v_phone,
        v.v_email,
        v.v_note || ''
      ], y);
    });

    doc.end();
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류: ' + err.message);
  }
});

// HTML 리스트 보기
router.get('/pdfview', async (req, res) => {
  const { filter_name } = req.query;
  const [vendors] = await db.query(
    filter_name && filter_name !== ''
      ? 'SELECT * FROM domestic_vendor WHERE v_name = ? ORDER BY date DESC'
      : 'SELECT * FROM domestic_vendor ORDER BY date DESC',
    filter_name ? [filter_name] : []
  );
  const [names] = await db.query('SELECT DISTINCT v_name FROM domestic_vendor');

  res.render('admin/domestic/domestic_vendor_pdfview', {
    title: 'Domestic Vendor List View',
    vendors,
    names,
    filter_name
  });
});

module.exports = router;

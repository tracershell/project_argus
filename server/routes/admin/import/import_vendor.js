const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Table } = require('pdfkit-table');
const ejs = require('ejs');
const fs = require('fs');


// 목록 보기 + 필터
router.get('/', async (req, res) => {
  const { filter_name } = req.query;
  const [vendors] = await db.query(
    filter_name && filter_name !== ''
      ? 'SELECT * FROM import_vendor WHERE v_name = ? ORDER BY date DESC'
      : 'SELECT * FROM import_vendor ORDER BY date DESC',
    filter_name ? [filter_name] : []
  );
  const [names] = await db.query('SELECT DISTINCT v_name FROM import_vendor');
  res.render('admin/import/import_vendor', {
    title: 'Vender Management',
    vendors,
    names,
    filter_name
  });
});

// 등록
router.post('/add', async (req, res) => {
  const { date, v_name, vd_rate, v_address1, v_address2, v_phone, v_email, v_note } = req.body;
  await db.query(`
    INSERT INTO import_vendor (date, v_name, vd_rate, v_address1, v_address2, v_phone, v_email, v_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [date, v_name, vd_rate, v_address1, v_address2, v_phone, v_email, v_note]
  );
  res.redirect('/admin/import');
});

// 수정
router.get('/edit/:id', async (req, res) => {
  const [[vendor]] = await db.query('SELECT * FROM import_vendor WHERE id = ?', [req.params.id]);
  if (!vendor) return res.status(404).send('Vendor not found');
  res.render('admin/import/import_vendor_edit', {
    title: 'Vender Edit',
    vendor });
});

// 수정 저장 처리
router.post('/edit/:id', async (req, res) => {
  const { date, v_name, vd_rate, v_address1, v_address2, v_phone, v_email, v_note } = req.body;
  const { id } = req.params;

  await db.query(`
    UPDATE import_vendor 
    SET date = ?, v_name = ?, vd_rate = ?, v_address1 = ?, v_address2 = ?, v_phone = ?, v_email = ?, v_note = ?
    WHERE id = ?
  `, [date, v_name, vd_rate, v_address1, v_address2, v_phone, v_email, v_note, id]);

  res.redirect('/admin/import');
});

// 삭제
router.post('/delete/:id', async (req, res) => {
  await db.query('DELETE FROM import_vendor WHERE id = ?', [req.params.id]);
  res.redirect('/admin/import');
});

// ✅ PDFKIT 으로 PDF 출력
router.get('/xxxxpdf', async (req, res) => {
    const { filter_name } = req.query;
    const [vendors] = await db.query(
      filter_name && filter_name !== ''
        ? 'SELECT * FROM import_vendor WHERE v_name = ? ORDER BY date DESC'
        : 'SELECT * FROM import_vendor ORDER BY date DESC',
      filter_name ? [filter_name] : []
    );
  
    try {
        const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
        console.log('📁 폰트 경로:', fontPath);
  
      // ✅ 폰트 파일 존재 여부 확인
      if (!fs.existsSync(fontPath)) {
        console.error('❌ 폰트 파일 없음:', fontPath);
        return res.status(500).send('폰트 파일이 존재하지 않습니다.');
      }
      const doc = new PDFDocument({ margin: 40, size: 'letter', layout: 'landscape' });
  
      doc.registerFont('Korean', fontPath);
      doc.font('Korean');
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=vendor_list.pdf');
      doc.pipe(res);
  
      // 제목
      doc.fontSize(16).text('Vendor List', { align: 'center' });
      doc.moveDown();
  
      // 내용
      vendors.forEach(v => {
        const line = [
          v.date.toISOString().split('T')[0],
          v.v_name,
          `${v.vd_rate}%`,
          `${v.v_address1} ${v.v_address2}`,
          v.v_phone,
          v.v_email,
          v.v_note || ''
        ].join(' | ');
        doc.fontSize(10).text(line);
      });
  
      doc.end();
    } catch (err) {
      console.error('PDF 생성 오류:', err);
      res.status(500).send('PDF 생성 오류: ' + err.message);
    }
  });

// ✅ HTML 화면에서 리스트 출력용 라우트 (PDFVIEW)
router.get('/pdfview', async (req, res) => {
  const { filter_name } = req.query;
  const [vendors] = await db.query(
    filter_name && filter_name !== ''
      ? 'SELECT * FROM import_vendor WHERE v_name = ? ORDER BY date DESC'
      : 'SELECT * FROM import_vendor ORDER BY date DESC',
    filter_name ? [filter_name] : []
  );
  const [names] = await db.query('SELECT DISTINCT v_name FROM import_vendor');

  res.render('admin/import/import_vendor_pdfview', {
    title: 'Vendor List View',
    vendors,
    names,
    filter_name
  });
});


module.exports = router;
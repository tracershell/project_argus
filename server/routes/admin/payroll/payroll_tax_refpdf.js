// ✅ File: /server/routes/admin/payroll/payroll_tax_refpdf.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ✅ 입력 필드: startCkno, endCkno → 이 범위에 있는 레코드를 2개씩 출력
router.get('/refpdf', async (req, res) => {
  const { startCkno, endCkno } = req.query;
  if (!startCkno || !endCkno) return res.status(400).send('Check No 범위를 지정하세요.');

  try {
    const [rows] = await db.query(
        'SELECT ckno, pdate, name, gross FROM payroll_tax WHERE CAST(ckno AS UNSIGNED) >= ? AND CAST(ckno AS UNSIGNED) <= ? ORDER BY CAST(ckno AS UNSIGNED) ASC',
        [startCkno, endCkno]
    );

    const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
    if (!fs.existsSync(fontPath)) return res.status(500).send('폰트 파일이 존재하지 않습니다.');

    const doc = new PDFDocument({ margin: 40, size: 'letter', layout: 'portrait' });
    doc.registerFont('Korean', fontPath).font('Korean');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=payroll_check_summary.pdf');
    doc.pipe(res);

    doc.fontSize(10);
    for (let i = 0; i < rows.length; i += 2) {
      const pair = rows.slice(i, i + 2);

      pair.forEach((item, idx) => {
        const top = 60 + idx * 250; // 상단 위치 조절

        doc.rect(40, top - 10, 520, 120).stroke(); // 박스

        doc.text(`Check No: ${item.ckno}`, 60, top);
        doc.text(`Pay Date: ${new Date(item.pdate).toLocaleDateString('en-US')}`, 60, top + 20);
        doc.text(`Name: ${item.name}`, 60, top + 40);
        doc.text(`Gross: $${parseFloat(item.gross).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 60, top + 60);
      });

      if (i + 2 < rows.length) doc.addPage();
    }

    doc.end();
  } catch (err) {
    console.error('PDF 출력 오류:', err);
    res.status(500).send('PDF 생성 실패');
  }
});

module.exports = router;

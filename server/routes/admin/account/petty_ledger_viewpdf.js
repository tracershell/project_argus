const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

router.get('/viewpdf', async (req, res) => {
  const { start, end } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT * FROM petty_ledger WHERE pldate BETWEEN ? AND ? ORDER BY pldate, id',
      [start, end]
    );

    const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
    if (!fs.existsSync(fontPath)) return res.status(500).send('폰트 파일이 없습니다.');

    const doc = new PDFDocument({ margin: 40 });
    doc.registerFont('Korean', fontPath).font('Korean');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=petty_ledger.pdf');
    doc.pipe(res);

    doc.fontSize(16).text(`Petty Ledger: ${start} ~ ${end}`, { align: 'center' });
    doc.moveDown();

    rows.forEach(row => {
      doc.fontSize(11).text(`날짜: ${row.pldate} | Credit: ${row.plcredit} | Debit: ${row.pldebit} | Balance: ${row.plbalance}`);
      doc.text(`내용: ${row.plcomment}`);
      doc.moveDown();
    });

    // ✅ 오른쪽 상단 필요 항목 입력 필드 (하드코딩 예시)
    doc.addPage();
    doc.fontSize(14).text('필요 항목 입력', { align: 'left' });
    const items = ['항목1', '항목2', '항목3', '항목4'];
    let total = 0;
    items.forEach((item, i) => {
      const amount = 0; // 추후 입력 기능 추가 시 활용
      doc.fontSize(12).text(`${item}: $${amount.toFixed(2)}`);
      total += amount;
    });
    doc.text(`총합계: $${total.toFixed(2)}`);

    doc.end();
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류');
  }
});

module.exports = router;

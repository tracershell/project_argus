const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

router.get('/formpdf', async (req, res) => {
  const { start, end, item1, item2, item3, item4, amount1 = 0, amount2 = 0, amount3 = 0, amount4 = 0 } = req.query;

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
    res.setHeader('Content-Disposition', 'inline; filename=petty_ledger_form_view.pdf');
    doc.pipe(res);

    // ✅ Title
    doc.fontSize(16).text(`Petty Ledger: ${start} ~ ${end}`, { align: 'center' });
    doc.moveDown();

    // ✅ Ledger Entries
    rows.forEach(row => {
      doc.fontSize(11).text(`날짜: ${row.pldate} | Credit: ${row.plcredit} | Debit: ${row.pldebit} | Balance: ${row.plbalance}`);
      doc.text(`내용: ${row.plcomment}`);
      doc.moveDown();
    });

    // ✅ 다음 페이지: 항목별 금액
    doc.addPage();
    doc.fontSize(14).text('필요 항목 및 금액', { align: 'left' });

    const items = [
      { name: item1, amount: parseFloat(amount1) || 0 },
      { name: item2, amount: parseFloat(amount2) || 0 },
      { name: item3, amount: parseFloat(amount3) || 0 },
      { name: item4, amount: parseFloat(amount4) || 0 }
    ];

    let total = 0;
    items.forEach(item => {
      if (item.name) {
        doc.fontSize(12).text(`${item.name}: $${item.amount.toFixed(2)}`, { align: 'right' });
        total += item.amount;
      }
    });

    doc.moveDown();
    doc.fontSize(12).text(`총합계: $${total.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류');
  }
});

module.exports = router;

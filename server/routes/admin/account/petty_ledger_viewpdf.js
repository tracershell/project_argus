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

    const doc = new PDFDocument({
      size: 'letter',
      layout: 'portrait',
      margin: 40
    });

    doc.registerFont('Korean', fontPath).font('Korean');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=petty_ledger.pdf');
    doc.pipe(res);

    // Title
    doc.fontSize(14).text(`Petty Money Ledger`, { align: 'center' });
    doc.fontSize(10).text(`( ${start} ~ ${end} )`, { align: 'center' });
    doc.moveDown(1);

    // 테이블 헤더 설정
    const tableTop = doc.y;
    const colWidths = {
      date: 70,
      credit: 70,
      debit: 70,
      balance: 70,
      comment: 200
    };
    const colX = {
      date: 40,
      credit: 120,
      debit: 200,
      balance: 280,
      comment: 360
    };

    doc.fontSize(10)        // table header font size
    .text('Date', colX.date, tableTop, { width: colWidths.date, align: 'center' })
    .text('Credit', colX.credit, tableTop, { width: colWidths.credit, align: 'center' })
    .text('Debit', colX.debit, tableTop, { width: colWidths.debit, align: 'center' })
    .text('Balance', colX.balance, tableTop, { width: colWidths.balance, align: 'center' })
    .text('Comment', colX.comment, tableTop, { width: colWidths.comment, align: 'center' });
    doc.lineWidth(0.5);  // 선의 굵기 가늘게 

    doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // 테이블 행 출력
    let y = tableTop + 20;

    rows.forEach(row => {
      if (y > 730) {
        doc.addPage();
        y = 40;
      }
    
      const credit = parseFloat(row.plcredit) || 0;
      const debit = parseFloat(row.pldebit) || 0;
      const balance = parseFloat(row.plbalance) || 0;
    
      const dateObj = new Date(row.pldate);
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const yyyy = dateObj.getFullYear();
      const formattedDate = `${mm}/${dd}/${yyyy}`;
    
      doc.text(formattedDate, colX.date, y)
        .text(credit.toFixed(2), colX.credit, y, { width: colWidths.credit, align: 'right' })
        .text(debit.toFixed(2), colX.debit, y, { width: colWidths.debit, align: 'right' })
        .text(balance.toFixed(2), colX.balance, y, { width: colWidths.balance, align: 'right' })
        .text(row.plcomment || '', colX.comment, y, { width: colWidths.comment });
    
      y += 14;  // ✅ 줄 간격 줄임
    });

    doc.end();
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류');
  }
});

module.exports = router;

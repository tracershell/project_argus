const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

router.get('/formpdf', async (req, res) => {
  const { start, end, item1, amount1, item2, amount2, item3, amount3, item4, amount4 } = req.query;

  try {
    const [rows] = await db.query(
      'SELECT * FROM petty_ledger WHERE pldate BETWEEN ? AND ? ORDER BY pldate, id',
      [start, end]
    );

    const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
    if (!fs.existsSync(fontPath)) return res.status(500).send('폰트 파일이 없습니다.');

    const doc = new PDFDocument({ size: 'letter', layout: 'portrait', margin: 40 });
    doc.registerFont('Korean', fontPath).font('Korean');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=petty_ledger_custom.pdf');
    doc.pipe(res);

    // Title
    doc.fontSize(14).text(`Petty Money Ledger`, { align: 'center' });
    doc.fontSize(10).text(`( ${start} ~ ${end} )`, { align: 'center' });
    doc.moveDown(1);

    // 필요 항목 오른쪽 상단
    const items = [
      { name: item1 || '항목1', amount: parseFloat(amount1) || 0 },
      { name: item2 || '항목2', amount: parseFloat(amount2) || 0 },
      { name: item3 || '항목3', amount: parseFloat(amount3) || 0 },
      { name: item4 || '항목4', amount: parseFloat(amount4) || 0 }
    ];

    // 오른쪽 상단 출력물 ============================================================
    doc.fontSize(9);
    let rightY = 40;
    
    // 항목 출력
    items.forEach(item => {
      doc.text(`${item.name}: $${item.amount.toFixed(2)}`, 400, rightY, { align: 'right' });
      rightY += 12;
    });
    
    // 합계 계산
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    
    // 가는 선 그리기
    doc.lineWidth(0.3).moveTo(480, rightY + 2).lineTo(580, rightY + 2).stroke();
    
    // 총합 출력
    rightY += 6;
    doc.text(`총합계: $${totalAmount.toFixed(2)}`, 400, rightY, { align: 'right' });

    // 오른쪽 상단 출력물 끝 ==============================================================

    // 테이블 헤더
    const tableTop = doc.y + 20;
    const colWidths = { date: 70, credit: 70, debit: 70, balance: 70, comment: 200 };
    const colX = { date: 40, credit: 120, debit: 200, balance: 280, comment: 360 };

    doc.fontSize(10)
      .text('Date', colX.date, tableTop, { width: colWidths.date, align: 'center' })
      .text('Credit', colX.credit, tableTop, { width: colWidths.credit, align: 'center' })
      .text('Debit', colX.debit, tableTop, { width: colWidths.debit, align: 'center' })
      .text('Balance', colX.balance, tableTop, { width: colWidths.balance, align: 'center' })
      .text('Comment', colX.comment, tableTop, { width: colWidths.comment, align: 'center' });

    doc.lineWidth(0.5).moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Ledger Rows
    let y = tableTop + 20;
    rows.forEach(row => {
      if (y > 730) {
        doc.addPage(); y = 40;
      }

      const credit = parseFloat(row.plcredit) || 0;
      const debit = parseFloat(row.pldebit) || 0;
      const balance = parseFloat(row.plbalance) || 0;
      const dateObj = new Date(row.pldate);
      const formattedDate = `${String(dateObj.getMonth()+1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`;

      doc.fontSize(10)
        .text(formattedDate, colX.date, y)
        .text(credit.toFixed(2), colX.credit, y, { width: colWidths.credit, align: 'right' })
        .text(debit.toFixed(2), colX.debit, y, { width: colWidths.debit, align: 'right' })
        .text(balance.toFixed(2), colX.balance, y, { width: colWidths.balance, align: 'right' })
        .text(row.plcomment || '', colX.comment, y, { width: colWidths.comment });

      y += 14;
    });

    doc.end();
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류');
  }
});

module.exports = router;

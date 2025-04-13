// ✅ File: /server/routes/admin/import/import_po_paylist_pdf.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const headers = [
  'Vendor', 'Style', 'PO No.', 'PCS', 'Cost', 'PO Amount',
  'P. Date', 'RMB', 'Rate', 'USD'
];

const colWidths = [
  120,   // Vendor
  40,   // Style
  40,   // PO No.
  40,   // PCS
  30,   // Cost
  60,   // PO Amount
  60,   // P. Date
  60,   // RMB (D/B 병합)
  60,   // Rate (D/B 병합)
  60    // USD (D/B 병합)
];

async function generatePaylistPDF(res, records, comment, isDownload) {
  const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
  if (!fs.existsSync(fontPath)) {
    return res.status(500).send('폰트 파일이 존재하지 않습니다.');
  }

  const doc = new PDFDocument({ margin: 30, size: 'letter', layout: 'portrait' });
  doc.registerFont('Korean', fontPath).font('Korean');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${isDownload ? 'attachment' : 'inline'}; filename=import_po_payment_list.pdf`
  );
  doc.pipe(res);

  let y = 20;  // table top margin
  const rowHeight = 30; // table row height
  const startX = 20;

  doc.fontSize(8).text('ARGUS US INC', 20, 4, { align: 'left' }); // x =0 , y=5 위로 이동
  doc.moveDown(0.2);
  doc.fontSize(10).text('PAYMENT LIST', { align: 'center' });

  y += 30;
  doc.fontSize(7);

  const drawRow = (rowData, y, isHeader = false) => {
    let x = startX;
    rowData.forEach((text, i) => {
      const colWidth = colWidths[i];
      doc.lineWidth(isHeader ? 1 : 0.5);
      doc.rect(x, y, colWidth, rowHeight).stroke();

      const centerAligned = [0, 1, 2].includes(i);
      const rightPadded = [3, 4, 5, 6, 7, 8, 9].includes(i); // 오른쪽 정렬 컬럼

      const alignment = isHeader || centerAligned ? 'center' : 'right';

      doc.text(text, x + 2, y + 4, {
        width: colWidth - 10,           // ✅ 기존 -4 → -8 로 너비 여유 확보 (오른쪽 정렬시 padding 값과 비슷)
        align: alignment
      });

      x += colWidth;
    });
  };

  drawRow(headers, y, true);
  y += rowHeight;

  let totalDexRMB = 0, totalBexRMB = 0;
  let totalDexUSD = 0, totalBexUSD = 0;



  for (const r of records) {
    // 안전한 숫자 변환
    const cost = isNaN(parseFloat(r.cost)) ? 0 : parseFloat(r.cost);
    const po_amount = isNaN(parseFloat(r.po_amount)) ? 0 : parseFloat(r.po_amount);
    const pcs = isNaN(parseInt(r.pcs)) ? 0 : parseInt(r.pcs);

    const dex_rmb = isNaN(parseFloat(r.dex_rmbamount)) ? 0 : parseFloat(r.dex_rmbamount);
    const bex_rmb = isNaN(parseFloat(r.bex_rmbamount)) ? 0 : parseFloat(r.bex_rmbamount);
    const dex_rate = isNaN(parseFloat(r.dex_rate)) ? 0 : parseFloat(r.dex_rate);
    const bex_rate = isNaN(parseFloat(r.bex_rate)) ? 0 : parseFloat(r.bex_rate);
    const dex_usd = isNaN(parseFloat(r.dex_amount)) ? 0 : parseFloat(r.dex_amount);
    const bex_usd = isNaN(parseFloat(r.bex_amount)) ? 0 : parseFloat(r.bex_amount);

    const row = [
      r.v_name || '',
      r.style || '',
      r.po_no || '',
      pcs.toLocaleString(),
      cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      po_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      `${r.dex_date || ''}${r.bex_date ? '\n' + r.bex_date : ''}`,
      `${dex_rmb > 0 ? 'D: ' + dex_rmb.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}` +
      `${bex_rmb > 0 ? '\nB: ' + bex_rmb.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}`,
      `${dex_rate > 0 ? 'D: ' + dex_rate.toFixed(3) : ''}` +
      `${bex_rate > 0 ? '\nB: ' + bex_rate.toFixed(3) : ''}`,
      `${dex_usd > 0 ? 'D: ' + dex_usd.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}` +
      `${bex_usd > 0 ? '\nB: ' + bex_usd.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}`
    ];

    totalDexRMB += dex_rmb;
    totalBexRMB += bex_rmb;
    totalDexUSD += dex_usd;
    totalBexUSD += bex_usd;

    drawRow(row, y);
    y += rowHeight;
  }

  y += 5;
  doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
  y += 60; // ✅ 기존 10 → 30 으로 변경: 하단 여백 확보 (테이블 아래 여백)
  doc.fontSize(8).text(`Total Amount(RMB)  Deposit: ${totalDexRMB.toLocaleString(undefined, { minimumFractionDigits: 2 })}   Payoff: ${totalBexRMB.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, startX);
  doc.text(`Total Amount(USD)  Deposit: ${totalDexUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}   Payoff: ${totalBexUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, startX);

  if (comment) {
    y += 20;
    doc.fontSize(8).text(`Comment: ${comment}`, startX);
  }

  doc.end();
}

router.get(['/pdf', '/pdfdownload'], async (req, res) => {
  const { v_name, po_no, style, pay_date, comment } = req.query;
  const where = [];
  const params = [];

  if (v_name) { where.push('v_name = ?'); params.push(v_name); }
  if (po_no) { where.push('po_no = ?'); params.push(po_no); }
  if (style) { where.push('style = ?'); params.push(style); }

  let query = 'SELECT * FROM import_po';
  if (where.length > 0) query += ' WHERE ' + where.join(' AND ');
  query += ' ORDER BY po_date DESC';

  try {
    const [rows] = await db.query(query, params);
    const records = rows.map(r => ({
      ...r,
      dex_date: r.dex_date ? new Date(r.dex_date).toISOString().split('T')[0] : '',
      bex_date: r.bex_date ? new Date(r.bex_date).toISOString().split('T')[0] : ''
    }));

    const isDownload = req.path.includes('download');
    await generatePaylistPDF(res, records, comment, isDownload);
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류: ' + err.message);
  }
});

module.exports = router;

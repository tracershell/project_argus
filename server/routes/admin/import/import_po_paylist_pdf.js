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

  let y = 40;
  const rowHeight = 22;
  const startX = 20;

  doc.fontSize(12).text('ARGUS US INC', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text('PAYMENT LIST', { align: 'center' });

  y += 30;
  doc.fontSize(7);

  const drawRow = (rowData, y, isHeader = false) => {
    let x = startX;
    rowData.forEach((text, i) => {
      const colWidth = colWidths[i];
      doc.lineWidth(isHeader ? 1 : 0.5);
      doc.rect(x, y, colWidth, rowHeight).stroke();
      doc.text(text, x + 2, y + 4, {
        width: colWidth - 4,
        align: isHeader ? 'center' : 'right',
      });
      x += colWidth;
    });
  };

  drawRow(headers, y, true);
  y += rowHeight;

  let totalDexRMB = 0, totalBexRMB = 0;
  let totalDexUSD = 0, totalBexUSD = 0;

  for (const r of records) {
    const cost = parseFloat(r.cost) || 0;
    const po_amount = parseFloat(r.po_amount) || 0;
    const dex_rmb = parseFloat(r.dex_rmbamount) || 0;
    const bex_rmb = parseFloat(r.bex_rmbamount) || 0;
    const dex_rate = parseFloat(r.dex_rate) || 0;
    const bex_rate = parseFloat(r.bex_rate) || 0;
    const dex_usd = parseFloat(r.dex_amount) || 0;
    const bex_usd = parseFloat(r.bex_amount) || 0;

    const row = [
      r.v_name,
      r.style,
      r.po_no,
      r.pcs,
      cost.toFixed(2),
      po_amount.toFixed(2),
      `${r.dex_date || ''}${r.bex_date ? '\n' + r.bex_date : ''}`,
      `${dex_rmb ? 'D: ' + dex_rmb.toFixed(2) : ''}${bex_rmb ? '\nB: ' + bex_rmb.toFixed(2) : ''}`,
      `${dex_rate ? 'D: ' + dex_rate.toFixed(3) : ''}${bex_rate ? '\nB: ' + bex_rate.toFixed(3) : ''}`,
      `${dex_usd ? 'D: ' + dex_usd.toFixed(2) : ''}${bex_usd ? '\nB: ' + bex_usd.toFixed(2) : ''}`
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
  y += 10;
  doc.fontSize(8).text(`Total RMB  D: ${totalDexRMB.toLocaleString(undefined, { minimumFractionDigits: 2 })}   B: ${totalBexRMB.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, startX);
  doc.text(`Total USD  D: ${totalDexUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}   B: ${totalBexUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, startX);

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

// ✅ Directory: /server/routes/admin/import/import_po_paylist_pdf.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// 📌 컬럼 제목 및 너비 설정
const headers = [
  'Vendor', 'Style', 'PO No.', 'PCS', 'Cost', 'PO Amount',
  'P. Date', 'RMB D', 'RMB B', 'Rate D', 'Rate B', 'USD D', 'USD B'
];

const colWidths = [
  80, 70, 70, 40, 50, 70, 80, 60, 60, 50, 50, 60, 60
];

// 📄 PDF 생성 함수
async function generatePaylistPDF(res, records, comment, isDownload) {
  const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
  if (!fs.existsSync(fontPath)) {
    return res.status(500).send('폰트 파일이 존재하지 않습니다.');
  }

  const doc = new PDFDocument({ margin: 40, size: 'letter', layout: 'landscape' });
  doc.registerFont('Korean', fontPath).font('Korean');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${isDownload ? 'attachment' : 'inline'}; filename=import_po_payment_list.pdf`
  );
  doc.pipe(res);

  let y = 40;
  const rowHeight = 20;
  const startX = 20;

  // 헤더
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
      doc.text(text, x + 2, y + 6, {
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
    const row = [
      r.v_name,
      r.style,
      r.po_no,
      r.pcs ? r.pcs.toLocaleString() : '',
      r.cost ? parseFloat(r.cost).toFixed(2) : '',
      r.po_amount ? parseFloat(r.po_amount).toFixed(2) : '',
      `${r.dex_date || ''}${r.bex_date ? '\n' + r.bex_date : ''}`,
      r.dex_rmbamount ? parseFloat(r.dex_rmbamount).toFixed(2) : '',
      r.bex_rmbamount ? parseFloat(r.bex_rmbamount).toFixed(2) : '',
      r.dex_rate ? parseFloat(r.dex_rate).toFixed(3) : '',
      r.bex_rate ? parseFloat(r.bex_rate).toFixed(3) : '',
      r.dex_amount ? parseFloat(r.dex_amount).toFixed(2) : '',
      r.bex_amount ? parseFloat(r.bex_amount).toFixed(2) : '',
    ];

    totalDexRMB += parseFloat(r.dex_rmbamount) || 0;
    totalBexRMB += parseFloat(r.bex_rmbamount) || 0;
    totalDexUSD += parseFloat(r.dex_amount) || 0;
    totalBexUSD += parseFloat(r.bex_amount) || 0;

    drawRow(row, y);
    y += rowHeight;
  }

  // 합계 라인
  y += 5;
  doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
  y += 10;
  doc.fontSize(8).text(`Total RMB D: ${totalDexRMB.toFixed(2)}   B: ${totalBexRMB.toFixed(2)}`, startX);
  doc.text(`Total USD D: ${totalDexUSD.toFixed(2)}   B: ${totalBexUSD.toFixed(2)}`, startX);

  if (comment) {
    y += 20;
    doc.fontSize(8).text(`Comment: ${comment}`, startX);
  }

  doc.end();
}

// 📌 라우터: /admin/import_po_result_pdf/pdf
router.get(['/pdf', '/pdfdownload'], async (req, res) => {
  const { v_name, po_no, style, pay_date, comment } = req.query;
  const where = [];
  const params = [];

  if (v_name) { where.push('v_name = ?'); params.push(v_name); }
  if (po_no) { where.push('po_no = ?'); params.push(po_no); }
  if (style) { where.push('style = ?'); params.push(style); }

  let query = `SELECT * FROM import_po`;
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

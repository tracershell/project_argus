// ✅ File: /server/routes/admin/payroll/payroll_tax_result_viewpdf.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const headers = [
  'Name', 'P.Date', 'CK.No', 'R', 'O', 'D', 'FW', 'SSE', 'ME', 'CAW', 'CADE', 'ADV', 'CSP', 'DD', 'GROSS', 'TAX', 'NET'
];

const colWidths = [
  90,   // Name
  50,   // P.Date
  45,   // CK.No
  40, 40, 40, 40, 40, 40, // R, O, D, FW, SSE, ME
  40, 40, 40, 40, 40,      // CAW, CADE, ADV, CSP, DD
  50, 40, 50              // GROSS, TAX, NET
];

async function generatePayrollPDF(res, records, comment, isDownload) {
  const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
  if (!fs.existsSync(fontPath)) return res.status(500).send('폰트 파일이 없습니다.');

  const doc = new PDFDocument({ margin: 30, size: 'letter', layout: 'landscape' });
  doc.registerFont('Korean', fontPath).font('Korean');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename=payroll_tax_summary.pdf`);
  doc.pipe(res);

  doc.fontSize(9).text('ARGUS US INC.', { align: 'left' });
  doc.fontSize(12).text('Payroll Tax Summary (Personal)', { align: 'center' });
  doc.moveDown();

  let y = doc.y + 10;
  const startX = 20;
  const rowHeight = 24;

  const drawRow = (rowData, y, isHeader = false) => {
    let x = startX;
    rowData.forEach((text, i) => {
      const width = colWidths[i];
      doc.lineWidth(isHeader ? 1 : 0.5);
      doc.rect(x, y, width, rowHeight).stroke();
      doc.fontSize(isHeader ? 8 : 7);
      doc.text(text, x + 2, y + 6, {
        width: width - 4,
        align: isHeader ? 'center' : i <= 2 ? 'left' : 'right'
      });
      x += width;
    });
  };

  drawRow(headers, y, true);
  y += rowHeight;

  const total = {};
  headers.forEach((h, i) => { if (i >= 3) total[h] = 0; });

  for (const row of records) {
    const vals = [
      row.name,
      row.pdate.toISOString().split('T')[0],
      row.ckno,
      row.rtime, row.otime, row.dtime,
      row.fw, row.sse, row.me,
      row.caw, row.cade, row.adv, row.csp, row.dd,
      row.gross, row.tax, row.net
    ];

    vals.forEach((v, i) => {
      if (i >= 3) total[headers[i]] += parseFloat(v || 0);
    });

    drawRow(vals.map((v, i) => (i >= 3 ? Number(v).toFixed(2) : v)), y);
    y += rowHeight;
  }

  drawRow(['합계', '', ''].concat(headers.slice(3).map(h => total[h].toFixed(2))), y);

  if (comment) {
    y += rowHeight + 10;
    doc.fontSize(8).text(`Comment: ${comment}`, startX);
  }

  doc.end();
}

router.get(['/pdf', '/pdfdownload'], async (req, res) => {
  const { start, end, comment } = req.query;
  if (!start || !end) return res.status(400).send('기간 정보가 누락되었습니다.');

  try {
    const [rows] = await db.query(
      'SELECT * FROM payroll_tax WHERE pdate BETWEEN ? AND ? ORDER BY name ASC, pdate ASC',
      [start, end]
    );

    const isDownload = req.path.includes('download');
    await generatePayrollPDF(res, rows, comment, isDownload);
  } catch (err) {
    console.error('Payroll PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 중 오류 발생');
  }
});

module.exports = router;
// ✅ File: /server/routes/admin/payroll/payroll_tax_result_viewpdf.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { FONT_SANS_14_BLACK } = require('jimp');

async function generatePersonalGroupedPDF(res, records, comment, isDownload) {
  const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
  if (!fs.existsSync(fontPath)) {
    return res.status(500).send('폰트 파일이 존재하지 않습니다.');
  }

  const doc = new PDFDocument({ margin: 30, size: 'letter', layout: 'landscape' });
  doc.registerFont('Korean', fontPath).font('Korean');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${isDownload ? 'attachment' : 'inline'}; filename=payroll_tax_personal.pdf`
  );
  doc.pipe(res);

  const grouped = {};
  for (const row of records) {
    if (!grouped[row.name]) grouped[row.name] = [];
    grouped[row.name].push(row);
  }

  const headers = ['P.Date', 'CK.No', 'R.Time', 'O.Time', 'D.Time', 'FW', 'SSE', 'ME', 'CAW', 'CADE', 'ADV', 'CSP', 'DD', 'GROSS', 'TAX', 'NET'];
  const colWidths = [55, 45, 55, 55, 55, 45, 35, 35, 35, 35, 35, 35, 45, 55, 55, 55];

  const drawRow = (data, y, isHeader = false) => {
    let x = doc.page.margins.left;
    const height = 16;  // 줄간격 줄이기

    data.forEach((text, i) => {
      doc.lineWidth(0.3); // ✅ 여기서 선 굵기 설정
      doc.rect(x, y, colWidths[i], height).stroke();   // << 위의 const height 를 사용 

      doc.fontSize(6.5).text(text, x + 2, y + 3 , {    //table cell 에서의 text 의 vertical 위치 조절
        width: colWidths[i] - 4,
        align: 'center'                             // isHeader ? 'center' : 'right'
      });
      x += colWidths[i];
    });
  };

  let y = 30;
  doc.fontSize(12).text('ARGUS US INC.', { align: 'left' });
  doc.moveDown();
  doc.fontSize(10).text('Payroll Tax Summary (Personal)', { align: 'center' });
  y += 40;

  const overallTotals = {};
  for (const name in grouped) {
    doc.addPage();
    doc.fontSize(10).text(`\u{1F464} ${name}`, { align: 'left' });
    y = 60;
    drawRow(headers, y, true);
    y += 16;  // table header 와 table data 간의 높이 간격 조정

    const totals = {};
    grouped[name].forEach(row => {
      const rowData = [
        row.pdate.toISOString().slice(0, 10),
        row.ckno,
        row.rtime, row.otime, row.dtime,
        row.fw, row.sse, row.me, row.caw, row.cade,
        row.adv, row.csp, row.dd,
        row.gross, row.tax, row.net
      ];

      drawRow(rowData.map(v => typeof v === 'number' ? v.toFixed(2) : v), y);
      y += 16; // table data 와 table data 간의 높이 간격 조정


      // accumulate per-person and overall totals
      ['rtime','otime','dtime','fw','sse','me','caw','cade','adv','csp','dd','gross','tax','net'].forEach(key => {
        totals[key] = (totals[key] || 0) + parseFloat(row[key]);
        overallTotals[key] = (overallTotals[key] || 0) + parseFloat(row[key]);
      });
    });

    drawRow(['합계', '',
      totals.rtime.toFixed(2), totals.otime.toFixed(2), totals.dtime.toFixed(2),
      totals.fw.toFixed(2), totals.sse.toFixed(2), totals.me.toFixed(2),
      totals.caw.toFixed(2), totals.cade.toFixed(2), totals.adv.toFixed(2),
      totals.csp.toFixed(2), totals.dd.toFixed(2), totals.gross.toFixed(2),
      totals.tax.toFixed(2), totals.net.toFixed(2)
    ], y);

    y += 30;
  }

  // 전체 합계 마지막 페이지
  doc.addPage();
  doc.fontSize(10).text('전체 합계', { align: 'left' });
  y = 60;
  drawRow(headers, y, true);
  y += 20;
  drawRow([
    '합계', '',
    overallTotals.rtime.toFixed(2), overallTotals.otime.toFixed(2), overallTotals.dtime.toFixed(2),
    overallTotals.fw.toFixed(2), overallTotals.sse.toFixed(2), overallTotals.me.toFixed(2),
    overallTotals.caw.toFixed(2), overallTotals.cade.toFixed(2), overallTotals.adv.toFixed(2),
    overallTotals.csp.toFixed(2), overallTotals.dd.toFixed(2), overallTotals.gross.toFixed(2),
    overallTotals.tax.toFixed(2), overallTotals.net.toFixed(2)
  ], y);

  if (comment) {
    doc.moveDown().fontSize(8).text(`Comment: ${comment}`);
  }

  doc.end();
}

router.get(['/pdf', '/pdfdownload'], async (req, res) => {
  const { start, end, comment } = req.query;
  const isDownload = req.path.includes('download');

  if (!start || !end) return res.status(400).send('시작일과 종료일을 넣고 선택을 하셔야합니다.');

  try {
    const [records] = await db.query(
      'SELECT * FROM payroll_tax WHERE pdate BETWEEN ? AND ? ORDER BY name, pdate',
      [start, end]
    );

    await generatePersonalGroupedPDF(res, records, comment, isDownload);
  } catch (err) {
    console.error('PDF 출력 오류:', err);
    res.status(500).send('PDF 출력 실패');
  }
});

module.exports = router;

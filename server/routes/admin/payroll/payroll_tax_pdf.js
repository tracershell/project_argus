// ✅ File: /server/routes/admin/payroll/payroll_tax_pdf.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ✅ 테이블 헤더와 열 너비 설정
const headers = [
  'EID', 'Name', 'Check No', 'R.T', 'O.T', 'D.T', 'FW', 'SSE', 'ME',
  'CA-W', 'CA-de', 'ADV.', 'C.S', 'D.D', 'Gross', 'Tax', 'Net', 'Remark'
];
const colWidths = [30,105, 47, 37, 37, 37, 35, 35, 35, 35, 35, 35, 35, 35, 37, 37, 37, 70];

// ✅ PDF 생성 함수
async function generatePayrollTaxPDF(res, records, isDownload, pdate) {
  const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
  if (!fs.existsSync(fontPath)) {
    return res.status(500).send('폰트 파일이 존재하지 않습니다.');
  }

  const doc = new PDFDocument({ margin: 30, size: 'letter', layout: 'landscape' });
  doc.registerFont('Korean', fontPath).font('Korean');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${isDownload ? 'attachment' : 'inline'}; filename=payroll_tax_result.pdf`
  );
  doc.pipe(res);

  // ✅ 상단 정보
  doc.fontSize(9).text('ARGUS US INC', 20, 10);
  const formattedDate = new Date(pdate + 'T00:00:00').toLocaleDateString('en-US', {
    year: '2-digit', month: '2-digit', day: '2-digit'
  });
  doc.fontSize(9).text(`Pay Date: ${formattedDate}`, { align: 'right' });
  doc.fontSize(11).text('PAYROLL RECORD', { align: 'center' });
  doc.moveDown(1);

  let y = 60;
  const startX = 20;
  const rowHeight = 18;

  const drawRow = (rowData, y, isHeader = false) => {
    let x = startX;
    doc.fontSize(8);

    rowData.forEach((text, i) => {
      const width = colWidths[i];
      doc.lineWidth(isHeader ? 1 : 0.5);
      doc.rect(x, y, width, rowHeight).stroke();
      doc.text(text, x + 2, y + 4, {        // y + 7 for vertical centering
        width: width - 4,
        align: 'center'
      });
      x += width;
    });
  };

  drawRow(headers, y, true);
  y += rowHeight;

  let totalGross = 0;
  let totalNet = 0;

  for (const r of records) {
    const gross = parseFloat(r.gross) || 0;
    const net = parseFloat(r.net) || 0;
    totalGross += gross;
    totalNet += net;

    const row = [
      r.eid || '',
      r.name || '',
      r.ckno || '',
      r.rtime || '',
      r.otime || '',
      r.dtime || '',
      r.fw || '',
      r.sse || '',
      r.me || '',
      r.caw || '',
      r.cade || '',
      r.adv || '',
      r.csp || '',
      r.dd || '',
      gross.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      r.tax || '',
      net.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      r.remark || ''
    ];
    drawRow(row, y);
    y += rowHeight;
  }

  // ✅ 합계 표 출력
  // y += 20;
  // doc.fontSize(8).text('TOTALS', startX, y);
  y += 2;

  drawRow([
    '','', '', '', '', '', '', '', '', '', '', '', '', '',
    totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    '',
    totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    ''
  ], y);

  doc.end();
}

// ✅ PDF 요청 처리 라우터
router.get(['/pdf', '/pdfdownload'], async (req, res) => {
  const { pdate } = req.query;

  if (!pdate) return res.status(400).send('날짜(pdate)를 지정해주세요.');

  try {
    const [records] = await db.query(
      'SELECT * FROM payroll_tax WHERE pdate = ? ORDER BY id ASC',
      [pdate]
    );

    const isDownload = req.path.includes('download');
    await generatePayrollTaxPDF(res, records, isDownload, pdate);
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 중 오류 발생: ' + err.message);
  }
});

module.exports = router;
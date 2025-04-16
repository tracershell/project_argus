const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

async function generateAuditPDF(res, grouped, start, end, isDownload) {
  const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
  if (!fs.existsSync(fontPath)) {
    return res.status(500).send('폰트 파일이 존재하지 않습니다.');
  }

  const doc = new PDFDocument({ margin: 30, size: 'letter', layout: 'landscape' });
  doc.registerFont('Korean', fontPath).font('Korean');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${isDownload ? 'attachment' : 'inline'}; filename=payroll_tax_audit.pdf`
  );
  doc.pipe(res);

  const headers = ['EID', 'Name', 'Job Title', 'Job Code', 'Wages', 'Regular Time', '1.5 Times', '2 Times'];
  const colWidths = [80, 120, 120, 80, 80, 80, 80, 80]; // ✅ eid 넓이 60 → 80 으로 수정
  const rowHeight = 16;

  const drawRow = (data, y, isHeader = false) => {
    let x = doc.page.margins.left;
    data.forEach((text, i) => {
      doc.lineWidth(0.3);
      doc.rect(x, y, colWidths[i], rowHeight).stroke();

      // ✅ 텍스트가 너무 길어도 줄이거나 축소되지 않게
      doc.fontSize(7).text(String(text), x + 2, y + 3, {
        width: colWidths[i] - 4,
        align: 'center',
        ellipsis: true // optional
      });

      x += colWidths[i];
    });
  };

  const checkPageEnd = (y) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      return doc.page.margins.top;
    }
    return y;
  };

  let y = 40;
  doc.fontSize(10).text('ARGUS US INC.', { align: 'left' });
  doc.fontSize(10).text('Payroll Tax Audit Summary', { align: 'center' });
  doc.fontSize(8).text(`기간: ${start} ~ ${end}`, doc.page.width - 200, 40, { align: 'right' });
  y += 40;

  drawRow(headers, y, true);
  y += rowHeight;

  for (const key in grouped) {
    const list = grouped[key];
    const [eid, name] = key.split('||');
    const jtitle = list[0].jtitle || '';
    const jcode = list[0].jcode || '';
    let gross = 0, rtime = 0, otime = 0, dtime = 0;

    list.forEach(row => {
      gross += parseFloat(row.gross || 0);
      rtime += parseFloat(row.rtime || 0);
      otime += parseFloat(row.otime || 0);
      dtime += parseFloat(row.dtime || 0);
    });

    y = checkPageEnd(y);
    drawRow([
      eid,
      name,
      jtitle,
      jcode,
      gross.toFixed(2),
      rtime.toFixed(2),
      otime.toFixed(2),
      dtime.toFixed(2)
    ], y);
    y += rowHeight;
  }

  doc.end();
}

router.get(['/pdf', '/pdfdownload'], async (req, res) => {
  const { start, end } = req.query;
  const isDownload = req.path.includes('download');

  if (!start || !end) return res.status(400).send('시작일과 종료일을 입력해주세요.');

  try {
    const [records] = await db.query(
      `SELECT eid, name, jtitle, jcode, gross, rtime, otime, dtime 
       FROM payroll_tax 
       WHERE pdate BETWEEN ? AND ? 
       ORDER BY name`,
      [start, end]
    );

    const grouped = {};
    for (const row of records) {
      const key = `${row.eid}||${row.name}`; // key 기준 유지
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    }

    await generateAuditPDF(res, grouped, start, end, isDownload);
  } catch (err) {
    console.error('PDF Audit 출력 오류:', err);
    res.status(500).send('PDF Audit 출력 실패');
  }
});

module.exports = router;

// ✅ File: /server/routes/admin/employees_sick_personalviewpdf.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ✅ PDF 생성 함수
async function generateSickPDF(res, employee, sickList) {
  const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
  if (!fs.existsSync(fontPath)) {
    return res.status(500).send('폰트 파일이 존재하지 않습니다.');
  }

  const doc = new PDFDocument({ margin: 40, size: 'letter', layout: 'portrait' });
  doc.registerFont('Korean', fontPath).font('Korean');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=sick_report.pdf');
  doc.pipe(res);

  doc.fontSize(14).text('ARGUS US INC.', { align: 'left' });
  doc.fontSize(12).text('Sick Day Report (Individual)', { align: 'center' });
  doc.moveDown();

  // ✅ 직원 정보 출력
  doc.fontSize(10).text(`EID: ${employee.eid}`);
  doc.text(`Name: ${employee.name}`);
  doc.text(`Given Sick Days: ${employee.sick}`);
  doc.moveDown();

  // ✅ 테이블 헤더
  const headers = ['Sick Date', 'Used Sick'];
  const colWidths = [200, 150];
  const rowHeight = 20;

  const drawRow = (data, y) => {
    let x = doc.page.margins.left;
    data.forEach((text, i) => {
      doc.lineWidth(0.3);
      doc.rect(x, y, colWidths[i], rowHeight).stroke();
      doc.fontSize(9).text(text, x + 5, y + 6, {
        width: colWidths[i] - 10,
        align: 'center'
      });
      x += colWidths[i];
    });
  };

  let y = doc.y;
  drawRow(headers, y);
  y += rowHeight;

  let totalUsed = 0;
  sickList.forEach(row => {
    const dateStr = new Date(row.sickdate).toLocaleDateString('en-US');
    totalUsed += parseFloat(row.usedsick);
    drawRow([dateStr, row.usedsick.toString()], y);
    y += rowHeight;
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = doc.y;
    }
  });

  // ✅ 합계 출력
  y += 10;
  doc.fontSize(10).text(`Total Used Sick: ${totalUsed.toFixed(1)}`);
  doc.text(`Remaining Sick: ${(employee.sick - totalUsed).toFixed(1)}`);

  doc.end();
}

// ✅ 라우터
router.get('/pdf', async (req, res) => {
  const { eid } = req.query;
  if (!eid) return res.status(400).send('eid 누락');

  try {
    const [[employee]] = await db.query('SELECT eid, name, sick FROM employees WHERE eid = ?', [eid]);
    const [sickList] = await db.query('SELECT sickdate, usedsick FROM sick_list WHERE eid = ? ORDER BY sickdate', [eid]);

    if (!employee) return res.status(404).send('직원 정보 없음');

    await generateSickPDF(res, employee, sickList);
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 실패');
  }
});

module.exports = router;

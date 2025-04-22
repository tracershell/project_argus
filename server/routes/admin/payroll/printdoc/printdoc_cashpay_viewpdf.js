// ✅ server/routes/admin/payroll/printdoc_cashpay_viewpdf.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

router.get('/', (req, res) => {
  const { paydate, name, rtime, otime, rate } = req.query;
  const [rH, rM] = rtime.split(':').map(Number);
  const [oH, oM] = otime.split(':').map(Number);
  const cashRate = parseFloat(rate);

  const regTotalHours = rH + rM / 60;
  const otTotalHours = oH + oM / 60;

  const regAmount = regTotalHours * cashRate;
  const otAmount = otTotalHours * (cashRate * 1.5);
  // ✅ 소수점 둘째 자리 반올림 처리
const totalAmount = Math.round((regAmount + otAmount) );

  // ✅ 날짜 MM/DD/YYYY 형식 변환
  const formattedDate = new Date(paydate);
  const mm = String(formattedDate.getMonth() + 1).padStart(2, '0');
  const dd = String(formattedDate.getDate()).padStart(2, '0');
  const yyyy = formattedDate.getFullYear();
  const paydateFormatted = `${mm}/${dd}/${yyyy}`;

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=cashpay.pdf');
  doc.pipe(res);

  doc.fontSize(10);
  const boxX = 15;  // box 시작 x 좌표
  const boxY = 20; // box 시작 y 좌표
  const boxWidth = 200; // box 너비
  const boxHeight = 78; // box 높이
  const boxBorderWidth = 0.3; // box 테두리 두께
  doc.rect(boxX, boxY, boxWidth, boxHeight).stroke();

  const labelX = boxX + 10;
  const amountX = boxX + boxWidth - 80;

  doc.text(`Pay Date: ${paydateFormatted}`, labelX, boxY + 10);
  doc.text(`${name}`, amountX, boxY + 10, { align: 'right', width: 70 });

  doc.text(`Regular Time: ${rtime} × $${cashRate.toFixed(2)}`, labelX, boxY + 25);
  doc.text(`$${regAmount.toFixed(2)}`, amountX, boxY + 25, { align: 'right', width: 70 });

  doc.text(`Over Time:        ${otime} × $${(cashRate * 1.5).toFixed(2)}`, labelX, boxY + 40);
  doc.text(`$${otAmount.toFixed(2)}`, amountX, boxY + 40, { align: 'right', width: 70 });

  doc.text(`[Total Amount]`, labelX, boxY + 55);
  doc.text(`$${totalAmount.toFixed(2)}`, amountX, boxY + 55, { align: 'right', width: 70 });

  doc.end();
});

module.exports = router;

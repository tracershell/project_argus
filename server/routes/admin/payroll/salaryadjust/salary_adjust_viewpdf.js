
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

router.get('/', (req, res) => {
  const {
    deduction = '0',
    fixSalary = '0.00',
    originalSalary = '0.00',
    adjustedWorkDays = '0',
    workDays = '0',
    adjSalary = '0.00'
  } = req.query;

  const doc = new PDFDocument({ margin: 40 });
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {
    const pdfData = Buffer.concat(buffers);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=salary_adjust.pdf');
    res.send(pdfData);
  });

  doc.fontSize(8).font('Helvetica');
  doc.text('Deduction Day :', 40, 40);
  doc.text(`${deduction} day(s)`, 120, 40);

  doc.text('Adjusted Salary :', 40, 55);
  doc.text(`$ ${fixSalary}`, 120, 55);

  doc.text(`$${originalSalary}`, 40, 90);
  doc.text('X', 105, 90);
  doc.text(`${adjustedWorkDays}`, 120, 85);
  doc.text('=', 150, 90);
  doc.text(`${adjSalary}`, 170, 90);

  const numeratorWidth = doc.widthOfString(adjustedWorkDays);
  doc.moveTo(120, 93).lineTo(120 + numeratorWidth, 93).stroke();
  doc.text(`${workDays}`, 120, 95);

  doc.end();
});

module.exports = router;
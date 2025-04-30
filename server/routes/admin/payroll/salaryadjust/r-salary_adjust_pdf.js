const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

router.get('/', (req, res) => {
  const doc = new PDFDocument();
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {
    const pdfData = Buffer.concat(buffers);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=salary_adjust.pdf');
    res.send(pdfData);
  });

  doc.fontSize(16).text('Salary Adjustment Formula', { align: 'center' });
  doc.moveDown().fontSize(12).text('Adjusted Salary = (Salary × Work Days) ÷ Total Work Days');
  doc.moveDown().text('Example: $3,600 × 21 ÷ 22 = $3,436.36');
  doc.end();
});

module.exports = router;

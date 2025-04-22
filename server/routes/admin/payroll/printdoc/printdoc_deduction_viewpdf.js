const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

router.get('/', async (req, res) => {
  const { paydate, name, ckno, amount, filename } = req.query;

  try {
    const filePath = path.join(__dirname, '../../../../../public/paydoc_uploads', filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('PDF 파일을 찾을 수 없습니다.');

    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { width, height } = firstPage.getSize();
    const yBase = 40;

    // ✅ 하단 선
    firstPage.drawLine({
      start: { x: 50, y: yBase + 50 },
      end: { x: width - 50, y: yBase + 50 },
      thickness: 0.5,
      color: rgb(0, 0, 0)
    });

    // ✅ 텍스트 출력
    firstPage.drawText(`Name: ${name}`, {
      x: 50,
      y: yBase + 35,
      size: 10,
      font
    });

    firstPage.drawText(`Pay Date: ${paydate}    Check No: ${ckno}    Amount: ${amount}`, {
      x: 50,
      y: yBase + 20,
      size: 10,
      font
    });

    // ✅ 하단 선2
    firstPage.drawLine({
      start: { x: 50, y: yBase + 10 },
      end: { x: width - 50, y: yBase + 10 },
      thickness: 0.5,
      color: rgb(0, 0, 0)
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=payroll_deduction_view.pdf');
    res.send(pdfBytes);
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류');
  }
});

module.exports = router;

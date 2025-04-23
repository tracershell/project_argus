const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

router.get('/', async (req, res) => {
  const { filename, startdate, enddate, crname, amount, comment, paydate } = req.query;

  try {
    const filePath = path.join(__dirname, '../../../../../public/paydoc_uploads', filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('PDF 파일을 찾을 수 없습니다.');

    const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
    if (!fs.existsSync(fontPath)) return res.status(500).send('폰트 파일을 찾을 수 없습니다.');

    const existingPdfBytes = fs.readFileSync(filePath);
    const fontBytes = fs.readFileSync(fontPath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const customFont = await pdfDoc.embedFont(fontBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const { width, height } = firstPage.getSize();
    const yTop = height - 50;
    const textSize = 10;

    // ✅ 날짜 포맷 함수
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    };

    const formattedStart = formatDate(startdate);
    const formattedEnd = formatDate(enddate);
    const formattedPayDate = formatDate(paydate);
    const formattedAmount = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); // ✅ 금액 포맷

    // ✅ 오른쪽 정렬용 X좌표 계산 함수
    // const getRightAlignX = (text, font, size, padding = 50) => {
    //   const textWidth = font.widthOfTextAtSize(text, size);
    //   return width - textWidth - padding;
    // };

    const line1 = `${crname}`;
    const line2 = `${formattedPayDate}`; // ✅ 추가
    const line3 = `${formattedStart}  ~  ${formattedEnd}`;
    const line4 = `$ ${formattedAmount}`;
    const line5 = `${comment}`;

    // ✅ 상단 선
    firstPage.drawLine({
      start: { x: 50, y: yTop - 5 },
      end: { x: width - 50, y: yTop - 5 },
      thickness: 0.5,
      color: rgb(0, 0, 0)
    });

    // ✅ 텍스트 출력 (오른쪽 상단)
    firstPage.drawText(line1, {
      x: 400,
      y: yTop - 110,
      size: textSize,
      font: customFont,
    });

    firstPage.drawText(line2, {
      x: 400,
      y: yTop - 150,
      size: textSize,
      font: customFont,
    });

    firstPage.drawText(line3, {
      x: 370,
      y: yTop - 193,
      size: textSize,
      font: customFont,
    });

    firstPage.drawText(line4, {
      x: 400,
      y: yTop - 235,
      size: textSize,
      font: customFont,
    });

    firstPage.drawText(line5, {
      x: 300,
      y: yTop - 270,
      size: textSize,
      font: customFont,
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=cash_receipt.pdf');
    res.send(pdfBytes);
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류');
  }
});

module.exports = router;

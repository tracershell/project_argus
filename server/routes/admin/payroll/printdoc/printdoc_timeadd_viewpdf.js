const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

router.get('/', (req, res) => {
  const { regular, overtime, doubletime, lunchcount, comment } = req.query;

  const [rHour, rMin] = regular.split(':').map(Number);
  const totalMin = rHour * 60 + rMin + (parseInt(lunchcount) * 10);
  const adjHour = Math.floor(totalMin / 60);
  const adjMin = totalMin % 60;
  const adjustedTime = `${String(adjHour).padStart(2, '0')}:${String(adjMin).padStart(2, '0')}`;

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=timesheet.pdf');
  doc.pipe(res);

  doc.fontSize(10);

  // ✅ 전체 정보를 하나의 큰 박스 안에 출력
  const boxX = 200;
  const boxY = 100;
  const boxWidth = 390;
  const boxHeight = 50;

  doc.rect(boxX, boxY, boxWidth, boxHeight).stroke();

  // ✅ 내용 구성 - 위치 스위치
  doc.text(`* ADD. Minutes: ${lunchcount} x 10min = ${lunchcount * 10} min     : ${comment}`, boxX + 10, boxY + 10);
  doc.text(`* Regular Time: ${adjustedTime}       * Over Time: ${overtime}       * Double Time: ${doubletime}`, boxX + 10, boxY + 30);

  doc.end();
});

module.exports = router;

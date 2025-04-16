// ✅ File: /server/routes/admin/payroll/payroll_tax_refpdf.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ✅ 입력 필드: startCkno, endCkno → 이 범위에 있는 레코드를 2개씩 출력
router.get('/refpdf', async (req, res) => {
  const { startCkno, endCkno } = req.query;
  if (!startCkno || !endCkno) return res.status(400).send('Check No 범위를 지정하세요.');

  try {
    const [rows] = await db.query(
      'SELECT ckno, pdate, name, gross FROM payroll_tax WHERE CAST(ckno AS UNSIGNED) >= ? AND CAST(ckno AS UNSIGNED) <= ? ORDER BY CAST(ckno AS UNSIGNED) ASC',
      [startCkno, endCkno]
    );

    const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
    if (!fs.existsSync(fontPath)) return res.status(500).send('폰트 파일이 존재하지 않습니다.');

    const doc = new PDFDocument({ margin: 40, size: 'letter', layout: 'portrait' });
    doc.registerFont('Korean', fontPath).font('Korean');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=payroll_check_summary.pdf');
    doc.pipe(res);

    if (rows.length === 0) {
      doc.fontSize(12).text('No records found for selected Check No range.', 100, 100);
      doc.end();
      return;
    }

    doc.fontSize(9);
    for (let i = 0; i < rows.length; i += 2) {
      const pair = rows.slice(i, i + 2);

      pair.forEach((item, idx) => {
        // ✅ 첫 번째 box는 위쪽, 두 번째 box는 용지 하단에 배치
        const top = idx === 0 ? 680 : 720; // 아래 box는 letter 용지 하단 근처로 조정 680 <== 670 

        doc.lineWidth(0.5); // ✅ 더 얇게 설정
        doc.rect(40, top - 10, 520, 30).stroke(); // 박스 크기 줄임 (한 줄로) : 30 은 박스 높이

        // const line = `Check No: ${item.ckno}         Date: ${new Date(item.pdate).toLocaleDateString('en-US')}                          ${item.name}               $${parseFloat(item.gross || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        //doc.text(line, 50, top + 1, { width: 500 });  // 박스 안에 텍스트 추가  y margin 

        const formattedDate = new Date(item.pdate).toLocaleDateString('en-US');
const gross = parseFloat(item.gross || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

doc.fontSize(9);

// 왼쪽: Check No, Date
doc.text(`Check No: ${item.ckno}`, 50, top + 1);
doc.text(`Date: ${formattedDate}`, 160, top + 1);

// 오른쪽: Name, Gross
doc.text(`${item.name}`, 330, top + 1);  // 🔹 오른쪽으로 이동
doc.text(`$${gross}`, 460, top + 1);     // 🔹 오른쪽 정렬 위치
      });

      if (i + 2 < rows.length) doc.addPage();
    }

    doc.end();
  } catch (err) {
    console.error('PDF 출력 오류:', err);
    res.status(500).send('PDF 생성 실패');
  }
});

module.exports = router;

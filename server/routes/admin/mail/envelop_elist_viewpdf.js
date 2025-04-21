const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// 📌 Envelope PDF 보기 라우터
router.get('/pdf/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // ✅ DB에서 해당 레코드 조회
    const [rows] = await db.query('SELECT * FROM envelop_each WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('해당 레코드를 찾을 수 없습니다.');

    const record = rows[0];

    const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
      return res.status(500).send('폰트 파일이 존재하지 않습니다.');
    }

    // ✅ PDF 설정
    const doc = new PDFDocument({
      size: 'letter',
      layout: 'landscape',
      margin: 40
    });

    doc.registerFont('Korean', fontPath).font('Korean');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=envelope_view.pdf');
    doc.pipe(res);

    // ✅ 페이지 가운데 계산
    const centerX = (doc.page.width / 2) - 200; // 페이지 중앙 X 좌표-50
    let y = 300;  // Y 좌표 초기값
    const lineSpacing = 14;   // 줄간격 


    // ✅ 중앙 정렬 텍스트
    doc.fontSize(13).text(record.ename || '', centerX, y, { align: 'center' });  // fontSize  조정
    y += lineSpacing;
    doc.fontSize(11).text(record.eref || '', centerX, y, { align: 'center' });
    y += lineSpacing;
    doc.fontSize(12).text(record.estreet || '', centerX, y, { align: 'center' });
    y += lineSpacing;
    doc.fontSize(12).text(record.ecity || '', centerX, y, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Envelope PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류: ' + err.message);
  }
});

module.exports = router;

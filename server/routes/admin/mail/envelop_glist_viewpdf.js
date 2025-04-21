const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ✅ 그룹 전체 PDF 보기 - 1명당 1페이지, 이름만 출력
router.get('/pdf/:gno', async (req, res) => {
  const { gno } = req.params;

  try {
    const [members] = await db.query(
      'SELECT * FROM envelop_group WHERE gno = ? ORDER BY ono',
      [gno]
    );

    if (members.length === 0) return res.status(404).send('해당 그룹이 없습니다.');

    const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
      return res.status(500).send('폰트 파일이 존재하지 않습니다.');
    }

    const doc = new PDFDocument({ size: 'letter', layout: 'landscape', margin: 40 });
    doc.registerFont('Korean', fontPath).font('Korean');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=group_envelop.pdf');
    doc.pipe(res);

    const centerX = doc.page.width / 2 + 80;    // 중앙에서 상하 위치 조정
    const centerY = doc.page.height / 2 + 90;  // 중앙에서 위아래 위치 조정

    members.forEach((member, index) => {
      if (index > 0) doc.addPage();
      doc.fontSize(13).text(member.gmname || '', centerX, centerY, { align: 'center' });
    });

    doc.end();
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 오류');
  }
});

module.exports = router;

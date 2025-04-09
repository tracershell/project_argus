// ✅ Directory: /server/routes/admin/domestic/domestic_vendor_list_pdf.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// 📌 컬럼 제목 및 너비 설정
const headers = [
  'Date', 'Vendor Name', 'Address', 'Phone', 'Email', 'Note'
];

const colWidths = [
  45,     // Date
  120,    // Vendor Name
  270,    // Address
  70,     // Phone
  100,    // Email
  130     // Note
];

// 📄 공통 PDF 생성 함수
async function generateVendorPDF(res, vendors, isDownload) {
  const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
  if (!fs.existsSync(fontPath)) {
    return res.status(500).send('폰트 파일이 존재하지 않습니다.');
  }

  const doc = new PDFDocument({
    margin: 40,
    size: 'letter',
    layout: 'landscape'
  });

  doc.registerFont('Korean', fontPath).font('Korean');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${isDownload ? 'attachment' : 'inline'}; filename=vendor_list.pdf`
  );
  doc.pipe(res);

  const startX = 20;
  const startY = 40;
  const rowHeight = 20;

  // 제목
  doc.fontSize(11).text('Domestic Vendor List', startX, 20, { align: 'center' });
  doc.fontSize(7);

  const drawRow = (rowData, y, isHeader = false, bold = false) => {
    let x = startX;
    doc.font(bold ? 'Korean-Bold' : 'Korean');
    rowData.forEach((text, i) => {
      const colWidth = colWidths[i];
      doc.lineWidth(isHeader ? 1 : 0.5);
      doc.rect(x, y, colWidth, rowHeight).stroke();
      doc.text(text, x + 4, y + 6, {
        width: colWidth - 8,
        align: isHeader ? 'center' : 'left',
      });
      x += colWidth;
    });
  };

  drawRow(headers, startY, true);

  vendors.forEach((v, i) => {
    const y = startY + rowHeight * (i + 1);
    const rowData = [
      v.date.toISOString().split('T')[0],
      v.v_name,
      `${v.v_address1} ${v.v_address2}`.trim(),
      v.v_phone,
      v.v_email,
      v.v_note || ''
    ];
    drawRow(rowData, y);
  });

  doc.end();
}

// 📌 미리보기 또는 다운로드 라우터
router.get(['/pdf', '/pdfdownload'], async (req, res) => {
  const { filter_name } = req.query;

  try {
    const [vendors] = await db.query(
      filter_name && filter_name !== ''
        ? 'SELECT * FROM domestic_vendor WHERE v_name = ? ORDER BY date DESC'
        : 'SELECT * FROM domestic_vendor ORDER BY date DESC',
      filter_name ? [filter_name] : []
    );

    const isDownload = req.path.includes('download');
    await generateVendorPDF(res, vendors, isDownload);
  } catch (err) {
    console.error('PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류: ' + err.message);
  }
});

module.exports = router;

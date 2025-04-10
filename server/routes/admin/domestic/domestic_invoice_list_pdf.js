// ✅ File: /server/routes/admin/domestic/domestic_invoice_list_pdf.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// 📌 컬럼 제목 및 너비 설정
const headers = ['Invoice Date', 'Vendor Name', 'Invoice No', 'Amount', 'Note'];
const colWidths = [70, 130, 100, 70, 250];

// 📄 공통 PDF 생성 함수
async function generateInvoicePDF(res, invoices, isDownload) {
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
    `${isDownload ? 'attachment' : 'inline'}; filename=invoice_list.pdf`
  );
  doc.pipe(res);

  const startX = 20;
  const startY = 40;
  const rowHeight = 20;

  doc.fontSize(11).text('Domestic Invoice List', startX, 20, { align: 'center' });
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

  invoices.forEach((inv, i) => {
    const y = startY + rowHeight * (i + 1);
    const rowData = [
      inv.iv_date.toISOString().split('T')[0],
      inv.dv_name,
      inv.di_no,
      Number(inv.di_amount).toFixed(2),
      inv.note || ''
    ];

    // ✅ 여기에 로그 추가!
    // console.log(`▶ ${i + 1}번 인보이스 출력:`, rowData);

    drawRow(rowData, y);
  });

  doc.end();
}

router.get(['/pdf', '/pdfdownload'], async (req, res) => {
  const { filter_name } = req.query;

  try {
    const [invoices] = await db.query(
      filter_name && filter_name !== ''
        ? 'SELECT * FROM domestic_invoice WHERE dv_name = ? ORDER BY iv_date DESC'
        : 'SELECT * FROM domestic_invoice ORDER BY iv_date DESC',
      filter_name ? [filter_name] : []
    );

    // console.log('✅ /pdf 라우트 진입');
    //console.log('✅ invoice 수:', invoices.length);

    const isDownload = req.path.includes('download');
    await generateInvoicePDF(res, invoices, isDownload); // ✅ 정상
  } catch (err) {
    console.error('💥 PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류: ' + err.message);
  }
});

// // 📌 미리보기 또는 다운로드 라우터  : 직접 테스트 : http://apple2ne2.theworkpc.com/admin/domestic_invoice_pdf/pdf
// router.get(['/pdf', '/pdfdownload'], async (req, res) => {    // 
//   const { filter_name } = req.query;
//   console.log('✅ /pdf 라우트 진입');  // 🚨 꼭 찍혀야 함!
//   console.log('filter_name:', filter_name);    // DB 쿼리 조건 확인 : 결과 확인 http://apple2ne2.theworkpc.com/admin/domestic_invoice_pdf/pdf
//   console.log('invoice 개수:', invoices.length);
//   try {
//     const [invoices] = await db.query(
//       filter_name && filter_name !== ''
//         ? 'SELECT * FROM domestic_invoice WHERE dv_name = ? ORDER BY iv_date DESC'
//         : 'SELECT * FROM domestic_invoice ORDER BY iv_date DESC',
//       filter_name ? [filter_name] : []
//     );

//     // ✅ 여기에 로그 추가!
//     console.log('✅ 쿼리된 invoice 수:', invoices.length);
//     if (invoices.length > 0) {
//       console.log('▶ 샘플 invoice:', invoices[0]);
//     }

//     const isDownload = req.path.includes('download');
//     await generateInvoicePDF(res, invoices, isDownload);
//   } catch (err) {
//     console.error('PDF 생성 오류:', err);
//     res.status(500).send('PDF 생성 오류: ' + err.message);
//   }
// });

// router.get('/test', (req, res) => {
//   console.log('✅ /test 라우트 호출됨');
//   res.send('PDF 라우터 정상 연결됨!');    // 연결 테스트 : http://apple2ne2.theworkpc.com/admin/domestic_invoice_pdf/test
// });


// router.get('/test_pdf', async (req, res) => {
//   console.log('✅ /test_pdf 라우트 진입');   // 출력 테스트트 : http://apple2ne2.theworkpc.com/admin/domestic_invoice_pdf/test_pdf

//   const invoices = [
//     {
//       iv_date: new Date(),
//       dv_name: 'HIROSE',
//       di_no: 'H1234',
//       di_amount: 123.45,
//       note: '테스트'
//     }
//   ];

//   await generateInvoicePDF(res, invoices, false);
// });


// router.get('/pdf_test', async (req, res) => {
//   console.log('✅ /pdf 라우트 진입'); // 출력 테스트트 : http://apple2ne2.theworkpc.com/admin/domestic_invoice_pdf/pdf_test

//   const invoices = [
//     {
//       iv_date: new Date(),
//       dv_name: 'HIROSE',
//       di_no: 'TEST-001',
//       di_amount: 123.45,
//       note: '자동테스트'
//     }
//   ];

//   await generateInvoicePDF(res, invoices, false);
// });

module.exports = router;
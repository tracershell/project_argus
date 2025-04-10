const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

router.get('/pdf', async (req, res) => {
  const { dv_name, ip_date, note } = req.query;

  try {
    let query = `SELECT * FROM domestic_invoice WHERE 1=1`;
    const params = [];

    if (dv_name) {
      query += ' AND dv_name = ?';
      params.push(dv_name);
    }
    if (ip_date) {
      query += ' AND ip_date = ?';
      params.push(ip_date);
    }
    if (note) {
      query += ' AND note = ?';
      params.push(note);
    }

    query += ' ORDER BY iv_date ASC';
    const [results] = await db.query(query, params);

    if (results.length === 0) {
      return res.status(404).send('검색된 데이터가 없습니다.');
    }

    const fontPath = path.resolve('public/fonts/NotoSansKR-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
      return res.status(500).send('폰트 파일이 없습니다.');
    }

    const doc = new PDFDocument({ margin: 50, size: 'letter', layout: 'portrait' });
    doc.registerFont('Korean', fontPath).font('Korean');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=payment_list.pdf');
    doc.pipe(res);

    // 상단 헤더
    doc.fontSize(12).text('ARGUS US INC.', 50, 50);
    doc.fontSize(14).text('Payment List', { align: 'center' });
    doc.moveTo(50, 90).lineTo(560, 90).stroke();

    let y = 110;

    // 벤더 이름
    doc.fontSize(11).text(results[0].dv_name, 50, y);
    y += 20;

    y += 10; // 한 줄 공백

    const amountX = 420;

    // 날짜 포맷 함수
    const formatDate = (date) => {
      const d = new Date(date);
      return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    results.forEach((row) => {
      doc.fontSize(10)
        .text(formatDate(row.iv_date), 50, y)
        .text(row.di_no, 200, y)
        .text(`$${Number(row.ip_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, amountX, y);
      y += 20;
    });

    y += 10;
    doc.moveTo(50, y).lineTo(560, y).stroke();

    const last = results[results.length - 1];
    const total = results.reduce((sum, row) => sum + Number(row.ip_amount), 0);

    y += 30;

    const paymentDateStr = `Payment Date: ${formatDate(last.ip_date)}`;
    const totalPaidStr = `Total : $${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    // 중앙에 Payment Date
    doc.fontSize(11).text(paymentDateStr, (doc.page.width - doc.widthOfString(paymentDateStr)) / 2, y);

    // 오른쪽 끝에 Total Paid
    const rightMargin = 560;
    const totalPaidX = rightMargin - doc.widthOfString(totalPaidStr);
    doc.text(totalPaidStr, totalPaidX, y);

    // 💬 comment 하단에 출력
    y += 30;
    if (req.query.comment && req.query.comment.trim() !== '') {
      const commentText = `*** ${req.query.comment.trim()} ***`;
      doc.fontSize(10).fillColor('black')   // 글씨 색상 결정
         .text(commentText, 50, y, { width: 460, align: 'left' })
         .fillColor('black'); // 다시 색상 초기화
    }
    doc.end();
  } catch (err) {
    console.error('💥 PDF 생성 오류:', err);
    res.status(500).send('PDF 생성 오류: ' + err.message);
  }
});

module.exports = router;

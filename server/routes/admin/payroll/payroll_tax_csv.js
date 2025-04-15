// ✅ File: /server/routes/admin/payroll/payroll_tax_csv.js
const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const { format } = require('@fast-csv/format');

// ✅ CSV 테이블 헤더
const headers = [
  'EID', 'Name', 'Check No', 'R.T', 'O.T', 'D.T', 'FW', 'SSE', 'ME',
  'CA-W', 'CA-de', 'ADV.', 'C.S', 'D.D', 'Gross', 'Tax', 'Net', 'Remark'
];

// ✅ CSV 다운로드 라우터
router.get('/csv-export', async (req, res) => {
  const { pdate } = req.query;
  if (!pdate) return res.status(400).send('날짜(pdate)를 지정해주세요.');

  try {
    const [records] = await db.query(
      'SELECT * FROM payroll_tax WHERE pdate = ? ORDER BY id ASC',
      [pdate]
    );

    res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
    res.setHeader('Content-Disposition', 'attachment; filename=payroll_tax_export.csv');

    const csvStream = format({ headers });
    csvStream.pipe(res);

    for (const r of records) {
      csvStream.write({
        EID: r.eid,
        Name: r.name,
        'Check No': r.ckno,
        'R.T': r.rtime,
        'O.T': r.otime,
        'D.T': r.dtime,
        FW: r.fw,
        SSE: r.sse,
        ME: r.me,
        'CA-W': r.caw,
        'CA-de': r.cade,
        ADV: r.adv,
        'C.S': r.csp,
        'D.D': r.dd,
        Gross: Number(r.gross).toFixed(2),
        Tax: Number(r.tax).toFixed(2),
        Net: Number(r.net).toFixed(2),
        Remark: r.remark
      });
    }

    csvStream.end();
  } catch (err) {
    console.error('CSV 생성 오류:', err);
    res.status(500).send('CSV 생성 중 오류 발생');
  }
});

module.exports = router;

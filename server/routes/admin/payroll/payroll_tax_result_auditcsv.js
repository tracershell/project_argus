// ✅ File: /server/routes/admin/payroll/payroll_tax_result_auditcsv.js
const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const { format } = require('@fast-csv/format'); // fast-csv 필요 (npm install fast-csv)

router.get('/downloadauditcsv', async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).send('시작일과 종료일을 입력하세요.');

  try {
    const [records] = await db.query(
      `SELECT eid, name, jtitle, jcode, gross, rtime, otime, dtime
       FROM payroll_tax 
       WHERE pdate BETWEEN ? AND ? 
       ORDER BY name`,
      [start, end]
    );

    // CSV 파일 헤더
    const csvStream = format({ headers: ['EID', 'Name', 'Job Title', 'Job Code', 'Wages', 'Regular Time', '1.5 Times', '2 Times'] });
    res.setHeader('Content-Disposition', 'attachment; filename=payroll_tax_result.csv');
    res.setHeader('Content-Type', 'text/csv');
    csvStream.pipe(res);

    for (const row of records) {
      csvStream.write({
        EID: row.eid,
        Name: row.name,
        'Job Title': row.jtitle || '',
        'Job Code': row.jcode || '',
        Wages: parseFloat(row.gross || 0).toFixed(2),
        'Regular Time': parseFloat(row.rtime || 0).toFixed(2),
        '1.5 Times': parseFloat(row.otime || 0).toFixed(2),
        '2 Times': parseFloat(row.dtime || 0).toFixed(2),
      });
    }

    csvStream.end();
  } catch (err) {
    console.error('CSV 생성 오류:', err);
    res.status(500).send('CSV 생성 실패');
  }
});

module.exports = router;

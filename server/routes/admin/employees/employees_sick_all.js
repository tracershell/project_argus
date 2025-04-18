// ✅ /server/routes/admin/employees/employees_sick_all.js
const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// ✅ 월별 Sick 사용량을 Year별로 집계 (기본: 현재 연도)
router.get('/', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    // ✅ 직원 목록
    const [employees] = await db.query(
      'SELECT DISTINCT eid, name, givensick FROM sick_list ORDER BY eid'
    );

    // ✅ 월별 Sick 사용 내역 (12개월)
    const [monthly] = await db.query(
      `SELECT eid, MONTH(sickdate) AS month, SUM(usedsick) AS total
       FROM sick_list
       WHERE YEAR(sickdate) = ?
       GROUP BY eid, MONTH(sickdate)`,
      [year]
    );

    // ✅ 최종 remainsick
    const [remainList] = await db.query(
      `SELECT eid, remainsick FROM sick_list
       WHERE updated_at = (SELECT MAX(updated_at) FROM sick_list s2 WHERE s2.eid = sick_list.eid)`
    );

    // ✅ 병합: eid 기준으로 그룹핑
    const data = employees.map(emp => {
      const row = { ...emp, months: Array(12).fill(0), remainsick: 0 };
      monthly.forEach(m => {
        if (m.eid === emp.eid) row.months[m.month - 1] = parseFloat(m.total);
      });
      const remain = remainList.find(r => r.eid === emp.eid);
      row.remainsick = remain ? parseFloat(remain.remainsick) : 0;
      return row;
    });

    res.render('admin/employees/employees_sick_all', {
      layout: 'layout',
      title: 'Sick Usage Overview',
      isAuthenticated: true,
      year,
      summary: data   // ✅ 이름 변경: summary 로 넘겨야 EJS에서 인식 가능
    });
  } catch (err) {
    console.error('Sick Overview 조회 오류:', err);
    res.status(500).send('DB 조회 오류');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// 🔍 기간별 payroll_tax 조회
router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { start, end } = req.query;
  let payrecords = [];

  try {
    if (start && end) {
      payrecords = (
        await db.query(
          `SELECT * FROM payroll_tax 
           WHERE pdate BETWEEN ? AND ? 
           ORDER BY ckno ASC`,
          [start, end]
        )
      )[0];
    }

    res.render('admin/payroll/payroll_tax_result', {
      layout: 'layout',
      title: 'Payroll Tax Result',
      isAuthenticated: true,
      name: req.session.user.name,
      start,
      end,
      payrecords
    });
  } catch (err) {
    console.error('payroll_tax_result DB 오류:', err);
    res.status(500).send('DB 오류');
  }
});


// 👤 개인별 HTML 보기 라우터
router.get('/viewPhtml', async (req, res) => {
  const { start, end } = req.query;
  if (!req.session.user) return res.redirect('/login');
  if (!start || !end) return res.status(400).send('기간을 입력하세요.');

  try {
    const [rows] = await db.query(
      `SELECT * FROM payroll_tax WHERE pdate BETWEEN ? AND ? ORDER BY name ASC, pdate ASC`,
      [start, end]
    );

    // 🔹 이름으로 그룹핑
    const grouped = {};
    const totalAll = {
      rtime: 0, otime: 0, dtime: 0,
      fw: 0, sse: 0, me: 0,
      caw: 0, cade: 0, adv: 0, csp: 0, dd: 0,
      gross: 0, tax: 0, net: 0
    };

    for (const row of rows) {
      if (!grouped[row.name]) grouped[row.name] = [];
      grouped[row.name].push(row);

      // 🔹 전체 합계 계산
      totalAll.rtime += parseFloat(row.rtime || 0);
      totalAll.otime += parseFloat(row.otime || 0);
      totalAll.dtime += parseFloat(row.dtime || 0);
      totalAll.fw += parseFloat(row.fw || 0);
      totalAll.sse += parseFloat(row.sse || 0);
      totalAll.me += parseFloat(row.me || 0);
      totalAll.caw += parseFloat(row.caw || 0);
      totalAll.cade += parseFloat(row.cade || 0);
      totalAll.adv += parseFloat(row.adv || 0);
      totalAll.csp += parseFloat(row.csp || 0);
      totalAll.dd += parseFloat(row.dd || 0);
      totalAll.gross += parseFloat(row.gross || 0);
      totalAll.tax += parseFloat(row.tax || 0);
      totalAll.net += parseFloat(row.net || 0);
    }

    res.render('admin/payroll/payroll_tax_result_viewPhtml', {
      layout: 'layout',
      title: '개인별 급여 HTML 보기',
      isAuthenticated: true,
      name: req.session.user.name,
      start,
      end,
      grouped,
      totalAll
    });

  } catch (err) {
    console.error('viewPhtml 오류:', err);
    res.status(500).send('DB 오류');
  }
});


module.exports = router;

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

module.exports = router;

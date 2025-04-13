const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

function toNumber(value) {
  return parseFloat(String(value).replace(/,/g, '')) || 0;
}

// GET: payroll form
router.get('/tax', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const [results] = await db.query('SELECT eid, name, jcode, jtitle, work1 FROM employees WHERE status = "active"');

    const selectedPdate = req.session.lastPayDate || '';
    const selectedEidName = req.session.lastEidName || '';
    delete req.session.lastPayDate;
    delete req.session.lastEidName;

    res.render('admin/payroll/payroll_tax', {
      layout: 'layout',
      title: 'Payroll Management',
      isAuthenticated: true,
      name: req.session.user.name,
      employees: results,
      selectedPdate,
      selectedEidName,
      now: new Date().toString()
    });
  } catch (err) {
    res.status(500).send('DB 오류');
  }
});

// POST: payroll 입력 저장
router.post('/paylist/add', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const {
    name, pdate, ckno_table, rtime, otime, dtime,
    fw, sse, me, caw, cade,
    adv, d1, dd, remark,
    eid, jcode, jtitle, work1
  } = req.body;

  req.session.lastPayDate = pdate;
  req.session.lastEidName = `eid: ${eid} / ${name}`;

  const rtimeNum = toNumber(rtime);
  const otimeNum = toNumber(otime);
  const dtimeNum = toNumber(dtime);
  const fwNum = toNumber(fw);
  const sseNum = toNumber(sse);
  const meNum = toNumber(me);
  const cawNum = toNumber(caw);
  const cadeNum = toNumber(cade);
  const advNum = toNumber(adv);
  const d1Num = toNumber(d1);
  const ddNum = toNumber(dd);

  const gross = rtimeNum + otimeNum + dtimeNum;
  const tax = fwNum + sseNum + meNum + cawNum + cadeNum;
  const net = gross - tax;

  const checkQuery = 'SELECT COUNT(*) AS count FROM paylist WHERE eid = ? AND pdate = ?';
  const insertQuery = `
    INSERT INTO paylist (
      eid, name, jcode, jtitle, work1,
      pdate, ckno, rtime, otime, dtime,
      fw, sse, me, caw, cade,
      adv, csp, dd,
      gross, tax, net,
      remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    eid, name, jcode, jtitle, work1,
    pdate, ckno_table, rtimeNum, otimeNum, dtimeNum,
    fwNum, sseNum, meNum, cawNum, cadeNum,
    advNum, d1Num, ddNum,
    gross.toFixed(2), tax.toFixed(2), net.toFixed(2),
    remark
  ];

  try {
    const [[{ count }]] = await db.query(checkQuery, [eid, pdate]);
    if (count > 0) {
      return res.send(`
        <script>
          alert("이미 같은 날짜에 저장된 데이터가 있습니다 (eid: ${eid})");
          history.back();
        </script>
      `);
    }

    await db.query(insertQuery, values);
    res.redirect('/payroll');
  } catch (err) {
    console.error('paylist 저장 오류:', err);
    res.status(500).send('급여 정보 저장 중 오류 발생');
  }
});

// GET /paylist/latest?eid=xxx
router.get('/payroll/paylist/latest', async (req, res) => {
  const eid = req.query.eid;
  if (!eid) return res.json({ success: false, message: 'eid 누락' });

  const sql = `
    SELECT rtime, otime, dtime, fw, sse, me, caw, cade, adv, csp AS d1, dd, remark
    FROM paylist
    WHERE eid = ?
    ORDER BY pdate DESC
    LIMIT 1
  `;

  try {
    const [results] = await db.query(sql, [eid]);
    if (results.length === 0) return res.json({ success: false });
    res.json({ success: true, ...results[0] });
  } catch (err) {
    console.error('paylist 최신 데이터 조회 오류:', err);
    res.json({ success: false });
  }
});

module.exports = router;
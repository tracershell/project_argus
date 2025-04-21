const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// ✅ 잔액 다시 계산 함수
async function recalculateBalances() {
  const [rows] = await db.query('SELECT * FROM petty_ledger ORDER BY pldate, id');
  let balance = 0;
  for (let row of rows) {
    balance += parseFloat(row.plcredit || 0) - parseFloat(row.pldebit || 0);
    await db.query('UPDATE petty_ledger SET plbalance = ? WHERE id = ?', [balance, row.id]);
  }
}

// ✅ 전체 조회
router.get('/', async (req, res) => {
  const { start, end } = req.query;
  let query = 'SELECT * FROM petty_ledger';
  const params = [];

  if (start && end) {
    query += ' WHERE pldate BETWEEN ? AND ?';
    params.push(start, end);
  }

  query += ' ORDER BY pldate, id';

  try {
    const [ledgers] = await db.query(query, params);
    res.render('admin/account/petty_ledger', {
      layout: 'layout',
      title: 'Petty Ledger',
      isAuthenticated: true,
      ledgers,
      start: start || '',
      end: end || ''
    });
  } catch (err) {
    console.error('Ledger 조회 오류:', err);
    res.status(500).send('조회 오류');
  }
});

// ✅ 입력
router.post('/add', async (req, res) => {
  let { pldate, plcredit, pldebit, plcomment } = req.body;
  plcredit = parseFloat(plcredit) || 0;
  pldebit = parseFloat(pldebit) || 0;

  await db.query(
    'INSERT INTO petty_ledger (pldate, plcredit, pldebit, plcomment) VALUES (?, ?, ?, ?)',
    [pldate, plcredit, pldebit, plcomment]
  );

  await recalculateBalances();
  res.redirect('/admin/account/petty_ledger');
});

// ✅ 수정
router.post('/update/:id', async (req, res) => {
  const { id } = req.params;
  let { pldate, plcredit, pldebit, plcomment } = req.body;
  plcredit = parseFloat(plcredit) || 0;
  pldebit = parseFloat(pldebit) || 0;

  await db.query(
    'UPDATE petty_ledger SET pldate=?, plcredit=?, pldebit=?, plcomment=? WHERE id=?',
    [pldate, plcredit, pldebit, plcomment, id]
  );

  await recalculateBalances();
  res.redirect('/admin/account/petty_ledger');
});


// ✅ 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM petty_ledger WHERE id = ?', [id]);
  await recalculateBalances();
  res.redirect('/admin/account/petty_ledger');
});


// ✅ 추가 From 을 연결해 주는 라우터
router.get('/form', (req, res) => {
  const { start, end } = req.query;

  res.render('admin/account/petty_ledger_form', {
    layout: 'layout',
    title: '필요 항목 입력',
    start: start || '',
    end: end || '',
    isAuthenticated: true
  });
});



module.exports = router;

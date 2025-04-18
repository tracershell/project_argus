const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// GET 메인 페이지
router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [cardList] = await db.query('SELECT * FROM card_list WHERE active = 1');
    const [accList] = await db.query('SELECT * FROM card_acclist WHERE active = 1');
    const [transactions] = await db.query('SELECT * FROM card_transaction ORDER BY id DESC');

    res.render('admin/creditcard/creditcard_manager', {
      layout: 'layout',
      title: 'Credit Card Manager',
      isAuthenticated: true,
      name: req.session.user.name,
      cardList,
      accList,
      transactions
    });
  } catch (err) {
    console.error('카드 트랜잭션 조회 오류:', err);
    res.status(500).send('카드 트랜잭션 조회 오류');
  }
});

// ✅ 트랜잭션 저장 라우터
router.post('/add', async (req, res) => {
  try {
    const {
      cardcom_name,
      cardcom_account,
      cardown_name,
      cardown_account,
      cardacc_name,
      cardacc_code,
      paydate,
      paytype,
      checkno,
      payamount,
      trdate,
      tramount
    } = req.body;

    // ✅ 디버깅용 로그 출력
    console.log('✅ INSERT VALUES:', [
      cardcom_name,
      cardcom_account,
      cardown_name,
      cardown_account,
      cardacc_name,
      cardacc_code,
      paydate,
      paytype,
      checkno,
      payamount,
      trdate,
      tramount
    ]);

    const query = `
      INSERT INTO card_transaction (
        cardcom_name, cardcom_account, cardown_name, cardown_account,
        cardacc_name, cardacc_code, paydate, paytype, checkno,
        payamount, trdate, tramount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      cardcom_name,
      cardcom_account,
      cardown_name,
      cardown_account,
      cardacc_name,
      cardacc_code,
      paydate,
      paytype === 'check pay' || paytype === 'direct debit' ? paytype : null,
      checkno,
      parseFloat(payamount),
      trdate,
      parseFloat(tramount)
    ];

    await db.query(query, values);
    res.redirect('/admin/creditcard/creditcard_manager');
  } catch (err) {
    console.error('❌ 트랜잭션 저장 오류:', err);
    res.status(500).send('트랜잭션 저장 실패');
  }
});




// POST 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM card_transaction WHERE id = ?', [id]);
    res.redirect('/admin/creditcard/creditcard_manager');
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).send('삭제 실패');
  }
});

module.exports = router;

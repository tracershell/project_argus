const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// 📄 카드 목록 페이지
router.get('/', async (req, res) => {
  try {
    const [cards] = await db.query('SELECT * FROM card_list ORDER BY cardcom_name, cardown_name');
    res.render('admin/creditcard/creditcard_list', {
      layout: 'layout',
      title: 'Credit Card 관리',
      isAuthenticated: true,
      name: req.session.user?.name || 'Guest',
      cards
    });
  } catch (err) {
    console.error('카드 목록 조회 오류:', err);
    res.status(500).send('카드 목록 조회 중 오류 발생');
  }
});

// ➕ 카드 등록
router.post('/add', async (req, res) => {
  const { cardcom_name, cardcom_account, cardown_name, cardown_account } = req.body;
  try {
    await db.query(`
      INSERT INTO card_list (cardcom_name, cardcom_account, cardown_name, cardown_account, active)
      VALUES (?, ?, ?, ?, true)
    `, [cardcom_name, cardcom_account, cardown_name, cardown_account]);
    res.redirect('/admin/creditcard/creditcard_list');
  } catch (err) {
    console.error('카드 등록 오류:', err);
    res.status(500).send('카드 등록 중 오류 발생');
  }
});

// ✏ 카드 수정
router.post('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { cardcom_name, cardcom_account, cardown_name, cardown_account } = req.body;
  try {
    await db.query(`
      UPDATE card_list
      SET cardcom_name = ?, cardcom_account = ?, cardown_name = ?, cardown_account = ?
      WHERE id = ?
    `, [cardcom_name, cardcom_account, cardown_name, cardown_account, id]);
    res.redirect('/admin/creditcard/creditcard_list');
  } catch (err) {
    console.error('카드 수정 오류:', err);
    res.status(500).send('카드 수정 중 오류 발생');
  }
});

// 🗑 카드 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM card_list WHERE id = ?', [id]);
    res.redirect('/admin/creditcard/creditcard_list');
  } catch (err) {
    console.error('카드 삭제 오류:', err);
    res.status(500).send('카드 삭제 중 오류 발생');
  }
});

module.exports = router;

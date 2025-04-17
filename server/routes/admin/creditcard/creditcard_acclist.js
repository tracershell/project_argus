const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// 📄 카드 계정 목록 페이지
router.get('/', async (req, res) => {
  try {
    const [accounts] = await db.query('SELECT * FROM card_acclist ORDER BY cardacc_name ASC');
    res.render('admin/creditcard/creditcard_acclist', {
      layout: 'layout',
      title: '카드 계정 목록 관리',
      isAuthenticated: true,
      name: req.session.user?.name || 'Guest',
      accounts
    });
  } catch (err) {
    console.error('카드 계정 목록 조회 오류:', err);
    res.status(500).send('카드 계정 목록 조회 중 오류 발생');
  }
});

// ➕ 계정 등록
router.post('/add', async (req, res) => {
  const { cardacc_name, cardacc_code, cardacc_comment } = req.body;
  try {
    await db.query(`
      INSERT INTO card_acclist (cardacc_name, cardacc_code, cardacc_comment, active)
      VALUES (?, ?, ?, true)
    `, [cardacc_name, cardacc_code, cardacc_comment]);
    res.redirect('/admin/creditcard/creditcard_acclist');
  } catch (err) {
    console.error('계정 등록 오류:', err);
    res.status(500).send('계정 등록 중 오류 발생');
  }
});

// ✏ 계정 수정
router.post('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { cardacc_name, cardacc_code, cardacc_comment } = req.body;
  try {
    await db.query(`
      UPDATE card_acclist
      SET cardacc_name = ?, cardacc_code = ?, cardacc_comment = ?
      WHERE id = ?
    `, [cardacc_name, cardacc_code, cardacc_comment, id]);
    res.redirect('/admin/creditcard/creditcard_acclist');
  } catch (err) {
    console.error('계정 수정 오류:', err);
    res.status(500).send('계정 수정 중 오류 발생');
  }
});

// 🗑 계정 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM card_acclist WHERE id = ?', [id]);
    res.redirect('/admin/creditcard/creditcard_acclist');
  } catch (err) {
    console.error('계정 삭제 오류:', err);
    res.status(500).send('계정 삭제 중 오류 발생');
  }
});

module.exports = router;

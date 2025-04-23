// ✅ /routes/admin/general/monthlycd_list.js
const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// ✅ GET - monthly list 메인 페이지
router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [cardList] = await db.query('SELECT * FROM card_list WHERE active = 1');
    const [monthlyList] = await db.query('SELECT * FROM monthlycd_list ORDER BY id DESC');

    res.render('admin/general/monthlycd_list', {
      layout: 'layout',
      title: 'Credit Card Monthly Pay List',
      isAuthenticated: true,
      name: req.session.user.name,
      cardList,
      monthlyList
    });
  } catch (err) {
    console.error('❌ monthlycd_list 조회 오류:', err);
    res.status(500).send('월별 리스트 조회 실패');
  }
});

// ✅ POST - 저장
router.post('/add', async (req, res) => {
  try {
    const {
      mcdcompany, mcdcoaccount, mcdowner, mcdowaccount,
      mcdcgdate, mcdcharge, mcdcomment,
      mcdsite, mcdlogin, mcdpw, mcdremark
    } = req.body;

    const query = `
      INSERT INTO monthlycd_list (
        mcdcompany, mcdcoaccount, mcdowner, mcdowaccount,
        mcdcgdate, mcdcharge, mcdcomment,
        mcdsite, mcdlogin, mcdpw, mcdremark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      mcdcompany, mcdcoaccount, mcdowner, mcdowaccount,
      parseInt(mcdcgdate), parseFloat(mcdcharge), mcdcomment,
      mcdsite, mcdlogin, mcdpw, mcdremark
    ];

    await db.query(query, values);
    res.redirect('/admin/general/monthlycd_list');
  } catch (err) {
    console.error('❌ monthlycd_list 저장 오류:', err);
    res.status(500).send('저장 실패');
  }
});

// ✅ POST - 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM monthlycd_list WHERE id = ?', [id]);
    res.redirect('/admin/general/monthlycd_list');
  } catch (err) {
    console.error('❌ 삭제 오류:', err);
    res.status(500).send('삭제 실패');
  }
});

module.exports = router;

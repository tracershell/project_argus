const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// ✅ 전체 그룹 리스트 + 멤버 불러오기
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM envelop_group ORDER BY gno, ono');
    const grouped = {};
    rows.forEach(row => {
      if (!grouped[row.gno]) grouped[row.gno] = [];
      grouped[row.gno].push(row);
    });

    const groups = Object.entries(grouped).map(([gno, members]) => ({ gno, members }));

    res.render('admin/mail/envelop_glist', {
      layout: 'layout',
      title: 'Payment Envelope Entry',
      isAuthenticated: true,
      groups
    });
  } catch (err) {
    console.error('envelop_group 조회 오류:', err);
    res.status(500).send('DB 조회 오류');
  }
});

// ✅ 입력
router.post('/add', async (req, res) => {
  const { gno, ono, gmname } = req.body;
  try {
    await db.query('INSERT INTO envelop_group (gno, ono, gmname) VALUES (?, ?, ?)', [gno, ono, gmname]);
    res.redirect('/admin/mail/envelop_glist');
  } catch (err) {
    console.error('입력 오류:', err);
    res.status(500).send('입력 오류');
  }
});

// ✅ 수정
router.post('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { ono, gmname } = req.body;
  try {
    await db.query('UPDATE envelop_group SET ono=?, gmname=? WHERE id=?', [ono, gmname, id]);
    res.redirect('/admin/mail/envelop_glist');
  } catch (err) {
    console.error('수정 오류:', err);
    res.status(500).send('수정 오류');
  }
});

// ✅ 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM envelop_group WHERE id=?', [id]);
    res.redirect('/admin/mail/envelop_glist');
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).send('삭제 오류');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// GET 리스트
router.get('/', async (req, res) => {
  try {
    const [envelops] = await db.query('SELECT * FROM envelop_each ORDER BY id DESC');
    res.render('admin/mail/envelop_elist', {
      layout: 'layout',
      title: 'Envelope Entry',
      isAuthenticated: true,
      envelops
    });
  } catch (err) {
    console.error('Envelope 조회 오류:', err);
    res.status(500).send('DB 조회 오류');
  }
});

// POST 입력
router.post('/add', async (req, res) => {
  const { ename, eref, estreet, ecity } = req.body;
  try {
    await db.query(
      'INSERT INTO envelop_each (ename, eref, estreet, ecity) VALUES (?, ?, ?, ?)',
      [ename, eref, estreet, ecity]
    );
    res.redirect('/admin/mail/envelop_elist');
  } catch (err) {
    console.error('Envelope 입력 오류:', err);
    res.status(500).send('입력 오류');
  }
});

// POST 수정
router.post('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { ename, eref, estreet, ecity } = req.body;
  try {
    await db.query(
      'UPDATE envelop_each SET ename=?, eref=?, estreet=?, ecity=? WHERE id=?',
      [ename, eref, estreet, ecity, id]
    );
    res.redirect('/admin/mail/envelop_elist');
  } catch (err) {
    console.error('Envelope 수정 오류:', err);
    res.status(500).send('수정 오류');
  }
});

// POST 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM envelop_each WHERE id = ?', [id]);
    res.redirect('/admin/mail/envelop_elist');
  } catch (err) {
    console.error('Envelope 삭제 오류:', err);
    res.status(500).send('삭제 오류');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// 🔍 카테고리 목록 표시
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM doc_list ORDER BY sort_order ASC, id ASC');
    res.render('admin/document/document_list', {
      layout: 'layout',
      title: '문서 카테고리 관리',
      isAuthenticated: true,
      name: req.session.user?.name || 'Guest',
      categories
    });
  } catch (err) {
    console.error('카테고리 조회 오류:', err);
    res.status(500).send('카테고리 조회 중 오류 발생');
  }
});

// ➕ 등록
router.post('/add', async (req, res) => {
  const { name, code, description, sort_order } = req.body;
  try {
    await db.query(`
      INSERT INTO doc_list (name, code, description, sort_order, active)
      VALUES (?, ?, ?, ?, true)
    `, [name, code, description, parseInt(sort_order) || 0]);
    res.redirect('/admin/document/document_list');
  } catch (err) {
    console.error('카테고리 추가 오류:', err);
    res.status(500).send('카테고리 추가 중 오류 발생');
  }
});

// ✏ 수정
router.post('/edit/:id', async (req, res) => {
  const { name, description, sort_order } = req.body;
  const { id } = req.params;
  try {
    await db.query(`
      UPDATE doc_list SET name = ?, description = ?, sort_order = ? WHERE id = ?
    `, [name, description, parseInt(sort_order) || 0, id]);
    res.redirect('/admin/document/document_list');
  } catch (err) {
    console.error('카테고리 수정 오류:', err);
    res.status(500).send('카테고리 수정 중 오류 발생');
  }
});

// 🗑 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM doc_list WHERE id = ?', [id]);
    res.redirect('/admin/document/document_list');
  } catch (err) {
    console.error('카테고리 삭제 오류:', err);
    res.status(500).send('카테고리 삭제 중 오류 발생');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../../../../../db/mysql'); // mysql2/promise 연결

// 전화번호부 리스트 페이지
router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { department, keyword, importance } = req.query;

  try {
    let query = 'SELECT * FROM phone_list WHERE 1=1';
    const params = [];

    if (department) {
      query += ' AND department LIKE ?';
      params.push(`%${department}%`);
    }
    if (keyword) {
      query += ' AND keyword LIKE ?';
      params.push(`%${keyword}%`);
    }
    if (importance) {
      query += ' AND importance = ?';
      params.push(importance);
    }

    const [results] = await db.query(query, params);

    // 부문, 키워드, 중요도 목록 추출 (필터용)
    const departments = [...new Set(results.map(row => row.department).filter(Boolean))];
    const keywords = [...new Set(results.map(row => row.keyword).filter(Boolean))];
    const importanceList = [...new Set(results.map(row => row.importance).filter(Boolean))];

    res.render('admin/general/board/board01/phone_list', {
      layout: 'layout',
      title: 'Phone List',
      phoneList: results,
      departments,
      keywords,
      importanceList,
      name: req.session.user.name || 'Guest',
      isAuthenticated: true,
      now: new Date().toString(),
    });
  } catch (err) {
    console.error('DB 오류:', err);
    res.status(500).send('Database error');
  }
});

// 전화번호부 추가
router.post('/add', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const {
    department, keyword, importance, name,
    personal_phone, office_phone, email, note
  } = req.body;

  try {
    const insertQuery = `
      INSERT INTO phone_list (department, keyword, importance, name, personal_phone, office_phone, email, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      department || null, keyword || null, importance || null, name,
      personal_phone || null, office_phone || null, email || null, note || null
    ];
    await db.query(insertQuery, values);

    res.redirect('/admin/general/board/board01/phone_list');
  } catch (err) {
    console.error('전화번호부 추가 오류:', err);
    res.status(500).send('추가 중 오류 발생');
  }
});

// 전화번호부 수정 (ID 기준)
router.post('/edit/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { id } = req.params;
  const {
    department, keyword, importance, name,
    personal_phone, office_phone, email, note
  } = req.body;

  try {
    const updateQuery = `
      UPDATE phone_list SET
        department = ?, keyword = ?, importance = ?, name = ?,
        personal_phone = ?, office_phone = ?, email = ?, note = ?
      WHERE id = ?
    `;
    const values = [
      department || null, keyword || null, importance || null, name,
      personal_phone || null, office_phone || null, email || null, note || null,
      id
    ];

    const [result] = await db.query(updateQuery, values);
    if (result.affectedRows === 0) {
      return res.send(`<script>alert("수정할 ID를 찾을 수 없습니다: ${id}"); history.back();</script>`);
    }
    res.redirect('/admin/general/board/board01/phone_list');
  } catch (err) {
    console.error('전화번호부 수정 오류:', err);
    res.status(500).send('수정 중 오류 발생');
  }
});

// 전화번호부 삭제 (ID 기준)
router.post('/delete/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM phone_list WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.send(`<script>alert("삭제할 ID를 찾을 수 없습니다: ${id}"); history.back();</script>`);
    }
    res.send(`<script>alert("삭제 완료: ID ${id}"); window.location.href = "/admin/general/board/board01/phone_list";</script>`);
  } catch (err) {
    console.error('전화번호부 삭제 오류:', err);
    res.status(500).send('삭제 중 오류 발생');
  }
});

module.exports = router;

// server/routes/index.js
const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql'); // mysql2/promise 기반 연결


// 직원 목록 페이지
router.get('/employees', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const [results] = await db.query('SELECT * FROM employees');

    res.render('admin/employees/employees_list', {
      layout: 'layout',
      title: 'employees',
      editId: 'none',
      deleteId: '',
      employees: results,
      name: req.session.user.name || 'Guest',
      isAuthenticated: true,
      now: new Date().toString(),
    });
  } catch (err) {
    console.error('DB 오류:', err);
    res.status(500).send('Database error');
  }
});

// 직원 추가
router.post('/add', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const {
    status, eid, name, ss, birth, email, phone,
    jcode, jtitle, sdate, edate, sick, work1,
    address, city, state, zip, remark
  } = req.body;

  try {
    const [dup] = await db.query('SELECT COUNT(*) AS count FROM employees WHERE eid = ?', [eid]);
    if (dup[0].count > 0) {
      return res.send(`<script>alert("이미 존재하는 직원 ID입니다: ${eid}"); history.back();</script>`);
    }

    const insertQuery = `
      INSERT INTO employees (
        status, eid, name, ss, birth, email, phone,
        jcode, jtitle, sdate, edate, sick, work1,
        address, city, state, zip, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      status || null, eid || null, name || null, ss || null, birth || null,
      email || null, phone || null, jcode || null, jtitle || null,
      sdate || null, edate || null, sick || 0, work1 || null,
      address || null, city || null, state || null, zip || null, remark || null
    ];

    await db.query(insertQuery, values);
    res.redirect('/admin/employees/employees_list/employees');
  } catch (err) {
    console.error('직원 추가 오류:', err);
    res.status(500).send('직원 추가 중 오류가 발생했습니다.');
  }
});

// 직원 수정
router.post('/edit/:eid', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const eidParam = req.params.eid;
  const {
    status, name, ss, birth, email, phone,
    jcode, jtitle, sdate, edate, sick, work1,
    address, city, state, zip, remark
  } = req.body;

  try {
    const updateQuery = `
      UPDATE employees SET
        status = ?, name = ?, ss = ?, birth = ?, email = ?, phone = ?,
        jcode = ?, jtitle = ?, sdate = ?, edate = ?, sick = ?, work1 = ?,
        address = ?, city = ?, state = ?, zip = ?, remark = ?
      WHERE eid = ?
    `;

    const values = [
      status, name, ss, birth || null, email, phone,
      jcode, jtitle, sdate || null, edate || null, sick || 0, work1,
      address, city, state, zip, remark, eidParam
    ];

    const [result] = await db.query(updateQuery, values);
    if (result.affectedRows === 0) {
      return res.send(`<script>alert("수정할 직원 정보를 찾을 수 없습니다: ${eidParam}"); history.back();</script>`);
    }
    res.redirect('/admin/employees/employees_list/employees');
  } catch (err) {
    console.error('직원 수정 오류:', err);
    res.status(500).send('직원 수정 중 오류가 발생했습니다.');
  }
});

// 직원 삭제
router.post('/delete/:eid', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const eidParam = req.params.eid;
  try {
    const [result] = await db.query('DELETE FROM employees WHERE eid = ?', [eidParam]);
    if (result.affectedRows === 0) {
      return res.send(`<script>alert("삭제할 직원 정보를 찾을 수 없습니다: ${eidParam}"); history.back();</script>`);
    }
    res.send(`<script>alert("직원 정보가 삭제되었습니다: ${eidParam}"); window.location.href = "/employees";</script>`);
  } catch (err) {
    console.error('직원 삭제 오류:', err);
    res.status(500).send('직원 삭제 중 오류가 발생했습니다.');
  }
});

// 직원 상세 보기
router.get('/view-one/:eid', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const eid = req.params.eid;
  try {
    const [results] = await db.query('SELECT * FROM employees WHERE eid = ?', [eid]);
    if (results.length === 0) {
      return res.send(`<script>alert("해당 EID의 직원 정보를 찾을 수 없습니다: ${eid}"); window.close();</script>`);
    }
    res.render('view-one', {
      layout: false,
      title: `Employee Record: ${results[0].name}`,
      emp: results[0],
    });
  } catch (err) {
    console.error('레코드 출력 오류:', err);
    res.status(500).send('DB 오류가 발생했습니다.');
  }
});

// 직원 출력 페이지
router.get('/print/:eid', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const eid = req.params.eid;
  try {
    const [results] = await db.query('SELECT * FROM employees WHERE eid = ?', [eid]);
    if (results.length === 0) {
      return res.send(`<script>alert("해당 EID의 직원 정보를 찾을 수 없습니다: ${eid}"); window.close();</script>`);
    }
    res.render('print', {
      layout: false,
      title: `Employee Record: ${results[0].name}`,
      emp: results[0],
    });
  } catch (err) {
    console.error('레코드 출력 오류:', err);
    res.status(500).send('DB 오류가 발생했습니다.');
  }
});

// 직원 목록 PDF 보기용
router.get('/employees/pdf-view', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const [results] = await db.query('SELECT * FROM employees');
    res.render('pdf-employees-view', {
      layout: false,
      employees: results,
    });
  } catch (err) {
    res.status(500).send('DB 오류 발생');
  }
});

// 직원 목록 PDF 인쇄용
router.get('/employees/pdf-print', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const [results] = await db.query('SELECT * FROM employees');
    res.render('pdf-employees-print', {
      layout: false,
      employees: results,
    });
  } catch (err) {
    res.status(500).send('DB 오류 발생');
  }
});

module.exports = router;
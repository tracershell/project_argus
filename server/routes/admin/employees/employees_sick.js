// ✅ /server/routes/admin/employees/employees_sick.js

const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// ✅ GET: sick_list 화면 렌더링
router.get('/', async (req, res) => {
  try {
    // 🔹 직원 리스트 불러오기 (active 상태만)
    const [employees] = await db.query('SELECT eid, name, sick FROM employees WHERE status = "active"');

    // 🔹 선택된 직원이 있을 경우 그 eid 가져오기
    let selectedEid = req.query.eid || '';

    // 🔹 sickList와 선택된 직원 정보 초기화
    let sickList = [];
    let selectedEmployee = null;

    if (selectedEid) {
      // 🔹 해당 직원 정보 및 sick 기록 조회
      [[selectedEmployee]] = await db.query('SELECT eid, name, sick FROM employees WHERE eid = ?', [selectedEid]);
      [sickList] = await db.query('SELECT * FROM sick_list WHERE eid = ? ORDER BY sickdate DESC', [selectedEid]);
    } else {
      // 🔹 직원 선택 안 한 경우 전체 sick_list 출력
      [sickList] = await db.query('SELECT * FROM sick_list ORDER BY sickdate DESC');
    }

    // 🔹 화면 렌더링
    res.render('admin/employees/employees_sick', {
      layout: 'layout',
      title: 'Sick Day Report',
      isAuthenticated: true,
      employees,         // 직원 콤보박스용
      sickList,          // sick 기록
      selectedEid,       // 선택된 직원 eid
      selectedEmployee   // 상단 요약 표시용
    });
  } catch (err) {
    console.error('Sick list 조회 오류:', err);
    res.status(500).send('DB 조회 오류');
  }
});

// ✅ POST: sick 기록 추가
router.post('/add', async (req, res) => {
  const { eid, sickdate, usedsick } = req.body;
  try {
    // 🔹 직원 정보 조회
    const [[emp]] = await db.query('SELECT eid, name, sick FROM employees WHERE eid = ?', [eid]);
    if (!emp) return res.status(400).send('직원 정보 없음');

    // 🔹 sick_list 테이블에 입력
    await db.query(
      `INSERT INTO sick_list (eid, name, givensick, sickdate, usedsick)
       VALUES (?, ?, ?, ?, ?)`,
      [eid, emp.name, emp.sick, sickdate, usedsick]
    );

    // 🔹 다시 해당 직원으로 redirect
    res.redirect(`/admin/employees/employees_sick?eid=${eid}`);
  } catch (err) {
    console.error('Sick 입력 오류:', err);
    res.status(500).send('Sick 저장 오류');
  }
});

// ✅ POST: sick 기록 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  const { eid } = req.query;
  try {
    await db.query('DELETE FROM sick_list WHERE id = ?', [id]);
    // 🔹 삭제 후 원래 선택한 직원 정보 유지
    res.redirect(`/admin/employees/employees_sick?eid=${eid || ''}`);
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).send('삭제 실패');
  }
});

module.exports = router;

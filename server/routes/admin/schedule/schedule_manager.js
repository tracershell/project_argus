const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const cron = require('node-cron');  // ⬅️ 꼭 라우터 상단에 추가 : 메시시 자동실행 로직- 매분마다 실행되게 할 때 필요
const { io } = require('../../../../server');  // 📌 상대 경로: schedule_manager.js → server.js

// ✅ 스케줄 목록 조회
router.get('/', async (req, res) => {
  try {
    const [schedules] = await db.query('SELECT * FROM schedule_plan ORDER BY hour, minute');
    res.render('admin/schedule/schedule_manager', {
      layout: 'layout',
      title: 'Schedule Manager',
      isAuthenticated: true,
      name: req.session.user?.name || 'Guest',
      schedules
    });
  } catch (err) {
    console.error('스케줄 목록 조회 오류:', err);
    res.status(500).send('스케줄 목록을 불러오는 중 오류가 발생했습니다.');
  }
});

// ✅ 스케줄 등록
router.post('/add', async (req, res) => {
  const { cycle_type, hour, minute, message } = req.body;
  let { month, day, weekday } = req.body;

  const toNull = (v) => (v === '' || v === undefined || v === null || v === '.') ? null : v;
  const extractFirst = (v) => Array.isArray(v) ? v[0] : v;

  const parsedHour = parseInt(hour);
  const parsedMinute = parseInt(minute);

  // 🔍 유효성 검사
  if (!cycle_type || !message) {
    return res.send('<script>alert("주기와 메시지를 입력하세요."); history.back();</script>');
  }

  if (isNaN(parsedHour) || isNaN(parsedMinute)) {
    return res.send('<script>alert("시간 또는 분을 정확히 입력하세요."); history.back();</script>');
  }

  // 주기별 필수 입력 필드 확인
  if (cycle_type === 'yearly' && (!month || !day)) {
    return res.send('<script>alert("매년 주기에는 월과 일이 필요합니다."); history.back();</script>');
  }
  if (cycle_type === 'monthly' && !day) {
    return res.send('<script>alert("매월 주기에는 일이 필요합니다."); history.back();</script>');
  }
  if (cycle_type === 'weekly' && !weekday) {
    return res.send('<script>alert("매주 주기에는 요일이 필요합니다."); history.back();</script>');
  }

  // ✅ 배열 방지 및 null 처리
  const cleanedMonth = toNull(extractFirst(month));
  const cleanedDay = toNull(extractFirst(day));
  const cleanedWeekday = toNull(extractFirst(weekday));

  try {
    // console.log('📥 INSERT VALUES:', {
    //   cycle_type,
    //   month: cleanedMonth,
    //   day: cleanedDay,
    //   weekday: cleanedWeekday,
    //   hour: parsedHour,
    //   minute: parsedMinute,
    //   message
    // });

    await db.query(`
      INSERT INTO schedule_plan (
        cycle_type, month, day, weekday, hour, minute, message, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cycle_type,
      cleanedMonth,
      cleanedDay,
      cleanedWeekday,
      parsedHour,
      parsedMinute,
      message,
      true
    ]);

    res.redirect('/admin/schedule/schedule_manager');
  } catch (err) {
    console.error('스케줄 등록 오류:', err);
    res.status(500).send('스케줄 등록 중 오류가 발생했습니다.');
  }
});

// ✅ 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM schedule_plan WHERE id = ?', [id]);
    res.redirect('/admin/schedule/schedule_manager');
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).send('스케줄 삭제 중 오류가 발생했습니다.');
  }
});


// ✅ 메시지 자동 실행 로직 - 매분마다 실행됨
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const weekday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];

  try {
    const [schedules] = await db.query(
      'SELECT * FROM schedule_plan WHERE hour = ? AND minute = ? AND active = 1',
      [hour, minute]
    );

    schedules.forEach(item => {
      let match = false;

      if (item.cycle_type === 'daily') match = true;
      else if (item.cycle_type === 'weekly' && item.weekday === weekday) match = true;
      else if (item.cycle_type === 'monthly' && item.day === date) match = true;
      else if (item.cycle_type === 'yearly' && item.day === date && item.month === month) match = true;

      if (match) {
        console.log('🔔 메시지 실행:', item.message);
        io.emit('schedule_alert', item.message); // ✅ 이제 정상
      }
    });
  } catch (err) {
    console.error('⛔ node-cron 실행 오류:', err);
  }
});


module.exports = router;
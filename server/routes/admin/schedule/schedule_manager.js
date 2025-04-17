const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

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
  const { cycle_type, month, day, weekday, hour, minute, message } = req.body;

  const parsedHour = parseInt(hour);
  const parsedMinute = parseInt(minute);

  if (!cycle_type || !message) {
    return res.send('<script>alert(\"주기와 메시지를 입력하세요.\"); history.back();</script>');
  }

  if (isNaN(parsedHour) || isNaN(parsedMinute)) {
    return res.send('<script>alert(\"시간 또는 분을 정확히 입력하세요.\"); history.back();</script>');
  }

  if (cycle_type === 'yearly' && (!month || !day)) {
    return res.send('<script>alert(\"매년 주기에는 월과 일이 필요합니다.\"); history.back();</script>');
  }
  if (cycle_type === 'monthly' && !day) {
    return res.send('<script>alert(\"매월 주기에는 일이 필요합니다.\"); history.back();</script>');
  }
  if (cycle_type === 'weekly' && !weekday) {
    return res.send('<script>alert(\"매주 주기에는 요일이 필요합니다.\"); history.back();</script>');
  }

  // 빈 문자열 → null 처리
  const toNull = (v) => v === '' ? null : v;

  try {
    await db.query(`
      INSERT INTO schedule_plan (
        cycle_type, month, day, weekday, hour, minute, message, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cycle_type,
      toNull(month),
      toNull(day),
      toNull(weekday),
      parsedHour,
      parsedMinute,
      message,     // ✅ 올바르게 문자열 메시지
      true         // ✅ 마지막 active 자리
    ]);

    res.redirect('/admin/schedule');
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
    res.redirect('/admin/schedule');
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).send('스케줄 삭제 중 오류가 발생했습니다.');
  }
});

module.exports = router;

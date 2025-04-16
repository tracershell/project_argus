const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// 날짜 지정하여 레코드 조회 (기본 페이지 진입 시)
router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const [employees] = await db.query(
      'SELECT eid, name, jcode, jtitle, work1 FROM employees WHERE status = "active"'
    );

    const selectedPdate = req.session.lastPayDate || new Date().toISOString().split('T')[0];
    const selectedEidName = req.session.lastEidName || '';
    delete req.session.lastPayDate;
    delete req.session.lastEidName;


    // ✅ 기존 코드 (선택한 날짜만 가져오는 쿼리)
    // const [paylist] = await db.query('SELECT * FROM payroll_tax WHERE pdate = ?', [selectedPdate]);

    // ✅  (선택한 날짜를 제외한 모든 레코드 가져오기)
    // const [paylist] = await db.query('SELECT * FROM payroll_tax WHERE pdate != ?', [selectedPdate]);

    // ✅  코드 (모든 레코드 가져오기)
    // const [paylist] = await db.query('SELECT * FROM payroll_tax ORDER BY pdate DESC');

    // ✅ DB에서 등록된 모든 pdate 목록 가져오기 (중복 제거 후 최신순 정렬)

    const [dates] = await db.query('SELECT DISTINCT pdate FROM payroll_tax ORDER BY pdate DESC');

    const selectedDate = req.query.pdate || ''; // 쿼리스트링으로 넘어온 pdate
    let paylist = [];

    // ✅ pdate가 선택된 경우에만 해당 날짜의 급여 리스트 가져오기
    if (selectedDate) {
      [paylist] = await db.query('SELECT * FROM payroll_tax WHERE pdate = ? ORDER BY id DESC', [selectedDate]);
    }


    res.render('admin/payroll/payroll_tax', {
      layout: 'layout',
      title: 'Payroll Management',
      isAuthenticated: true,
      name: req.session.user.name,
      employees,
      selectedPdate,
      selectedEidName,
      paylist,
      dates,
      selectedDate,
      now: new Date().toString()
    });
  } catch (err) {
    console.error('DB 조회 오류:', err);
    res.status(500).send('DB 오류');
  }
});

// 최신 급여 기록 가져오기 (Reference 버튼)
router.get('/paylist/latest', async (req, res) => {
  const { eid } = req.query;
  if (!eid) return res.json({ success: false, message: 'eid 누락' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM payroll_tax WHERE eid = ? ORDER BY pdate DESC LIMIT 1',
      [eid]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: '이전 기록 없음' });
    }

    const latest = rows[0];
    return res.json({ success: true, ...latest });
  } catch (err) {
    console.error('Reference 조회 오류:', err);
    return res.json({ success: false, message: 'DB 오류' });
  }
});

// 데이터 저장
router.post('/add', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const {
    eid, name, jcode, jtitle, work1,
    pdate, ckno_table, rtime, otime, dtime,
    fw, sse, me, caw, cade, adv, csp, dd,
    gross, tax, net, remark
  } = req.body;

  req.session.lastPayDate = pdate;
  req.session.lastEidName = `eid: ${eid} / ${name}`;

  try {
    await db.query(
      `INSERT INTO payroll_tax (
        eid, name, jcode, jtitle, work1,
        pdate, ckno, rtime, otime, dtime,
        fw, sse, me, caw, cade, adv, csp, dd,
        gross, tax, net, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eid, name, jcode, jtitle, work1,
        pdate, ckno_table,
        toNumber(rtime), toNumber(otime), toNumber(dtime),
        toNumber(fw), toNumber(sse), toNumber(me), toNumber(caw), toNumber(cade),
        toNumber(adv), toNumber(csp), toNumber(dd),
        toNumber(gross), toNumber(tax), toNumber(net), remark
      ]
    );

    res.redirect('/admin/payroll/payroll_tax');
  } catch (err) {
    console.error('급여 저장 오류:', err);
    res.status(500).send('급여 저장 실패');
  }
});

// ✅ 선택 라우터 - ckno로 단일 레코드 조회
router.get('/select', async (req, res) => {
  const { ckno } = req.query;
  if (!ckno) return res.json({ success: false, message: 'ckno 누락' });

  try {
    const [rows] = await db.query('SELECT * FROM payroll_tax WHERE ckno = ?', [ckno]);
    if (rows.length === 0) {
      return res.json({ success: false, message: '해당 Check No. 없음' });
    }

    // return res.json({ success: true, data: rows[0] });

    const record = rows[0];
    return res.json({
      success: true,
      data: record,
      pdate: record.pdate,
      ckno: record.ckno
    });

  } catch (err) {
    console.error('선택 조회 오류:', err);
    return res.json({ success: false, message: 'DB 오류' });
  }
});



// ✅ payroll_tax.js - Update 라우터 추가 코드

router.post('/update', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const {
    eid, name, jcode, jtitle, work1,
    pdate, ckno_table, rtime, otime, dtime,
    fw, sse, me, caw, cade, adv, csp, dd,
    gross, tax, net, remark
  } = req.body;

  const originalCkno = req.body.ckno; // ✅ 원래 검색에 사용된 ckno (form 상단에서 가져옴)

  if (!originalCkno) return res.status(400).send('원래 Check No. 없음');

  try {
    // ✅ update 처리 (ckno 기준으로 해당 레코드 갱신)
    const [result] = await db.query(
      `UPDATE payroll_tax SET
        eid = ?, name = ?, jcode = ?, jtitle = ?, work1 = ?,
        pdate = ?, ckno = ?, rtime = ?, otime = ?, dtime = ?,
        fw = ?, sse = ?, me = ?, caw = ?, cade = ?, adv = ?, csp = ?, dd = ?,
        gross = ?, tax = ?, net = ?, remark = ?
      WHERE ckno = ?`,
      [
        eid, name, jcode, jtitle, work1,
        formatDate(pdate), ckno_table, // ✅ ckno_table = 새롭게 입력된 값
        toNumber(rtime), toNumber(otime), toNumber(dtime),
        toNumber(fw), toNumber(sse), toNumber(me), toNumber(caw), toNumber(cade),
        toNumber(adv), toNumber(csp), toNumber(dd),
        toNumber(gross), toNumber(tax), toNumber(net),
        remark,
        originalCkno // ✅ WHERE 조건: 원래 ckno
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send('수정할 데이터가 없습니다.');
    }

    res.redirect('/admin/payroll/payroll_tax');
  } catch (err) {
    console.error('수정 오류:', err);
    res.status(500).send('급여 수정 실패');
  }
});

// ✅ 삭제 라우터 - ckno로 삭제 처리
router.post('/delete', async (req, res) => {
  const { ckno } = req.body;
  if (!ckno) return res.json({ success: false, message: 'ckno 누락' });

  try {
    const [result] = await db.query('DELETE FROM payroll_tax WHERE ckno = ?', [ckno]);
    if (result.affectedRows === 0) {
      return res.json({ success: false, message: '삭제할 데이터 없음' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('삭제 오류:', err);
    return res.json({ success: false, message: 'DB 오류' });
  }
});


// ✅ 도우미 함수 - 날짜 포맷 변환 (MM/DD/YYYY → YYYY-MM-DD)
function formatDate(input) {
  if (!input) return null;
  const d = new Date(input);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 도우미 숫자 변환 함수
function toNumber(val) {
  if (typeof val === 'string') {
    val = val.replace(/,/g, '');
  }
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// ✅ 기본 import_po 페이지 렌더링
router.get('/', async (req, res) => {
  try {
    const { v_name, po_no, style } = req.query;
    const where = [];
    const params = [];

    if (v_name) {
      where.push('v_name = ?');
      params.push(v_name);
    }
    if (po_no) {
      where.push('po_no = ?');
      params.push(po_no);
    }
    if (style) {
      where.push('style = ?');
      params.push(style);
    }

    let query = 'SELECT * FROM import_po';
    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }

    // ✅ [🔧 수정] 날짜 + ID 기준 복합 정렬로 변경 (최근 입력이 항상 맨 위로)
    query += ' ORDER BY po_date DESC, id DESC';

    // ✅ [✔ 유지] vendor 목록을 import_vendor 에서 가져오도록 수정되어 있음
    const [importPOs] = await db.query(query, params);
    const [vendors] = await db.query('SELECT v_name, vd_rate AS v_rate FROM import_vendor');
    const [styles] = await db.query('SELECT DISTINCT style FROM import_po');
    const [po_nos] = await db.query('SELECT DISTINCT po_no FROM import_po');
    const today = new Date().toISOString().split('T')[0];

    res.render('admin/import/import_po', {
      vendors,
      styles,
      po_nos,
      importPOs,
      today,
      v_name,
      po_no,
      style
    });
  } catch (err) {
    console.error('💥 import_po 조회 오류:', err);
    res.status(500).send('Import PO 조회 실패: ' + err.message);
  }
});

// ✅ 첫 번째 입력 방식: PCS * COST
router.post('/add/po', async (req, res) => {
  try {
    const { po_date, v_name, style, po_no, pcs, cost } = req.body;
    const [vendor] = await db.query('SELECT vd_rate AS v_rate FROM import_vendor WHERE v_name = ?', [v_name]);
    const v_rate = parseFloat(vendor[0].v_rate);
    const n_pcs = parseInt(pcs);
    const n_cost = parseFloat(cost);
    const po_amount = n_pcs * n_cost;
    const dp_amount = po_amount * v_rate / 100;
    const balance = po_amount;

    await db.query(`
      INSERT INTO import_po (po_date, v_name, style, po_no, pcs, cost, po_amount, v_rate, dp_amount, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [po_date, v_name, style, po_no, n_pcs, n_cost, po_amount, v_rate, dp_amount, balance]
    );
    res.redirect('/admin/import_po');
  } catch (err) {
    console.error('💥 add/po 등록 오류:', err);
    res.status(500).send('등록 실패: ' + err.message);
  }
});

// ✅ 두 번째 입력 방식: 고정 금액 입력 (deposit 없는 경우)
router.post('/add/direct', async (req, res) => {
  try {
    const { po_date, v_name, style, cost } = req.body;

    // ✅ 안전한 값 변환 처리
    const safe_date = po_date && po_date.trim() !== '' ? po_date : null;
    const safe_style = style || '';
    const safe_cost = !isNaN(parseFloat(cost)) ? parseFloat(cost) : 0.00;

    const v_rate = null;
    const pcs = 1;
    const po_amount = pcs * safe_cost;
    const dp_amount = 0;
    const balance = po_amount;
    const note = '환율 적용 불필요';

    // ✅ MySQL DATE 필드에는 반드시 유효한 날짜값 또는 null만 전달해야 함
    if (!safe_date) {
      return res.status(400).send('📛 날짜 값이 유효하지 않습니다.');
    }

    await db.query(`
      INSERT INTO import_po (po_date, v_name, style, pcs, cost, po_amount, v_rate, dp_amount, balance, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [safe_date, v_name, safe_style, pcs, safe_cost, po_amount, v_rate, dp_amount, balance, note]
    );

    res.redirect('/admin/import_po');
  } catch (err) {
    console.error('💥 add/direct 등록 오류:', err);
    res.status(500).send('등록 실패: ' + err.message);
  }
});

// ✅ 삭제
router.post('/delete/:id', async (req, res) => {
  await db.query('DELETE FROM import_po WHERE id = ?', [req.params.id]);
  res.redirect('/admin/import_po');
});

// ✅ 결과 페이지 라우터 (/result용)
router.get('/result', async (req, res) => {
  try {
    const { v_name, style, po_no, dex_date, bex_date } = req.query;
    let where = [];
    let params = [];

    if (v_name) { where.push('v_name = ?'); params.push(v_name); }
    if (style) { where.push('style = ?'); params.push(style); }
    if (po_no) { where.push('po_no = ?'); params.push(po_no); }
    if (dex_date) { where.push('dex_date = ?'); params.push(dex_date); }
    if (bex_date) { where.push('bex_date = ?'); params.push(bex_date); }

    let query = 'SELECT * FROM import_po';
    if (where.length > 0) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY po_date DESC';

    const [results] = await db.query(query, params);
    const [vendors] = await db.query('SELECT DISTINCT v_name FROM import_po');
    const [styles] = await db.query('SELECT DISTINCT style FROM import_po');
    const [po_nos] = await db.query('SELECT DISTINCT po_no FROM import_po');

    res.render('admin/import/import_po_result', {
      results,
      vendors,
      styles,
      po_nos,
      v_name,
      style,
      po_no,
      dex_date,
      bex_date
    });
  } catch (err) {
    console.error('💥 result 조회 오류:', err);
    res.status(500).send('결과 조회 실패: ' + err.message);
  }
});

// ✅ 수정 페이지 렌더링
router.get('/edit/:id', async (req, res) => {
  const [[po]] = await db.query('SELECT * FROM import_po WHERE id = ?', [req.params.id]);
  if (!po) return res.status(404).send('PO not found');
  res.render('admin/import/import_po_edit', { po });
});

//  ✅ 수정 페이지 값을 받아 db 에 저장처리
router.post('/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { po_date, v_name, style, po_no, pcs, cost, v_rate, note } = req.body;

    // 안전한 숫자 변환
    const n_pcs = !isNaN(parseInt(pcs)) ? parseInt(pcs) : 1;
    const n_cost = !isNaN(parseFloat(cost)) ? parseFloat(cost) : 0.00;
    const n_rate = v_rate === null || v_rate === '' || isNaN(parseFloat(v_rate)) ? null : parseFloat(v_rate);

    const po_amount = n_pcs * n_cost;
    const dp_amount = n_rate !== null ? po_amount * n_rate / 100 : 0;
    const balance = po_amount;

    await db.query(`
      UPDATE import_po
      SET po_date = ?, v_name = ?, style = ?, po_no = ?, pcs = ?, cost = ?,
          po_amount = ?, v_rate = ?, dp_amount = ?, balance = ?, note = ?
      WHERE id = ?`,
      [
        po_date,
        v_name,
        style || '',
        po_no || '',
        n_pcs,
        n_cost,
        po_amount,
        n_rate,
        dp_amount,
        balance,
        note || '',
        id
      ]
    );

    res.redirect('/admin/import_po');
  } catch (err) {
    console.error('💥 edit 처리 오류:', err);
    res.status(500).send('수정 실패: ' + err.message);
  }
});


// ✅ import_po.js에 추가할 라우터: /paid
router.post('/paid', async (req, res) => {
  try {
    const { pay_date, exchange_rate, deposit_ids = [], balance_ids = [] } = req.body;
    const rate = parseFloat(exchange_rate);
    const date = pay_date;

    // ✅ Deposit 처리
    if (Array.isArray(deposit_ids)) {
      for (let id of deposit_ids) {
        // 💬 dp_amount와 po_amount를 모두 조회
        const [[po]] = await db.query('SELECT dp_amount, po_amount FROM import_po WHERE id = ?', [id]);

        const dex_amount = po.dp_amount / rate; // 💬 지급 금액 (환율 적용)
        const new_balance = po.po_amount - po.dp_amount; // 💬 남은 잔액 계산
        const zero_dp = 0; // 💬 지급 완료 → dp_amount = 0

        await db.query(
          `UPDATE import_po 
           SET dex_date = ?, dex_rate = ?, dex_amount = ?, 
               dp_amount = ?, balance = ?
           WHERE id = ?`,
          [date, rate, dex_amount, zero_dp, new_balance, id]
        );
      }
    }

    // ✅ Balance 처리
    if (Array.isArray(balance_ids)) {
      for (let id of balance_ids) {
        // 💬 balance 값 조회
        const [[po]] = await db.query('SELECT balance FROM import_po WHERE id = ?', [id]);

        const bex_amount = po.balance / rate; // 💬 지급 금액 (환율 적용)
        const zero = 0; // 💬 지급 완료 → balance = 0, dp_amount = 0

        await db.query(
          `UPDATE import_po 
           SET bex_date = ?, bex_rate = ?, bex_amount = ?, 
               dp_amount = ?, balance = ?
           WHERE id = ?`,
          [date, rate, bex_amount, zero, zero, id]
        );
      }
    }

    res.redirect('/admin/import_po');
  } catch (err) {
    console.error('💥 paid 처리 오류:', err);
    res.status(500).send('지급 처리 실패: ' + err.message);
  }
});



module.exports = router;
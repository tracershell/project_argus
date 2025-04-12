const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');

// ✅ 기본 import_po 페이지 렌더링
router.get('/', async (req, res) => {
  try {
    const { v_name, po_no, style, pay_date } = req.query;  // ✅ pay_date 추가
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
      style,
      pay_date: ''
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
      INSERT INTO import_po (
        po_date, v_name, style, po_no, pcs, cost,
        po_amount, pdp_amount, v_rate, dp_amount, balance,
        dex_rmbamount, bex_rmbamount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        po_date, v_name, style, po_no, n_pcs, n_cost,
        po_amount, 0, v_rate, dp_amount, balance,
        0.00, 0.00 // ✅ 신규 필드: dex_rmbamount, bex_rmbamount 초기값 설정
      ]
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
      INSERT INTO import_po (
        po_date, v_name, style, pcs, cost,
        po_amount, pdp_amount, v_rate, dp_amount, balance, note,
        dex_rmbamount, bex_rmbamount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safe_date, v_name, safe_style, pcs, safe_cost,
        po_amount, 0, v_rate, dp_amount, balance, note,
        0.00, 0.00 // ✅ 신규 필드: dex_rmbamount, bex_rmbamount 초기값 설정
      ]
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
    const { v_name, style, po_no, dex_date, bex_date, pay_date = '' } = req.query;
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
      pay_date,
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


// ✅ 수정 처리 라우터
router.post('/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { po_date, v_name, style, po_no, pcs, cost, v_rate, note } = req.body;

    // 🔹 숫자형 변환
    const n_pcs = !isNaN(parseInt(pcs)) ? parseInt(pcs) : 1;
    const n_cost = !isNaN(parseFloat(cost)) ? parseFloat(cost) : 0.00;
    const n_rate = v_rate === null || v_rate === '' || isNaN(parseFloat(v_rate)) ? null : parseFloat(v_rate);

    // 🔹 기존 dp_amount, pdp_amount 조회 (지급 여부 판단용)
    const [[oldPO]] = await db.query(`
      SELECT dp_amount, pdp_amount, dex_rmbamount, bex_rmbamount 
      FROM import_po WHERE id = ?`, [id]);

    const prevDpAmount = Number(oldPO.dp_amount || 0);      // 현재 미지급 deposit
    const paidDpAmount = Number(oldPO.pdp_amount || 0);     // 과거 지급된 deposit 금액 (없으면 0)

    // ✅ 신규 필드: 유지할 이전 값
    const dexRmd = Number(oldPO.dex_rmbamount || 0);
    const bexRmd = Number(oldPO.bex_rmbamount || 0);

    // 🔹 po_amount 재계산
    const po_amount = n_pcs * n_cost;

    let dp_amount = 0;
    let balance = 0;

    if (prevDpAmount === 0) {
      // ✅ 이미 deposit 지급된 상태
      dp_amount = 0;
      balance = po_amount - paidDpAmount;
    } else {
      // ✅ 미지급 상태 → 계산
      dp_amount = n_rate !== null ? po_amount * n_rate / 100 : 0;
      balance = po_amount;  // po_amount와 balance는 동일 
    }

    // ✅ DB 업데이트 시 pdp_amount도 유지
    // ✅ DB 업데이트 (신규 필드 유지 포함)
    await db.query(`
      UPDATE import_po
      SET po_date = ?, v_name = ?, style = ?, po_no = ?, pcs = ?, cost = ?,
          po_amount = ?, v_rate = ?, dp_amount = ?, balance = ?, pdp_amount = ?, note = ?,
          dex_rmbamount = ?, bex_rmbamount = ? -- ✅ 새 필드 유지
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
        paidDpAmount,
        note || '',
        dexRmd,       // ✅ 유지
        bexRmd,       // ✅ 유지
        id
      ]
    );

    res.redirect('/admin/import_po');
  } catch (err) {
    console.error('💥 수정 처리 중 오류:', err);
    res.status(500).send('수정 실패: ' + err.message);
  }
});


// ✅ import_po.js에 추가할 라우터: /paid
router.post('/paid', async (req, res) => {
  try {
    const { pay_date, exchange_rate, deposit_ids = [], balance_ids = [] } = req.body;
    const rate = parseFloat(exchange_rate);
    const date = pay_date;

    // ✅ Deposit 처리 (💲 버튼 클릭 후 제출 시)
    if (Array.isArray(deposit_ids)) {
      for (let id of deposit_ids) {
        // 🔹 기존 dp_amount, po_amount 조회
        const [[po]] = await db.query(
          'SELECT dp_amount, po_amount FROM import_po WHERE id = ?',
          [id]
        );

        const dpAmount = Number(po.dp_amount);        // 현재 미지급 deposit 금액
        const poAmount = Number(po.po_amount);        // 전체 금액
        const dexAmount = parseFloat((dpAmount / rate).toFixed(2));  // 지급 환산 금액
        const newBalance = poAmount - dpAmount;       // 잔액 갱신
        const zero = 0;

        await db.query(`
          UPDATE import_po 
          SET dex_date = ?, 
              dex_rate = ?, 
              dex_amount = ?, 
              dex_rmbamount = ?,       -- ✅ 환산 전 금액 저장
              pdp_amount = ?, 
              dp_amount = ?, 
              balance = ?
          WHERE id = ?`,
          [
            date,         // dex_date
            rate,         // dex_rate
            dexAmount,    // dex_amount
            dpAmount,     // dex_rmbamount
            dpAmount,     // pdp_amount
            zero,         // dp_amount → 지급 완료되었으므로 0
            newBalance,   // balance
            id
          ]
        );
      }
    }

    // ✅ Balance 처리 (💲 버튼 클릭 후 제출 시)
    if (Array.isArray(balance_ids)) {
      for (let id of balance_ids) {
        const [[po]] = await db.query(
          'SELECT balance FROM import_po WHERE id = ?',
          [id]
        );

        const balanceVal = parseFloat(po.balance);
        const exchangeRate = parseFloat(rate);

        // ⚠️ 유효성 확인
        if (isNaN(balanceVal) || isNaN(exchangeRate) || exchangeRate <= 0) {
          console.warn(`❗ 유효하지 않은 balance 또는 환율: balance=${balanceVal}, rate=${exchangeRate}`);
          continue;
        }

        const bexAmount = parseFloat((balanceVal / exchangeRate).toFixed(2));
        const zero = 0;

        await db.query(`
          UPDATE import_po 
          SET bex_date = ?, 
              bex_rate = ?, 
              bex_amount = ?, 
              bex_rmbamount = ?,       -- ✅ 환산 전 금액 저장
              pdp_amount = ?, 
              dp_amount = ?, 
              balance = ?
          WHERE id = ?`,
          [
            date,           // bex_date
            exchangeRate,   // bex_rate
            bexAmount,      // bex_amount
            balanceVal,     // bex_rmbamount
            balanceVal,     // pdp_amount (잔액 전액 지급)
            zero,           // dp_amount
            zero,           // balance
            id
          ]
        );
      }
    }

    res.redirect('/admin/import_po');  // ✅ 정상 처리 후 페이지 이동

  } catch (err) {
    console.error('💥 paid 처리 오류:', err);
    res.status(500).send('지급 처리 실패: ' + err.message);
  }
});


// ✅ Router: /admin/import_po/result
router.get('/result', async (req, res) => {
  try {
    const { v_name, style, po_no, dex_date, bex_date, pay_date = '' } = req.query;
    // ✅ pay_date 기본값

    let where = [];
    let params = [];

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

    let query = `
      SELECT id, po_date, v_name, style, po_no, pcs, cost, po_amount,
             pdp_amount, v_rate, dp_amount, balance, note,
             dex_date, bex_date,
             dex_rmbamount, bex_rmbamount,
             dex_rate, bex_rate,
             dex_amount, bex_amount
      FROM import_po
    `;
    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }
    query += ' ORDER BY po_date DESC, id DESC';

    const [results] = await db.query(query, params);

    // ✅ 날짜/숫자 데이터 가공
    results.forEach(row => {
      row.po_date = row.po_date ? new Date(row.po_date) : null;
      row.dex_date = row.dex_date ? new Date(row.dex_date) : null;
      row.bex_date = row.bex_date ? new Date(row.bex_date) : null;

      row.dex_rate = row.dex_rate ? parseFloat(row.dex_rate) : 0;
      row.bex_rate = row.bex_rate ? parseFloat(row.bex_rate) : 0;
      row.dex_amount = parseFloat(row.dex_amount) || 0;
      row.bex_amount = parseFloat(row.bex_amount) || 0;
      row.dex_rmbamount = parseFloat(row.dex_rmbamount) || 0;
      row.bex_rmbamount = parseFloat(row.bex_rmbamount) || 0;
    });

    const [vendors] = await db.query('SELECT DISTINCT v_name FROM import_po');
    const [styles] = await db.query('SELECT DISTINCT style FROM import_po WHERE style IS NOT NULL');
    const [po_nos] = await db.query('SELECT DISTINCT po_no FROM import_po WHERE po_no IS NOT NULL');

    res.render('admin/import/import_po_result', {
      results,
      vendors,
      styles,
      po_nos,
      v_name,
      style,
      po_no,
      pay_date // ✅ 전달
    });
  } catch (err) {
    console.error('💥 /result 라우터 오류:', err);
    res.status(500).send('Import PO Result 조회 실패: ' + err.message);
  }
});

module.exports = router;
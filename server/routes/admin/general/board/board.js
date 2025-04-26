const express = require('express');
const router = express.Router();

// GET: board 페이지 렌더링
router.get('/', (req, res) => {
  res.render('admin/general/board/board');
});

// POST: 버튼 클릭 처리
router.post('/select', (req, res) => {
  const boardName = req.body.boardName;
  console.log(`✅ 선택된 보드: ${boardName}`);
  // 선택한 보드에 따라 다른 화면 또는 로직으로 이동
  res.render('admin/general/board/board01/board01', { boardName });
});

module.exports = router;

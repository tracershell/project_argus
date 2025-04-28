const express = require('express');
const router = express.Router();

// GET: board 메인 페이지 렌더링
router.get('/', (req, res) => {
  res.render('admin/general/board/board');
});

// POST: 버튼 클릭 처리
router.post('/select', (req, res) => {
  const boardName = req.body.boardName;
  console.log(`✅ 선택된 보드: ${boardName}`);

  if (!boardName) {
    return res.status(400).send('Board name is missing.');
  }

  // boardName이 'board 01' 같은 형식이므로 숫자만 추출
  const boardNumber = boardName.replace('board ', '').padStart(2, '0');

  // 렌더링할 EJS 경로 설정
  const renderPath = `admin/general/board/board${boardNumber}/board${boardNumber}`;

  res.render(renderPath, { boardName });
});

module.exports = router;

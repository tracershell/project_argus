const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('start', { title: 'Start Page' });  // isAuthenticated(로그인 여부 확인위해)는 전역에서 자동 전달됨 (server.js 에서 전역변수로 설정)
});

module.exports = router;

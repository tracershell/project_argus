// server/routes/register.js

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController'); // 로그인/회원가입 처리 함수
const db = require('../../db/mysql'); // DB 연결

// ✅ 로그인 화면
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// ✅ 로그인 처리
router.post('/login', authController.loginUser);

// ✅ 회원가입 화면
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// ✅ 회원가입 처리
router.post('/register', authController.registerUser);

// ✅ 로그아웃
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('로그아웃 실패');
    }
    res.redirect('/login');
  });
});

// ✅ 로그인 여부 확인용 미들웨어
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
}

module.exports = router;

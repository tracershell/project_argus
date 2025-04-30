const express = require('express');
const router = express.Router();
const db = require('../db'); // 실제 DB 모듈

router.get('/login', (req, res) => {
  res.render('login'); // login.ejs 페이지 보여줌
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 예시: DB에서 사용자 정보 확인
  const [user] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

  if (user) {
    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };
    return res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});


// ===== 라우팅 =====

// 로그인 페이지
app.get('/test_login', (req, res) => {
  res.render('test_login');
});

// 로그인 처리
app.post('/test_login', (req, res) => {
  const { username, password } = req.body;

  // ✅ 테스트용 사용자 하드코딩
  if (username === 'test' && password === '1234') {
    req.session.user = {
      id: 1,
      username: 'test',
      name: 'Test User',
      role: 'admin'
    };
    res.redirect('/dashboard');
  } else {
    res.render('test_login', { error: 'Invalid username or password' });
  }
});

// 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// 보호된 대시보드 페이지
app.get('/dashboard', isLoggedIn, (req, res) => {
  res.send(`
    <h2>Welcome, ${req.session.user.name}</h2>
    <p>Role: ${req.session.user.role}</p>
    <a href="/logout">Logout</a>
  `);
});

// 기본 루트 → 로그인으로 이동
app.get('/', (req, res) => {
  res.redirect('/login');
});

module.exports = router;

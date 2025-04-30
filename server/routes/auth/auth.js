// server/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController'); // 컨트롤러 가져오기

// ✅ 로그인 페이지 : start page 에서 들어 온 login 을 login.ejs 로 라우팅
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login', error: null });
});


// router.get('/login', (req, res) => {
//   res.render('login', { title: 'Login', error: null }); // login.ejs rendering 시 title, error 값 전달- ejs 에서 받도록 code 를 작성했기 때문
// });



// ✅ 로그인 처리 : login.ejs 에서 POST 로 보내온 비어있는 req.body 에 미들웨어 body parser 를 통해 req.body 에 담아 전달 받음
// router.post('/login', (req, res) => {
//   const { username, password } = req.body;

//   if (username === 'admin' && password === '1234') {
//     req.session.user = { name: 'Admin' };
//     res.redirect('/');
//   } else {
//     res.render('login', {
//       title: 'Login',
//       error: 'Invalid username or password',
//       isAuthenticated: false
//     });
//   }
// });

router.post('/login', authController.loginUser); // authController 에서 loginUser 함수 가져와서 사용

// name="username"&password="pw"  === 미들 웨어 ===> 객체 {name: 'username', password: 'pw'}
// 전달 받은 req.body authController(디렉토리 변수에).loginUser 함수에 연결
// router.post('/login', authController.loginUser); // 값을 함수로 전달


// ✅ 회원가입 페이지 : start page 에서 들어 온 register 를 register.ejs 로 라우팅팅
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Registration', error: null });
});

// ✅ 회원가입 처리 : register.ejs 에서 입력된 값 처리
router.post('/register', authController.registerUser);

// ✅ 로그아웃
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('로그아웃 실패');
    res.redirect('/login');
  });
});

// ✅ 로그인 여부 확인 미들웨어
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

module.exports = router;

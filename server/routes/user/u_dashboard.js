const express = require('express');
const router = express.Router();

// 로그인된 사용자만 접근 가능
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

router.get('/u_dashboard', isAuthenticated, (req, res) => {  // ✅ 여기서 req.session.user 를 EJS에 user 변수로 전달
  res.render('user/u_dashboard', {
    user: req.session.user,
    title: 'User Dashboard'
  });
});    // ✅ req 전달 : res.render('dashboard') => res.render('dashboard',{user: req.session.user}) 세션 정보 담아 전달  


module.exports = router;
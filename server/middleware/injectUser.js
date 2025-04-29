// 매번 라우터마다 넘기는 게 번거로우므로, 미들웨서 사용 == server.js 에 등록 : isAuthenticated 자동 사용, req.session 자동사용 가능 
function injectUser(req, res, next) {
  const user = req.session?.user;  // undefined 안전 처리

  res.locals.user = user || null;  // EJS에서 <%= user.username %>
  res.locals.isAuthenticated = !!user;

  next();
}

module.exports = injectUser;
// 매번 라우터마다 넘기는 게 번거로우므로, 미들웨서 사용 == server.js 에 등록 : isAuthenticated 자동 사용 가능 
function injectUser(req, res, next) {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
}

module.exports = injectUser;

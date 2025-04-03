require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session'); // 세션 미들웨서 설정 (아래 session 사용에 필요)
const RedisStore = require('connect-redis')(session); //  redis session 을 사용하기 위해 설정 1
const { createClient } = require('redis'); // redis session 을 사용하기 위해 설정 2

const app = express();

// ====== Middleware 설정 ====== \\
app.use(express.urlencoded({ extended: true })); // HTML <form> </form> 전송에 필요
app.use(express.json());  // JavaScript fetch 나 axios 전송에 필요

// ===== redis 세션 설정 ===== \\ : 로그인 후 세션을 저장하면 RAM 에 저장되며 서버가 재시작 되면 사라짐 (저장된 세션의 ID와 PATH 는 Client 에 쿠키 형태로 저장장)
// redis Client 생성 및 연결
const redisClient = createClient({
  legacyMode: true,
  socket: {
    host: 'localhost',
    port: 6379
  }
});


redisClient.connect().catch(console.error);   //// redis connect

// ====== express-session + redis 연동 ======
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'my-secret-key', // ✅ .env 사용 권장
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 30,
    httpOnly: true
  }
}));

// ===== 정적 파일 제공 ===== \\
app.use(express.static(path.join(__dirname, 'public')));  // 정적파일 [현재 실행중인(server.js)디렉토리/public]

// ===== EJS 뷰 설정 ===== \\
app.set('view engine', 'ejs');                      // view 엔진 : 확장자 ejs
app.set('views', path.join(__dirname, 'views'));    // views 가 있는 곳: 현재 실행중인(server.js) 디렉토리/views ==> 경로만 지정하는 역할


// ===== Express 웹서버에서 라우터를 연결하는 핵심역할 : 라우터 연결 ===== \\
const startRoutes = require('./server/routes/start');  // start.js 라우터 파일 연결 (시작화면 start.ejs 와 연결위해)
app.use('/', startRoutes);   // 라우터 등록 : router.get(), router.post() 를 처리 가능

const authRoutes = require('./server/routes/auth'); // ./routes/auth.js 파일을 불러옴 (라우터 객체를 받음)
app.use('/', authRoutes);   // 라우터 등록 : router.get(), router.post() 를 처리 가능

const dashboardRoutes = require('./server/routes/dashboard'); // ./routes/dashboard.js 파일을 불러옴 (라우터 객체를 받음)
app.use('/', dashboardRoutes);   // 라우터 등록 : 로그인 authController 에서 과정을 거쳐 res.redirect('/dashboard') 한 것도 라우터로 처리리

const generalRoutes = require('./server/routes/general'); // ./routes/dashboard.js 파일을 불러옴 (라우터 객체를 받음)
app.use('/', generalRoutes);   // 라우터 등록 : 로그인 authController 에서 과정을 거쳐 res.redirect('/dashboard') 한 것도 라우터로 처리리

const employeesRoutes = require('./server/routes/employees'); // ./routes/dashboard.js 파일을 불러옴 (라우터 객체를 받음)
app.use('/', employeesRoutes);   // 라우터 등록 : 로그인 authController 에서 과정을 거쳐 res.redirect('/dashboard') 한 것도 라우터로 처리리


// ====== 서버 시작 ====== \\
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});



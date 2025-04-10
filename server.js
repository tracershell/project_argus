require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session'); // 세션 미들웨서 설정 (아래 session 사용에 필요)
const RedisStore = require('connect-redis')(session); //  redis session 을 사용하기 위해 설정 1
const { createClient } = require('redis'); // redis session 을 사용하기 위해 설정 2
const expressLayouts = require('express-ejs-layouts');  // 공통 layout 설정 위해해
const injectUser = require('./middleware/injectUser'); // res.render() 마다 user 를 넘기지 않아도/ isAuthenticated  자동으로 접근 가능하게 하는 미들웨어 

const app = express();



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

// ===== session 등록 후 isAuthenticated, req.session  미들웨어 설정 ===== \\
// 로그인 여부 확인 미들웨서 설정 (아래 injectUser 사용에 필요) : isAuthenticated 자동사용 위해
app.use(injectUser); // 이거 하나면 모든 EJS에서 user / isAuthenticated 자동 사용 가능  


// ====== Middleware 설정 ====== \\
app.use(express.urlencoded({ extended: true })); // HTML <form> </form> 전송에 필요
app.use(express.json());  // JavaScript fetch 나 axios 전송에 필요

// ====== 세션과 별도로 현재 사용자가 로그인 되어 있는지 여부 판단을 위해 ===== : 라우터 설치 전에 위치치\\
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.user;  // 세션 user 가 있으면 isAuthenticated = true : ejs rndering 시 매번 유저의 로그인 여부를 확인하기 위해 isAuthenticated 변수 같이 넘겨야 하는데, 편리를 위해 전역변수로 설정
  res.locals.user = req.session.user || null;       // !! booleqn 변환(true, false) : req.session.user 가 있으면 true, 없으면 false
  next();                                           // 다음 으로 넘어 감
});


// ===== 정적 파일 제공 ===== \\
app.use(express.static(path.join(__dirname, 'public')));  // 정적파일 [현재 실행중인(server.js)디렉토리/public]

// ===== EJS 뷰 설정 ===== \\
app.set('view engine', 'ejs');                      // view 엔진 : 확장자 ejs
app.set('views', path.join(__dirname, 'views'));    // views 가 있는 곳: 현재 실행중인(server.js) 디렉토리/views ==> 경로만 지정하는 역할

// ===== 공통 layout 을 사용하기 위한 미들 웨어 ===== \\
app.use(expressLayouts);
app.set('layout', 'layout'); // 'views/layout.ejs'를 기본 레이아웃으로 사용 

// ===== webpage 마다 route 설정 \\
// ===== admin Routes 설정 ===== \\
const a_dashboardRoutes = require('./server/routes/admin/a_dashboard');
app.use('/admin', a_dashboardRoutes);   // url 이 /admin 으로 시작하는 모든 요청은 a_dashboard.js 에서 처리됨

// ===== photo_admin Routes 설정 ===== \\
const photo_adminRoutes = require('./server/routes/admin/photo_admin');
app.use('/photo_admin', photo_adminRoutes);   // url 이 /photo_admin 으로 시작하는 모든 요청은 photo_admin.js 에서 처리됨

// ===== music_admin Routes 설정 ===== \\
const music_adminRoutes = require('./server/routes/admin/music_admin');
app.use('/music_admin', music_adminRoutes);   // url 이 /music_admin 으로 시작하는 모든 요청은 music_admin.js 에서 처리됨

// ===== movie_admin Routes 설정 ===== \\
const movie_adminRoutes = require('./server/routes/admin/movie_admin');
app.use('/movie_admin', movie_adminRoutes);   // url 이 /video_admin 으로 시작하는 모든 요청은 video_admin.js 에서 처리됨

//====================================================================================================================
const importVendorRoutes = require('./server/routes/admin/import/import_vendor');
app.use('/admin/import', importVendorRoutes);

app.use('/admin/import', require('./server/routes/admin/import/import_vendor_list_pdf'));

app.use('/admin/import_po', require('./server/routes/admin/import/import_po'));

app.use('/admin/domestic', require('./server/routes/admin/domestic/domestic_vendor'));

app.use('/admin/domestic', require('./server/routes/admin/domestic/domestic_vendor_list_pdf'));

app.use('/admin/domestic_invoice', require('./server/routes/admin/domestic/domestic_invoice'));

app.use('/admin/domestic_invoice_pdf', require('./server/routes/admin/domestic/domestic_invoice_list_pdf'));

app.use('/admin/domestic_invoice_result_pdf', require('./server/routes/admin/domestic/domestic_invoice_result_pdf'));
//====================================================================================================================
// ===== user Routes 설정 ===== \\
const u_dashboardRoutes = require('./server/routes/user/u_dashboard');
app.use('/user', u_dashboardRoutes);   // url 이 /user 으로 시작하는 모든 요청은 u_dashboard.js 에서 처리됨

// ===== photo_gallery Routes 설정 ===== \\
const photo_galleryRoutes = require('./server/routes/user/photo_gallery');
app.use('/photo_gallery', photo_galleryRoutes);   // url 이 /photo_gallery 으로 시작하는 모든 요청은 photo.js 에서 처리됨

// ===== movie_gallery Routes 설정 ===== \\
const movie_galleryRoutes = require('./server/routes/user/movie_gallery');
app.use('/movie_gallery', movie_galleryRoutes);

// ===== music_gallery Routes 설정 ===== \\
const music_galleryRoutes = require('./server/routes/user/music_gallery');
app.use('/music_gallery', music_galleryRoutes);


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



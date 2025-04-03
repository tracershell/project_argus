// =====  controllers/authController.js ===== \\
const bcrypt = require('bcrypt'); // bcrypt 로 password 처리 위한 module      
const db = require('../server/db/mysql'); // DB 연결

// ✅ 로그인 처리
const loginUser = async (req, res) => {   // router 로 부터 연결된 loginUser 비동기 함수 <== async key word (await 사용 가능)
  const { username, password } = req.body; // Client 가 POST 전송한 로그인 정보가 담긴 객체 req.body 를 {username, password} 구조 분해

  // 예외 또는 오류 발생시 처리하가 위한 try-catch 문 : DB 조회나 bcrypt 처리중 오류가 생기면 catch 로 넘어가도록 보호호
  try { 
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]); // 사용자 정보 조회 쿼리 : ? 는 sql 인젝션 방지를 위한 자리표시자자
    const user = rows[0]; // 첫번째 레코드 row[0] 의 값을 user 로 저장 ==> 객체가 되어 user.password ~ user.email 을 사용 가능능
                          // user.id, user.name, user.password, user.email, user.name, user.role, user.status, user.last_login

    if (!user) {      // user 가 없을 경우
      return res.render('login', { error: '사용자 없음' }); // error code 를 login.ejs 로 전달 :  error 객체 값 {error: '사용자 없음'}  
    }

    const match = await bcrypt.compare(password, user.password); // 전달 받은 password 와 user.password hash값을 비교 

    if (!match) {   // 일치하지 않을 경우
      return res.render('login', { error: '비밀번호 불일치' }); // error code 를 login.ejs 로 전달 :  error 객체 값 {error: '비밀번호 불일치'}  
    }
    
    // redis 사용하여 로그인 성공시 req.session.user 에 id, username, role 에 값들을 저장
    req.session.user = {    // 로그인 성공시 req.session.user 에 id, username, role 에 값들을 저장
      id: user.id,
      username: user.username,
      role: user.role
    };

    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]); // user id 값을 가지고 있는 last_login 값을 현재값으로 변경경

    res.redirect('/dashboard'); // dashboard.ejs 로 바로 랜더링 
  } catch (err) {   // 로그인 과정에서 err 처리
    console.error(err); // console 에 에러 표시시
    res.render('login', { error: '로그인 실패' }); // error code 를 login.ejs 로 전달 :  error 객체 값 {error: '로그인 실패'}  
  }
};

// ✅ 회원가입 처리 함수
const registerUser = async (req, res) => {
  const { username, password, email, name, role, status } = req.body;

  try {
    // 아이디 중복 확인
    const [existingUsers] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.render('register', { error: '이미 사용 중인 아이디입니다. 다른 아이디를 사용해주세요.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      'INSERT INTO users (username, password, email, name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, name, role || 'user', status || 'active']
    );

    return res.redirect('/login');
  } catch (err) {
    console.error('[회원가입 실패]', err);

    // 구체적인 오류 메시지 처리
    if (err.code === 'ER_DUP_ENTRY') {
      return res.render('register', { error: '이미 사용 중인 아이디입니다. 다른 아이디를 사용해주세요.' });
    } else if (err.code === 'ER_BAD_NULL_ERROR') {
      return res.render('register', { error: '필수 입력 항목을 모두 작성해주세요.' });
    } else if (err.code === 'ER_DATA_TOO_LONG') {
      return res.render('register', { error: '입력 값이 너무 깁니다. 다시 확인해주세요.' });
    }

    return res.render('register', { error: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
};

// ✅ export
exports.loginUser = loginUser;
exports.registerUser = registerUser;

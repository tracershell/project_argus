CREATE DATABASE project_201_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE project_201_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,                     -- 고유 ID (자동 증가)
  username VARCHAR(50) NOT NULL UNIQUE,                  -- 로그인 ID (중복 불가)
  password VARCHAR(255) NOT NULL,                        -- 암호화된 비밀번호 저장용
  email VARCHAR(100),                                    -- 이메일 (선택)
  name VARCHAR(100),                                     -- 이름 (선택)
  role ENUM('admin', 'user') DEFAULT 'user',             -- 사용자 권한
  status ENUM('active', 'inactive') DEFAULT 'active',    -- 계정 상태
  last_login DATETIME,                                   -- 마지막 로그인 시간
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,        -- 생성 시간
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
              ON UPDATE CURRENT_TIMESTAMP                -- 수정 시간 자동 업데이트
);

INSERT INTO users (username, password, role)
VALUES 
('tshell', 'ts3300', 'user'),
('tracershell', 'ts330069', 'admin');



CREATE TABLE import_vendor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE,
  v_name VARCHAR(100),
  vd_rate DECIMAL(5,2),
  v_address1 VARCHAR(200),
  v_address2 VARCHAR(200),
  v_phone VARCHAR(50),
  v_email VARCHAR(100),
  v_note TEXT
);

CREATE TABLE import_po (
  id INT PRIMARY KEY AUTO_INCREMENT,
  po_date DATE NOT NULL,
  v_name VARCHAR(100) NOT NULL,
  style VARCHAR(100),
  po_no VARCHAR(100),
  pcs INT DEFAULT 1,
  cost DECIMAL(10,2) DEFAULT 0.00,
  po_amount DECIMAL(12,2) DEFAULT 0.00,

  -- Paid 된 deposit Amount 저장칸
  pdp_amount DECIMAL(12,2) DEFAULT 0.00,

  v_rate DECIMAL(5,2) DEFAULT 0.00,
  dp_amount DECIMAL(12,2) DEFAULT 0.00,
  balance DECIMAL(12,2) DEFAULT 0.00,
  note TEXT,

  dex_date DATE,
  dex_rmbamount DECIMAL(12,2) DEFAULT 0.00,
  dex_rate DECIMAL(10,4),
  dex_amount DECIMAL(12,2),

  bex_date DATE,
  bex_rmbamount DECIMAL(12,2) DEFAULT 0.00,
  bex_rate DECIMAL(10,4),
  bex_amount DECIMAL(12,2)
);


CREATE TABLE domestic_vendor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE,
  v_name VARCHAR(100),
  v_address1 VARCHAR(200),
  v_address2 VARCHAR(200),
  v_phone VARCHAR(50),
  v_email VARCHAR(100),
  v_note TEXT
);

CREATE TABLE domestic_invoice (
  id INT AUTO_INCREMENT PRIMARY KEY,
  iv_date DATE NOT NULL,            -- Invoice Date
  dv_name VARCHAR(100) NOT NULL,    -- Domestic Vendor Name (from domestic_vendor.v_name)
  di_no VARCHAR(50) NOT NULL,       -- Domestic Invoice Number
  di_amount DECIMAL(12, 2) NOT NULL,-- Invoice Total Amount
  ip_date DATE DEFAULT NULL,        -- Invoice Pay Date
  ip_amount DECIMAL(12, 2) DEFAULT 0.00, -- Paid Amount
  ib_amount DECIMAL(12, 2) DEFAULT 0.00, -- Balance = di_amount - ip_amount
  note TEXT                         -- Note or remarks (ex: full paid)
);

CREATE TABLE employees (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(10),
  eid VARCHAR(10),
  name VARCHAR(60),
  ss VARCHAR(20),
  birth DATE,
  email VARCHAR(60),
  phone VARCHAR(60),
  jcode VARCHAR(10),
  jtitle VARCHAR(60),
  sdate DATE,
  edate DATE,
  sick INT,
  work1 VARCHAR(20),
  address VARCHAR(100),
  city VARCHAR(50),
  state VARCHAR(50),
  zip VARCHAR(20),
  remark TEXT
);


CREATE TABLE payroll_tax (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eid VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  jcode VARCHAR(20),
  jtitle VARCHAR(50),
  work1 VARCHAR(50),

  pdate DATE NOT NULL,
  ckno VARCHAR(20),
  rtime DECIMAL(10,2) DEFAULT 0,
  otime DECIMAL(10,2) DEFAULT 0,
  dtime DECIMAL(10,2) DEFAULT 0,

  fw DECIMAL(10,2) DEFAULT 0,
  sse DECIMAL(10,2) DEFAULT 0,
  me DECIMAL(10,2) DEFAULT 0,
  caw DECIMAL(10,2) DEFAULT 0,
  cade DECIMAL(10,2) DEFAULT 0,

  adv DECIMAL(10,2) DEFAULT 0,
  csp DECIMAL(10,2) DEFAULT 0,
  dd DECIMAL(10,2) DEFAULT 0,

  gross DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  net DECIMAL(10,2) DEFAULT 0,

  remark VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original VARCHAR(255),
  thumbnail VARCHAR(255),
  date DATE,
  comment TEXT,
  place VARCHAR(100),
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE musics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original VARCHAR(255) NOT NULL,        -- 음악 파일명 (파일시스템에 저장된 이름)
  textfile VARCHAR(255),                 -- 선택적으로 업로드한 텍스트 파일명 (.txt)
  date DATE NOT NULL,                    -- 음악과 관련된 날짜
  comment TEXT NOT NULL,                 -- 코멘트 입력
  keyword VARCHAR(255) NOT NULL,         -- 키워드 입력
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 레코드 생성 시각
);

CREATE TABLE movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_filename VARCHAR(255),
  thumbnail VARCHAR(255),
  date DATE,
  comment TEXT,
  keyword VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE employees_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eid VARCHAR(50) NOT NULL,        -- 직원 ID (employees.eid와 연결)
  filename VARCHAR(255) NOT NULL,  -- 실제 저장된 파일명
  originalname VARCHAR(255),       -- 원래 파일명 (보여주기 용도)
  comment VARCHAR(255),            -- 파일에 대한 설명 또는 메모
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE schedule_plan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cycle_type ENUM('yearly', 'monthly', 'weekly', 'daily') NOT NULL, -- 반복 주기
  month INT DEFAULT NULL,      -- 매년: 월 (1~12)
  day INT DEFAULT NULL,        -- 매년, 매월: 일 (1~31)
  weekday ENUM('sun','mon','tue','wed','thu','fri','sat') DEFAULT NULL, -- 매주
  hour INT NOT NULL,           -- 알림 시
  minute INT NOT NULL,         -- 알림 분
  message TEXT NOT NULL,       -- 팝업 메시지
  active BOOLEAN DEFAULT TRUE, -- 사용 여부
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE doc_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,        -- 카테고리 이름
  code VARCHAR(50) UNIQUE,           -- 내부코드 (예: "REQUIRED", "TAX", "BIZ_INS", 등)
  description TEXT DEFAULT NULL,     -- 설명 (선택)
  active BOOLEAN DEFAULT TRUE,       -- 사용 여부 (숨김처리 등 관리용)
  sort_order INT DEFAULT 0,          -- 정렬 우선순위 (콤보박스에서 정렬 용도)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE doc_manager (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doc_id INT NOT NULL,                         -- doc_list.id 와 연결
  filename VARCHAR(255) NOT NULL,              -- 저장된 실제 파일명
  originalname VARCHAR(255) NOT NULL,          -- 원본 파일명
  comment TEXT,                                -- 파일 설명
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doc_id) REFERENCES doc_list(id) ON DELETE CASCADE
);


CREATE TABLE card_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cardcom_name VARCHAR(100) NOT NULL,        -- 카드사 이름 (ex: Samsung Card, Amex)
  cardcom_account VARCHAR(50),               -- 카드사 제공 계정 번호 또는 식별자
  cardown_name VARCHAR(100) NOT NULL,        -- 카드 소유자 이름 (ex: 홍길동)
  cardown_account VARCHAR(50),               -- 카드 번호 뒷자리 또는 내부 식별용
  card_type ENUM('개인', '법인') DEFAULT '개인', -- 선택사항: 카드 성격
  active BOOLEAN DEFAULT TRUE,               -- 사용 여부
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE card_acclist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cardacc_name VARCHAR(100) NOT NULL,        -- 항목 이름
  cardacc_code VARCHAR(50) NOT NULL,         -- 항목 코드 (예: FUEL, TRAVEL)
  cardacc_comment TEXT,                      -- 설명
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE card_transaction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cardcom_name VARCHAR(100),
  cardcom_account VARCHAR(50),
  cardown_name VARCHAR(100),
  cardown_account VARCHAR(50),
  cardacc_name VARCHAR(100),
  cardacc_code VARCHAR(50),
  paydate DATE,
  paytype ENUM('check pay', 'direct debit'),
  checkno VARCHAR(50),
  payamount DECIMAL(10,2),
  trdate DATE,
  tramount DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE sick_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eid VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  givensick DECIMAL(5,1) DEFAULT 0,
  sickdate DATE NOT NULL,
  usedsick DECIMAL(5,1) NOT NULL,
  remainsick DECIMAL(5,1) GENERATED ALWAYS AS (givensick - usedsick) STORED,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ✅ MySQL 스키마: envelop_each
CREATE TABLE envelop_each (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ename VARCHAR(100) NOT NULL,
  eref VARCHAR(100),
  estreet VARCHAR(255),
  ecity VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE envelop_group (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gno VARCHAR(50) NOT NULL,
  ono INT NOT NULL,
  gmname VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE petty_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pldate DATE NOT NULL,
  plcredit DECIMAL(10,2) DEFAULT 0,
  pldebit DECIMAL(10,2) DEFAULT 0,
  plbalance DECIMAL(10,2) DEFAULT 0,
  plcomment VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE simple_doc (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  originalname VARCHAR(255),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  category VARCHAR(50) DEFAULT NOT NULL,      -- 카테고리 (ex: "invoice", "receipt", "contract" 등)
);


CREATE TABLE cash_receipt (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crname VARCHAR(100) NOT NULL,
  cramount DECIMAL(10,2) NOT NULL DEFAULT 0,
  category ENUM('period', 'day') NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ MySQL 테이블 monthlycd_list 생성
CREATE TABLE monthlycd_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mcdcompany VARCHAR(100) NOT NULL,
  mcdcoaccount VARCHAR(100) NOT NULL,
  mcdowner VARCHAR(100) NOT NULL,
  mcdowaccount VARCHAR(100) NOT NULL,
  mcdcgdate INT NOT NULL CHECK (mcdcgdate BETWEEN 1 AND 31),
  mcdcharge DECIMAL(10,2) DEFAULT 0,
  mcdcomment TEXT,
  mcdsite VARCHAR(255),
  mcdlogin VARCHAR(255),
  mcdpw VARCHAR(255),
  mcdremark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
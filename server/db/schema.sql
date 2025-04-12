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

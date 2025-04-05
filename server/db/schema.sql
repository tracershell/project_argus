CREATE DATABASE project_layout_test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE project_layout_test_db;

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
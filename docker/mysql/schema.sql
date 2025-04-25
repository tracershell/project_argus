-- CREATE DATABASE project_301_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE project_301_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,                    
  username VARCHAR(50) NOT NULL UNIQUE,                 
  password VARCHAR(255) NOT NULL,                       
  email VARCHAR(100),                                    
  name VARCHAR(100),                                    
  role ENUM('admin', 'user') DEFAULT 'user',            
  status ENUM('active', 'inactive') DEFAULT 'active',    
  last_login DATETIME,                                   
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
              ON UPDATE CURRENT_TIMESTAMP                
);



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
  iv_date DATE NOT NULL,            
  dv_name VARCHAR(100) NOT NULL,    
  di_no VARCHAR(50) NOT NULL,       
  di_amount DECIMAL(12, 2) NOT NULL,
  ip_date DATE DEFAULT NULL,       
  ip_amount DECIMAL(12, 2) DEFAULT 0.00,
  ib_amount DECIMAL(12, 2) DEFAULT 0.00,
  note TEXT                         
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
  original VARCHAR(255) NOT NULL,        
  textfile VARCHAR(255),                 
  date DATE NOT NULL,                    
  comment TEXT NOT NULL,                 
  keyword VARCHAR(255) NOT NULL,         
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
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
  eid VARCHAR(50) NOT NULL,      
  filename VARCHAR(255) NOT NULL, 
  originalname VARCHAR(255),      
  comment VARCHAR(255),            
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE schedule_plan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cycle_type ENUM('yearly', 'monthly', 'weekly', 'daily') NOT NULL, 
  month INT DEFAULT NULL,     
  day INT DEFAULT NULL,        
  weekday ENUM('sun','mon','tue','wed','thu','fri','sat') DEFAULT NULL,
  hour INT NOT NULL,           
  minute INT NOT NULL,         
  message TEXT NOT NULL,       
  active BOOLEAN DEFAULT TRUE, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE doc_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,       
  code VARCHAR(50) UNIQUE,           
  description TEXT DEFAULT NULL,     
  active BOOLEAN DEFAULT TRUE,       
  sort_order INT DEFAULT 0,          
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE doc_manager (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doc_id INT NOT NULL,                        
  filename VARCHAR(255) NOT NULL,             
  originalname VARCHAR(255) NOT NULL,        
  comment TEXT,                               
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doc_id) REFERENCES doc_list(id) ON DELETE CASCADE
);


CREATE TABLE card_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cardcom_name VARCHAR(100) NOT NULL,        
  cardcom_account VARCHAR(50),              
  cardown_name VARCHAR(100) NOT NULL,       
  cardown_account VARCHAR(50),              
  card_type ENUM('person', 'company') DEFAULT 'person', 
  active BOOLEAN DEFAULT TRUE,              
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE card_acclist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cardacc_name VARCHAR(100) NOT NULL,        
  cardacc_code VARCHAR(50) NOT NULL,         
  cardacc_comment TEXT,                      
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
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  category VARCHAR(50) NOT NULL
);


CREATE TABLE cash_receipt (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crname VARCHAR(100) NOT NULL,
  cramount DECIMAL(10,2) NOT NULL DEFAULT 0,
  category ENUM('period', 'day') NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


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
const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 📁 업로드 폴더 설정
const uploadPath = path.join(__dirname, '../../../../public/e_uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// 📦 multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${base}_${timestamp}${ext}`);
  },
});
const upload = multer({ storage });

// 📄 직원 파일 관리 페이지
router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const [employees] = await db.query('SELECT eid, name FROM employees ORDER BY name');
    const [files] = await db.query(`
      SELECT ed.*, e.name 
      FROM employees_data ed
      LEFT JOIN employees e ON ed.eid = e.eid
      ORDER BY ed.upload_date DESC
    `);

    res.render('admin/employees/employees_data', {
      layout: 'layout',
      title: 'Employee File Manager',
      isAuthenticated: true,
      name: req.session.user.name,
      employees,
      files
    });
  } catch (err) {
    console.error('DB 조회 오류:', err);
    res.status(500).send('DB 오류');
  }
});

// 📥 파일 업로드
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { eid, comment } = req.body;
  const file = req.file;

  if (!file) {
    return res.send('<script>alert("파일을 선택하세요."); history.back();</script>');
  }

  try {
    await db.query(`
      INSERT INTO employees_data (eid, filename, originalname, comment)
      VALUES (?, ?, ?, ?)
    `, [eid, file.filename, file.originalname, comment]);

    res.redirect('/admin/employees/employees_data');
  } catch (err) {
    console.error('파일 업로드 DB 오류:', err);
    res.status(500).send('파일 업로드 오류');
  }
});

// 🗑 파일 삭제
router.post('/delete/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { id } = req.params;

  try {
    const [[fileRecord]] = await db.query('SELECT filename FROM employees_data WHERE id = ?', [id]);

    if (!fileRecord) {
      return res.send('<script>alert("파일을 찾을 수 없습니다."); history.back();</script>');
    }

    const filePath = path.join(uploadPath, fileRecord.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.query('DELETE FROM employees_data WHERE id = ?', [id]);

    res.redirect('/admin/employees/employees_data');
  } catch (err) {
    console.error('파일 삭제 오류:', err);
    res.status(500).send('파일 삭제 오류');
  }
});

module.exports = router;

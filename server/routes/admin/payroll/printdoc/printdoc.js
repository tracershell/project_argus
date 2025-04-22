// printdoc.js
const express = require('express');
const router = express.Router();
const db = require('../../../../db/mysql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 경로 설정
const uploadPath = path.join(__dirname, '../../../../../public/paydoc_uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${base}_${timestamp}${ext}`);
  }
});
const upload = multer({ storage });

// ✅ printdoc 메인 렌더링 (Time Sheet + Child Support)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM simple_doc ORDER BY uploaded_at DESC LIMIT 1');
    const uploadedFile = rows.length > 0 ? rows[0] : null;

    res.render('admin/payroll/printdoc/printdoc', {
      layout: 'layout',
      title: 'Print Document',
      uploadedFile
    });
  } catch (err) {
    console.error('printdoc 라우터 오류:', err);
    res.status(500).send('라우팅 중 오류 발생');
  }
});

// ✅ 파일 업로드
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.send('<script>alert("파일을 선택하세요."); history.back();</script>');

  await db.query('INSERT INTO simple_doc (filename, originalname) VALUES (?, ?)', [file.filename, file.originalname]);
  res.redirect('/admin/payroll/printdoc/printdoc');
});

// ✅ 파일 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  const [[row]] = await db.query('SELECT filename FROM simple_doc WHERE id = ?', [id]);
  if (!row) return res.send('<script>alert("파일을 찾을 수 없습니다."); history.back();</script>');

  const filePath = path.join(uploadPath, row.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await db.query('DELETE FROM simple_doc WHERE id = ?', [id]);
  res.redirect('/admin/payroll/printdoc/printdoc');
});

module.exports = router;

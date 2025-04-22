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

// ✅ 카테고리별 최근 업로드 파일
router.get('/', async (req, res) => {
  try {
    const [childRows] = await db.query(
      `SELECT * FROM simple_doc WHERE category = 'childsupport' ORDER BY uploaded_at DESC LIMIT 1`
    );
    const [deductRows] = await db.query(
      `SELECT * FROM simple_doc WHERE category = 'deduction' ORDER BY uploaded_at DESC LIMIT 1`
    );

    const uploadedChildFile = childRows.length > 0 ? childRows[0] : null;
    const uploadedDeductFile = deductRows.length > 0 ? deductRows[0] : null;

    res.render('admin/payroll/printdoc/printdoc', {
      layout: 'layout',
      title: 'Print Document',
      uploadedChildFile,
      uploadedDeductFile
    });
  } catch (err) {
    console.error('printdoc 라우터 오류:', err);
    res.status(500).send('라우팅 중 오류 발생');
  }
});


// ✅ 업로드 (Child Support용)
router.post('/upload/childsupport', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.send('<script>alert("파일을 선택하세요."); history.back();</script>');

  await db.query(
    'INSERT INTO simple_doc (filename, originalname, category) VALUES (?, ?, ?)',
    [file.filename, file.originalname, 'childsupport']
  );
  res.redirect('/admin/payroll/printdoc/printdoc');
});

// ✅ 업로드 (Deduction용)
router.post('/upload/deduction', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.send('<script>alert("파일을 선택하세요."); history.back();</script>');

  await db.query(
    'INSERT INTO simple_doc (filename, originalname, category) VALUES (?, ?, ?)',
    [file.filename, file.originalname, 'deduction']
  );
  res.redirect('/admin/payroll/printdoc/printdoc');
});

// ✅ category 별 ID 로 삭제
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

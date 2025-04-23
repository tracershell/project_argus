// ✅ /server/routes/admin/payroll/cashreceipt/cashreceipt_sheet.js
const express = require('express');
const router = express.Router();
const db = require('../../../../db/mysql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath = path.join(__dirname, '../../../../../public/paydoc_uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// 📄 페이지 렌더링
router.get('/', async (req, res) => {
  const [periods] = await db.query("SELECT * FROM cash_receipt WHERE category = 'period'");
  const [days] = await db.query("SELECT * FROM cash_receipt WHERE category = 'day'");

  const [[periodFile]] = await db.query("SELECT * FROM simple_doc WHERE category = 'period' ORDER BY uploaded_at DESC LIMIT 1");
  const [[dayFile]] = await db.query("SELECT * FROM simple_doc WHERE category = 'day' ORDER BY uploaded_at DESC LIMIT 1");

  res.render('admin/payroll/cashreceipt/cashreceipt_sheet', {
    layout: 'layout',
    title: 'Cash Receipt Sheet',
    periods,
    days,
    periodFile,
    dayFile
  });
});

// 📤 파일 업로드
router.post('/upload/:cat', upload.single('file'), async (req, res) => {
  const { cat } = req.params;
  const file = req.file;
  if (!file) return res.send('<script>alert("파일을 선택하세요."); history.back();</script>');

  await db.query('INSERT INTO simple_doc (filename, originalname, category) VALUES (?, ?, ?)', [
    file.filename,
    file.originalname,
    cat
  ]);

  res.redirect('/admin/payroll/cashreceipt/cashreceipt_sheet');
});

// 🗑 파일 삭제
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  const [[row]] = await db.query('SELECT filename FROM simple_doc WHERE id = ?', [id]);
  if (!row) return res.send('<script>alert("파일이 존재하지 않습니다."); history.back();</script>');

  const filePath = path.join(uploadPath, row.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await db.query('DELETE FROM simple_doc WHERE id = ?', [id]);

  res.redirect('/admin/payroll/cashreceipt/cashreceipt_sheet');
});

module.exports = router;


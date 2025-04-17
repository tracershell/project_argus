const express = require('express');
const router = express.Router();
const db = require('../../../db/mysql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath = path.join(__dirname, '../../../../public/doc_uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

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

router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const [categories] = await db.query('SELECT id, name, code FROM doc_list ORDER BY sort_order ASC');
    const [files] = await db.query(`
      SELECT d.*, c.name AS category_name
      FROM doc_manager d
      LEFT JOIN doc_list c ON d.doc_id = c.id
      ORDER BY d.upload_date DESC
    `);
    res.render('admin/document/document_manager', {
      layout: 'layout',
      title: 'Document Manager',
      isAuthenticated: true,
      name: req.session.user.name,
      categories,
      files
    });
  } catch (err) {
    console.error('문서 조회 오류:', err);
    res.status(500).send('문서 조회 오류');
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { doc_id, comment } = req.body;
  const file = req.file;

  if (!file) return res.send('<script>alert("파일을 선택하세요."); history.back();</script>');

  try {
    await db.query(`
      INSERT INTO doc_manager (doc_id, filename, originalname, comment)
      VALUES (?, ?, ?, ?)
    `, [doc_id, file.filename, file.originalname, comment]);
    res.redirect('/admin/document/document_manager');
  } catch (err) {
    console.error('업로드 오류:', err);
    res.status(500).send('업로드 중 오류 발생');
  }
});

router.post('/delete/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { id } = req.params;

  try {
    const [[record]] = await db.query('SELECT filename FROM doc_manager WHERE id = ?', [id]);
    if (!record) return res.send('<script>alert("파일을 찾을 수 없습니다."); history.back();</script>');

    const filePath = path.join(uploadPath, record.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.query('DELETE FROM doc_manager WHERE id = ?', [id]);
    res.redirect('/admin/document/document_manager');
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).send('삭제 중 오류 발생');
  }
});

module.exports = router;

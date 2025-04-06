const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../../db/mysql');

// music 파일 저장 폴더: public/m_uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/m_uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM musics ORDER BY id DESC');
  res.render('admin/music/music', {
    user: req.session.user,
    musics: rows,
    title: 'music_admin'
  });
});

router.post('/upload', upload.single('music'), async (req, res) => {
  try {
    const { date, comment, keyword } = req.body;
    const original = req.file.filename;

    await db.query(
      'INSERT INTO musics (original, date, comment, keyword) VALUES (?, ?, ?, ?)',
      [original, date, comment, keyword]
    );

    res.redirect('/music_admin');
  } catch (err) {
    console.error('Music Upload Error:', err);
    res.status(500).send('Upload failed');
  }
});

router.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../../../public/m_uploads', req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).send('File not found');
    }
  });
});

// ===== 화면 삭제시 db id 삭제 및 폴더에 있는 파일 삭제 ===== \\
router.get('/delete/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT original FROM musics WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).send('Music not found');

    const { original } = rows[0];
    const filePath = path.join(__dirname, '../../../public/m_uploads', original);

    // 파일 삭제
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // DB 삭제
    await db.query('DELETE FROM musics WHERE id = ?', [req.params.id]);

    res.redirect('/music_admin');
  } catch (err) {
    console.error('Music Delete Error:', err);
    res.status(500).send('Delete failed');
  }
});
router.get('/edit/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM musics WHERE id = ?', [req.params.id]);
  res.render('admin/music/music_edit', { music: rows[0] });
});

router.post('/edit/:id', async (req, res) => {
  const { comment, keyword } = req.body;
  await db.query(
    'UPDATE musics SET comment = ?, keyword = ? WHERE id = ?',
    [comment, keyword, req.params.id]
  );
  res.redirect('/music_admin');
});

module.exports = router;

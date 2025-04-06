const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../../db/mysql');

// 음악 파일 저장 위치
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/m_uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// 텍스트 파일 저장 위치
const textStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/m_text/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'music') cb(null, 'public/m_uploads/');
      else if (file.fieldname === 'text') cb(null, 'public/m_text/');
    },
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  })
});

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM musics ORDER BY id DESC');
  res.render('admin/music/music_admin', {
    user: req.session.user,
    musics: rows,
    title: 'music_admin'
  });
});

router.post('/upload', upload.fields([{ name: 'music' }, { name: 'text' }]), async (req, res) => {
  try {
    const { date, comment, keyword } = req.body;
    const musicFile = req.files['music'] ? req.files['music'][0].filename : null;
    const textFile = req.files['text'] ? req.files['text'][0].filename : null;

    await db.query(
      'INSERT INTO musics (original, textfile, date, comment, keyword) VALUES (?, ?, ?, ?, ?)',
      [musicFile, textFile, date, comment, keyword]
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

router.get('/text/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../../../public/m_text', req.params.filename);
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Text load error:', err);
      return res.status(404).send('Text not found');
    }
    res.send(data);
  });
});

router.get('/delete/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT original, textfile FROM musics WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).send('Music not found');

    const { original, textfile } = rows[0];
    const musicPath = path.join(__dirname, '../../../public/m_uploads', original);
    const textPath = textfile ? path.join(__dirname, '../../../public/m_text', textfile) : null;

    if (fs.existsSync(musicPath)) fs.unlinkSync(musicPath);
    if (textPath && fs.existsSync(textPath)) fs.unlinkSync(textPath);

    await db.query('DELETE FROM musics WHERE id = ?', [req.params.id]);

    res.redirect('/music_admin');
  } catch (err) {
    console.error('Delete Error:', err);
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

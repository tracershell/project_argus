const express = require('express');
const router = express.Router();
const multer = require('multer');
const JimpModule = require('jimp'); // sharp 대신 jimp 사용
const Jimp = JimpModule.default || JimpModule; // jimp 모듈을 가져옵니다. jimp는 이미지 처리 라이브러리입니다.
const fs = require('fs'); // 파일 시스템 모듈
const util = require('util'); // util 모듈
console.log('Jimp 타입:', typeof Jimp.read);  // 디버깅용
const path = require('path');
const db = require('../../db/mysql'); // DB 연결

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM photos ORDER BY id DESC');
  res.render('user/photo/photo', {
    user: req.session.user,
    photos: rows,
    title: 'photo'
  });  // Express는 views 폴더 기준으로 상대 경로를 사용합니다.
});

router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const { date, comment, place } = req.body;
    const original = req.file.filename;
    const thumbnail = 'thumb_' + original;

    const inputPath = req.file.path;
    const outputPath = 'public/thumbnails/' + thumbnail;

    const image = await Jimp.read(inputPath);
    await image.resize(200, Jimp.AUTO).quality(60).writeAsync(outputPath);

    await db.query(
      'INSERT INTO photos (original, thumbnail, date, comment, place) VALUES (?, ?, ?, ?, ?)',
      [original, thumbnail, date, comment, place]
    );

    res.redirect('/photo');
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).send('Upload failed');
  }
});

router.get('/download/:filename', (req, res) => {
  const file = path.join(__dirname, '../public/uploads', req.params.filename);
  res.download(file);
});

router.get('/delete/:id', async (req, res) => {
  await db.query('DELETE FROM photos WHERE id = ?', [req.params.id]);
  res.redirect('/');
});


// 수정 폼
router.get('/edit/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM photos WHERE id = ?', [req.params.id]);
  res.render('user/photo_edit', { photo: rows[0] });
});

// 수정 처리
router.post('/edit/:id', async (req, res) => {
  const { comment, place } = req.body;
  await db.query('UPDATE photos SET comment = ?, place = ? WHERE id = ?', [comment, place, req.params.id]);
  res.redirect('/');
});

module.exports = router;

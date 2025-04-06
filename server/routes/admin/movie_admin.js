const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../../db/mysql');

// 저장 위치 지정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'movie') cb(null, 'public/v_uploads/');
    else if (file.fieldname === 'thumbnail') cb(null, 'public/v_thumbnails/');
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 200 } // 200MB 제한
});

// 영화 목록 페이지
router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM movies ORDER BY id DESC');
  res.render('admin/movie/movie_admin', {
    user: req.session.user,
    movies: rows,
    title: 'movie_admin'
  });
});

// 업로드 처리
router.post('/upload', upload.fields([
  { name: 'movie', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { date, comment, keyword } = req.body;
    const video_filename = req.files['movie'][0].filename;
    const thumbnail = req.files['thumbnail'][0].filename;

    await db.query(
      'INSERT INTO movies (video_filename, thumbnail, date, comment, keyword) VALUES (?, ?, ?, ?, ?)',
      [video_filename, thumbnail, date, comment, keyword]
    );

    res.redirect('/movie_admin');
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).send('Upload failed');
  }
});

// 다운로드
router.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../../../public/v_uploads', req.params.filename);
  res.download(filePath, err => {
    if (err) res.status(404).send('File not found');
  });
});

// ===== movie 삭제 : DB file 삭제 + 저장된 thumbnail, movie  삭제 ===== \\
router.get('/delete/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT video_filename, thumbnail FROM movies WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).send('Movie not found');

    const { video_filename, thumbnail } = rows[0];

    // 파일 경로 설정
    const videoPath = path.join(__dirname, '../../../public/v_uploads', video_filename);
    const thumbPath = path.join(__dirname, '../../../public/v_thumbnails', thumbnail);

    // 파일 삭제
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

    // DB 삭제
    await db.query('DELETE FROM movies WHERE id = ?', [req.params.id]);

    res.redirect('/movie_admin');
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('Error deleting movie');
  }
});


// 수정 페이지
router.get('/edit/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM movies WHERE id = ?', [req.params.id]);
  res.render('admin/movie/movie_edit', { movie: rows[0] });
});

// 수정 처리
router.post('/edit/:id', async (req, res) => {
  const { comment, keyword } = req.body;
  await db.query('UPDATE movies SET comment = ?, keyword = ? WHERE id = ?', [comment, keyword, req.params.id]);
  res.redirect('/movie_admin');
});

// 재생
router.get('/play/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM movies WHERE id = ?', [req.params.id]);
  res.render('admin/movie/movie_play', { movie: rows[0] });
});

module.exports = router;

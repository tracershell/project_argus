const express = require('express');
const router = express.Router();
const db = require('../../../server/db/mysql');

// GET /music_gallery
router.get('/', async (req, res) => {
  try {
    const { year, keyword } = req.query;
    let whereClause = '';
    const params = [];

    if (year) {
      whereClause += ' AND YEAR(date) = ?';
      params.push(year);
    }

    if (keyword) {
      whereClause += ' AND keyword LIKE ?';
      params.push(`%${keyword}%`);
    }

    const [musics] = await db.query(
      `SELECT * FROM musics WHERE 1=1 ${whereClause} ORDER BY id DESC`, params
    );

    const [yearRows] = await db.query('SELECT DISTINCT YEAR(date) AS year FROM musics ORDER BY year DESC');
    const years = yearRows.map(row => row.year);

    const [keywordRows] = await db.query('SELECT DISTINCT keyword FROM musics ORDER BY keyword');
    const keywords = keywordRows.map(row => row.keyword);

    res.render('user/music/music_gallery', {
      musics,
      years,
      keywords,
      selectedYear: year,
      selectedKeyword: keyword
    });
  } catch (err) {
    console.error('music_gallery error:', err);
    res.status(500).send('서버 오류');
  }
});

module.exports = router;

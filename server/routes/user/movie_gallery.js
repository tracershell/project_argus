const express = require('express');
const router = express.Router();
const db = require('../../../server/db/mysql');

// GET /movie_gallery
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

    const [movies] = await db.query(
      `SELECT * FROM movies WHERE 1=1 ${whereClause} ORDER BY id DESC`, params
    );

    const [yearRows] = await db.query('SELECT DISTINCT YEAR(date) AS year FROM movies ORDER BY year DESC');
    const years = yearRows.map(row => row.year);

    const [keywordRows] = await db.query('SELECT DISTINCT keyword FROM movies ORDER BY keyword');
    const keywords = keywordRows.map(row => row.keyword);

    res.render('user/movie/movie_gallery', {
      movies,
      years,
      keywords,
      selectedYear: year,
      selectedKeyword: keyword
    });
  } catch (err) {
    console.error('movie_gallery error:', err);
    res.status(500).send('서버 오류');
  }
});

module.exports = router;

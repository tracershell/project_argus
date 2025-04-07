const express = require('express');
const router = express.Router();
const db = require('../../../server/db/mysql');

// GET /photo_gallery
router.get('/', async (req, res) => {
  try {
    const { year, place } = req.query;

    // 조건에 따라 WHERE 절 구성
    let whereClause = '';
    const params = [];

    if (year) {
      whereClause += ' AND YEAR(date) = ?';
      params.push(year);
    }

    if (place) {
      whereClause += ' AND place = ?';
      params.push(place);
    }

    // 사진 목록
    const [photos] = await db.query(
      `SELECT * FROM photos WHERE 1=1 ${whereClause} ORDER BY id DESC`, params
    );

    // 년도 목록
    const [yearRows] = await db.query('SELECT DISTINCT YEAR(date) AS year FROM photos ORDER BY year DESC');
    const years = yearRows.map(row => row.year);

    // 장소 목록
    const [placeRows] = await db.query('SELECT DISTINCT place FROM photos ORDER BY place');
    const places = placeRows.map(row => row.place);

    res.render('user/photo/photo_gallery', {
      photos,
      years,
      places,
      selectedYear: year,
      selectedPlace: place
    });
  } catch (err) {
    console.error('photo_gallery error:', err);
    res.status(500).send('서버 오류');
  }
});

module.exports = router;

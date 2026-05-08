// routes/ratings.js
const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/ratings — employee rates a package
router.post('/', auth, requireRole('employee'), async (req, res) => {
  try {
    const { package_id, booking_id, rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    const result = await db.query(`
      INSERT INTO package_ratings (package_id, booking_id, employee_id, rating, review)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (booking_id) DO UPDATE SET rating=$4, review=$5
      RETURNING *
    `, [package_id, booking_id, req.user.id, rating, review]);

    // Update vendor rating average
    await db.query(`
      UPDATE vendors SET
        rating = (SELECT AVG(pr.rating) FROM package_ratings pr JOIN packages p ON pr.package_id = p.id WHERE p.vendor_id = vendors.id),
        total_reviews = (SELECT COUNT(*) FROM package_ratings pr JOIN packages p ON pr.package_id = p.id WHERE p.vendor_id = vendors.id)
      WHERE id = (SELECT vendor_id FROM packages WHERE id=$1)
    `, [package_id]);

    // Award Sabba Points for leaving a review
    await db.query(`
      INSERT INTO points_transactions (user_id, points, reason, booking_id)
      VALUES ($1, 50, 'Left a package review', $2)
    `, [req.user.id, booking_id]);

    await db.query(`
      UPDATE employee_profiles SET sabba_points = sabba_points + 50 WHERE user_id=$1
    `, [req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ratings/package/:id — get ratings for a package
router.get('/package/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pr.*, u.full_name as employee_name
      FROM package_ratings pr JOIN users u ON pr.employee_id = u.id
      WHERE pr.package_id = $1 ORDER BY pr.created_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

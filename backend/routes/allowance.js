// routes/allowance.js
const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/allowance — employee's allowance for current and past years
router.get('/', auth, requireRole('employee'), async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    // Get allowance for year
    const allowance = await db.query(`
      SELECT * FROM travel_allowances WHERE user_id=$1 AND year=$2
    `, [req.user.id, year]);

    // Get bookings for year
    const bookings = await db.query(`
      SELECT b.*, p.title as package_title, p.emoji, p.destination
      FROM bookings b JOIN packages p ON b.package_id = p.id
      WHERE b.employee_id=$1
        AND EXTRACT(YEAR FROM b.created_at) = $2
        AND b.payment_method IN ('payroll', 'points')
      ORDER BY b.created_at DESC
    `, [req.user.id, year]);

    // Get all years with allowances
    const years = await db.query(`
      SELECT year FROM travel_allowances WHERE user_id=$1 ORDER BY year DESC
    `, [req.user.id]);

    const totalAllowance = allowance.rows[0]?.total_allowance_gbp || 0;
    const used = bookings.rows
      .filter(b => ['confirmed','approved'].includes(b.status))
      .reduce((s, b) => s + Number(b.total_amount), 0);
    const pending = bookings.rows
      .filter(b => b.status === 'pending')
      .reduce((s, b) => s + Number(b.total_amount), 0);
    const remaining = Math.max(0, totalAllowance - used - pending);

    // Points balance
    const points = await db.query('SELECT sabba_points FROM employee_profiles WHERE user_id=$1', [req.user.id]);

    res.json({
      year: parseInt(year),
      total_allowance: totalAllowance,
      used,
      pending,
      remaining,
      bookings: bookings.rows,
      available_years: years.rows.map(r => r.year),
      sabba_points: points.rows[0]?.sabba_points || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HR sets allowance for an employee
router.post('/set', auth, requireRole('hr'), async (req, res) => {
  try {
    const { user_id, year, total_allowance_gbp } = req.body;
    const result = await db.query(`
      INSERT INTO travel_allowances (user_id, company_id, year, total_allowance_gbp)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id, year) DO UPDATE SET total_allowance_gbp=$4
      RETURNING *
    `, [user_id, req.user.company_id, year, total_allowance_gbp]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

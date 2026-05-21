// routes/allowance.js — employee travel allowance
const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/allowance?year=2026 — get employee allowance for a given year
router.get('/', auth, requireRole('employee'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Always read the authoritative spend limit from employee_profiles
    const profile = await db.query(`
      SELECT ep.spend_limit_gbp, u.company_id
      FROM employee_profiles ep
      JOIN users u ON u.id = ep.user_id
      WHERE ep.user_id = $1
    `, [req.user.id]);

    const spendLimit = profile.rows[0]?.spend_limit_gbp
      ? parseFloat(profile.rows[0].spend_limit_gbp)
      : 5000;
    const companyId = profile.rows[0]?.company_id || req.user.company_id;

    // Upsert the travel_allowances row — always sync total from spend_limit_gbp
    await db.query(`
      INSERT INTO travel_allowances (user_id, company_id, year, total_allowance_gbp, used_allowance_gbp)
      VALUES ($1, $2, $3, $4, 0)
      ON CONFLICT (user_id, year) DO UPDATE
        SET total_allowance_gbp = $4
    `, [req.user.id, companyId, year, spendLimit]);

    // Calculate used from payroll bookings for this year (payroll only — card excluded)
    const used = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) as used
      FROM bookings
      WHERE employee_id = $1
        AND payment_method = 'payroll'
        AND status IN ('pending', 'approved', 'vendor_confirmed', 'confirmed')
        AND EXTRACT(YEAR FROM created_at) = $2
    `, [req.user.id, year]);

    const usedAmount  = parseFloat(used.rows[0].used);
    const remaining   = Math.max(0, spendLimit - usedAmount);

    // Get all years with data + always include current year
    const allYears = await db.query(`
      SELECT DISTINCT year FROM travel_allowances
      WHERE user_id = $1 ORDER BY year DESC
    `, [req.user.id]);

    const currentYear     = new Date().getFullYear();
    const availableYears  = [...new Set([
      ...allYears.rows.map(r => r.year),
      currentYear,
    ])].sort((a, b) => b - a);

    res.json({
      year,
      total_allowance_gbp:     spendLimit,
      used_allowance_gbp:      usedAmount,
      remaining_allowance_gbp: remaining,
      available_years:         availableYears,
      note: 'Payroll bookings only. Card payments do not count against this allowance.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/allowance/history — get all years summary for the employee
router.get('/history', auth, requireRole('employee'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ta.year, ta.total_allowance_gbp,
             COALESCE(SUM(CASE WHEN b.payment_method='payroll' AND b.status IN ('pending','approved','vendor_confirmed','confirmed') THEN b.total_amount ELSE 0 END), 0) as used_allowance_gbp,
             COUNT(CASE WHEN b.payment_method='payroll' THEN 1 END) as payroll_bookings,
             COUNT(CASE WHEN b.payment_method='card' THEN 1 END) as card_bookings
      FROM travel_allowances ta
      LEFT JOIN bookings b ON b.employee_id = ta.user_id AND EXTRACT(YEAR FROM b.created_at) = ta.year
      WHERE ta.user_id = $1
      GROUP BY ta.year, ta.total_allowance_gbp
      ORDER BY ta.year DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

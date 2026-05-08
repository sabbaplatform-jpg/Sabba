// routes/employees.js - HR employee management
const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/employees — HR sees all employees in their company
router.get('/', auth, requireRole('hr'), async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT u.id, u.email, u.full_name, u.created_at,
             ep.department, ep.job_title, ep.location, ep.salary_band,
             ep.sabba_points, ep.spend_limit_gbp, ep.avatar_url,
             COUNT(b.id) as booking_count
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN bookings b ON u.id = b.employee_id
      WHERE u.company_id = $1 AND u.role = 'employee'
    `;
    const params = [req.user.company_id];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR ep.department ILIKE $${params.length})`;
    }
    query += ' GROUP BY u.id, ep.department, ep.job_title, ep.location, ep.salary_band, ep.sabba_points, ep.spend_limit_gbp, ep.avatar_url ORDER BY u.full_name';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employees/:id — HR sees single employee details
router.get('/:id', auth, requireRole('hr'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.full_name, u.created_at,
             ep.department, ep.job_title, ep.location, ep.salary_band,
             ep.sabba_points, ep.spend_limit_gbp, ep.avatar_url
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE u.id = $1 AND u.company_id = $2 AND u.role = 'employee'
    `, [req.params.id, req.user.company_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Employee not found' });

    const bookings = await db.query(`
      SELECT b.*, p.title as package_title, p.destination, p.emoji, v.company_name as vendor_name
      FROM bookings b JOIN packages p ON b.package_id = p.id JOIN vendors v ON p.vendor_id = v.id
      WHERE b.employee_id = $1 ORDER BY b.created_at DESC
    `, [req.params.id]);

    res.json({ ...result.rows[0], bookings: bookings.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employees/:id/spend-limit — HR sets spend limit
router.patch('/:id/spend-limit', auth, requireRole('hr'), async (req, res) => {
  try {
    const { spend_limit_gbp } = req.body;
    await db.query(`
      INSERT INTO employee_profiles (user_id, spend_limit_gbp)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE SET spend_limit_gbp = $2
    `, [req.params.id, spend_limit_gbp]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

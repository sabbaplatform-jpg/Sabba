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

router.post('/:id/reset-password', auth, requireRole('hr'), async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const emp = await db.query(
      'SELECT id FROM users WHERE id=$1 AND company_id=$2 AND role=$3',
      [req.params.id, req.user.company_id, 'employee']
    );
    if (!emp.rows.length) return res.status(404).json({ error: 'Employee not found' });
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [password_hash, req.params.id]);
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)',
      [req.params.id, 'Password updated', 'Your password has been reset by your HR admin.', 'info']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employees/count
router.get('/count', auth, requireRole('hr'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*) AS count FROM users
       WHERE company_id = $1 AND role = 'employee'`,
      [req.user.company_id]
    );
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employees/:id — HR edits employee profile
router.patch('/:id', auth, requireRole('hr'), async (req, res) => {
  try {
    const { full_name, first_name, last_name, department, job_title, location,
            salary_band, spend_limit_gbp, employment_category,
            assignment_status, leave_type, gl_location, employee_number } = req.body;

    const emp = await db.query(
      'SELECT id FROM users WHERE id=$1 AND company_id=$2 AND role=$3',
      [req.params.id, req.user.company_id, 'employee']
    );
    if (!emp.rows.length) return res.status(404).json({ error: 'Employee not found' });

    if (full_name || first_name || last_name) {
      const name = full_name || `${first_name || ''} ${last_name || ''}`.trim();
      await db.query(
        'UPDATE users SET full_name=$1, first_name=$2, last_name=$3 WHERE id=$4',
        [name, first_name || null, last_name || null, req.params.id]
      );
    }

    await db.query(`
      INSERT INTO employee_profiles
        (user_id, department, job_title, location, salary_band, spend_limit_gbp,
         employment_category, assignment_status, leave_type, gl_location, employee_number)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (user_id) DO UPDATE SET
        department          = COALESCE(EXCLUDED.department,          employee_profiles.department),
        job_title           = COALESCE(EXCLUDED.job_title,           employee_profiles.job_title),
        location            = COALESCE(EXCLUDED.location,            employee_profiles.location),
        salary_band         = COALESCE(EXCLUDED.salary_band,         employee_profiles.salary_band),
        spend_limit_gbp     = COALESCE(EXCLUDED.spend_limit_gbp,     employee_profiles.spend_limit_gbp),
        employment_category = COALESCE(EXCLUDED.employment_category, employee_profiles.employment_category),
        assignment_status   = COALESCE(EXCLUDED.assignment_status,   employee_profiles.assignment_status),
        leave_type          = COALESCE(EXCLUDED.leave_type,          employee_profiles.leave_type),
        gl_location         = COALESCE(EXCLUDED.gl_location,         employee_profiles.gl_location),
        employee_number     = COALESCE(EXCLUDED.employee_number,     employee_profiles.employee_number)
    `, [req.params.id, department, job_title, location, salary_band,
        spend_limit_gbp ? parseFloat(spend_limit_gbp) : null,
        employment_category, assignment_status, leave_type, gl_location, employee_number]);

    const result = await db.query(
      `SELECT u.*, ep.* FROM users u
       LEFT JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE u.id = $1`, [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

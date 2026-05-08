// routes/profile.js
const router = require('express').Router();
const db = require('../lib/db');
const { auth } = require('../middleware/auth');

// GET /api/profile — get own profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await db.query('SELECT id, email, full_name, role, company_id FROM users WHERE id=$1', [req.user.id]);
    if (req.user.role === 'employee') {
      const profile = await db.query('SELECT * FROM employee_profiles WHERE user_id=$1', [req.user.id]);
      const points = await db.query('SELECT * FROM points_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10', [req.user.id]);
      return res.json({ ...user.rows[0], profile: profile.rows[0] || {}, points_history: points.rows });
    }
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/profile — update own profile
router.patch('/', auth, async (req, res) => {
  try {
    const { full_name, avatar_url, department, job_title, location, salary_band, bank_name, bank_account_last4 } = req.body;

    if (full_name) {
      await db.query('UPDATE users SET full_name=$1 WHERE id=$2', [full_name, req.user.id]);
    }

    if (req.user.role === 'employee') {
      await db.query(`
        INSERT INTO employee_profiles (user_id, avatar_url, department, job_title, location, salary_band, bank_name, bank_account_last4)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (user_id) DO UPDATE SET
          avatar_url=COALESCE($2, employee_profiles.avatar_url),
          department=COALESCE($3, employee_profiles.department),
          job_title=COALESCE($4, employee_profiles.job_title),
          location=COALESCE($5, employee_profiles.location),
          salary_band=COALESCE($6, employee_profiles.salary_band),
          bank_name=COALESCE($7, employee_profiles.bank_name),
          bank_account_last4=COALESCE($8, employee_profiles.bank_account_last4)
      `, [req.user.id, avatar_url, department, job_title, location, salary_band, bank_name, bank_account_last4]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profile/points — employee points balance and history
router.get('/points', auth, async (req, res) => {
  try {
    const balance = await db.query('SELECT sabba_points FROM employee_profiles WHERE user_id=$1', [req.user.id]);
    const history = await db.query('SELECT * FROM points_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    res.json({ balance: balance.rows[0]?.sabba_points || 0, history: history.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

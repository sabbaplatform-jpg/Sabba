// routes/admin.js — Sabba super-admin portal API
const router = require('express').Router();
const db     = require('../lib/db');
const jwt    = require('jsonwebtoken');
const { auth, requireRole } = require('../middleware/auth');

// ── Middleware: only superadmin ───────────────────────────────
const requireAdmin = requireRole('superadmin');

// ── GET /api/admin/stats ──────────────────────────────────────
// Platform-wide summary metrics
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const [companies, employees, vendors, bookings, gmv] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM companies`),
      db.query(`SELECT COUNT(*) FROM users WHERE role='employee'`),
      db.query(`SELECT COUNT(*) FROM vendors`),
      db.query(`SELECT COUNT(*) FROM bookings`),
      db.query(`SELECT COALESCE(SUM(total_amount),0) as gmv FROM bookings WHERE status IN ('approved','vendor_confirmed','confirmed')`),
    ]);

    const monthly = await db.query(`
      SELECT DATE_TRUNC('month', created_at) as month,
             COUNT(*) as bookings,
             COALESCE(SUM(total_amount),0) as gmv
      FROM bookings
      WHERE status IN ('approved','vendor_confirmed','confirmed')
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC LIMIT 6
    `);

    const pendingVendors = await db.query(
      `SELECT COUNT(*) FROM vendors WHERE verified=FALSE AND onboarding_completed=TRUE`
    );

    res.json({
      companies:      parseInt(companies.rows[0].count),
      employees:      parseInt(employees.rows[0].count),
      vendors:        parseInt(vendors.rows[0].count),
      bookings:       parseInt(bookings.rows[0].count),
      gmv:            parseFloat(gmv.rows[0].gmv),
      pending_vendors: parseInt(pendingVendors.rows[0].count),
      monthly:        monthly.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/companies ──────────────────────────────────
router.get('/companies', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*,
             COUNT(DISTINCT u.id)  FILTER (WHERE u.role='employee') as employee_count,
             COUNT(DISTINCT u.id)  FILTER (WHERE u.role='hr')       as hr_count,
             COUNT(DISTINCT b.id)                                    as booking_count,
             COALESCE(SUM(b.total_amount) FILTER (WHERE b.status IN ('approved','confirmed','vendor_confirmed')), 0) as total_gmv,
             MAX(b.created_at) as last_booking_at
      FROM companies c
      LEFT JOIN users     u ON u.company_id = c.id
      LEFT JOIN bookings  b ON b.company_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/companies ─────────────────────────────────
router.post('/companies', auth, requireAdmin, async (req, res) => {
  try {
    const { name, plan = 'starter', admin_email, admin_name } = req.body;
    if (!name || !admin_email || !admin_name) {
      return res.status(400).json({ error: 'name, admin_email and admin_name are required' });
    }

    // Create company
    const co = await db.query(
      `INSERT INTO companies (name, plan) VALUES ($1,$2) RETURNING *`,
      [name, plan]
    );
    const company = co.rows[0];

    // Create HR admin account
    const bcrypt = require('bcryptjs');
    const pw = await bcrypt.hash('Welcome2Sabba!', 10);
    await db.query(
      `INSERT INTO users (email, full_name, role, company_id, password_hash)
       VALUES ($1,$2,'hr',$3,$4)`,
      [admin_email, admin_name, company.id, pw]
    );

    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/companies/:id ───────────────────────────
router.patch('/companies/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { status, plan, name } = req.body;
    const fields = []; const vals = []; let i = 1;
    if (status !== undefined) { fields.push(`status=$${i++}`);  vals.push(status); }
    if (plan   !== undefined) { fields.push(`plan=$${i++}`);    vals.push(plan); }
    if (name   !== undefined) { fields.push(`name=$${i++}`);    vals.push(name); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const result = await db.query(
      `UPDATE companies SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/vendors ────────────────────────────────────
router.get('/vendors', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT v.*, u.email, u.full_name,
             COUNT(DISTINCT p.id)  as package_count,
             COUNT(DISTINCT b.id)  as booking_count,
             COALESCE(SUM(b.total_amount) FILTER (WHERE b.status IN ('confirmed','approved','vendor_confirmed')),0) as total_revenue
      FROM vendors v
      JOIN users    u ON v.user_id  = u.id
      LEFT JOIN packages p ON p.vendor_id = v.id
      LEFT JOIN bookings  b ON b.package_id = p.id
      GROUP BY v.id, u.email, u.full_name
      ORDER BY v.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/bookings ───────────────────────────────────
router.get('/bookings', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*,
             p.title  as package_title, p.destination, p.category,
             u.full_name as employee_name, u.email as employee_email,
             c.name   as company_name,
             v.company_name as vendor_name
      FROM bookings  b
      JOIN packages  p ON b.package_id  = p.id
      JOIN users     u ON b.employee_id = u.id
      JOIN companies c ON b.company_id  = c.id
      JOIN vendors   v ON p.vendor_id   = v.id
      ORDER BY b.created_at DESC
      LIMIT 200
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/impersonate ───────────────────────────────
// Issue a short-lived JWT scoped to a specific HR admin
router.post('/impersonate', auth, requireAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const user = await db.query(
      `SELECT id, email, role, full_name, company_id FROM users WHERE id=$1`,
      [user_id]
    );
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });
    if (user.rows[0].role !== 'hr') return res.status(403).json({ error: 'Can only impersonate HR admins' });

    // Log the impersonation
    await db.query(
      `INSERT INTO audit_log (actor_id, action, target_id, target_type, meta)
       VALUES ($1, 'impersonate', $2, 'user', $3)`,
      [req.user.id, user_id, JSON.stringify({ company_id: user.rows[0].company_id })]
    ).catch(() => {}); // audit_log may not exist yet — non-fatal

    const token = jwt.sign(
      { ...user.rows[0], impersonated_by: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({ token, user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/audit-log ──────────────────────────────────
router.get('/audit-log', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT al.*, u.full_name as actor_name, u.email as actor_email
      FROM audit_log al
      JOIN users u ON u.id = al.actor_id
      ORDER BY al.created_at DESC
      LIMIT 100
    `).catch(() => ({ rows: [] })); // table may not exist yet
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

// ── GET /api/admin/feature-flags ─────────────────────────────
router.get('/feature-flags', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM feature_flags ORDER BY name`)
      .catch(() => ({ rows: [] }));
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

// ── PATCH /api/admin/feature-flags/:name ─────────────────────
router.patch('/feature-flags/:name', auth, requireAdmin, async (req, res) => {
  try {
    const { enabled, company_id } = req.body;
    await db.query(`
      INSERT INTO feature_flags (name, enabled, company_id)
      VALUES ($1,$2,$3)
      ON CONFLICT (name, company_id) DO UPDATE SET enabled=$2
    `, [req.params.name, enabled, company_id || null]).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

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
    const {
      name, plan = 'starter',
      industry, size, website, address,
      billing_name, billing_email, billing_address,
      admin_name, admin_email, admin_title,
      admin_first, admin_last,
      hris, hris_conn, payroll, payroll_conn, integration_notes,
    } = req.body;

    const hrName = admin_name || `${admin_first||''} ${admin_last||''}`.trim();
    if (!name || !admin_email || !hrName) {
      return res.status(400).json({ error: 'name, admin_email and admin name are required' });
    }

    // Create company with all metadata
    const co = await db.query(`
      INSERT INTO companies (name, plan, industry, size, website, address,
        billing_name, billing_email, billing_address,
        hris, hris_conn, payroll, payroll_conn, integration_notes,
        status, plan_started_at, plan_renews_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'active',NOW(),NOW()+INTERVAL '1 year')
      RETURNING *
    `, [name, plan,
        industry||null, size||null, website||null, address||null,
        billing_name||null, billing_email||null, billing_address||null,
        hris||null, hris_conn||null, payroll||null, payroll_conn||null, integration_notes||null,
    ]);
    const company = co.rows[0];

    // Create HR admin account
    const bcrypt = require('bcryptjs');
    const pw = await bcrypt.hash('Welcome2Sabba!', 10);
    await db.query(
      `INSERT INTO users (email, full_name, role, company_id, password_hash, job_title)
       VALUES ($1,$2,'hr',$3,$4,$5)`,
      [admin_email, hrName, company.id, pw, admin_title||null]
    );

    // Log creation
    await db.query(
      `INSERT INTO audit_log (actor_id, action, target_id, target_type, meta)
       VALUES ($1,'create_employer',$2,'company',$3)`,
      [req.user.id, company.id, JSON.stringify({ name, plan, admin_email })]
    ).catch(()=>{});

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


// ── GET /api/admin/companies/:id/employees ────────────────────
router.get('/companies/:id/employees', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.full_name, u.created_at,
             ep.department, ep.job_title, ep.location, ep.salary_band,
             ep.spend_limit_gbp, ep.sabba_points, ep.avatar_url,
             ep.employee_number, ep.gl_location, ep.employment_category,
             ep.assignment_status, ep.leave_type
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE u.company_id = $1 AND u.role = 'employee'
      ORDER BY u.full_name
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/companies/:id/bookings ─────────────────────
router.get('/companies/:id/bookings', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*,
             p.title as package_title, p.destination, p.emoji, p.category,
             u.full_name as employee_name, u.email as employee_email,
             v.company_name as vendor_name
      FROM bookings b
      JOIN packages  p ON b.package_id  = p.id
      JOIN users     u ON b.employee_id = u.id
      JOIN vendors   v ON p.vendor_id   = v.id
      WHERE b.company_id = $1
      ORDER BY b.created_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/companies/:id/employees/import ────────────
router.post('/companies/:id/employees/import', auth, requireAdmin, async (req, res) => {
  try {
    const { employees } = req.body;
    if (!Array.isArray(employees) || !employees.length) {
      return res.status(400).json({ error: 'No employee data provided' });
    }

    const bcrypt  = require('bcryptjs');
    const defPw   = await bcrypt.hash('Welcome2Sabba!', 10);
    const results = { created: 0, skipped: 0, errors: [] };
    const year    = new Date().getFullYear();
    const companyId = req.params.id;

    for (const emp of employees) {
      const email     = emp.email?.trim().toLowerCase();
      const firstName = emp.first_name?.trim() || emp.full_name?.split(' ')[0] || '';
      const lastName  = emp.last_name?.trim()  || emp.full_name?.split(' ').slice(1).join(' ') || '';
      const fullName  = `${firstName} ${lastName}`.trim();
      if (!email || !fullName) { results.errors.push({ email: email||'(missing)', reason: 'Missing email or name' }); continue; }

      try {
        const existing = await db.query('SELECT id FROM users WHERE email=$1', [email]);
        if (existing.rows.length) { results.skipped++; continue; }

        const ur = await db.query(
          `INSERT INTO users (email, full_name, first_name, last_name, role, company_id, password_hash)
           VALUES ($1,$2,$3,$4,'employee',$5,$6) RETURNING id`,
          [email, fullName, firstName, lastName, companyId, defPw]
        );
        const uid = ur.rows[0].id;
        const allowance = emp.spend_limit_gbp ? parseFloat(emp.spend_limit_gbp) : 5000;

        await db.query(`
          INSERT INTO employee_profiles
            (user_id, department, job_title, location, salary_band, spend_limit_gbp,
             gl_location, employee_number, employment_category, assignment_status, leave_type, sabba_points)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0) ON CONFLICT (user_id) DO NOTHING
        `, [uid, emp.department||null, emp.job_title||null, emp.location||null,
            emp.salary_band||null, allowance, emp.gl_location||null, emp.employee_number||null,
            emp.employment_category||'Permanent', emp.assignment_status||'Active', emp.leave_type||'Both']);

        await db.query(
          `INSERT INTO travel_allowances (user_id, company_id, year, total_allowance_gbp)
           VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, year) DO NOTHING`,
          [uid, companyId, year, allowance]
        );
        results.created++;
      } catch (err) {
        results.errors.push({ email, reason: err.message });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/employees/:id ───────────────────────────
// Super admin edits any employee directly
router.patch('/employees/:id', auth, requireAdmin, async (req, res) => {
  try {
    const {
      full_name, first_name, last_name, department, job_title, location,
      salary_band, spend_limit_gbp, employment_category,
      assignment_status, leave_type, gl_location, employee_number
    } = req.body;

    if (full_name || first_name || last_name) {
      const name = full_name || `${first_name||''} ${last_name||''}`.trim();
      await db.query(
        'UPDATE users SET full_name=$1, first_name=$2, last_name=$3 WHERE id=$4',
        [name, first_name||null, last_name||null, req.params.id]
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
       LEFT JOIN employee_profiles ep ON ep.user_id = u.id WHERE u.id=$1`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── PATCH /api/admin/vendors/:id/reject ──────────────────────
router.patch('/vendors/:id/reject', auth, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'Rejection reason required' });

    const result = await db.query(`
      UPDATE vendors SET verified=FALSE, rejection_reason=$1, rejected_at=NOW(), rejected_by=$2
      WHERE id=$3 RETURNING *
    `, [reason, req.user.id, req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Vendor not found' });

    // Notify vendor
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, 'Application update', $2, 'warning')
    `, [result.rows[0].user_id,
        `Your vendor application was not approved. Reason: ${reason}. Please contact support@sabbaplatform.com if you have questions.`]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/vendors/:id/access ──────────────────────
router.patch('/vendors/:id/access', auth, requireAdmin, async (req, res) => {
  try {
    const { company_id, enabled } = req.body;
    await db.query(`
      INSERT INTO vendor_employer_access (vendor_id, company_id, enabled, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (vendor_id, company_id) DO UPDATE
        SET enabled=$3, updated_by=$4, updated_at=NOW()
    `, [req.params.id, company_id, enabled, req.user.id]).catch(() => {
      // Table may not exist yet — non-fatal
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/packages ───────────────────────────────────
router.get('/packages', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*,
             v.company_name as vendor_name,
             v.verified as vendor_verified
      FROM packages p
      JOIN vendors v ON p.vendor_id = v.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/packages/:id/access ─────────────────────
router.patch('/packages/:id/access', auth, requireAdmin, async (req, res) => {
  try {
    const { company_id, allowed } = req.body;
    await db.query(`
      INSERT INTO package_employer_access (package_id, company_id, allowed, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (package_id, company_id) DO UPDATE
        SET allowed=$3, updated_by=$4, updated_at=NOW()
    `, [req.params.id, company_id, allowed, req.user.id]).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

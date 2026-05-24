// routes/admin.js — Sabba super-admin portal API
const router = require('express').Router();
const email  = require('../lib/email');
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
        // Send welcome email (non-blocking)
        email.sendWelcomeEmployee({
          to: email_addr,
          full_name: fullName,
          company_name: (await db.query('SELECT name FROM companies WHERE id=$1',[companyId]).catch(()=>({rows:[{name:''}]}))).rows[0]?.name || '',
          temp_password: 'Welcome2Sabba!'
        }).catch(()=>{});
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

    // Notify vendor via notification and email
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, 'Application update', $2, 'warning')
    `, [result.rows[0].user_id,
        `Your vendor application was not approved. Reason: ${reason}. Please contact support@sabbaplatform.com if you have questions.`]);

    // Get vendor email for sending rejection email
    const vendorUser = await db.query('SELECT email FROM users WHERE id=$1', [result.rows[0].user_id]).catch(()=>({rows:[]}));
    if (vendorUser.rows.length) {
      email.sendVendorRejected({
        to: vendorUser.rows[0].email,
        company_name: result.rows[0].company_name,
        reason,
      }).catch(() => {});
    }

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


// ── GET /api/admin/integrations/:companyId ────────────────────
router.get('/integrations/:companyId', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM employer_integrations WHERE company_id=$1 ORDER BY created_at ASC`,
      [req.params.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    // Table may not exist yet
    res.json([]);
  }
});

// ── POST /api/admin/integrations/:companyId ───────────────────
router.post('/integrations/:companyId', auth, requireAdmin, async (req, res) => {
  try {
    const { name, type, category, endpoint, api_key, secret, status, notes, postback_url, postback_events } = req.body;
    const result = await db.query(`
      INSERT INTO employer_integrations
        (company_id, name, type, category, endpoint, api_key_hash, secret_hash,
         status, notes, postback_url, postback_events, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [
      req.params.companyId, name, type||'REST API', category||'hris',
      endpoint||null,
      api_key ? require('crypto').createHash('sha256').update(api_key).digest('hex') : null,
      secret   ? require('crypto').createHash('sha256').update(secret).digest('hex')  : null,
      status||'pending', notes||null,
      postback_url||null,
      postback_events ? JSON.stringify(postback_events) : null,
      req.user.id,
    ]);

    // Log
    await db.query(
      `INSERT INTO audit_log (actor_id, action, target_id, target_type, meta)
       VALUES ($1,'add_integration',$2,'integration',$3)`,
      [req.user.id, result.rows[0].id, JSON.stringify({ name, company_id: req.params.companyId })]
    ).catch(()=>{});

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/integrations/:companyId/:integrationId ───
router.patch('/integrations/:companyId/:integrationId', auth, requireAdmin, async (req, res) => {
  try {
    const { name, type, category, endpoint, api_key, secret, status, notes, postback_url, postback_events } = req.body;
    const fields = []; const vals = []; let i = 1;
    if (name     !== undefined) { fields.push(`name=$${i++}`);     vals.push(name); }
    if (type     !== undefined) { fields.push(`type=$${i++}`);     vals.push(type); }
    if (category !== undefined) { fields.push(`category=$${i++}`); vals.push(category); }
    if (endpoint !== undefined) { fields.push(`endpoint=$${i++}`); vals.push(endpoint); }
    if (status   !== undefined) { fields.push(`status=$${i++}`);   vals.push(status); }
    if (notes    !== undefined) { fields.push(`notes=$${i++}`);    vals.push(notes); }
    if (postback_url !== undefined) { fields.push(`postback_url=$${i++}`); vals.push(postback_url); }
    if (postback_events !== undefined) { fields.push(`postback_events=$${i++}`); vals.push(JSON.stringify(postback_events)); }
    if (api_key && api_key.trim()) {
      fields.push(`api_key_hash=$${i++}`);
      vals.push(require('crypto').createHash('sha256').update(api_key).digest('hex'));
    }
    if (secret && secret.trim()) {
      fields.push(`secret_hash=$${i++}`);
      vals.push(require('crypto').createHash('sha256').update(secret).digest('hex'));
    }
    fields.push(`updated_at=NOW()`);
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.integrationId);
    const result = await db.query(
      `UPDATE employer_integrations SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/integrations/:companyId/:integrationId ──
router.delete('/integrations/:companyId/:integrationId', auth, requireAdmin, async (req, res) => {
  try {
    await db.query(
      `DELETE FROM employer_integrations WHERE id=$1 AND company_id=$2`,
      [req.params.integrationId, req.params.companyId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/integrations/:companyId/:integrationId/test
router.post('/integrations/:companyId/:integrationId/test', auth, requireAdmin, async (req, res) => {
  try {
    const integ = await db.query(
      `SELECT * FROM employer_integrations WHERE id=$1 AND company_id=$2`,
      [req.params.integrationId, req.params.companyId]
    );
    if (!integ.rows.length) return res.status(404).json({ error: 'Integration not found' });
    const { endpoint, type } = integ.rows[0];

    if (!endpoint) return res.json({ success: false, message: 'No endpoint configured — add an API URL first' });

    // For REST API, attempt a HEAD request to the endpoint
    if (type === 'REST API' || type === 'Webhook') {
      try {
        const https = require('https');
        const url = new URL(endpoint);
        const result = await new Promise((resolve) => {
          const req2 = https.request({ hostname: url.hostname, port: 443, path: url.pathname, method: 'HEAD', timeout: 5000 }, (r) => {
            resolve({ success: r.statusCode < 500, message: `HTTP ${r.statusCode} — ${r.statusCode < 400 ? 'endpoint reachable' : 'endpoint returned error'}` });
          });
          req2.on('error', () => resolve({ success: false, message: 'Endpoint unreachable — check URL and firewall settings' }));
          req2.on('timeout', () => { req2.destroy(); resolve({ success: false, message: 'Connection timed out after 5 seconds' }); });
          req2.end();
        });
        // Update last_tested
        await db.query(`UPDATE employer_integrations SET last_sync=NOW() WHERE id=$1`, [req.params.integrationId]).catch(()=>{});
        return res.json(result);
      } catch {
        return res.json({ success: false, message: 'Invalid URL — check the endpoint format' });
      }
    }

    // For non-HTTP types just acknowledge
    res.json({ success: true, message: `${type} integration acknowledged — manual verification required` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── GET /api/admin/team ───────────────────────────────────────
// List all super admins
router.get('/team', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, full_name, created_at, active
       FROM users WHERE role='superadmin' ORDER BY created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/team ──────────────────────────────────────
// Create a new super admin
router.post('/team', auth, requireAdmin, async (req, res) => {
  try {
    const { full_name, email } = req.body;
    if (!full_name || !email) return res.status(400).json({ error: 'Name and email required' });

    const existing = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already in use' });

    const bcrypt = require('bcryptjs');
    const pw = await bcrypt.hash('Sabba@Admin2026!', 10);
    const result = await db.query(
      `INSERT INTO users (email, full_name, role, password_hash)
       VALUES ($1,$2,'superadmin',$3) RETURNING id, email, full_name, created_at`,
      [email, full_name, pw]
    );

    await db.query(
      `INSERT INTO audit_log (actor_id, action, target_id, target_type, meta)
       VALUES ($1,'create_admin',$2,'user',$3)`,
      [req.user.id, result.rows[0].id, JSON.stringify({ email, full_name })]
    ).catch(()=>{});

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/team/:id ─────────────────────────────────
// Deactivate a super admin
router.patch('/team/:id', auth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    const { active } = req.body;
    const result = await db.query(
      `UPDATE users SET active=$1 WHERE id=$2 AND role='superadmin' RETURNING id, email, full_name, active`,
      [active, req.params.id]
    );
    await db.query(
      `INSERT INTO audit_log (actor_id, action, target_id, target_type, meta)
       VALUES ($1,'deactivate_admin',$2,'user',$3)`,
      [req.user.id, req.params.id, JSON.stringify({ active })]
    ).catch(()=>{});
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/companies/:id/hr-users ─────────────────────
// Get HR admins for a specific company (for impersonation selector)
router.get('/companies/:id/hr-users', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, full_name, company_id FROM users
       WHERE company_id=$1 AND role='hr' ORDER BY full_name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ══════════════════════════════════════════════════════════
// EMAIL TEMPLATE ROUTES
// ══════════════════════════════════════════════════════════

// ── GET /api/admin/email-templates ───────────────────────────
// List all templates — global + per company
router.get('/email-templates', auth, requireAdmin, async (req, res) => {
  try {
    const { company_id } = req.query;
    const result = await db.query(`
      SELECT * FROM email_templates
      WHERE company_id ${company_id ? '= $1' : 'IS NULL'}
      ORDER BY email_type
    `, company_id ? [company_id] : []).catch(() => ({ rows: [] }));
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

// ── PUT /api/admin/email-templates ───────────────────────────
// Create or update a template (upsert)
router.put('/email-templates', auth, requireAdmin, async (req, res) => {
  try {
    const { email_type, subject, body_html, company_id, is_active } = req.body;
    if (!email_type || !subject || !body_html) {
      return res.status(400).json({ error: 'email_type, subject and body_html required' });
    }
    const result = await db.query(`
      INSERT INTO email_templates (email_type, subject, body_html, company_id, is_active, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (email_type, company_id)
        DO UPDATE SET subject=$2, body_html=$3, is_active=$5, updated_by=$6, updated_at=NOW()
      RETURNING *
    `, [email_type, subject, body_html, company_id || null, is_active !== false, req.user.id]);

    await db.query(
      `INSERT INTO audit_log (actor_id, action, target_id, target_type, meta)
       VALUES ($1,'update_email_template',$2,'email_template',$3)`,
      [req.user.id, result.rows[0].id, JSON.stringify({ email_type, company_id })]
    ).catch(() => {});

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/email-templates/:id ─────────────────────
// Delete a custom template (reverts to global/default)
router.delete('/email-templates/:id', auth, requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM email_templates WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/email-templates/preview ───────────────────
router.post('/email-templates/preview', auth, requireAdmin, async (req, res) => {
  try {
    const { body_html, subject } = req.body;
    const email = require('../lib/email');
    const html  = await email.renderPreview('preview', body_html, subject);
    res.json({ html, subject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
// SUPER ADMIN PROFILE ROUTES
// ══════════════════════════════════════════════════════════

// ── GET /api/admin/profile ────────────────────────────────────
router.get('/profile', auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/profile ──────────────────────────────────
router.patch('/profile', auth, requireAdmin, async (req, res) => {
  try {
    const { full_name, email, current_password, new_password } = req.body;
    const user = await db.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

    const updates = []; const vals = []; let i = 1;
    if (full_name) { updates.push(`full_name=$${i++}`); vals.push(full_name); }
    if (email)     { updates.push(`email=$${i++}`);     vals.push(email.toLowerCase().trim()); }
    if (new_password) {
      if (!current_password) return res.status(400).json({ error: 'Current password required' });
      const bcrypt = require('bcryptjs');
      const valid  = await bcrypt.compare(current_password, user.rows[0].password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
      if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      updates.push(`password_hash=$${i++}`);
      vals.push(await bcrypt.hash(new_password, 10));
    }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.user.id);
    const result = await db.query(
      `UPDATE users SET ${updates.join(',')} WHERE id=$${i} RETURNING id, email, full_name, avatar_url`,
      vals
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/profile/avatar ──────────────────────────
router.patch('/profile/avatar', auth, requireAdmin, async (req, res) => {
  try {
    const { avatar_url } = req.body;
    await db.query('UPDATE users SET avatar_url=$1 WHERE id=$2', [avatar_url, req.user.id]);
    res.json({ success: true, avatar_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

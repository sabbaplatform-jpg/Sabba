// routes/vendors.js - vendor management for HR admins + vendor self-management
const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/vendors — HR sees all vendors
router.get('/', auth, requireRole('hr'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT v.*, u.email, u.full_name,
             COUNT(p.id) as package_count,
             COUNT(b.id) as total_bookings
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN packages p ON v.id = p.vendor_id
      LEFT JOIN bookings b ON p.id = b.package_id
      GROUP BY v.id, u.email, u.full_name
      ORDER BY v.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/vendors/:id/verify — HR verifies a vendor
router.patch('/:id/verify', auth, requireRole('hr'), async (req, res) => {
  try {
    const { verified } = req.body;
    const result = await db.query(`
      UPDATE vendors SET verified=$1, verified_by=$2, verified_at=NOW()
      WHERE id=$3 RETURNING *
    `, [verified, req.user.id, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Vendor not found' });

    // Notify vendor
    const vendor = result.rows[0];
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
    `, [vendor.user_id,
        verified ? 'You are now verified!' : 'Verification removed',
        verified ? 'Congratulations! Your vendor account has been verified by Sabba admin.' : 'Your verification status has been updated.',
        verified ? 'success' : 'warning']);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vendors/profile — vendor gets own profile
router.get('/profile', auth, requireRole('vendor'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT v.*, u.email, u.full_name
      FROM vendors v JOIN users u ON v.user_id = u.id
      WHERE v.user_id = $1
    `, [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Vendor profile not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/vendors/profile — vendor updates own profile
router.patch('/profile', auth, requireRole('vendor'), async (req, res) => {
  try {
    const { company_name, about, website, avatar_url, banner_url } = req.body;
    const result = await db.query(`
      UPDATE vendors SET
        company_name=COALESCE($1,company_name),
        about=COALESCE($2,about),
        website=COALESCE($3,website),
        avatar_url=COALESCE($4,avatar_url),
        banner_url=COALESCE($5,banner_url)
      WHERE user_id=$6 RETURNING *
    `, [company_name, about, website, avatar_url, banner_url, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vendors/packages/:id/media — add media to a package
router.post('/packages/:id/media', auth, requireRole('vendor'), async (req, res) => {
  try {
    const { url, media_type, display_order } = req.body;
    const result = await db.query(`
      INSERT INTO package_media (package_id, url, media_type, display_order)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [req.params.id, url, media_type, display_order || 0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/vendors/packages/media/:id — remove media
router.delete('/packages/media/:id', auth, requireRole('vendor'), async (req, res) => {
  try {
    await db.query('DELETE FROM package_media WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/vendors/bookings/:id/notes — vendor sends notes to employee
router.patch('/bookings/:id/notes', auth, requireRole('vendor'), async (req, res) => {
  try {
    const { vendor_notes } = req.body;
    const result = await db.query(`
      UPDATE bookings SET vendor_notes=$1
      WHERE id=$2 RETURNING *
    `, [vendor_notes, req.params.id]);

    // Notify employee
    if (result.rows.length) {
      await db.query(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES ($1, 'Booking details from vendor', $2, 'info', '/my-booking')
      `, [result.rows[0].employee_id, `Your vendor has sent you important details about your upcoming adventure.`]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vendors/earnings — vendor earnings analytics
router.get('/earnings', auth, requireRole('vendor'), async (req, res) => {
  try {
    const vendor = await db.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Vendor not found' });

    const monthly = await db.query(`
      SELECT DATE_TRUNC('month', b.created_at) as month,
             COUNT(*) as bookings,
             SUM(b.total_amount) as revenue
      FROM bookings b
      JOIN packages p ON b.package_id = p.id
      WHERE p.vendor_id = $1 AND b.status IN ('confirmed','approved')
      GROUP BY DATE_TRUNC('month', b.created_at)
      ORDER BY month DESC LIMIT 6
    `, [vendor.rows[0].id]);

    const totals = await db.query(`
      SELECT COUNT(*) as total_bookings,
             SUM(CASE WHEN b.status='confirmed' THEN b.total_amount ELSE 0 END) as confirmed_revenue,
             AVG(pr.rating) as avg_rating
      FROM bookings b
      JOIN packages p ON b.package_id = p.id
      LEFT JOIN package_ratings pr ON p.id = pr.package_id
      WHERE p.vendor_id = $1
    `, [vendor.rows[0].id]);

    // Per-package breakdown
    const byPackage = await db.query(`
      SELECT
        p.id, p.title, p.destination, p.category, p.price_gbp, p.image_url, p.emoji,
        COUNT(b.id)                                                    AS total_bookings,
        COUNT(CASE WHEN b.status IN ('confirmed','approved') THEN 1 END) AS confirmed_bookings,
        COALESCE(SUM(CASE WHEN b.status IN ('confirmed','approved') THEN b.total_amount END), 0) AS revenue,
        COALESCE(AVG(pr.rating), 0)                                    AS avg_rating,
        COUNT(pr.id)                                                   AS review_count,
        p.status
      FROM packages p
      LEFT JOIN bookings b ON b.package_id = p.id
      LEFT JOIN package_ratings pr ON pr.package_id = p.id
      WHERE p.vendor_id = $1
      GROUP BY p.id
      ORDER BY revenue DESC
    `, [vendor.rows[0].id]);

    res.json({
      monthly:    monthly.rows,
      totals:     totals.rows[0],
      by_package: byPackage.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vendors/all — admin gets all vendors for dropdowns
router.get('/all', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT v.id, v.company_name, v.verified, v.commission_rate,
             COUNT(p.id) as package_count
      FROM vendors v
      LEFT JOIN packages p ON v.id = p.vendor_id AND p.status = 'live'
      GROUP BY v.id
      ORDER BY v.company_name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ══════════════════════════════════════════════════════════════
// VENDOR MULTI-USER — OPTION B (primary / secondary)
// ══════════════════════════════════════════════════════════════

// ── GET /api/vendors/team ────────────────────────────────────
router.get('/team', auth, requireRole('vendor'), async (req, res) => {
  try {
    const vendor = await db.query(`SELECT id FROM vendors WHERE user_id=$1`, [req.user.id]);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.job_title, u.created_at, v2.is_primary_user
       FROM vendors v2 JOIN users u ON v2.user_id=u.id
       WHERE v2.company_name=(SELECT company_name FROM vendors WHERE id=$1)
       ORDER BY v2.is_primary_user DESC, u.created_at ASC`,
      [vendor.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/vendors/team ───────────────────────────────────
router.post('/team', auth, requireRole('vendor'), async (req, res) => {
  try {
    const primary = await db.query(`SELECT * FROM vendors WHERE user_id=$1 AND is_primary_user=true`, [req.user.id]);
    if (!primary.rows.length) return res.status(403).json({ error: 'Only the primary account holder can add team members' });
    const v = primary.rows[0];
    const { full_name, email, job_title, password } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ error: 'full_name, email and password are required' });
    const existing = await db.query(`SELECT id FROM users WHERE email=$1`, [email.toLowerCase().trim()]);
    if (existing.rows.length) return res.status(409).json({ error: 'An account with this email already exists' });
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    const newUser = await db.query(
      `INSERT INTO users (email,full_name,job_title,role,password_hash) VALUES ($1,$2,$3,'vendor',$4) RETURNING id,email,full_name,job_title`,
      [email.toLowerCase().trim(), full_name, job_title||null, hash]
    );
    await db.query(
      `INSERT INTO vendors (user_id, company_name, category, description, verified, is_primary_user)
       SELECT $1, company_name, category, description, verified, false FROM vendors WHERE id=$2`,
      [newUser.rows[0].id, v.id]
    );
    res.status(201).json({ ...newUser.rows[0], is_primary_user: false });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/vendors/team/:userId ─────────────────────────
router.patch('/team/:userId', auth, requireRole('vendor'), async (req, res) => {
  try {
    const primary = await db.query(`SELECT * FROM vendors WHERE user_id=$1 AND is_primary_user=true`, [req.user.id]);
    if (!primary.rows.length) return res.status(403).json({ error: 'Only the primary account holder can edit team members' });
    const { full_name, email, job_title, password } = req.body;
    const fields=[]; const vals=[]; let idx=1;
    if (full_name !== undefined) { fields.push(`full_name=$${idx++}`); vals.push(full_name); }
    if (email     !== undefined) { fields.push(`email=$${idx++}`);     vals.push(email.toLowerCase().trim()); }
    if (job_title !== undefined) { fields.push(`job_title=$${idx++}`); vals.push(job_title); }
    if (password  !== undefined && password.length >= 8) {
      const bcrypt = require('bcryptjs');
      fields.push(`password_hash=$${idx++}`);
      vals.push(await bcrypt.hash(password, 10));
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.userId);
    const result = await db.query(
      `UPDATE users SET ${fields.join(',')} WHERE id=$${idx} AND role='vendor' RETURNING id,email,full_name,job_title`, vals
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/vendors/team/:userId ────────────────────────
router.delete('/team/:userId', auth, requireRole('vendor'), async (req, res) => {
  try {
    const primary = await db.query(`SELECT * FROM vendors WHERE user_id=$1 AND is_primary_user=true`, [req.user.id]);
    if (!primary.rows.length) return res.status(403).json({ error: 'Only the primary account holder can remove team members' });
    const target = await db.query(`SELECT is_primary_user FROM vendors WHERE user_id=$1`, [req.params.userId]);
    if (target.rows[0]?.is_primary_user) return res.status(400).json({ error: 'Cannot remove the primary account holder' });
    await db.query(`DELETE FROM vendors WHERE user_id=$1`, [req.params.userId]);
    await db.query(`DELETE FROM users WHERE id=$1 AND role='vendor'`, [req.params.userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

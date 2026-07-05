const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let query = `
      SELECT p.*,
        v.company_name as vendor_name, v.rating as vendor_rating, v.verified,
        CASE WHEN sl.id IS NOT NULL THEN true ELSE false END as is_sponsored,
        sl.slot_number
      FROM packages p
      JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN sponsored_listings sl
        ON sl.package_id = p.id
        AND sl.start_date <= $1
        AND sl.end_date   >= $1
        AND COALESCE(sl.listing_type, 'marketplace') = 'marketplace'
      WHERE p.status = 'live'
        AND (p.start_date IS NULL OR p.start_date <= $1)
        AND (p.end_date   IS NULL OR p.end_date   >= $1)
    `;
    const params = [today];
    if (category) { params.push(category); query += ` AND p.category = $${params.length}`; }
    if (search)   { params.push('%' + search + '%'); query += ` AND (p.title ILIKE $${params.length} OR p.destination ILIKE $${params.length})`; }
    query += ' ORDER BY is_sponsored DESC, sl.slot_number ASC NULLS LAST, v.rating DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/vendor/mine', auth, requireRole('vendor'), async (req, res) => {
  try {
    const vendor = await db.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Vendor profile not found' });
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query(
      `SELECT *,
        CASE WHEN end_date < $2 THEN 'expired'
             WHEN end_date <= ($2::date + interval '14 days') THEN 'expiring_soon'
             ELSE status END as display_status,
        (end_date::date - $2::date) as days_until_expiry
       FROM packages WHERE vendor_id=$1 ORDER BY created_at DESC`,
      [vendor.rows[0].id, today]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active sponsored packages (public)
router.get('/sponsored', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query(`
      SELECT p.*, v.company_name as vendor_name, v.rating as vendor_rating, v.verified,
        sl.slot_number, sl.id as sponsored_listing_id, true as is_sponsored
      FROM sponsored_listings sl
      JOIN packages p ON sl.package_id = p.id
      JOIN vendors v ON p.vendor_id = v.id
      WHERE sl.start_date <= $1 AND sl.end_date >= $1
        AND COALESCE(sl.listing_type, 'marketplace') = 'marketplace'
        AND p.status = 'live'
        AND (p.end_date IS NULL OR p.end_date >= $1)
      ORDER BY sl.slot_number ASC
    `, [today]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: get all sponsored listings
router.get('/sponsored/all', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT sl.*, sl.listing_type, p.title as package_title, p.category, p.destination,
        v.company_name as vendor_name
      FROM sponsored_listings sl
      JOIN packages p ON sl.package_id = p.id
      JOIN vendors v ON sl.vendor_id = v.id
      ORDER BY sl.end_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// ── GET /api/packages/expiry-check ───────────────────────────
// Called by employee portal on load — notifies about booked packages expiring soon
router.get('/expiry-check', auth, requireRole('employee'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find employee's active bookings where the package expires within 14 days
    const result = await db.query(`
      SELECT b.id as booking_id, p.title, p.end_date,
        (p.end_date::date - $2::date) as days_until_expiry
      FROM bookings b
      JOIN packages p ON b.package_id = p.id
      WHERE b.employee_id = $1
        AND b.status IN ('pending','approved','confirmed')
        AND p.end_date IS NOT NULL
        AND p.end_date != '2099-12-31'
        AND p.end_date >= $2
        AND p.end_date <= ($2::date + interval '14 days')
    `, [req.user.id, today]);

    // For each expiring booking, create a notification if not already sent today
    for (const row of result.rows) {
      const existing = await db.query(`
        SELECT id FROM notifications
        WHERE user_id = $1
          AND message LIKE $2
          AND created_at >= NOW() - interval '24 hours'
      `, [req.user.id, `%${row.title}%expires%`]);

      if (!existing.rows.length) {
        await db.query(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES ($1, $2, $3, 'warning')
          ON CONFLICT DO NOTHING
        `, [
          req.user.id,
          `Package expiring soon ⏳`,
          `Your booking for "${row.title}" expires in ${row.days_until_expiry} day${row.days_until_expiry === 1 ? '' : 's'}. Contact your vendor if you have questions.`
        ]);
      }
    }

    res.json({ checked: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, v.company_name as vendor_name, v.rating as vendor_rating, v.verified, v.description as vendor_description
      FROM packages p JOIN vendors v ON p.vendor_id = v.id
      WHERE p.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, requireRole('vendor'), async (req, res) => {
  try {
    const vendor = await db.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Vendor profile not found' });
    const { title, description, category, destination, duration, price_gbp, emoji, image_url, start_date, end_date } = req.body;
    if (!title || !category || !destination || !duration || !price_gbp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await db.query(
      `INSERT INTO packages (vendor_id, title, description, category, destination, duration, price_gbp, emoji, image_url, status, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11) RETURNING *`,
      [vendor.rows[0].id, title, description, category, destination, duration, price_gbp, emoji || '🌍', image_url || null,
       start_date || '2026-01-01', end_date || '2099-12-31']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Vendor editing their own package
router.patch('/:id', auth, async (req, res) => {
  try {
    const { title, description, category, destination, duration,
            price_gbp, emoji, status, image_url, admin_status,
            start_date, end_date } = req.body;

    // HR admins can update admin_status; vendors can update everything else
    if (req.user.role === 'hr') {
      if (admin_status === undefined) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      const result = await db.query(
        `UPDATE packages SET admin_status=$1, approved_by=$2, approved_at=NOW()
         WHERE id=$3 RETURNING *`,
        [admin_status, req.user.id, req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Package not found' });
      return res.json(result.rows[0]);
    }

    // Vendor — verify ownership
    const vendor = await db.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!vendor.rows.length) return res.status(403).json({ error: 'Vendor profile not found' });
    const pkg = await db.query(
      'SELECT * FROM packages WHERE id=$1 AND vendor_id=$2',
      [req.params.id, vendor.rows[0].id]
    );
    if (!pkg.rows.length) return res.status(404).json({ error: 'Package not found' });

    const result = await db.query(
      `UPDATE packages SET
        title       = COALESCE($1, title),
        description = COALESCE($2, description),
        category    = COALESCE($3, category),
        destination = COALESCE($4, destination),
        duration    = COALESCE($5, duration),
        price_gbp   = COALESCE($6, price_gbp),
        emoji       = COALESCE($7, emoji),
        status      = COALESCE($8, status),
        image_url   = COALESCE($9, image_url),
        start_date  = COALESCE($11, start_date),
        end_date    = COALESCE($12, end_date)
       WHERE id=$10 RETURNING *`,
      [title, description, category, destination, duration,
       price_gbp, emoji, status, image_url, req.params.id,
       start_date || null, end_date || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, requireRole('vendor'), async (req, res) => {
  try {
    const vendor = await db.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    await db.query('DELETE FROM packages WHERE id=$1 AND vendor_id=$2', [req.params.id, vendor.rows[0].id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// -- POST /api/packages/import (CSV parsed client-side, sent as JSON array) --
router.post('/import', auth, requireRole('vendor'), async (req, res) => {
  try {
    const { packages: rows } = req.body;
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ error: 'No package data provided' });
    }
    if (rows.length > 200) {
      return res.status(400).json({ error: 'Maximum 200 packages per import' });
    }

    const vendor = await db.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!vendor.rows.length) return res.status(403).json({ error: 'Vendor not found' });
    const vendorId = vendor.rows[0].id;

    const VALID_CATEGORIES = ['travel','volunteering','courses','work_abroad','accommodation','airlines'];
    const REQUIRED = ['title','description','category','destination','duration','price_gbp'];

    let created = 0; let skipped = 0; const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Validate required fields
      const missingFields = REQUIRED.filter(f => !row[f]?.toString().trim());
      if (missingFields.length) {
        skipped++;
        errors.push({ row: i + 2, message: `Missing: ${missingFields.join(', ')}` });
        continue;
      }

      // Validate category
      const category = row.category.toLowerCase().trim();
      if (!VALID_CATEGORIES.includes(category)) {
        skipped++;
        errors.push({ row: i + 2, message: `Invalid category "${row.category}"` });
        continue;
      }

      const price = parseFloat(row.price_gbp);
      if (isNaN(price) || price <= 0) {
        skipped++;
        errors.push({ row: i + 2, message: `Invalid price "${row.price_gbp}"` });
        continue;
      }

      const status = ['live','draft'].includes(row.status?.toLowerCase()) ? row.status.toLowerCase() : 'draft';

      await db.query(
        `INSERT INTO packages (vendor_id, title, description, category, destination, duration, price_gbp, emoji, image_url, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [vendorId, row.title.trim(), row.description.trim(), category,
         row.destination.trim(), row.duration.trim(), price,
         row.emoji?.trim() || null, row.image_url?.trim() || null, status]
      );
      created++;
    }

    res.json({ created, skipped, errors: errors.slice(0, 10), total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Note: cart deduplication and allowance check handled in cart.js route
// ── Sponsored listings ───────────────────────────────────────


// Admin: create sponsored listing
router.post('/sponsored', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { package_id, vendor_id, slot_number, monthly_fee_gbp, start_date, end_date, notes } = req.body;
    if (!package_id || !vendor_id || !slot_number || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const listing_type = req.body.listing_type || 'marketplace';
    // Check slot not already occupied for overlapping dates — scoped to listing_type
    // Platinum slot 1 and marketplace slot 1 are independent
    const newStart = start_date || new Date().toISOString().split('T')[0];
    const conflict = await db.query(`
      SELECT id FROM sponsored_listings
      WHERE slot_number = $1
        AND COALESCE(listing_type, 'marketplace') = $4
        AND start_date <= $3
        AND end_date   >= $2
    `, [slot_number, newStart, end_date, listing_type]);
    if (conflict.rows.length) {
      return res.status(409).json({ error: `${listing_type === 'platinum' ? 'Platinum slot' : 'Slot'} ${slot_number} is already occupied for those dates` });
    }
    const result = await db.query(`
      INSERT INTO sponsored_listings (package_id, vendor_id, slot_number, listing_type, monthly_fee_gbp, start_date, end_date, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [package_id, vendor_id, slot_number, listing_type, monthly_fee_gbp || 2000,
        start_date || new Date().toISOString().split('T')[0], end_date, notes || null, req.user.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete sponsored listing
// PATCH /api/packages/sponsored/:id/dates — extend or update listing dates
router.patch('/sponsored/:id/dates', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    if (!end_date) return res.status(400).json({ error: 'End date is required' });
    const result = await db.query(
      `UPDATE sponsored_listings SET
         start_date = COALESCE($1::date, start_date),
         end_date   = $2::date
       WHERE id = $3 RETURNING *`,
      [start_date || null, end_date, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Listing not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/sponsored/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    await db.query('DELETE FROM sponsored_listings WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT p.*, v.company_name as vendor_name, v.rating as vendor_rating, v.verified
      FROM packages p
      JOIN vendors v ON p.vendor_id = v.id
      WHERE p.status = 'live'
    `;
    const params = [];
    if (category) { params.push(category); query += ` AND p.category = $${params.length}`; }
    if (search)   { params.push(`%${search}%`); query += ` AND (p.title ILIKE $${params.length} OR p.destination ILIKE $${params.length})`; }
    query += ' ORDER BY v.rating DESC';
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
    const result = await db.query(
      'SELECT * FROM packages WHERE vendor_id=$1 ORDER BY created_at DESC',
      [vendor.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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
    const { title, description, category, destination, duration, price_gbp, emoji, image_url } = req.body;
    if (!title || !category || !destination || !duration || !price_gbp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await db.query(
      `INSERT INTO packages (vendor_id, title, description, category, destination, duration, price_gbp, emoji, image_url, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft') RETURNING *`,
      [vendor.rows[0].id, title, description, category, destination, duration, price_gbp, emoji || '🌍', image_url || null]
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
            price_gbp, emoji, status, image_url, admin_status } = req.body;

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
        image_url   = COALESCE($9, image_url)
       WHERE id=$10 RETURNING *`,
      [title, description, category, destination, duration,
       price_gbp, emoji, status, image_url, req.params.id]
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

module.exports = router;

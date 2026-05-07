const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

router.post('/', auth, requireRole('employee'), async (req, res) => {
  try {
    const { package_id, departure_date, payroll_months } = req.body;
    if (!package_id || !departure_date || ![3,6,12].includes(Number(payroll_months))) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }
    const pkg = await db.query('SELECT * FROM packages WHERE id=$1 AND status=$2', [package_id, 'live']);
    if (!pkg.rows.length) return res.status(404).json({ error: 'Package not available' });
    const total = parseFloat(pkg.rows[0].price_gbp);
    const monthly = parseFloat((total / payroll_months).toFixed(2));
    const result = await db.query(
      `INSERT INTO bookings (employee_id, package_id, company_id, departure_date, payroll_months, monthly_amount, total_amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *`,
      [req.user.id, package_id, req.user.company_id, departure_date, payroll_months, monthly, total]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/mine', auth, requireRole('employee'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, p.title as package_title, p.destination, p.emoji, p.duration,
             v.company_name as vendor_name
      FROM bookings b
      JOIN packages p ON b.package_id = p.id
      JOIN vendors v ON p.vendor_id = v.id
      WHERE b.employee_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/company', auth, requireRole('hr'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, p.title as package_title, p.destination, p.emoji,
             u.full_name as employee_name, u.email as employee_email,
             v.company_name as vendor_name
      FROM bookings b
      JOIN packages p ON b.package_id = p.id
      JOIN users u ON b.employee_id = u.id
      JOIN vendors v ON p.vendor_id = v.id
      WHERE b.company_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.company_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/vendor', auth, requireRole('vendor'), async (req, res) => {
  try {
    const vendor = await db.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const result = await db.query(`
      SELECT b.*, p.title as package_title, p.destination, p.emoji,
             u.full_name as employee_name, c.name as company_name
      FROM bookings b
      JOIN packages p ON b.package_id = p.id
      JOIN users u ON b.employee_id = u.id
      JOIN companies c ON b.company_id = c.id
      WHERE p.vendor_id = $1
      ORDER BY b.created_at DESC
    `, [vendor.rows[0].id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/status', auth, requireRole('hr'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved','confirmed','cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await db.query(
      'UPDATE bookings SET status=$1 WHERE id=$2 AND company_id=$3 RETURNING *',
      [status, req.params.id, req.user.company_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

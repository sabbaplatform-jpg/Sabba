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
    const total   = parseFloat(pkg.rows[0].price_gbp);
    const monthly = parseFloat((total / payroll_months).toFixed(2));
    const result  = await db.query(
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

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    // When approving, capture commission rate from vendor at point of approval
    if (status === 'approved') {
      await db.query(`
        UPDATE bookings b SET
          status = 'approved',
          commission_rate   = COALESCE(v.commission_rate, 0.10),
          commission_amount = ROUND(b.total_amount * COALESCE(v.commission_rate, 0.10), 2)
        FROM packages p
        JOIN vendors v ON p.vendor_id = v.id
        WHERE b.id = $1 AND b.package_id = p.id
      `, [req.params.id]);
    } else {
      await db.query(
        'UPDATE bookings SET status=$1 WHERE id=$2',
        [status, req.params.id]
      );
    }

    if (status === 'approved') {
      // FIX: use employee_id (not user_id) — bookings table uses employee_id
      const booking = await db.query(`
        SELECT b.*,
               u.full_name  AS employee_name,
               u.id         AS employee_id,
               p.title      AS package_title,
               p.destination,
               hr.full_name AS hr_name
        FROM bookings b
        JOIN users    u  ON u.id  = b.employee_id
        JOIN packages p  ON p.id  = b.package_id
        JOIN users    hr ON hr.id = $2
        WHERE b.id = $1
      `, [req.params.id, req.user.id]);

      if (booking.rows.length) {
        const b       = booking.rows[0];
        const subject = `Adventure approved: ${b.package_title}`;
        const body    = `Great news! Your booking for "${b.package_title}" to ${b.destination} has been approved by ${b.hr_name}. Your vendor will be in touch with booking details shortly. Safe travels! 🌍`;

        // Create message thread between HR and employee
        const thread = await db.query(`
          INSERT INTO message_threads (subject, thread_type, booking_id)
          VALUES ($1, 'booking', $2) RETURNING id
        `, [subject, req.params.id]);
        const threadId = thread.rows[0].id;

        // Add both as participants
        await db.query(`
          INSERT INTO thread_participants (thread_id, user_id)
          VALUES ($1, $2), ($1, $3)
          ON CONFLICT DO NOTHING
        `, [threadId, b.employee_id, req.user.id]);

        // Post the approval message
        await db.query(
          'INSERT INTO messages (thread_id, sender_id, body) VALUES ($1, $2, $3)',
          [threadId, req.user.id, body]
        );

        // Notify employee
        await db.query(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES ($1, 'Adventure approved! 🎉', $2, 'success')
        `, [b.employee_id,
            `Your booking for ${b.package_title} has been approved. Check your messages for details.`]);

        // Confirm to HR
        await db.query(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES ($1, 'Booking approved', $2, 'info')
        `, [req.user.id,
            `You approved ${b.employee_name}'s booking for ${b.package_title}.`]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// routes/allowance.js — employee travel allowance
const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/allowance?year=2026 — get employee allowance for a given year
router.get('/', auth, requireRole('employee'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Always read the authoritative spend limit from employee_profiles
    const profile = await db.query(`
      SELECT ep.spend_limit_gbp, ep.sabba_points, u.company_id
      FROM employee_profiles ep
      JOIN users u ON u.id = ep.user_id
      WHERE ep.user_id = $1
    `, [req.user.id]);

    const spendLimit   = profile.rows[0]?.spend_limit_gbp
      ? parseFloat(profile.rows[0].spend_limit_gbp)
      : 5000;
    const companyId    = profile.rows[0]?.company_id || req.user.company_id;
    const sabbaPoints  = parseInt(profile.rows[0]?.sabba_points || 0);

    // Upsert the travel_allowances row — always sync total from spend_limit_gbp
    await db.query(`
      INSERT INTO travel_allowances (user_id, company_id, year, total_allowance_gbp, used_allowance_gbp)
      VALUES ($1, $2, $3, $4, 0)
      ON CONFLICT (user_id, year) DO UPDATE
        SET total_allowance_gbp = $4
    `, [req.user.id, companyId, year, spendLimit]);

    // Calculate used from payroll bookings for this year (payroll only — card excluded)
    const used = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) as used
      FROM bookings
      WHERE employee_id = $1
        AND payment_method = 'payroll'
        AND status IN ('pending', 'approved', 'vendor_confirmed', 'confirmed')
        AND EXTRACT(YEAR FROM created_at) = $2
    `, [req.user.id, year]);

    const usedAmount  = parseFloat(used.rows[0].used);
    const remaining   = Math.max(0, spendLimit - usedAmount);

    // Get all years with data + always include current year
    const allYears = await db.query(`
      SELECT DISTINCT year FROM travel_allowances
      WHERE user_id = $1 ORDER BY year DESC
    `, [req.user.id]);

    const currentYear     = new Date().getFullYear();
    const availableYears  = [...new Set([
      ...allYears.rows.map(r => r.year),
      currentYear,
    ])].sort((a, b) => b - a);

    res.json({
      year,
      total_allowance_gbp:     spendLimit,
      used_allowance_gbp:      usedAmount,
      remaining_allowance_gbp: remaining,
      available_years:         availableYears,
      sabba_points:            sabbaPoints,
      sabba_points_value_gbp:  parseFloat((sabbaPoints / 100).toFixed(2)),
      note: 'Payroll bookings only. Card payments do not count against this allowance.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/allowance/history — get all years summary for the employee
router.get('/history', auth, requireRole('employee'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ta.year, ta.total_allowance_gbp,
             COALESCE(SUM(CASE WHEN b.payment_method='payroll' AND b.status IN ('pending','approved','vendor_confirmed','confirmed') THEN b.total_amount ELSE 0 END), 0) as used_allowance_gbp,
             COUNT(CASE WHEN b.payment_method='payroll' THEN 1 END) as payroll_bookings,
             COUNT(CASE WHEN b.payment_method='card' THEN 1 END) as card_bookings
      FROM travel_allowances ta
      LEFT JOIN bookings b ON b.employee_id = ta.user_id AND EXTRACT(YEAR FROM b.created_at) = ta.year
      WHERE ta.user_id = $1
      GROUP BY ta.year, ta.total_allowance_gbp
      ORDER BY ta.year DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// ── POST /api/allowance/award-points — employee awards points to colleague ──
router.post('/award-points', auth, requireRole('employee'), async (req, res) => {
  try {
    const { recipient_id, points, message } = req.body;
    if (!recipient_id || !points || points < 1 || points > 500) {
      return res.status(400).json({ error: 'Recipient and points (1–500) are required' });
    }
    // Check sender has enough points
    const sender = await db.query(
      'SELECT sabba_points, company_id FROM employee_profiles WHERE user_id=$1',
      [req.user.id]
    );
    if (!sender.rows.length || sender.rows[0].sabba_points < points) {
      return res.status(400).json({ error: 'Insufficient Sabba Points' });
    }
    // Verify recipient is in same company
    const recipient = await db.query(
      `SELECT u.company_id, u.full_name FROM users u
       JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE u.id=$1`,
      [recipient_id]
    );
    if (!recipient.rows.length || recipient.rows[0].company_id !== sender.rows[0].company_id) {
      return res.status(403).json({ error: 'You can only award points to colleagues in your company' });
    }
    // Deduct from sender
    await db.query(
      'UPDATE employee_profiles SET sabba_points = sabba_points - $1 WHERE user_id=$2',
      [points, req.user.id]
    );
    await db.query(
      'INSERT INTO points_transactions (user_id, points, reason) VALUES ($1,$2,$3)',
      [req.user.id, -points, `Awarded to ${recipient.rows[0].full_name}`]
    );
    // Add to recipient
    await db.query(
      'UPDATE employee_profiles SET sabba_points = sabba_points + $1 WHERE user_id=$2',
      [points, recipient_id]
    );
    await db.query(
      'INSERT INTO points_transactions (user_id, points, reason) VALUES ($1,$2,$3)',
      [recipient_id, points, `Awarded by colleague${message ? ': ' + message : ''}`]
    );
    // Notify recipient
    const senderInfo = await db.query('SELECT full_name FROM users WHERE id=$1', [req.user.id]);
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,'success')`,
      [recipient_id,
       `You received ${points} Sabba Points! 🎉`,
       `${senderInfo.rows[0]?.full_name} awarded you ${points} points${message ? ': "' + message + '"' : '.'}`]
    );
    res.json({ success: true, points_awarded: points });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/allowance/award-voucher — HR awards voucher to employee ──
router.post('/award-voucher', auth, requireRole('hr'), async (req, res) => {
  try {
    const { employee_id, points, reason } = req.body;
    if (!employee_id || !points || points < 1) {
      return res.status(400).json({ error: 'Employee and points value are required' });
    }
    // Verify employee is in same company
    const emp = await db.query(
      'SELECT u.full_name, u.company_id FROM users u WHERE u.id=$1',
      [employee_id]
    );
    if (!emp.rows.length || emp.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Employee not found in your company' });
    }
    // Award points as voucher
    await db.query(
      `INSERT INTO employee_profiles (user_id, sabba_points)
       VALUES ($1,$2)
       ON CONFLICT (user_id) DO UPDATE SET sabba_points = employee_profiles.sabba_points + $2`,
      [employee_id, points]
    );
    await db.query(
      'INSERT INTO points_transactions (user_id, points, reason) VALUES ($1,$2,$3)',
      [employee_id, points, `HR voucher award${reason ? ': ' + reason : ''}`]
    );
    // Notify employee
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,'success')`,
      [employee_id,
       `You've received a ${points}-point voucher! 🎁`,
       `Your HR team has awarded you a ${points} Sabba Points voucher${reason ? ': "' + reason + '"' : '. Redeem them on your next adventure booking.'}`]
    );
    res.json({ success: true, points_awarded: points, employee_name: emp.rows[0].full_name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

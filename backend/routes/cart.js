const router = require('express').Router();
const db     = require('../lib/db');
const email  = require('../lib/email');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/cart
router.get('/', auth, requireRole('employee'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ci.*, p.title, p.destination, p.emoji, p.price_gbp, p.duration,
             p.category, p.image_url, v.company_name as vendor_name, v.rating as vendor_rating
      FROM cart_items ci
      JOIN packages p ON ci.package_id = p.id
      JOIN vendors v ON p.vendor_id = v.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart
// ON CONFLICT handles deduplication — adding same package updates it rather than duplicating
router.post('/', auth, requireRole('employee'), async (req, res) => {
  try {
    const { package_id, payroll_months, departure_date, payment_method } = req.body;
    const result = await db.query(`
      INSERT INTO cart_items (user_id, package_id, payroll_months, departure_date, payment_method)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (user_id, package_id) DO UPDATE SET
        payroll_months=$3, departure_date=$4, payment_method=$5
      RETURNING *
    `, [req.user.id, package_id, payroll_months || 6, departure_date, payment_method || 'payroll']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', auth, requireRole('employee'), async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/checkout
router.post('/checkout', auth, requireRole('employee'), async (req, res) => {
  try {
    const { payment_method, payroll_months, points_used } = req.body;

    // Get cart items
    const cart = await db.query(`
      SELECT ci.*, p.title, p.price_gbp, p.id as pkg_id
      FROM cart_items ci JOIN packages p ON ci.package_id = p.id
      WHERE ci.user_id = $1
    `, [req.user.id]);
    if (!cart.rows.length) return res.status(400).json({ error: 'Cart is empty' });

    // Deduct Sabba Points if used
    const pointsToDeduct = parseInt(points_used) || 0;
    if (pointsToDeduct > 0) {
      const profile = await db.query(
        'SELECT sabba_points FROM employee_profiles WHERE user_id=$1',
        [req.user.id]
      );
      const available = profile.rows[0]?.sabba_points || 0;
      if (pointsToDeduct > available) {
        return res.status(400).json({ error: 'Insufficient Sabba Points' });
      }
      await db.query(
        'UPDATE employee_profiles SET sabba_points = sabba_points - $1 WHERE user_id=$2',
        [pointsToDeduct, req.user.id]
      );
    }

    if (payment_method === 'card') {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const pointsDiscount = pointsToDeduct / 100;

      const lineItems = cart.rows.map(item => ({
        price_data: {
          currency: 'gbp',
          product_data: { name: item.title, description: 'Adventure package via Sabba' },
          unit_amount: Math.round((Number(item.price_gbp) - pointsDiscount / cart.rows.length) * 100),
        },
        quantity: 1,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cart`,
        metadata: { user_id: req.user.id, company_id: req.user.company_id },
      });

      for (const item of cart.rows) {
        const total   = Number(item.price_gbp);
        const monthly = parseFloat((total / (item.payroll_months || 1)).toFixed(2));
        await db.query(`
          INSERT INTO bookings
            (employee_id, package_id, company_id, departure_date, payroll_months,
             monthly_amount, total_amount, status, payment_method, stripe_checkout_session)
          VALUES ($1,$2,$3,$4,$5,$6,$7,'approved','card',$8)
        `, [
          req.user.id, item.pkg_id, req.user.company_id,
          item.departure_date || new Date(Date.now() + 90*24*60*60*1000),
          item.payroll_months || 1, monthly, total, session.id
        ]);
      }

      await db.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1,'Card payment processing 💳','Your booking has been created. Complete payment to confirm your adventure.','info')
      `, [req.user.id]);

      await db.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
      return res.json({ url: session.url, type: 'stripe' });
    }

    // Payroll checkout
    const bookingIds = [];
    const months = parseInt(payroll_months) || 6;

    for (const item of cart.rows) {
      const total   = Number(item.price_gbp);
      const monthly = parseFloat((total / months).toFixed(2));
      const result  = await db.query(`
        INSERT INTO bookings
          (employee_id, package_id, company_id, departure_date, payroll_months,
           monthly_amount, total_amount, status, payment_method)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','payroll') RETURNING id
      `, [
        req.user.id, item.pkg_id, req.user.company_id,
        item.departure_date || new Date(Date.now() + 90*24*60*60*1000),
        months, monthly, total
      ]);
      bookingIds.push(result.rows[0].id);

      await db.query(
        'INSERT INTO points_transactions (user_id, points, reason) VALUES ($1, 100, $2)',
        [req.user.id, 'Package booked']
      );
      await db.query(
        'UPDATE employee_profiles SET sabba_points = sabba_points + 100 WHERE user_id=$1',
        [req.user.id]
      );
    }

    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1,'Booking submitted! 🌍','Your adventure request is with your HR team for approval.','info')
    `, [req.user.id]);

    // Email employee confirmation + HR approval request
    const userInfo = await db.query(`
      SELECT u.email, u.full_name, u.company_id,
        p.title as package_title, p.destination,
        hr.email as hr_email, hr.full_name as hr_name
      FROM users u
      JOIN cart_items ci ON ci.user_id = u.id
      JOIN packages p ON p.id = ci.package_id
      LEFT JOIN users hr ON hr.company_id = u.company_id AND hr.role = 'hr'
      WHERE u.id = $1 LIMIT 1
    `, [req.user.id]).catch(() => ({ rows: [] }));

    if (userInfo.rows.length) {
      const info = userInfo.rows[0];
      // Email employee
      email.sendBookingSubmitted({
        to: info.email, full_name: info.full_name,
        package_title: info.package_title,
        destination: info.destination,
        company_id: info.company_id,
      }).catch(() => {});
      // Email HR
      if (info.hr_email) {
        email.sendHRApprovalRequest({
          to: info.hr_email, hr_name: info.hr_name,
          employee_name: info.full_name,
          package_title: info.package_title,
          destination: info.destination,
          total_amount: cart.rows.reduce((s, i) => s + Number(i.price_gbp), 0),
          company_id: info.company_id,
        }).catch(() => {});
      }
    }

    await db.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
    res.json({ type: 'payroll', booking_ids: bookingIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

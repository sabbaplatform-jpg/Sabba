const router  = require('express').Router();

// Rate limiters injected from app (set in server.js)
const getLoginLimiter = (req) => req.app.get('loginLimiter') || ((r,s,n)=>n());
const getResetLimiter = (req) => req.app.get('passwordResetLimiter') || ((r,s,n)=>n());
const applyLoginLimit = (req, res, next) => getLoginLimiter(req)(req, res, next);
const applyResetLimit = (req, res, next) => getResetLimiter(req)(req, res, next);
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { body, validationResult } = require('express-validator');
const db      = require('../lib/db');
const { auth } = require('../middleware/auth');
const email   = require('../lib/email');

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('full_name').notEmpty(),
  body('role').isIn(['hr', 'employee', 'vendor']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email: userEmail, password, full_name, role, company_id, company_name, category } = req.body;
  try {
    const existing = await db.query('SELECT id FROM users WHERE email=$1', [userEmail]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, role, full_name, company_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, role, full_name',
      [userEmail, password_hash, role, full_name, company_id || null]
    );
    const user = result.rows[0];
    if (role === 'vendor' && company_name && category) {
      await db.query('INSERT INTO vendors (user_id, company_name, category) VALUES ($1,$2,$3)', [user.id, company_name, category]);
      // Notify Sabba team of new vendor signup
      email.sendNewVendorAlert({
        vendor_name: company_name,
        vendor_email: userEmail,
        category: category,
        full_name: full_name,
      }).catch(err => console.error('[EMAIL] vendor alert:', err.message));
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', applyLoginLimit, [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email: userEmail, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email=$1', [userEmail]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name, company_id: user.company_id },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name, company_id: user.company_id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query('SELECT id, email, role, full_name, company_id FROM users WHERE id=$1', [decoded.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/profile ─────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, full_name, role, created_at FROM users WHERE id=$1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/auth/profile ───────────────────────────────────
router.patch('/profile', auth, async (req, res) => {
  try {
    const { full_name, email: newEmail, current_password, new_password } = req.body;
    const user = await db.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

    const updates = []; const values = []; let idx = 1;
    if (full_name) { updates.push(`full_name=$${idx++}`); values.push(full_name); }
    if (newEmail)  { updates.push(`email=$${idx++}`);     values.push(newEmail.toLowerCase().trim()); }
    if (new_password) {
      if (!current_password) return res.status(400).json({ error: 'Current password required' });
      const valid = await bcrypt.compare(current_password, user.rows[0].password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
      if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      updates.push(`password_hash=$${idx++}`); values.push(await bcrypt.hash(new_password, 10));
    }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.user.id);
    const result = await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id=$${idx} RETURNING id, email, full_name, role`, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────
// Request a password reset — sends email with token link
router.post('/forgot-password', applyResetLimit, [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Valid email required' });

  // Always return 200 to prevent email enumeration
  res.json({ message: 'If that email exists on Sabba, you\'ll receive a reset link shortly.' });

  try {
    const { email: userEmail } = req.body;
    const result = await db.query('SELECT id, email, full_name FROM users WHERE email=$1', [userEmail]);
    if (!result.rows.length) return; // Silent — don't reveal if email exists

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await db.query(`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET token=$2, expires_at=$3, used=FALSE
    `, [user.id, token, expires]);

    // Send email (non-blocking)
    email.sendPasswordReset({ to: user.email, full_name: user.full_name, reset_token: token }).catch(console.error);
  } catch (err) {
    console.error('forgot-password error:', err.message);
  }
});

// ── POST /api/auth/reset-password ────────────────────────────
// Validate token and set new password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Token and password (min 8 chars) required' });

  try {
    const { token, password } = req.body;

    const result = await db.query(`
      SELECT pr.*, u.email, u.full_name
      FROM password_resets pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.token=$1 AND pr.expires_at > NOW() AND pr.used=FALSE
    `, [token]);

    if (!result.rows.length) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const reset = result.rows[0];
    const hash  = await bcrypt.hash(password, 10);

    // Update password and mark token used
    await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, reset.user_id]);
    await db.query('UPDATE password_resets SET used=TRUE WHERE id=$1', [reset.id]);

    res.json({ message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/reset-password/validate ────────────────────
// Check if a reset token is still valid (used by frontend before showing form)
router.get('/reset-password/validate', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ valid: false });
    const result = await db.query(`
      SELECT id FROM password_resets
      WHERE token=$1 AND expires_at > NOW() AND used=FALSE
    `, [token]);
    res.json({ valid: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
});

module.exports = router;

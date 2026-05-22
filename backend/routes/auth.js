const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../lib/db');
const { auth } = require('../middleware/auth');

router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('full_name').notEmpty(),
  body('role').isIn(['hr', 'employee', 'vendor']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password, full_name, role, company_id, company_name, category } = req.body;
  try {
    const existing = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, role, full_name, company_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, role, full_name',
      [email, password_hash, role, full_name, company_id || null]
    );
    const user = result.rows[0];
    if (role === 'vendor' && company_name && category) {
      await db.query('INSERT INTO vendors (user_id, company_name, category) VALUES ($1,$2,$3)', [user.id, company_name, category]);
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name, company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name, company_id: user.company_id }
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query(
      'SELECT id, email, role, full_name, company_id FROM users WHERE id=$1',
      [decoded.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

// GET /api/auth/profile — get current user's own profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/profile — update current user's own profile (name, email, password)
router.patch('/profile', auth, async (req, res) => {
  try {
    const { full_name, email, current_password, new_password } = req.body;

    const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

    const updates = [];
    const values  = [];
    let idx = 1;

    if (full_name) { updates.push(`full_name=$${idx++}`); values.push(full_name); }
    if (email)     { updates.push(`email=$${idx++}`);     values.push(email.toLowerCase().trim()); }

    if (new_password) {
      if (!current_password) return res.status(400).json({ error: 'Current password required to set a new one' });
      const valid = await bcrypt.compare(current_password, user.rows[0].password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
      if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      const hash = await bcrypt.hash(new_password, 10);
      updates.push(`password_hash=$${idx++}`);
      values.push(hash);
    }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    values.push(req.user.id);
    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id=$${idx} RETURNING id, email, full_name, role`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

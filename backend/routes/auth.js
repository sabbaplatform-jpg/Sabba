const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../lib/db');

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
      await db.query(
        'INSERT INTO vendors (user_id, company_name, category) VALUES ($1,$2,$3)',
        [user.id, company_name, category]
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name, company_id: user.company_id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', require('../middleware/auth').auth, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, role, full_name, company_id FROM users WHERE id=$1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

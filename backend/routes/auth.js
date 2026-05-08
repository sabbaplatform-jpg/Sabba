const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../lib/db');

router.post('/login', async (req, res) => {
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
    res.status(500).json({ error: err.message, code: err.code });
  }
});

router.post('/register', async (req, res) => {
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  res.json({ ok: true });
});

module.exports = router;

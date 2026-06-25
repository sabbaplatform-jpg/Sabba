const express  = require('express');
const router   = express.Router();
const db       = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

// ── GET /api/hr/team ─────────────────────────────────────────
// List all HR admins in the same company
router.get('/', auth, requireRole('hr'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, full_name, job_title, created_at
       FROM users WHERE company_id=$1 AND role='hr' ORDER BY created_at ASC`,
      [req.user.company_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/hr/team ────────────────────────────────────────
// HR admin invites a colleague
router.post('/', auth, requireRole('hr'), async (req, res) => {
  try {
    const { full_name, email, job_title } = req.body;
    if (!full_name || !email) return res.status(400).json({ error: 'full_name and email are required' });
    const existing = await db.query(`SELECT id FROM users WHERE email=$1`, [email.toLowerCase().trim()]);
    if (existing.rows.length) return res.status(409).json({ error: 'An account with this email already exists' });
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Welcome2Sabba!', 10);
    const result = await db.query(
      `INSERT INTO users (email,full_name,job_title,role,company_id,password_hash)
       VALUES ($1,$2,$3,'hr',$4,$5) RETURNING id,email,full_name,job_title,created_at`,
      [email.toLowerCase().trim(), full_name, job_title||null, req.user.company_id, hash]
    );
    res.status(201).json({ ...result.rows[0], default_password: 'Welcome2Sabba!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/hr/team/:id ──────────────────────────────────
// HR admin removes a colleague (cannot remove self or last admin)
router.delete('/:id', auth, requireRole('hr'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot remove yourself' });
    const count = await db.query(
      `SELECT COUNT(*) FROM users WHERE company_id=$1 AND role='hr'`, [req.user.company_id]
    );
    if (parseInt(count.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last HR admin for this company' });
    }
    await db.query(
      `DELETE FROM users WHERE id=$1 AND company_id=$2 AND role='hr'`,
      [req.params.id, req.user.company_id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

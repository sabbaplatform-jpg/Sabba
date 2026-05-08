// routes/policies.js — HR spend limit policies
const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, requireRole('hr'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM spend_policies WHERE company_id=$1 ORDER BY created_at DESC', [req.user.company_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, requireRole('hr'), async (req, res) => {
  try {
    const { department, job_title, location, salary_band, spend_limit_gbp, payroll_months_allowed } = req.body;
    const result = await db.query(`
      INSERT INTO spend_policies (company_id, department, job_title, location, salary_band, spend_limit_gbp, payroll_months_allowed)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [req.user.company_id, department, job_title, location, salary_band, spend_limit_gbp, payroll_months_allowed || [3,6,12]]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, requireRole('hr'), async (req, res) => {
  try {
    await db.query('DELETE FROM spend_policies WHERE id=$1 AND company_id=$2', [req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

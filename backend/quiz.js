// routes/quiz.js
const router = require('express').Router();
const db = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/quiz — get employee's quiz response
router.get('/', auth, requireRole('employee'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM quiz_responses WHERE user_id=$1', [req.user.id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quiz — save quiz response
router.post('/', auth, requireRole('employee'), async (req, res) => {
  try {
    const { adventure_types, interests, duration_preference, budget_preference } = req.body;
    const result = await db.query(`
      INSERT INTO quiz_responses (user_id, adventure_types, interests, duration_preference, budget_preference, completed)
      VALUES ($1,$2,$3,$4,$5,TRUE)
      ON CONFLICT (user_id) DO UPDATE SET
        adventure_types=$2, interests=$3, duration_preference=$4, budget_preference=$5, completed=TRUE
      RETURNING *
    `, [req.user.id, adventure_types, interests, duration_preference, budget_preference]);

    // Award points for completing quiz
    await db.query(`INSERT INTO points_transactions (user_id, points, reason) VALUES ($1, 25, 'Completed adventure quiz')`, [req.user.id]);
    await db.query(`
      INSERT INTO employee_profiles (user_id, sabba_points) VALUES ($1, 25)
      ON CONFLICT (user_id) DO UPDATE SET sabba_points = employee_profiles.sabba_points + 25
    `, [req.user.id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

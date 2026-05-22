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

// POST /api/quiz — save quiz response + travel type
router.post('/', auth, requireRole('employee'), async (req, res) => {
  try {
    const {
      adventure_types,
      duration_preference,
      budget_preference,
      travel_type,
      travel_type_label,
      answers,
    } = req.body;

    // Upsert quiz response — store travel_type and full answers in interests JSONB
    const result = await db.query(`
      INSERT INTO quiz_responses
        (user_id, adventure_types, interests, duration_preference, budget_preference, completed)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      ON CONFLICT (user_id) DO UPDATE SET
        adventure_types    = EXCLUDED.adventure_types,
        interests          = EXCLUDED.interests,
        duration_preference= EXCLUDED.duration_preference,
        budget_preference  = EXCLUDED.budget_preference,
        completed          = TRUE
      RETURNING *
    `, [
      req.user.id,
      adventure_types || [],
      JSON.stringify({ travel_type, travel_type_label, answers }),
      duration_preference || 'medium',
      budget_preference   || 'mid',
    ]);

    // Award 100 points for completing the gamified quiz
    // Check if they've already received points for the quiz to avoid double-awarding
    const existing = await db.query(
      `SELECT id FROM points_transactions WHERE user_id=$1 AND reason='Completed adventure quiz' LIMIT 1`,
      [req.user.id]
    );
    if (!existing.rows.length) {
      await db.query(
        `INSERT INTO points_transactions (user_id, points, reason) VALUES ($1, 100, 'Completed adventure quiz')`,
        [req.user.id]
      );
      await db.query(`
        INSERT INTO employee_profiles (user_id, sabba_points) VALUES ($1, 100)
        ON CONFLICT (user_id) DO UPDATE SET sabba_points = employee_profiles.sabba_points + 100
      `, [req.user.id]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

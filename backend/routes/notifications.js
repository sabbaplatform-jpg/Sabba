// routes/notifications.js
const router = require('express').Router();
const db = require('../lib/db');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read=TRUE WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/read-all', auth, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read=TRUE WHERE user_id=$1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

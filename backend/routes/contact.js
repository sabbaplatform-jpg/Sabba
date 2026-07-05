const router = require('express').Router();
const email  = require('../lib/email');

// POST /api/contact — public contact form
router.post('/', async (req, res) => {
  try {
    const { name, email: senderEmail, subject, message } = req.body;
    if (!name || !senderEmail || !message) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }
    await email.sendContactForm({ name, email: senderEmail, subject, message });
    res.json({ success: true });
  } catch (err) {
    console.error('[CONTACT]', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;

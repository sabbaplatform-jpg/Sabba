const express = require('express');
const router  = express.Router();
const db      = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/messages/threads — list all threads for current user
router.get('/threads', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        t.id, t.subject, t.thread_type, t.booking_id, t.updated_at,
        (
          SELECT json_build_object(
            'id', m.id, 'body', m.body, 'created_at', m.created_at,
            'sender_name', u.full_name
          )
          FROM messages m
          JOIN users u ON u.id = m.sender_id
          WHERE m.thread_id = t.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message,
        (
          SELECT COUNT(*) FROM messages m
          WHERE m.thread_id = t.id
          AND m.created_at > COALESCE(tp.last_read, '1970-01-01')
          AND m.sender_id != $1
        ) AS unread_count,
        (
          SELECT json_agg(json_build_object('id', u2.id, 'name', u2.full_name, 'role', u2.role))
          FROM thread_participants tp2
          JOIN users u2 ON u2.id = tp2.user_id
          WHERE tp2.thread_id = t.id AND tp2.user_id != $1
        ) AS participants
      FROM message_threads t
      JOIN thread_participants tp ON tp.thread_id = t.id AND tp.user_id = $1
      ORDER BY t.updated_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/threads/:id — get thread with all messages
router.get('/threads/:id', auth, async (req, res) => {
  try {
    // Verify user is a participant
    const check = await db.query(
      'SELECT id FROM thread_participants WHERE thread_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!check.rows.length) return res.status(403).json({ error: 'Not a participant' });

    // Get thread
    const thread = await db.query(`
      SELECT t.*,
        (
          SELECT json_agg(json_build_object('id', u.id, 'name', u.full_name, 'role', u.role))
          FROM thread_participants tp
          JOIN users u ON u.id = tp.user_id
          WHERE tp.thread_id = t.id
        ) AS participants
      FROM message_threads t WHERE t.id = $1
    `, [req.params.id]);

    // Get messages
    const msgs = await db.query(`
      SELECT m.*, u.full_name AS sender_name, u.role AS sender_role
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.thread_id = $1
      ORDER BY m.created_at ASC
    `, [req.params.id]);

    // Mark as read
    await db.query(
      'UPDATE thread_participants SET last_read = NOW() WHERE thread_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );

    res.json({ thread: thread.rows[0], messages: msgs.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/threads — create new thread
router.post('/threads', auth, async (req, res) => {
  try {
    const { subject, participant_ids, body, thread_type = 'direct', booking_id = null } = req.body;
    if (!subject || !body || !participant_ids?.length) {
      return res.status(400).json({ error: 'subject, body and participant_ids are required' });
    }

    // Create thread
    const t = await db.query(`
      INSERT INTO message_threads (subject, thread_type, booking_id)
      VALUES ($1, $2, $3) RETURNING id
    `, [subject, thread_type, booking_id]);
    const threadId = t.rows[0].id;

    // Add sender + all recipients as participants
    const allParticipants = [...new Set([req.user.id, ...participant_ids])];
    for (const uid of allParticipants) {
      await db.query(
        'INSERT INTO thread_participants (thread_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [threadId, uid]
      );
    }

    // Add first message
    await db.query(
      'INSERT INTO messages (thread_id, sender_id, body) VALUES ($1,$2,$3)',
      [threadId, req.user.id, body]
    );

    // Notify recipients
    for (const uid of participant_ids) {
      await db.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, 'message')
      `, [uid, `New message: ${subject}`, `${req.user.full_name}: ${body.slice(0, 80)}${body.length > 80 ? '…' : ''}`]);
    }

    res.json({ thread_id: threadId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/threads/:id/reply — reply to thread
router.post('/threads/:id/reply', auth, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Message body is required' });

    // Verify participant
    const check = await db.query(
      'SELECT id FROM thread_participants WHERE thread_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!check.rows.length) return res.status(403).json({ error: 'Not a participant' });

    // Insert message
    const msg = await db.query(`
      INSERT INTO messages (thread_id, sender_id, body)
      VALUES ($1,$2,$3)
      RETURNING id, created_at
    `, [req.params.id, req.user.id, body]);

    // Update thread updated_at
    await db.query('UPDATE message_threads SET updated_at=NOW() WHERE id=$1', [req.params.id]);

    // Get thread subject for notification
    const thread = await db.query('SELECT subject FROM message_threads WHERE id=$1', [req.params.id]);

    // Notify other participants
    const others = await db.query(
      'SELECT user_id FROM thread_participants WHERE thread_id=$1 AND user_id!=$2',
      [req.params.id, req.user.id]
    );
    for (const { user_id } of others.rows) {
      await db.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1,$2,$3,'message')
      `, [user_id, `Reply: ${thread.rows[0]?.subject}`, `${req.user.full_name}: ${body.slice(0,80)}${body.length>80?'…':''}`]);
    }

    res.json({ message_id: msg.rows[0].id, created_at: msg.rows[0].created_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT COUNT(DISTINCT m.id) AS count
      FROM messages m
      JOIN thread_participants tp ON tp.thread_id = m.thread_id AND tp.user_id = $1
      WHERE m.sender_id != $1
      AND m.created_at > COALESCE(tp.last_read, '1970-01-01')
    `, [req.user.id]);
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/users — get list of users the current user can message (same company)
router.get('/users', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT id, full_name, role, email FROM users
      WHERE id != $1
      AND (company_id = $2 OR role = 'vendor')
      ORDER BY role, full_name
    `, [req.user.id, req.user.company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/vendor — employee messages the vendor for one of their bookings
router.post('/vendor', auth, requireRole('employee'), async (req, res) => {
  try {
    const { booking_id, body } = req.body;
    if (!booking_id || !body?.trim()) {
      return res.status(400).json({ error: 'booking_id and body are required' });
    }

    // Verify the booking belongs to this employee, and resolve the vendor's user_id
    const info = await db.query(`
      SELECT b.id AS booking_id, p.title AS package_title,
             v.user_id AS vendor_user_id, v.company_name AS vendor_name
      FROM bookings b
      JOIN packages p ON p.id = b.package_id
      JOIN vendors  v ON v.id = p.vendor_id
      WHERE b.id = $1 AND b.employee_id = $2
    `, [booking_id, req.user.id]);

    if (!info.rows.length) return res.status(404).json({ error: 'Booking not found' });
    const { package_title, vendor_user_id, vendor_name } = info.rows[0];
    if (!vendor_user_id) return res.status(400).json({ error: 'This vendor has no contactable account' });

    // Reuse an existing employee↔vendor thread for this booking if present
    const existing = await db.query(`
      SELECT t.id
      FROM message_threads t
      JOIN thread_participants tp1 ON tp1.thread_id = t.id AND tp1.user_id = $1
      JOIN thread_participants tp2 ON tp2.thread_id = t.id AND tp2.user_id = $2
      WHERE t.booking_id = $3 AND t.thread_type = 'vendor'
      LIMIT 1
    `, [req.user.id, vendor_user_id, booking_id]);

    let threadId;
    if (existing.rows.length) {
      threadId = existing.rows[0].id;
      await db.query('INSERT INTO messages (thread_id, sender_id, body) VALUES ($1,$2,$3)',
        [threadId, req.user.id, body]);
    } else {
      const subject = `Question about ${package_title}`;
      const t = await db.query(
        `INSERT INTO message_threads (subject, thread_type, booking_id) VALUES ($1,'vendor',$2) RETURNING id`,
        [subject, booking_id]
      );
      threadId = t.rows[0].id;
      for (const uid of [req.user.id, vendor_user_id]) {
        await db.query('INSERT INTO thread_participants (thread_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [threadId, uid]);
      }
      await db.query('INSERT INTO messages (thread_id, sender_id, body) VALUES ($1,$2,$3)',
        [threadId, req.user.id, body]);
    }

    // Notify the vendor
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, 'message')
    `, [vendor_user_id, `New message from ${req.user.full_name || 'an employee'}`,
        `${body.slice(0, 80)}${body.length > 80 ? '…' : ''}`]).catch(() => {});

    res.json({ thread_id: threadId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

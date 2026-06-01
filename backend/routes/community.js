const router = require('express').Router();
const db     = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

// ── Points config ─────────────────────────────────────────
const POINTS = {
  post_with_image: 20, post_text: 10, comment: 5,
  like_received: 2, match_message: 30,
  profile_complete: 50, first_post: 25,
};
const LEVEL_CAPS = [0, 50, 100, 150, 200, 300]; // index = level

async function awardPoints(userId, amount, reason) {
  try {
    // Get profile and check daily cap
    const profile = await db.query(
      `SELECT level, social_points_today, social_points_date
       FROM community_profiles WHERE user_id = $1`,
      [userId]
    );
    if (!profile.rows.length) return;

    const today = new Date().toISOString().split('T')[0];
    const p = profile.rows[0];
    const todayTotal = p.social_points_date === today ? p.social_points_today : 0;
    const cap = LEVEL_CAPS[Math.min(p.level, 5)];
    const canAward = Math.min(amount, Math.max(0, cap - todayTotal));
    if (canAward <= 0) return;

    // Award points
    await db.query(
      `UPDATE community_profiles SET
         social_points_today = CASE WHEN social_points_date = $2
           THEN social_points_today + $3
           ELSE $3 END,
         social_points_date = $2
       WHERE user_id = $1`,
      [userId, today, canAward]
    );
    await db.query(
      `UPDATE employee_profiles SET sabba_points = sabba_points + $1 WHERE user_id = $2`,
      [canAward, userId]
    );
    await db.query(
      `INSERT INTO points_transactions (user_id, points, reason) VALUES ($1, $2, $3)`,
      [userId, canAward, reason]
    );

    // Level up check
    const total = await db.query(
      `SELECT COALESCE(SUM(points),0) as total FROM points_transactions WHERE user_id=$1`,
      [userId]
    );
    const totalPts = Number(total.rows[0].total);
    const newLevel =
      totalPts >= 10000 ? 5 :
      totalPts >= 4000  ? 4 :
      totalPts >= 1500  ? 3 :
      totalPts >= 500   ? 2 : 1;

    if (newLevel !== p.level) {
      await db.query(
        `UPDATE community_profiles SET level = $1 WHERE user_id = $2`,
        [newLevel, userId]
      );
      const LEVEL_NAMES = ['', 'Explorer','Adventurer','Trailblazer','Pioneer','Legend'];
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, 'success')`,
        [userId, `Level up! You're now a ${LEVEL_NAMES[newLevel]} 🎉`,
         `You've reached Level ${newLevel} on Sabba Community. Your daily points cap has increased.`]
      );
    }
  } catch (err) { console.error('awardPoints error:', err.message); }
}

// ── GET /api/community/profile/me ─────────────────────────
router.get('/profile/me', auth, async (req, res) => {
  try {
    let profile = await db.query(
      `SELECT cp.*, u.full_name, u.email, c.name as company_name,
        ep.adventure_type, ep.sabba_points,
        (SELECT COUNT(*) FROM community_posts WHERE user_id=$1) as post_count
       FROM community_profiles cp
       JOIN users u ON u.id = cp.user_id
       LEFT JOIN companies c ON c.id = u.company_id
       LEFT JOIN employee_profiles ep ON ep.user_id = cp.user_id
       WHERE cp.user_id = $1`,
      [req.user.id]
    );

    if (!profile.rows.length) {
      // Auto-create profile on first visit
      await db.query(
        `INSERT INTO community_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
        [req.user.id]
      );
      // Award profile completion points
      await awardPoints(req.user.id, POINTS.profile_complete, 'Community profile created');
      profile = await db.query(
        `SELECT cp.*, u.full_name, u.email, c.name as company_name,
          ep.adventure_type, ep.sabba_points,
          0 as post_count
         FROM community_profiles cp
         JOIN users u ON u.id = cp.user_id
         LEFT JOIN companies c ON c.id = u.company_id
         LEFT JOIN employee_profiles ep ON ep.user_id = cp.user_id
         WHERE cp.user_id = $1`,
        [req.user.id]
      );
    }
    res.json(profile.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/community/profile/:id ────────────────────────
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const profile = await db.query(
      `SELECT cp.*, u.full_name, u.job_title, c.name as company_name,
        ep.adventure_type, ep.sabba_points,
        (SELECT COUNT(*) FROM community_posts WHERE user_id=cp.user_id) as post_count
       FROM community_profiles cp
       JOIN users u ON u.id = cp.user_id
       LEFT JOIN companies c ON c.id = u.company_id
       LEFT JOIN employee_profiles ep ON ep.user_id = cp.user_id
       WHERE cp.user_id = $1`,
      [req.params.id]
    );
    if (!profile.rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/community/profile ─────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, avatar_url, opt_out } = req.body;
    const result = await db.query(
      `UPDATE community_profiles SET
         bio=$1, avatar_url=$2, opt_out=$3, updated_at=NOW()
       WHERE user_id=$4 RETURNING *`,
      [bio || null, avatar_url || null, opt_out || false, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/community/feed ───────────────────────────────
router.get('/feed', auth, async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Get user's company for visibility filter
    const userInfo = await db.query(
      `SELECT u.company_id, c.community_restricted
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    const { company_id, community_restricted } = userInfo.rows[0] || {};

    const result = await db.query(
      `SELECT p.*,
        u.full_name as author_name,
        c.name as author_company,
        cp.level as author_level,
        cp.avatar_url as author_avatar,
        ep.adventure_type as author_adventure_type,
        EXISTS(
          SELECT 1 FROM community_likes
          WHERE post_id=p.id AND user_id=$1
        ) as liked_by_me
       FROM community_posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN companies c ON c.id = p.company_id
       LEFT JOIN community_profiles cp ON cp.user_id = p.user_id
       LEFT JOIN employee_profiles ep ON ep.user_id = p.user_id
       WHERE ($2::boolean = false OR p.company_id = $3)
         AND p.visibility = CASE WHEN $2::boolean THEN 'company' ELSE p.visibility END
         OR (p.visibility = 'global' AND $2::boolean = false)
       ORDER BY p.created_at DESC
       LIMIT $4 OFFSET $5`,
      [req.user.id, community_restricted || false, company_id, limit, offset]
    );

    // Simpler query that always works
    const posts = await db.query(
      `SELECT
        p.id, p.user_id, p.company_id, p.content, p.image_url,
        p.visibility, p.likes_count, p.comments_count, p.created_at,
        u.full_name as author_name, u.job_title as author_job_title,
        c.name as author_company,
        cp.level as author_level,
        cp.avatar_url as author_avatar,
        ep.adventure_type as author_adventure_type,
        EXISTS(
          SELECT 1 FROM community_likes WHERE post_id=p.id AND user_id=$1
        ) as liked_by_me
       FROM community_posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN companies c ON c.id = p.company_id
       LEFT JOIN community_profiles cp ON cp.user_id = p.user_id
       LEFT JOIN employee_profiles ep ON ep.user_id = p.user_id
       WHERE (
         p.visibility = 'global'
         OR (p.visibility = 'company' AND p.company_id = $2)
       )
       ORDER BY p.created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.user.id, company_id, limit, offset]
    );
    res.json(posts.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/community/posts ─────────────────────────────
router.post('/posts', auth, async (req, res) => {
  try {
    const { content, image_url, visibility = 'global' } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const userInfo = await db.query('SELECT company_id FROM users WHERE id=$1', [req.user.id]);
    const company_id = userInfo.rows[0]?.company_id;

    // Check if first post
    const postCount = await db.query(
      'SELECT COUNT(*) FROM community_posts WHERE user_id=$1', [req.user.id]
    );
    const isFirst = Number(postCount.rows[0].count) === 0;

    const result = await db.query(
      `INSERT INTO community_posts (user_id, company_id, content, image_url, visibility)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, company_id, content.trim(), image_url || null, visibility]
    );

    // Award points
    const pts = image_url ? POINTS.post_with_image : POINTS.post_text;
    await awardPoints(req.user.id, pts, 'Community post');
    if (isFirst) await awardPoints(req.user.id, POINTS.first_post, 'First community post');

    // Ensure community profile exists
    await db.query(
      `INSERT INTO community_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/community/posts/:id ──────────────────────
router.delete('/posts/:id', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM community_posts WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/community/posts/:id/like ───────────────────
router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT id FROM community_likes WHERE post_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );

    if (existing.rows.length) {
      // Unlike
      await db.query('DELETE FROM community_likes WHERE post_id=$1 AND user_id=$2',
        [req.params.id, req.user.id]);
      await db.query(
        'UPDATE community_posts SET likes_count = GREATEST(0, likes_count-1) WHERE id=$1',
        [req.params.id]
      );
      res.json({ liked: false });
    } else {
      // Like
      await db.query(
        'INSERT INTO community_likes (post_id, user_id) VALUES ($1,$2)',
        [req.params.id, req.user.id]
      );
      await db.query(
        'UPDATE community_posts SET likes_count = likes_count+1 WHERE id=$1',
        [req.params.id]
      );
      // Award points to post author
      const post = await db.query('SELECT user_id FROM community_posts WHERE id=$1', [req.params.id]);
      if (post.rows.length && post.rows[0].user_id !== req.user.id) {
        await awardPoints(post.rows[0].user_id, POINTS.like_received, 'Like received on post');
      }
      res.json({ liked: true });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/community/posts/:id/comments ────────────────
router.get('/posts/:id/comments', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT cm.*, u.full_name as author_name, cp.level as author_level,
        cp.avatar_url as author_avatar, c.name as author_company
       FROM community_comments cm
       JOIN users u ON u.id = cm.user_id
       LEFT JOIN community_profiles cp ON cp.user_id = cm.user_id
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE cm.post_id=$1
       ORDER BY cm.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/community/posts/:id/comments ───────────────
router.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

    const result = await db.query(
      `INSERT INTO community_comments (post_id, user_id, content) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.id, content.trim()]
    );
    await db.query(
      'UPDATE community_posts SET comments_count = comments_count+1 WHERE id=$1',
      [req.params.id]
    );
    await awardPoints(req.user.id, POINTS.comment, 'Community comment');

    // Notify post author
    const post = await db.query('SELECT user_id, content FROM community_posts WHERE id=$1', [req.params.id]);
    if (post.rows.length && post.rows[0].user_id !== req.user.id) {
      const commenter = await db.query('SELECT full_name FROM users WHERE id=$1', [req.user.id]);
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,'info')`,
        [post.rows[0].user_id,
         'New comment on your post 💬',
         `${commenter.rows[0]?.full_name} commented on your post.`]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/community/matches ────────────────────────────
router.get('/matches', auth, async (req, res) => {
  try {
    // Run matching algorithm — find others with same package ±30 day window
    const myBookings = await db.query(
      `SELECT b.package_id, b.departure_date, p.destination, p.title
       FROM bookings b
       JOIN packages p ON p.id = b.package_id
       WHERE b.employee_id=$1
         AND b.status IN ('pending','approved','confirmed')
         AND b.departure_date IS NOT NULL`,
      [req.user.id]
    );

    if (!myBookings.rows.length) return res.json([]);

    const matches = [];
    for (const booking of myBookings.rows) {
      const result = await db.query(
        `SELECT DISTINCT
          b.employee_id as matched_user_id,
          u.full_name as matched_name,
          c.name as matched_company,
          cp.level as matched_level,
          cp.avatar_url as matched_avatar,
          cp.bio as matched_bio,
          ep.adventure_type as matched_adventure_type,
          p.title as package_title,
          p.destination,
          b.departure_date,
          'same_package' as match_type
         FROM bookings b
         JOIN packages p ON p.id = b.package_id
         JOIN users u ON u.id = b.employee_id
         LEFT JOIN companies c ON c.id = u.company_id
         LEFT JOIN community_profiles cp ON cp.user_id = b.employee_id
         LEFT JOIN employee_profiles ep ON ep.user_id = b.employee_id
         WHERE b.package_id = $1
           AND b.employee_id != $2
           AND b.status IN ('pending','approved','confirmed')
           AND b.departure_date BETWEEN ($3::date - interval '30 days')
                                    AND ($3::date + interval '30 days')
           AND (cp.opt_out IS NULL OR cp.opt_out = false)`,
        [booking.package_id, req.user.id, booking.departure_date]
      );
      matches.push(...result.rows.map(r => ({ ...r, my_package: booking.title, my_departure: booking.departure_date })));
    }

    // Deduplicate by matched_user_id
    const seen = new Set();
    const unique = matches.filter(m => {
      if (seen.has(m.matched_user_id)) return false;
      seen.add(m.matched_user_id); return true;
    });

    // Store matches + send notifications for new ones
    for (const match of unique) {
      const existing = await db.query(
        `SELECT id, notified_at FROM travel_matches
         WHERE user_id=$1 AND matched_user_id=$2`,
        [req.user.id, match.matched_user_id]
      );
      if (!existing.rows.length) {
        await db.query(
          `INSERT INTO travel_matches
             (user_id, matched_user_id, package_id, match_type, destination,
              departure_window_start, departure_window_end)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (user_id, matched_user_id, package_id) DO NOTHING`,
          [req.user.id, match.matched_user_id, match.package_id || null,
           'same_package', match.destination,
           match.departure_date, match.departure_date]
        );
        // Send notification
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1,$2,$3,'info')
           ON CONFLICT DO NOTHING`,
          [req.user.id,
           `New travel match! 🌍`,
           `${match.matched_name} from ${match.matched_company || 'another company'} is also heading to ${match.destination} around your dates.`]
        );
        await db.query(
          `UPDATE travel_matches SET notified_at=NOW()
           WHERE user_id=$1 AND matched_user_id=$2`,
          [req.user.id, match.matched_user_id]
        );
      }
    }

    res.json(unique);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin: toggle community restriction ──────────────────
router.patch('/admin/company/:id/restrict', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { restricted } = req.body;
    await db.query(
      'UPDATE companies SET community_restricted=$1 WHERE id=$2',
      [restricted, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/community/platinum ──────────────────────────
// Returns active platinum sponsored listings for community sidebar
router.get('/platinum', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query(`
      SELECT sl.*, p.title as package_title, p.price_gbp, p.destination,
        p.image_url, p.emoji, p.category, p.duration, p.id as package_id,
        v.company_name as vendor_name
      FROM sponsored_listings sl
      JOIN packages p ON sl.package_id = p.id
      JOIN vendors v ON sl.vendor_id = v.id
      WHERE sl.listing_type = 'platinum'
        AND sl.start_date <= $1
        AND sl.end_date   >= $1
        AND p.status = 'live'
      ORDER BY sl.slot_number ASC
    `, [today]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

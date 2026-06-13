// routes/upload.js — Supabase Storage uploads
const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Create Supabase client — use service key if available, fall back to anon key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Allowed buckets — must exist in Supabase Storage as Public buckets
const ALLOWED_BUCKETS = ['avatars', 'community', 'packages'];

// POST /api/upload — upload image to Supabase Storage
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const bucket = req.body.bucket || 'avatars';
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return res.status(400).json({ error: `Invalid bucket. Allowed: ${ALLOWED_BUCKETS.join(', ')}` });
    }

    const ext   = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const name  = `${req.user.id}-${Date.now()}.${ext}`;
    const folder = req.body.folder || '';
    const path  = folder ? `${folder}/${name}` : name;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error('[UPLOAD]', error.message);
      // Provide helpful error for missing bucket
      if (error.message.includes('not found') || error.message.includes('Bucket')) {
        return res.status(500).json({
          error: `Storage bucket '${bucket}' not found. Please create it in Supabase Storage dashboard as a Public bucket.`
        });
      }
      return res.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    res.json({ url: data.publicUrl, path, bucket });
  } catch (err) {
    console.error('[UPLOAD]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

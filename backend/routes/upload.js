// routes/upload.js — Supabase Storage uploads
const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// POST /api/upload — upload image to Supabase Storage
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const ext = req.file.originalname.split('.').pop();
    const filename = `${req.user.id}-${Date.now()}.${ext}`;
    const bucket = req.body.bucket || 'avatars';
    const folder = req.body.folder || '';
    const path = folder ? `${folder}/${filename}` : filename;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) return res.status(500).json({ error: error.message });

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    res.json({ url: data.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Sabba Backend v3
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const app = express();

// ── Security headers ────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ── Rate limiters ───────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password reset requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Expose limiters for use in routes
app.set('loginLimiter', loginLimiter);
app.set('passwordResetLimiter', passwordResetLimiter);

// ── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://sabba-frontend.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use('/api', apiLimiter);

// ── Routes ──────────────────────────────────────────────────
const hrTeamRouter = require('./routes/hrteam');
app.use('/api/hr/team', hrTeamRouter);

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/packages',      require('./routes/packages'));
app.use('/api/bookings',      require('./routes/bookings'));
app.use('/api/employees',     require('./routes/employees'));
app.use('/api/vendors',       require('./routes/vendors'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ratings',       require('./routes/ratings'));
app.use('/api/profile',       require('./routes/profile'));
app.use('/api/policies',      require('./routes/policies'));
app.use('/api/cart',          require('./routes/cart'));
app.use('/api/quiz',          require('./routes/quiz'));
app.use('/api/allowance',     require('./routes/allowance'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/community',     require('./routes/community'));
app.use('/api/contact',       require('./routes/contact'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', version: 'v3' }));

app.get('/api/dbtest', async (_, res) => {
  const db = require('./lib/db');
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Sabba V3 API running on port ${PORT}`));

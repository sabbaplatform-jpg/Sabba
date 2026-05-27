require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { apiLimiter, securityHeaders } = require('./middleware/security');

const app = express();

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
      callback(null, true); // allow all origins in production — restrict after custom domain
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(securityHeaders);
app.use('/api', apiLimiter);

// Auth
app.use('/api/auth',          require('./routes/auth'));

// Core
app.use('/api/packages',      require('./routes/packages'));
app.use('/api/bookings',      require('./routes/bookings'));
app.use('/api/employees',     require('./routes/employees'));
app.use('/api/vendors',       require('./routes/vendors'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ratings',       require('./routes/ratings'));
app.use('/api/profile',       require('./routes/profile'));
app.use('/api/policies',      require('./routes/policies'));

// V3
app.use('/api/cart',          require('./routes/cart'));
app.use('/api/quiz',          require('./routes/quiz'));
app.use('/api/allowance',     require('./routes/allowance'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/admin',         require('./routes/admin'));

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

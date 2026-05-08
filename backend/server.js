require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./lib/db');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/bookings', require('./routes/bookings'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.get('/api/dbtest', async (_, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now, db_url: process.env.DATABASE_URL ? 'set' : 'missing' });
  } catch (err) {
    res.json({ success: false, error: err.message, code: err.code });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Sabba API running on port ${PORT}`));

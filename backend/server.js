require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/packages',      require('./routes/packages'));
app.use('/api/bookings',      require('./routes/bookings'));
app.use('/api/employees',     require('./routes/employees'));
app.use('/api/vendors',       require('./routes/vendors'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ratings',       require('./routes/ratings'));
app.use('/api/profile',       require('./routes/profile'));
app.use('/api/policies',      require('./routes/policies'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', version: 'v2' }));

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
app.listen(PORT, () => console.log(`Sabba V2 API running on port ${PORT}`));

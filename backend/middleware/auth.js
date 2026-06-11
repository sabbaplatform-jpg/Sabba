const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Feature flag middleware — checks if a feature is enabled for the company
async function requireFlag(flagName) {
  return async (req, res, next) => {
    try {
      const db = require('../lib/db');
      const companyId = req.user?.company_id || null;
      // Check company-specific flag first, then global
      const result = await db.query(`
        SELECT enabled FROM feature_flags
        WHERE name = $1 AND (company_id = $2 OR company_id IS NULL)
        ORDER BY company_id NULLS LAST
        LIMIT 1
      `, [flagName, companyId]).catch(() => ({ rows: [] }));
      // Default to enabled if no flag set
      const enabled = result.rows.length ? result.rows[0].enabled : true;
      if (!enabled) return res.status(403).json({ error: `Feature '${flagName}' is not available for your organisation.` });
      next();
    } catch { next(); } // fail open — don't block on errors
  };
}

module.exports = { auth, requireRole, requireFlag };

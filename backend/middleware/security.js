// middleware/security.js
// Rate limiting + security headers for Sabba backend
// Install: npm install express-rate-limit

const rateLimit = require('express-rate-limit');

// ── Rate limiters ──────────────────────────────────────────

// Login — 10 attempts per 15 minutes per IP
// Blocks brute force without affecting real users (who log in once)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

// Password reset — 5 attempts per hour per IP
// Prevents email bombing
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password reset requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API — 200 requests per minute per IP
// Prevents scraping and general abuse, won't affect normal platform use
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

// ── Security headers middleware ────────────────────────────
// Applied to every response — invisible to users, important for security
const securityHeaders = (req, res, next) => {
  // Prevent the site being embedded in iframes on other domains (clickjacking)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Tell browser to use declared content type, not sniff it
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Only send referrer for same-origin requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy — disable features we don't use
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // HSTS — tell browsers to always use HTTPS for this domain (1 year)
  // Only set in production — causes issues in local dev
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy — restrict where resources can be loaded from
  // This is the most important header — prevents XSS attacks
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // unsafe-inline needed for inline scripts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://images.unsplash.com https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co https://api.sendgrid.com",
    "frame-ancestors 'none'",
  ].join('; '));

  next();
};

module.exports = { loginLimiter, passwordResetLimiter, apiLimiter, securityHeaders };

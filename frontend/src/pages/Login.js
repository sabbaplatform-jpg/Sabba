import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/UI';
import { colors, font } from '../lib/styles';

// ── Full-bleed ambient scene for the login branding panel ───────────────────
// Ocean-blue mountains, beacon moon, plane, tent, path. Pure inline SVG (SMIL);
// motion is disabled under prefers-reduced-motion via the global stylesheet
// (.brand-scene rule). A scrim keeps the overlaid copy legible.
function LoginScene() {
  return (
    <div className="brand-scene" aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <svg viewBox="0 0 600 900" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1C1916"/>
            <stop offset="55%" stopColor="#172232"/>
            <stop offset="100%" stopColor="#101A28"/>
          </linearGradient>
          <linearGradient id="lmF" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1663A0"/><stop offset="100%" stopColor="#0E4C7E"/></linearGradient>
          <linearGradient id="lmP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0E6BA8"/><stop offset="100%" stopColor="#143A5A"/></linearGradient>
          <linearGradient id="lmM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#223B56"/><stop offset="100%" stopColor="#13202F"/></linearGradient>
          <radialGradient id="lbeacon" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#8FCDEF"/><stop offset="100%" stopColor="#8FCDEF" stopOpacity="0"/></radialGradient>
          <linearGradient id="lscrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#101A28" stopOpacity="0"/>
            <stop offset="62%" stopColor="#101A28" stopOpacity="0"/>
            <stop offset="100%" stopColor="#0B1420" stopOpacity="0.45"/>
          </linearGradient>
        </defs>

        <rect width="600" height="900" fill="url(#lsky)"/>

        {/* Stars */}
        <g fill="#CFE4F5">
          <circle cx="90" cy="120" r="1.4"><animate attributeName="opacity" values="0.2;1;0.2" dur="3s" repeatCount="indefinite"/></circle>
          <circle cx="220" cy="80" r="1.1"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" begin="0.6s" repeatCount="indefinite"/></circle>
          <circle cx="400" cy="140" r="1.3"><animate attributeName="opacity" values="0.2;1;0.2" dur="3.4s" begin="1.1s" repeatCount="indefinite"/></circle>
          <circle cx="520" cy="90" r="1"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.8s" begin="1.5s" repeatCount="indefinite"/></circle>
          <circle cx="160" cy="200" r="0.9"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.6s" begin="0.3s" repeatCount="indefinite"/></circle>
          <circle cx="330" cy="60" r="1"><animate attributeName="opacity" values="0.2;1;0.2" dur="3.1s" begin="0.9s" repeatCount="indefinite"/></circle>
        </g>

        {/* Beacon moon */}
        <circle cx="470" cy="180" r="70" fill="url(#lbeacon)" opacity="0.5"><animate attributeName="opacity" values="0.35;0.65;0.35" dur="4.5s" repeatCount="indefinite"/></circle>
        <circle cx="470" cy="180" r="30" fill="#CFE8FA"/>
        <circle cx="470" cy="180" r="30" fill="#9FD0F0" opacity="0.45"/>

        {/* Clouds */}
        <g opacity="0.16" fill="#CFE4F5">
          <g><animateTransform attributeName="transform" type="translate" values="0,0;20,0;0,0" dur="11s" repeatCount="indefinite"/>
            <ellipse cx="140" cy="260" rx="48" ry="15"/><ellipse cx="168" cy="250" rx="34" ry="14"/></g>
          <g><animateTransform attributeName="transform" type="translate" values="0,0;-14,0;0,0" dur="14s" repeatCount="indefinite"/>
            <ellipse cx="420" cy="300" rx="40" ry="13"/><ellipse cx="444" cy="292" rx="28" ry="12"/></g>
        </g>

        {/* Plane */}
        <g>
          <animateTransform attributeName="transform" type="translate" values="-90,160; 660,70" dur="16s" repeatCount="indefinite"/>
          <g transform="rotate(-8) scale(1.3)">
            <ellipse cx="0" cy="0" rx="15" ry="3.4" fill="#EAF4FC"/>
            <path d="M13,-2.6 Q20,0 13,2.6 Z" fill="#CFE8FA"/>
            <polygon points="-1,-2 -9,-11 -4,-1" fill="#B8D8EF"/>
            <polygon points="-1,2 -9,11 -4,1" fill="#9FC9E8"/>
            <polygon points="-13,-1.5 -17,-7 -12,-0.6" fill="#B8D8EF"/>
          </g>
          <path d="M-22,2 L-64,6" stroke="#EAF4FC" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
        </g>

        {/* Back ridges */}
        <polygon points="0,720 150,560 320,720" fill="#1E3550" opacity="0.5"/>
        <polygon points="200,720 400,540 600,720" fill="#1A2E44" opacity="0.5"/>

        {/* Main mountains */}
        <polygon points="-40,900 220,590 460,900" fill="url(#lmF)"/>
        <polygon points="200,620 220,590 240,620 226,632 214,632" fill="#EAF4FC" opacity="0.9"/>
        <polygon points="260,900 460,580 680,900" fill="url(#lmP)"/>
        <polygon points="440,610 460,580 480,610 466,622 454,622" fill="#EAF4FC" opacity="0.9"/>
        <polygon points="-60,900 120,680 300,900" fill="url(#lmM)" opacity="0.95"/>

        {/* Scrim */}
        <rect x="0" y="0" width="600" height="900" fill="url(#lscrim)"/>


        {/* Tent */}
        <g transform="translate(360,872) scale(1.3)">
          <polygon points="0,16 18,-14 22,16" fill="#15517E"/>
          <polygon points="18,16 36,-14 20,-14 2,16" fill="#0E6BA8"/>
          <polygon points="18,16 24,-6 12,16" fill="#0A3A5E"/>
          <line x1="18" y1="-14" x2="18" y2="-18" stroke="#2E8BC0" strokeWidth="1.5"/>
          <ellipse cx="18" cy="17" rx="22" ry="3" fill="#000" opacity="0.25"/>
        </g>

        {/* Pine trees */}
        <g fill="#0B1C2E">
          <polygon points="40,900 60,854 80,900"/><polygon points="50,878 60,848 70,878"/>
          <polygon points="420,900 436,862 452,900"/>
          <polygon points="540,900 560,854 580,900"/><polygon points="550,878 560,848 570,878"/>
        </g>

        {/* Floating pins */}
        <g transform="translate(300,640)">
          <animateTransform attributeName="transform" type="translate" values="300,640;300,630;300,640" dur="3.8s" repeatCount="indefinite"/>
          <circle r="14" fill="#0E6BA8"/><circle r="6" fill="#fff"/><polygon points="0,14 -6,6 6,6" fill="#0E6BA8"/>
        </g>
        <g transform="translate(440,560)">
          <animateTransform attributeName="transform" type="translate" values="440,560;440,551;440,560" dur="4.4s" begin="0.8s" repeatCount="indefinite"/>
          <circle r="11" fill="#2E8BC0"/><circle r="4.5" fill="#fff"/><polygon points="0,11 -4.5,4.5 4.5,4.5" fill="#2E8BC0"/>
        </g>
      </svg>
    </div>
  );
}

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const dest = { hr: '/hr', employee: '/home', vendor: '/vendor' }[user.role] || '/';
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: font.body }}>
      {/* Left — branding panel */}
      <div className="login-brand" style={{ flex: 1, background: '#1C1916', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }}>
        <LoginScene/>
        <div style={{ position: 'absolute', right: -120, top: -120, width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,107,168,0.25) 0%, transparent 68%)', zIndex: 0, pointerEvents: 'none' }}/>

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: font.display, fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#fff' }}>Sabba</span>
        </div>

        {/* Tagline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: font.display, fontSize: 42, fontWeight: 700, fontStyle: 'italic', color: '#fff', lineHeight: 1.2, marginBottom: 20, maxWidth: 400 }}>
            Discovery, rejuvenation &amp; <span style={{ color: '#2E8BC0' }}>growth.</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 360 }}>
            The platform connecting employees with life-changing adventures — through your employer benefit portal.
          </p>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {['🌍 Travel', '🤝 Volunteering', '🎓 Courses', '💼 Work Abroad', '✈️ Airlines', '🏠 Stays'].map(cat => (
            <span key={cat} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '6px 14px', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>{cat}</span>
          ))}
        </div>
      </div>

      {/* Right — login form */}
      <div style={{ width: 480, background: '#F7F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: font.display, fontSize: 30, fontWeight: 700, fontStyle: 'italic', color: colors.dark, marginBottom: 6 }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: colors.muted, fontWeight: 500 }}>Sign in to your Sabba account</p>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: 32, border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Input label="Email" type="email" value={form.email} required
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com"/>
              <Input label="Password" type="password" value={form.password} required
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••"/>
              <div style={{ textAlign: 'right', marginTop: 8, marginBottom: 4 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#0E6BA8', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
              </div>
              {error && <p style={{ color: colors.red, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{error}</p>}
              <Button type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '13px 20px', fontSize: 14 }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div style={{ borderTop: '1px solid #eee', marginTop: 22, paddingTop: 18, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: colors.muted }}>
                New vendor? <Link to="/register" style={{ color: colors.orange, fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

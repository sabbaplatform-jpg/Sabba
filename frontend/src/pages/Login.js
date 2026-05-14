import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/UI';
import { colors, font } from '../lib/styles';

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
      <div style={{ flex: 1, background: '#1C1916', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -120, top: -120, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.12)' }}/>
        <div style={{ position: 'absolute', left: -60, bottom: -60, width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.08)' }}/>

        {/* Logo */}
        <div>
          <span style={{ fontFamily: font.display, fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#fff' }}>Sabba</span>
        </div>

        {/* Tagline */}
        <div>
          <h1 style={{ fontFamily: font.display, fontSize: 42, fontWeight: 700, fontStyle: 'italic', color: '#fff', lineHeight: 1.2, marginBottom: 20, maxWidth: 400 }}>
            Discovery, rejuvenation &amp; <span style={{ color: '#f5a066' }}>growth.</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 360 }}>
            The platform connecting employees with life-changing adventures — through your employer benefit portal.
          </p>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['🌍 Travel', '🤝 Volunteering', '🎓 Courses', '💼 Work Abroad', '✈️ Airlines', '🏠 Stays'].map(cat => (
            <span key={cat} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px' }}>{cat}</span>
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

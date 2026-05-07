import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/UI';
import { colors, font } from '../lib/styles';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const dest = { hr: '/hr', employee: '/home', vendor: '/vendor' }[user.role] || '/';
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: font.body }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #e06c2a, #f5a66d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 22, fontFamily: font.display, fontStyle: 'italic' }}>S</span>
          </div>
          <h1 style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 400, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: colors.muted, fontSize: 14 }}>Sign in to your Sabba account</p>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 16, padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Input label="Email" type="email" value={form.email} required
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com"/>
            <Input label="Password" type="password" value={form.password} required
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••"/>
            {error && <p style={{ color: '#b91c1c', fontSize: 13, textAlign: 'center' }}>{error}</p>}
            <Button type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: colors.muted }}>
              New vendor? <Link to="/register" style={{ color: colors.orange, fontWeight: 600, textDecoration: 'none' }}>Create an account</Link>
            </p>
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', background: colors.bg, borderRadius: 8, fontSize: 12, color: colors.muted }}>
            <strong>Demo logins:</strong><br/>
            HR: hr@barclays.com<br/>
            Employee: james@barclays.com<br/>
            Vendor: hello@remoteyear.com<br/>
            Password: <strong>Password123!</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

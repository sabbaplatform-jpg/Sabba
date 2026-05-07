import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Select } from '../components/UI';
import { colors, font } from '../lib/styles';

const CATEGORIES = ['travel','volunteering','courses','jobs_abroad','accommodation','airlines'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company_name: '', category: 'travel' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register({ ...form, role: 'vendor' });
      navigate('/vendor');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: font.body }}>
      <div style={{ width: '100%', maxWidth: 440, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #e06c2a, #f5a66d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 22, fontFamily: font.display, fontStyle: 'italic' }}>S</span>
          </div>
          <h1 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 400, marginBottom: 6 }}>Join as a Vendor</h1>
          <p style={{ color: colors.muted, fontSize: 14 }}>List your packages on the Sabba marketplace</p>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 16, padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Your full name" value={form.full_name} required onChange={set('full_name')} placeholder="Jane Smith"/>
            <Input label="Company name" value={form.company_name} required onChange={set('company_name')} placeholder="Remote Year Ltd"/>
            <Select label="Category" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
            </Select>
            <Input label="Email" type="email" value={form.email} required onChange={set('email')} placeholder="hello@yourcompany.com"/>
            <Input label="Password" type="password" value={form.password} required onChange={set('password')} placeholder="Min 8 characters"/>
            {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
            <Button type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Creating account…' : 'Create vendor account'}
            </Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: colors.muted }}>
            Already have an account? <Link to="/login" style={{ color: colors.orange, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

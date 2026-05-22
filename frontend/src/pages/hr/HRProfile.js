import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Spinner } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export default function HRProfile() {
  const { user, setUser } = useAuth();
  const navigate          = useNavigate();
  const [form,    setForm]    = useState({ full_name: '', email: '', current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/auth/profile').then(r => {
      setForm(f => ({ ...f, full_name: r.data.full_name || '', email: r.data.email || '' }));
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setError(''); setSuccess(''); setSaving(true);
    if (form.new_password && form.new_password !== form.confirm_password) {
      setError('New passwords do not match'); setSaving(false); return;
    }
    if (form.new_password && form.new_password.length < 8) {
      setError('New password must be at least 8 characters'); setSaving(false); return;
    }
    try {
      const payload = { full_name: form.full_name, email: form.email };
      if (form.new_password) {
        payload.current_password = form.current_password;
        payload.new_password     = form.new_password;
      }
      const { data } = await api.patch('/auth/profile', payload);
      setSuccess('Profile updated successfully');
      if (setUser) setUser(u => ({ ...u, full_name: data.full_name, email: data.email }));
      setForm(f => ({ ...f, current_password: '', new_password: '', confirm_password: '' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Edit profile</h1>
            <Button small variant="secondary" onClick={() => navigate('/hr')}>← Back to dashboard</Button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 40px' }}>

        {/* Avatar / identity card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px', background: '#fff', borderRadius: 16, border: '1px solid #eee', marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {form.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>{form.full_name || user?.full_name}</p>
            <p style={{ fontSize: 13, color: colors.muted }}>{form.email || user?.email}</p>
            <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700, color: colors.orange, background: colors.orangeLight, borderRadius: 6, padding: '2px 8px', textTransform: 'capitalize' }}>
              HR Admin
            </span>
          </div>
        </div>

        {/* Personal details */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 20 }}>Personal details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Full name</label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name"
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Email address</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com" type="email"
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Change password</h2>
          <p style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>Leave blank to keep your current password.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Current password</label>
              <input value={form.current_password} onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))}
                type="password" placeholder="Enter current password"
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>New password</label>
                <input value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                  type="password" placeholder="Min. 8 characters"
                  style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Confirm new password</label>
                <input value={form.confirm_password} onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                  type="password" placeholder="Repeat new password"
                  style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {error   && <p style={{ fontSize: 13.5, color: colors.red,   fontWeight: 700, marginBottom: 14 }}>⚠ {error}</p>}
        {success && <p style={{ fontSize: 13.5, color: colors.green, fontWeight: 700, marginBottom: 14 }}>✓ {success}</p>}

        {/* Save */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => navigate('/hr')}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </div>
    </div>
  );
}

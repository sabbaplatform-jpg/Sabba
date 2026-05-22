import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Spinner } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export default function HRProfile() {
  const { user, setUser } = useAuth();
  const navigate          = useNavigate();
  const fileRef           = useRef(null);
  const [form,      setForm]      = useState({ first_name: '', last_name: '', email: '', job_role: '', current_password: '', new_password: '', confirm_password: '' });
  const [avatar,    setAvatar]    = useState(null);   // preview URL
  const [avatarFile,setAvatarFile]= useState(null);   // File object
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  useEffect(() => {
    api.get('/auth/profile').then(r => {
      const d = r.data;
      const parts = (d.full_name || '').split(' ');
      setForm(f => ({
        ...f,
        first_name: d.first_name || parts[0] || '',
        last_name:  d.last_name  || parts.slice(1).join(' ') || '',
        email:      d.email      || '',
        job_role:   d.job_role   || '',
      }));
      if (d.avatar_url) setAvatar(d.avatar_url);
    }).finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatar(URL.createObjectURL(file));
  };

  const save = async () => {
    setError(''); setSuccess(''); setSaving(true);
    if (form.new_password && form.new_password !== form.confirm_password) {
      setError('New passwords do not match'); setSaving(false); return;
    }
    if (form.new_password && form.new_password.length < 8) {
      setError('New password must be at least 8 characters'); setSaving(false); return;
    }
    try {
      // Upload avatar if changed
      let avatar_url = undefined;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const { data: uploadData } = await api.post('/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        avatar_url = uploadData.url;
      }

      const full_name = `${form.first_name.trim()} ${form.last_name.trim()}`.trim();
      const payload = { full_name, email: form.email, job_role: form.job_role };
      if (avatar_url) payload.avatar_url = avatar_url;
      if (form.new_password) {
        payload.current_password = form.current_password;
        payload.new_password     = form.new_password;
      }

      const { data } = await api.patch('/auth/profile', payload);
      setSuccess('Profile updated successfully');
      if (setUser) setUser(u => ({ ...u, full_name: data.full_name, email: data.email }));
      setForm(f => ({ ...f, current_password: '', new_password: '', confirm_password: '' }));
      setAvatarFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner/>;

  const initials = `${form.first_name?.[0] || ''}${form.last_name?.[0] || ''}`.toUpperCase() || '?';

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Edit profile</h1>
            <Button small variant="secondary" onClick={() => navigate('/hr')}>← Back</Button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 40px' }}>

        {/* Avatar + Identity */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatar
              ? <img src={avatar} alt="Avatar" style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', border: '3px solid #eee' }}/>
              : <div style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff' }}>{initials}</div>
            }
            <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: -6, right: -6, width: 28, height: 28, borderRadius: '50%', background: colors.dark, border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
              ✏️
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }}/>
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>{`${form.first_name} ${form.last_name}`.trim() || user?.full_name}</p>
            <p style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>{form.email || user?.email}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.orange, background: colors.orangeLight, borderRadius: 6, padding: '2px 8px' }}>HR Admin</span>
              {form.job_role && <span style={{ fontSize: 11, fontWeight: 700, color: colors.mid, background: '#F7F5F2', borderRadius: 6, padding: '2px 8px' }}>{form.job_role}</span>}
            </div>
            <p style={{ fontSize: 12, color: colors.faint, marginTop: 8 }}>Click the pencil to change your photo</p>
          </div>
        </div>

        {/* Personal details */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 20 }}>Personal details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>First name</label>
              <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                placeholder="First name"
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Last name</label>
              <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                placeholder="Last name"
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Email address</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                type="email" placeholder="your@email.com"
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Job role</label>
              <input value={form.job_role} onChange={e => setForm(f => ({ ...f, job_role: e.target.value }))}
                placeholder="e.g. HR Director, People Manager"
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Change password</h2>
          <p style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>Leave blank to keep your current password.</p>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Current password</label>
            <input value={form.current_password} onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))}
              type="password" placeholder="Enter current password"
              style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

        {error   && <p style={{ fontSize: 13.5, color: colors.red,   fontWeight: 700, marginBottom: 14 }}>⚠ {error}</p>}
        {success && <p style={{ fontSize: 13.5, color: colors.green, fontWeight: 700, marginBottom: 14 }}>✓ {success}</p>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => navigate('/hr')}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </div>
    </div>
  );
}

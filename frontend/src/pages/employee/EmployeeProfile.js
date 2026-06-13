import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Spinner, Button } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export function EmployeeProfile() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const fileRef     = useRef(null);
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [avatar,    setAvatar]    = useState(null);
  const [avatarFile,setAvatarFile]= useState(null);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  useEffect(() => {
    api.get('/employees/me').then(r => {
      setProfile(r.data);
      if (r.data.avatar_url) setAvatar(r.data.avatar_url);
    }).finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatar(URL.createObjectURL(file));
  };

  const saveAvatar = async () => {
    if (!avatarFile) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('file', avatarFile);
      const { data } = await api.post('/upload/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await api.patch('/employees/me/avatar', { avatar_url: data.url });
      setSuccess('Photo updated successfully');
      setAvatarFile(null);
    } catch (err) {
      setError('Failed to upload photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner/>;

  const p = profile || {};
  const firstName  = p.first_name  || p.full_name?.split(' ')[0]  || '—';
  const lastName   = p.last_name   || p.full_name?.split(' ').slice(1).join(' ') || '—';
  const initials   = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?';
  const pts        = p.sabba_points || 0;
  const travelType = p.travel_type_label;

  const TRAVEL_META = {
    adventurer: { emoji: '🧗', label: 'The Adventurer', color: colors.orange, light: colors.orangeLight },
    creative:   { emoji: '🎨', label: 'The Creative',   color: '#7B3FA0',     light: '#F3EAF8' },
    scholar:    { emoji: '📚', label: 'The Scholar',     color: colors.blue,   light: colors.blueLight },
    healer:     { emoji: '🌿', label: 'The Healer',     color: colors.green,  light: colors.greenLight },
  };
  const tm = TRAVEL_META[travelType] || null;

  // Read-only field component
  const ReadField = ({ label, value, wide=false }) => (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</p>
      <div style={{ background: '#F7F5F2', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: value && value !== '—' ? colors.dark : colors.faint, fontFamily: font.body, minHeight: 40 }}>
        {value || '—'}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Employee Portal</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>My profile</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button small variant="secondary" onClick={() => navigate('/home')}>← Back</Button>
              <Button small onClick={() => p.id && navigate(`/community/profile/${p.id}`)}>🌍 Community profile</Button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 40px' }}>

        {/* Identity card */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* Avatar with upload */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {avatar
                ? <img src={avatar} alt="Profile" style={{ width: 88, height: 88, borderRadius: 20, objectFit: 'cover', border: '3px solid #eee' }}/>
                : <div style={{ width: 88, height: 88, borderRadius: 20, background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>{initials}</div>
              }
              <button onClick={() => fileRef.current?.click()} title="Change photo"
                style={{ position: 'absolute', bottom: -6, right: -6, width: 28, height: 28, borderRadius: '50%', background: colors.dark, border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                ✏️
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }}/>
            </div>

            {/* Name + role */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>{p.full_name || `${firstName} ${lastName}`}</p>
              <p style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>{p.job_title || 'Employee'}{p.department ? ` · ${p.department}` : ''}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.orange, background: colors.orangeLight, borderRadius: 6, padding: '3px 10px' }}>
                  Employee
                </span>
                {p.employment_category && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.mid, background: '#F7F5F2', borderRadius: 6, padding: '3px 10px', border: '1px solid #eee' }}>
                    {p.employment_category}
                  </span>
                )}
                {p.assignment_status && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.assignment_status === 'Active' ? colors.green : colors.muted, background: p.assignment_status === 'Active' ? colors.greenLight : '#F7F5F2', borderRadius: 6, padding: '3px 10px' }}>
                    {p.assignment_status}
                  </span>
                )}
                {tm && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: tm.color, background: tm.light, borderRadius: 6, padding: '3px 10px' }}>
                    {tm.emoji} {tm.label}
                  </span>
                )}
              </div>
            </div>

            {/* Sabba Points */}
            <div style={{ background: '#1C1916', borderRadius: 14, padding: '14px 20px', textAlign: 'center', flexShrink: 0, minWidth: 110 }}>
              <span style={{ fontSize: 22 }}>⭐</span>
              <p style={{ fontFamily: font.display, fontSize: 26, color: '#f5a066', lineHeight: 1, marginTop: 4 }}>{pts.toLocaleString()}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 600 }}>SABBA POINTS</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>= £{(pts/100).toFixed(2)}</p>
            </div>
          </div>

          {/* Avatar save controls */}
          {avatarFile && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: colors.orangeLight, borderRadius: 10 }}>
              <p style={{ fontSize: 13, color: colors.orange, fontWeight: 600, flex: 1 }}>New photo selected — save to update your profile</p>
              <button onClick={() => { setAvatarFile(null); setAvatar(p.avatar_url || null); }}
                style={{ background: 'none', border: '1px solid rgba(212,98,42,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: colors.orange, cursor: 'pointer', fontFamily: font.body }}>
                Cancel
              </button>
              <Button small onClick={saveAvatar} disabled={saving}>{saving ? 'Uploading…' : 'Save photo'}</Button>
            </div>
          )}
          {success && <p style={{ fontSize: 13, color: colors.green, fontWeight: 700, marginTop: 12 }}>✓ {success}</p>}
          {error   && <p style={{ fontSize: 13, color: colors.red, fontWeight: 700, marginTop: 12 }}>⚠ {error}</p>}
        </div>

        {/* Personal details — read only from HR/import */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Personal details</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ccc' }}/>
              <p style={{ fontSize: 12, color: colors.faint }}>These fields are managed by your HR team and cannot be edited here.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ReadField label="First name"        value={firstName}              />
            <ReadField label="Last name"         value={lastName}               />
            <ReadField label="Email"             value={p.email}                />
            <ReadField label="Employee number"   value={p.employee_number}      />
            <ReadField label="Department"        value={p.department}           />
            <ReadField label="Job title"         value={p.job_title}            />
            <ReadField label="Location"          value={p.location}             />
            <ReadField label="GL location code"  value={p.gl_location}          />
            <ReadField label="Salary band"       value={p.salary_band}          />
            <ReadField label="Employment type"   value={p.employment_category}  />
            <ReadField label="Assignment status" value={p.assignment_status}    />
            <ReadField label="Leave access"      value={p.leave_type}           />
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#F7F5F2', borderRadius: 10, border: '1px solid #eee' }}>
            <p style={{ fontSize: 12, color: colors.faint }}>
              Need to update any of these details? Contact your HR admin via <span onClick={() => navigate('/messages')} style={{ color: colors.orange, cursor: 'pointer', fontWeight: 600 }}>Messages</span>.
            </p>
          </div>
        </div>

        {/* 2026 Allowance snapshot */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>2026 Payroll allowance</h2>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>Your annual allowance for Sabba adventures via payroll deduction.</p>
          <AllowanceSummary userId={p.id}/>
          <p style={{ fontSize: 12, color: colors.faint, marginTop: 12 }}>
            Card payments are not counted against this allowance. <span onClick={() => navigate('/allowance')} style={{ color: colors.orange, cursor: 'pointer', fontWeight: 600 }}>View full allowance →</span>
          </p>
        </div>

        {/* Points history */}
        <PointsHistory/>
        {/* Community profile card */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #1A2E44, #243d58)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                🌍
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 2 }}>Sabba Community</p>
                <p style={{ fontSize: 12.5, color: colors.muted }}>Share adventure stories, connect with travel matches, earn Sabba Points</p>
              </div>
            </div>
            <Button small onClick={() => p.id && navigate(`/community/profile/${p.id}`)}>
              View community profile →
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Allowance summary mini-component ─────────────────────────
function AllowanceSummary() {
  const [alw, setAlw] = useState(null);
  useEffect(() => {
    api.get('/allowance').then(r => setAlw(r.data)).catch(() => {});
  }, []);
  if (!alw) return <div style={{ height: 48, background: '#F7F5F2', borderRadius: 10 }}/>;
  const used    = Number(alw.used_allowance_gbp      || 0);
  const total   = Number(alw.total_allowance_gbp     || 0);
  const remaining = Number(alw.remaining_allowance_gbp || 0);
  const pct     = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: colors.muted }}>Used: <strong style={{ color: colors.dark }}>£{used.toLocaleString()}</strong></span>
        <span style={{ fontSize: 13, color: colors.muted }}>Remaining: <strong style={{ color: colors.green }}>£{remaining.toLocaleString()}</strong></span>
        <span style={{ fontSize: 13, color: colors.muted }}>Total: <strong style={{ color: colors.dark }}>£{total.toLocaleString()}</strong></span>
      </div>
      <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? colors.red : pct > 50 ? colors.orange : colors.green, borderRadius: 4, transition: 'width 0.5s' }}/>
      </div>
      <p style={{ fontSize: 11.5, color: colors.faint, marginTop: 6 }}>{pct}% of annual payroll allowance used</p>
    </div>
  );
}

// ── Points history mini-component ────────────────────────────
function PointsHistory() {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    api.get('/employees/points/history').catch(() => ({ data: [] })).then(r => setHistory(r.data || []));
  }, []);
  if (!history.length) return null;
  return (
    <div className="card" style={{ padding: '22px 24px' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Points history</h2>
      {history.slice(0, 8).map((t, i) => (
        <div key={t.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < Math.min(history.length,8)-1 ? 12 : 0, marginBottom: i < Math.min(history.length,8)-1 ? 12 : 0, borderBottom: i < Math.min(history.length,8)-1 ? '1px solid #f5f5f5' : 'none' }}>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{t.reason || 'Points earned'}</p>
            <p style={{ fontSize: 11.5, color: colors.muted }}>{t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : ''}</p>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.points > 0 ? colors.green : colors.red }}>
            {t.points > 0 ? '+' : ''}{t.points} pts
          </span>
        </div>
      ))}
    </div>
  );
}

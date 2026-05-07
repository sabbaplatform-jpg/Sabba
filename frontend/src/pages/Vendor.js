import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, EmptyState, Button, Input, Select } from '../components/UI';
import { colors, font } from '../lib/styles';

const CATEGORIES = ['travel','volunteering','courses','jobs_abroad','accommodation','airlines'];
const EMOJIS = ['🌍','🇯🇵','🇮🇩','🇵🇹','🇰🇪','🇪🇸','🎓','🤝','💼','✈️','🏠','🇨🇷','🇲🇦','🇧🇷','🇮🇳'];

export function VendorDashboard() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([api.get('/packages/vendor/mine'), api.get('/bookings/vendor')])
      .then(([pkgs, bkgs]) => { setPackages(pkgs.data); setBookings(bkgs.data); })
      .finally(() => setLoading(false));
  }, []);

  const earnings = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + Number(b.total_amount), 0);
  const stats = [
    { label: 'Active Packages',   value: packages.filter(p => p.status === 'live').length, sub: `${packages.length} total` },
    { label: 'Total Bookings',    value: bookings.length,                                   sub: `${bookings.filter(b=>b.status==='confirmed').length} confirmed` },
    { label: 'Confirmed Revenue', value: `£${earnings.toLocaleString()}`,                   sub: 'from confirmed bookings' },
    { label: 'Pending Bookings',  value: bookings.filter(b=>b.status==='pending').length,   sub: 'awaiting HR approval' },
  ];

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Vendor Portal</p>
        <h1 style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 400 }}>Good morning, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p style={{ color: colors.muted, fontSize: 13.5, marginTop: 4 }}>Manage your listings and track bookings from Sabba employers.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '22px 22px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontFamily: font.display, fontSize: 32, color: colors.dark, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>{s.sub}</p>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.dark }}>Recent Bookings</h2>
          <p style={{ fontSize: 12, color: colors.faint, marginTop: 2 }}>Employees from employer portals</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1.4fr 0.8fr 0.8fr 1fr',
          padding: '10px 24px', background: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
          {['Employee','Employer','Package','Departure','Payroll','Status'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        {bookings.length === 0 ? (
          <EmptyState emoji="📬" title="No bookings yet" subtitle="Once employees book your packages they will appear here"/>
        ) : bookings.slice(0,8).map((b, i) => (
          <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1.4fr 0.8fr 0.8fr 1fr',
            padding: '13px 24px', alignItems: 'center',
            borderBottom: i < Math.min(bookings.length,8) - 1 ? `1px solid ${colors.border}` : 'none' }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: colors.dark }}>{b.employee_name}</span>
            <span style={{ fontSize: 13, color: colors.mid }}>{b.company_name}</span>
            <span style={{ fontSize: 13, color: colors.mid }}>{b.emoji} {b.package_title}</span>
            <span style={{ fontSize: 13, color: colors.mid }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—'}</span>
            <span style={{ fontSize: 12, color: colors.muted }}>{b.payroll_months}mo</span>
            <Badge status={b.status}/>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VendorPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPkg, setEditPkg]   = useState(null);

  const fetchPackages = () => {
    api.get('/packages/vendor/mine').then(r => setPackages(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPackages(); }, []);

  const toggleStatus = async (pkg) => {
    await api.patch(`/packages/${pkg.id}`, { status: pkg.status === 'live' ? 'draft' : 'live' });
    fetchPackages();
  };

  const deletePackage = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    await api.delete(`/packages/${id}`);
    fetchPackages();
  };

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Vendor Portal</p>
          <h1 style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 400 }}>My Packages</h1>
        </div>
        <Button onClick={() => { setEditPkg(null); setShowForm(true); }}>+ Add Package</Button>
      </div>
      {showForm && (
        <PackageForm initial={editPkg}
          onClose={() => { setShowForm(false); setEditPkg(null); }}
          onSaved={() => { setShowForm(false); setEditPkg(null); fetchPackages(); }}/>
      )}
      {loading ? <Spinner/> : packages.length === 0 ? (
        <EmptyState emoji="📦" title="No packages yet" subtitle="Add your first package to appear on the Sabba marketplace"/>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {packages.map(pkg => (
            <div key={pkg.id} style={{ background: '#fff', border: `1px solid ${colors.border}`,
              borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{pkg.emoji || '🌍'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: colors.dark, marginBottom: 2 }}>{pkg.title}</p>
                <p style={{ fontSize: 12, color: colors.muted }}>{pkg.destination} · {pkg.duration} · {pkg.category}</p>
              </div>
              <span style={{ fontFamily: font.display, fontSize: 20, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</span>
              <Badge status={pkg.status}/>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleStatus(pkg)} style={{ background: pkg.status === 'live' ? '#fef2f2' : colors.greenLight, color: pkg.status === 'live' ? '#b91c1c' : colors.green, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font.body }}>{pkg.status === 'live' ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => { setEditPkg(pkg); setShowForm(true); }} style={{ background: colors.bgCard, color: colors.mid, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font.body }}>Edit</button>
                <button onClick={() => deletePackage(pkg.id)} style={{ background: '#fef2f2', color: '#b91c1c', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font.body }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PackageForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || { title: '', description: '', category: 'travel', destination: '', duration: '', price_gbp: '', emoji: '🌍' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (initial) await api.patch(`/packages/${initial.id}`, form);
      else         await api.post('/packages', form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h2 style={{ fontFamily: font.display, fontSize: 22, color: colors.dark, marginBottom: 24, fontWeight: 400 }}>
          {initial ? 'Edit Package' : 'Add New Package'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Package title" required value={form.title} onChange={set('title')} placeholder="Japan Explorer — 3 Weeks"/>
          <Input label="Description" value={form.description} onChange={set('description')} placeholder="A brief description for employees"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Category" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
            </Select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Emoji</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {EMOJIS.map(em => (
                  <span key={em} onClick={() => setForm(f => ({...f, emoji: em}))}
                    style={{ fontSize: 18, cursor: 'pointer', padding: 3, borderRadius: 4,
                      background: form.emoji === em ? colors.orangeLight : 'transparent',
                      border: form.emoji === em ? `1px solid ${colors.orange}` : '1px solid transparent' }}>
                    {em}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Destination" required value={form.destination} onChange={set('destination')} placeholder="Tokyo & Kyoto"/>
            <Input label="Duration" required value={form.duration} onChange={set('duration')} placeholder="3 weeks"/>
          </div>
          <Input label="Price (£)" type="number" required min="1" value={form.price_gbp} onChange={set('price_gbp')} placeholder="3200"/>
          {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Create package'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, EmptyState, Button, Input, Select, Avatar } from '../components/UI';
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
  const maxEarnings = 20000;

  const stats = [
    { label: 'Active Packages',   value: packages.filter(p => p.status === 'live').length, sub: `${packages.length} total` },
    { label: 'Total Bookings',    value: bookings.length, sub: `${bookings.filter(b=>b.status==='confirmed').length} confirmed` },
    { label: 'Confirmed Revenue', value: `£${earnings.toLocaleString()}`, sub: 'from confirmed bookings' },
    { label: 'Pending',           value: bookings.filter(b=>b.status==='pending').length, sub: 'awaiting HR approval' },
  ];

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`.stat-card{transition:box-shadow 0.15s,transform 0.15s}.stat-card:hover{box-shadow:0 6px 24px rgba(0,0,0,0.08)!important;transform:translateY(-2px)}.row-hover:hover{background:#fdf7f3!important}`}</style>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Vendor Portal</p>
        <h1 style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 400 }}>Good morning, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p style={{ color: colors.muted, fontSize: 13.5, marginTop: 4 }}>Manage your listings and track bookings from Sabba employers.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '22px 22px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontFamily: font.display, fontSize: 32, color: colors.dark, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.dark }}>Recent Bookings</h2>
              <p style={{ fontSize: 12, color: colors.faint, marginTop: 2 }}>Employees via employer portals</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1.4fr 0.8fr 0.8fr 1fr', padding: '10px 24px', background: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
            {['Employee','Employer','Package','Departure','Payroll','Status'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>
          {bookings.length === 0 ? (
            <EmptyState emoji="📬" title="No bookings yet" subtitle="Once employees book your packages they'll appear here"/>
          ) : bookings.slice(0,8).map((b, i) => (
            <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1.4fr 0.8fr 0.8fr 1fr', padding: '13px 24px', alignItems: 'center', borderBottom: i < Math.min(bookings.length,8)-1 ? `1px solid ${colors.border}` : 'none', transition: 'background 0.12s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={b.employee_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}/>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: colors.dark }}>{b.employee_name}</span>
              </div>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.company_name}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.emoji} {b.package_title}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—'}</span>
              <span style={{ fontSize: 12, color: colors.muted }}>{b.payroll_months}mo</span>
              <Badge status={b.status}/>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Vendor profile */}
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #e06c2a, #f5a66d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌍</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>{user?.full_name}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, background: colors.greenLight, borderRadius: 4, padding: '2px 6px' }}>✓ VENDOR</span>
                </div>
                <p style={{ fontSize: 12, color: colors.faint }}>Sabba Marketplace Partner</p>
              </div>
            </div>
            {[{ label: 'Active Listings', value: packages.filter(p=>p.status==='live').length }, { label: 'Total Bookings', value: bookings.length }, { label: 'Platform Status', value: 'Active' }].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i < 2 ? 10 : 0, marginBottom: i < 2 ? 10 : 0, borderBottom: i < 2 ? `1px solid ${colors.border}` : 'none' }}>
                <span style={{ fontSize: 12, color: colors.faint }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: row.label === 'Platform Status' ? colors.green : colors.dark }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>Recent Activity</h2>
            <p style={{ fontSize: 12, color: colors.faint, marginBottom: 16 }}>Latest on your account</p>
            {bookings.slice(0,4).map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: i < 3 ? 13 : 0, marginBottom: i < 3 ? 13 : 0, borderBottom: i < 3 ? `1px solid ${colors.border}` : 'none' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: colors.orange, flexShrink: 0, marginTop: 5 }}/>
                <div>
                  <p style={{ fontSize: 12.5, color: colors.dark, lineHeight: 1.4 }}>{b.employee_name} booked {b.package_title}</p>
                  <p style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>via {b.company_name}</p>
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p style={{ fontSize: 13, color: colors.muted }}>No activity yet</p>}
          </div>
        </div>
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
          <p style={{ color: colors.muted, fontSize: 13.5, marginTop: 4 }}>Manage your listings on the Sabba marketplace</p>
        </div>
        <Button onClick={() => { setEditPkg(null); setShowForm(true); }}>+ Add Package</Button>
      </div>
      {showForm && <PackageForm initial={editPkg} onClose={() => { setShowForm(false); setEditPkg(null); }} onSaved={() => { setShowForm(false); setEditPkg(null); fetchPackages(); }}/>}
      {loading ? <Spinner/> : packages.length === 0 ? (
        <EmptyState emoji="📦" title="No packages yet" subtitle="Add your first package to appear on the Sabba marketplace"/>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {packages.map(pkg => (
            <div key={pkg.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{pkg.emoji || '🌍'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: colors.dark, marginBottom: 2 }}>{pkg.title}</p>
                <p style={{ fontSize: 12, color: colors.muted }}>{pkg.destination} · {pkg.duration} · {pkg.category?.replace('_',' ')}</p>
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
        <h2 style={{ fontFamily: font.display, fontSize: 22, color: colors.dark, marginBottom: 24, fontWeight: 400 }}>{initial ? 'Edit Package' : 'Add New Package'}</h2>
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
                  <span key={em} onClick={() => setForm(f => ({...f, emoji: em}))} style={{ fontSize: 18, cursor: 'pointer', padding: 3, borderRadius: 4, background: form.emoji === em ? colors.orangeLight : 'transparent', border: form.emoji === em ? `1px solid ${colors.orange}` : '1px solid transparent' }}>{em}</span>
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

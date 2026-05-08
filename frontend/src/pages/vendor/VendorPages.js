import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Spinner, EmptyState, Button, Input, Select, Avatar, StarRating, Modal, Textarea, SectionHeader, TableHeader, StatCard } from '../../components/UI';
import { colors, font } from '../../lib/styles';

const CATEGORIES = ['travel','volunteering','courses','jobs_abroad','accommodation','airlines'];
const EMOJIS = ['🌍','🇯🇵','🇮🇩','🇵🇹','🇰🇪','🇪🇸','🎓','🤝','💼','✈️','🏠','🇨🇷','🇲🇦','🇧🇷','🇮🇳'];

// ── Vendor Dashboard ─────────────────────────────────────────
export function VendorDashboard() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/packages/vendor/mine'),
      api.get('/bookings/vendor'),
      api.get('/vendors/profile'),
    ]).then(([pkgs, bkgs, prof]) => {
      setPackages(pkgs.data); setBookings(bkgs.data); setProfile(prof.data);
    }).finally(() => setLoading(false));
  }, []);

  const earnings = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + Number(b.total_amount), 0);

  const stats = [
    { label: 'Active Packages',   value: packages.filter(p => p.status === 'live').length, sub: `${packages.length} total`, icon: '📦' },
    { label: 'Total Bookings',    value: bookings.length, sub: `${bookings.filter(b=>b.status==='confirmed').length} confirmed`, icon: '📅', up: true },
    { label: 'Confirmed Revenue', value: `£${earnings.toLocaleString()}`, sub: 'from confirmed bookings', icon: '💷', up: true },
    { label: 'Avg Rating',        value: profile?.rating > 0 ? `${profile.rating} ★` : '—', sub: `${profile?.total_reviews || 0} reviews`, icon: '⭐' },
  ];

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Banner */}
      {profile?.banner_url && (
        <div style={{ height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 20, position: 'relative' }}>
          <img src={profile.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent)' }}/>
        </div>
      )}

      <SectionHeader
        label="Vendor Portal"
        title={`Good morning, ${user?.full_name?.split(' ')[0]} 👋`}
        subtitle="Manage your listings and track bookings from Sabba employers."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => <StatCard key={i} {...s}/>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Recent bookings */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>Recent Bookings</h2>
            <p style={{ fontSize: 12.5, color: colors.muted, marginTop: 2, fontWeight: 500 }}>Employees via employer portals</p>
          </div>
          <TableHeader cols={['Employee','Employer','Package','Departure','Status']} template="1.8fr 1.2fr 1.4fr 0.9fr 1fr"/>
          {bookings.length === 0 ? (
            <EmptyState emoji="📬" title="No bookings yet" subtitle="Once employees book your packages they'll appear here"/>
          ) : bookings.slice(0,6).map((b, i) => (
            <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1.4fr 0.9fr 1fr', padding: '13px 24px', alignItems: 'center', borderBottom: i < Math.min(bookings.length,6)-1 ? `1px solid ${colors.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={b.employee_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}/>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{b.employee_name}</span>
              </div>
              <span style={{ fontSize: 13, color: colors.mid, fontWeight: 500 }}>{b.company_name}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.emoji} {b.package_title}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—'}</span>
              <Badge status={b.status}/>
            </div>
          ))}
        </div>

        {/* Profile sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Avatar initials={profile?.company_name?.slice(0,2).toUpperCase()} src={profile?.avatar_url} size={48}/>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{profile?.company_name}</p>
                  {profile?.verified && <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, background: colors.greenLight, borderRadius: 4, padding: '2px 6px' }}>✓</span>}
                </div>
                <p style={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>{profile?.category} · Sabba Partner</p>
              </div>
            </div>
            <StarRating rating={Math.round(profile?.rating || 0)} size={18}/>
            <p style={{ fontSize: 12, color: colors.muted, marginTop: 4, fontWeight: 500 }}>{profile?.rating > 0 ? `${profile.rating} / 5` : 'No ratings yet'} · {profile?.total_reviews || 0} reviews</p>
            {profile?.about && <p style={{ fontSize: 13, color: colors.mid, lineHeight: 1.5, marginTop: 12 }}>{profile.about}</p>}
          </div>

          <div className="glass-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 12 }}>Recent Activity</h3>
            {bookings.slice(0,4).map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: i < 3 ? 12 : 0, marginBottom: i < 3 ? 12 : 0, borderBottom: i < 3 ? `1px solid ${colors.border}` : 'none' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: colors.orange, flexShrink: 0, marginTop: 5 }}/>
                <div>
                  <p style={{ fontSize: 12.5, color: colors.dark, lineHeight: 1.4, fontWeight: 500 }}>{b.employee_name} booked {b.package_title}</p>
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

// ── Vendor Packages ──────────────────────────────────────────
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
      <SectionHeader label="Vendor Portal" title="My Packages" subtitle="Manage your listings on the Sabba marketplace."
        action={<Button onClick={() => { setEditPkg(null); setShowForm(true); }}>+ Add Package</Button>}/>
      {showForm && <PackageForm initial={editPkg} onClose={() => { setShowForm(false); setEditPkg(null); }} onSaved={() => { setShowForm(false); setEditPkg(null); fetchPackages(); }}/>}
      {loading ? <Spinner/> : packages.length === 0 ? (
        <EmptyState emoji="📦" title="No packages yet" subtitle="Add your first package to appear on the Sabba marketplace"/>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {packages.map(pkg => (
            <div key={pkg.id} className="glass-card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{pkg.emoji || '🌍'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 2 }}>{pkg.title}</p>
                <p style={{ fontSize: 12.5, color: colors.muted, fontWeight: 500 }}>{pkg.destination} · {pkg.duration} · {pkg.category?.replace('_',' ')}</p>
              </div>
              <span style={{ fontFamily: font.display, fontSize: 20, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</span>
              <Badge status={pkg.status}/>
              <Badge status={pkg.admin_status || 'pending'}/>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleStatus(pkg)} style={{ background: pkg.status === 'live' ? colors.redLight : colors.greenLight, color: pkg.status === 'live' ? colors.red : colors.green, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>{pkg.status === 'live' ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => { setEditPkg(pkg); setShowForm(true); }} style={{ background: 'rgba(0,0,0,0.05)', color: colors.mid, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Edit</button>
                <button onClick={() => deletePackage(pkg.id)} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Vendor Bookings ──────────────────────────────────────────
export function VendorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notesModal, setNotesModal] = useState(null);
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    api.get('/bookings/vendor').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const sendNotes = async () => {
    setSaving(true);
    await api.patch(`/vendors/bookings/${notesModal.id}/notes`, { vendor_notes: notes });
    setSaving(false); setNotesModal(null); setNotes('');
    api.get('/bookings/vendor').then(r => setBookings(r.data));
  };

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeader label="Vendor Portal" title="Bookings" subtitle="Manage employee bookings and send adventure details."/>
      {loading ? <Spinner/> : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <TableHeader cols={['Employee','Employer','Package','Departure','Payroll','Total','Status','Action']} template="1.8fr 1.2fr 1.4fr 0.9fr 0.7fr 0.9fr 1fr 1.2fr"/>
          {bookings.length === 0 ? (
            <EmptyState emoji="📬" title="No bookings yet" subtitle="Bookings from employees will appear here"/>
          ) : bookings.map((b, i) => (
            <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1.4fr 0.9fr 0.7fr 0.9fr 1fr 1.2fr', padding: '13px 24px', alignItems: 'center', borderBottom: i < bookings.length-1 ? `1px solid ${colors.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={b.employee_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}/>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{b.employee_name}</span>
              </div>
              <span style={{ fontSize: 13, color: colors.mid, fontWeight: 500 }}>{b.company_name}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.emoji} {b.package_title}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}) : '—'}</span>
              <span style={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>{b.payroll_months}mo</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</span>
              <Badge status={b.status}/>
              <button onClick={() => { setNotesModal(b); setNotes(b.vendor_notes || ''); }} style={{ background: colors.orangeLight, color: colors.orange, border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Send Details</button>
            </div>
          ))}
        </div>
      )}

      {notesModal && (
        <Modal title={`Send details to ${notesModal.employee_name}`} onClose={() => setNotesModal(null)} width={480}>
          <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 16, fontWeight: 500 }}>Send booking details, meeting points, packing lists, or any important information about their adventure.</p>
          <Textarea label="Message" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Please arrive at Heathrow Terminal 3 by 6am. Your hotel is confirmed at…"/>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setNotesModal(null)}>Cancel</Button>
            <Button onClick={sendNotes} disabled={saving || !notes}>{saving ? 'Sending…' : 'Send to employee'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Vendor Earnings ──────────────────────────────────────────
export function VendorEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendors/earnings').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner/>;

  const monthly = data?.monthly || [];
  const totals  = data?.totals || {};
  const maxRevenue = Math.max(...monthly.map(m => Number(m.revenue || 0)), 1);

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <SectionHeader label="Vendor Portal" title="Earnings" subtitle="Analytics and revenue from your Sabba packages."/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Bookings', value: totals.total_bookings || 0, icon: '📅', up: true },
          { label: 'Confirmed Revenue', value: `£${Number(totals.confirmed_revenue || 0).toLocaleString()}`, icon: '💷', up: true },
          { label: 'Avg Rating', value: totals.avg_rating ? `${Number(totals.avg_rating).toFixed(1)} ★` : '—', icon: '⭐' },
          { label: 'This Month', value: `£${Number(monthly[0]?.revenue || 0).toLocaleString()}`, icon: '📈', up: true },
        ].map((s, i) => <StatCard key={i} {...s}/>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Bar chart */}
        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Monthly Revenue</h2>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 24, fontWeight: 500 }}>Last 6 months of confirmed bookings</p>
          {monthly.length === 0 ? (
            <EmptyState emoji="📊" title="No earnings data yet" subtitle="Revenue from confirmed bookings will appear here"/>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, marginBottom: 12 }}>
                {[...monthly].reverse().map((m, i) => {
                  const pct = (Number(m.revenue || 0) / maxRevenue) * 100;
                  const isLatest = i === monthly.length - 1;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isLatest ? colors.orange : colors.muted }}>£{Math.round(m.revenue/1000)}k</span>
                      <div style={{ width: '100%', borderRadius: 6, height: `${Math.max(pct, 4)}%`, background: isLatest ? `linear-gradient(to top, ${colors.orange}, #f5a66d)` : 'rgba(224,108,42,0.2)', transition: 'height 0.4s ease' }}/>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[...monthly].reverse().map((m, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ fontSize: 10.5, color: colors.faint, fontWeight: 600 }}>{new Date(m.month).toLocaleDateString('en-GB',{month:'short'})}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Monthly breakdown */}
        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Monthly Breakdown</h2>
          {monthly.length === 0 ? <p style={{ fontSize: 13, color: colors.muted }}>No data yet</p> : monthly.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < monthly.length-1 ? 12 : 0, marginBottom: i < monthly.length-1 ? 12 : 0, borderBottom: i < monthly.length-1 ? `1px solid ${colors.border}` : 'none' }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{new Date(m.month).toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</p>
                <p style={{ fontSize: 11.5, color: colors.muted, fontWeight: 500 }}>{m.bookings} bookings</p>
              </div>
              <span style={{ fontFamily: font.display, fontSize: 18, color: i === 0 ? colors.orange : colors.dark }}>£{Number(m.revenue || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Vendor Profile ───────────────────────────────────────────
export function VendorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [form, setForm]       = useState({});

  useEffect(() => {
    api.get('/vendors/profile').then(r => {
      setProfile(r.data);
      setForm({ company_name: r.data.company_name || '', about: r.data.about || '', website: r.data.website || '', avatar_url: r.data.avatar_url || '', banner_url: r.data.banner_url || '' });
    }).finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    await api.patch('/vendors/profile', form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 800, margin: '0 auto' }}>
      <SectionHeader label="Vendor Portal" title="Vendor Profile"/>

      {/* Banner preview */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        {form.banner_url ? (
          <div style={{ height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: 20, position: 'relative' }}>
            <img src={form.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>
        ) : (
          <div style={{ height: 100, borderRadius: 12, background: 'linear-gradient(135deg, #f5e6da, #fcd3b3)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 13, color: colors.muted, fontWeight: 500 }}>Banner preview</p>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Avatar initials={profile?.company_name?.slice(0,2).toUpperCase()} src={form.avatar_url} size={64}/>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>{profile?.company_name}</p>
              {profile?.verified && <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, background: colors.greenLight, borderRadius: 4, padding: '2px 7px' }}>✓ VERIFIED</span>}
            </div>
            <p style={{ fontSize: 13.5, color: colors.muted, fontWeight: 500 }}>{profile?.category} · Sabba Marketplace Partner</p>
            <StarRating rating={Math.round(profile?.rating || 0)} size={16}/>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Company name" value={form.company_name} onChange={set('company_name')}/>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>About us</label>
            <textarea value={form.about} onChange={set('about')} placeholder="Describe your company and what makes your packages special…"
              style={{ border: `1.5px solid ${colors.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: colors.dark, background: 'rgba(255,255,255,0.8)', outline: 'none', fontFamily: font.body, width: '100%', resize: 'vertical', minHeight: 100, fontWeight: 500 }}/>
          </div>
          <Input label="Website" value={form.website} onChange={set('website')} placeholder="https://yourcompany.com"/>
          <Input label="Avatar image URL" value={form.avatar_url} onChange={set('avatar_url')} placeholder="https://…"/>
          <Input label="Banner image URL" value={form.banner_url} onChange={set('banner_url')} placeholder="https://… (recommended: 1200×400px)"/>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 20 }}>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
          {saved && <span style={{ fontSize: 13, color: colors.green, fontWeight: 700 }}>✓ Saved!</span>}
        </div>
      </div>
    </div>
  );
}

// ── Package Form ─────────────────────────────────────────────
function PackageForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || { title: '', description: '', category: 'travel', destination: '', duration: '', price_gbp: '', emoji: '🌍' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

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
    <Modal title={initial ? 'Edit Package' : 'Add New Package'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Package title" required value={form.title} onChange={set('title')} placeholder="Japan Explorer — 3 Weeks"/>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Description</label>
          <textarea value={form.description} onChange={set('description')} placeholder="Describe this adventure for employees…"
            style={{ border: `1.5px solid ${colors.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: colors.dark, background: 'rgba(255,255,255,0.8)', outline: 'none', fontFamily: font.body, width: '100%', resize: 'vertical', minHeight: 70, fontWeight: 500 }}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Category" value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
          </Select>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Emoji</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {EMOJIS.map(em => (
                <span key={em} onClick={() => setForm(f => ({...f, emoji: em}))}
                  style={{ fontSize: 18, cursor: 'pointer', padding: 3, borderRadius: 4, background: form.emoji === em ? colors.orangeLight : 'transparent', border: form.emoji === em ? `1px solid ${colors.orange}` : '1px solid transparent' }}>
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
        {error && <p style={{ color: colors.red, fontSize: 13, fontWeight: 600 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Create package'}</Button>
        </div>
      </form>
    </Modal>
  );
}

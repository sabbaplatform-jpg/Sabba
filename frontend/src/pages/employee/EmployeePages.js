import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Spinner, EmptyState, Button, Input, Select, Avatar, StarRating, Modal, StatCard, SectionHeader } from '../../components/UI';
import { colors, font } from '../../lib/styles';

// ── Employee Home ────────────────────────────────────────────
export function EmployeeHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/packages'),
      api.get('/bookings/mine'),
      api.get('/profile'),
    ]).then(([pkgs, bkgs, prof]) => {
      setFeatured(pkgs.data.slice(0,4));
      setBookings(bkgs.data);
      setProfile(prof.data);
    }).finally(() => setLoading(false));
  }, []);

  const activeBooking = bookings.find(b => ['approved','confirmed'].includes(b.status));
  const daysUntil = activeBooking?.departure_date
    ? Math.max(0, Math.ceil((new Date(activeBooking.departure_date) - new Date()) / (1000*60*60*24)))
    : null;

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`.pkg-card:hover{border-color:#e06c2a!important;box-shadow:0 4px 20px rgba(224,108,42,0.12)!important}`}</style>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(120deg, #1a1612 0%, #2e2318 60%, #3d2e1a 100%)', borderRadius: 20, padding: '36px 40px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(224,108,42,0.12)' }}/>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(224,108,42,0.08)' }}/>
        <div style={{ zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Your Adventure Awaits</p>
          <h1 style={{ fontFamily: font.display, fontSize: 32, color: '#fff', fontWeight: 400, marginBottom: 8 }}>Good morning, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontWeight: 500 }}>Explore packages and book your next adventure — paid via payroll.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={() => navigate('/marketplace')} style={{ background: colors.orange, color: '#fff' }}>Browse marketplace →</Button>
            {profile?.profile?.sabba_points > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>⭐</span>
                <div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Sabba Points</p>
                  <p style={{ fontFamily: font.display, fontSize: 18, color: '#f5a66d' }}>{profile.profile.sabba_points?.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {daysUntil !== null && (
          <div style={{ background: 'rgba(224,108,42,0.15)', border: '1px solid rgba(224,108,42,0.25)', borderRadius: 14, padding: '20px 28px', textAlign: 'right', zIndex: 1 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Next adventure</p>
            <p style={{ fontFamily: font.display, fontSize: 36, color: '#f5a66d' }}>{daysUntil}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>days to go</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{activeBooking.emoji} {activeBooking.package_title}</p>
          </div>
        )}
      </div>

      {/* Categories */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>Explore by category</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
          {[
            { icon: '🌍', label: 'Travel',      cat: 'travel',         color: colors.orange },
            { icon: '🤝', label: 'Volunteering', cat: 'volunteering',  color: '#2d7a9a' },
            { icon: '🎓', label: 'Courses',      cat: 'courses',       color: '#6b5ea8' },
            { icon: '💼', label: 'Jobs Abroad',  cat: 'jobs_abroad',   color: colors.green },
            { icon: '✈️', label: 'Airlines',     cat: 'airlines',      color: '#b45309' },
            { icon: '🏠', label: 'Stays',        cat: 'accommodation', color: '#7a2d6b' },
          ].map((c, i) => (
            <div key={i} onClick={() => navigate(`/marketplace?category=${c.cat}`)}
              className="glass-card" style={{ padding: '16px', cursor: 'pointer', textAlign: 'center', borderRadius: 14 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; }}>
              <span style={{ fontSize: 24 }}>{c.icon}</span>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: colors.dark, marginTop: 8 }}>{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>Featured packages</h2>
        <span onClick={() => navigate('/marketplace')} style={{ fontSize: 13, color: colors.orange, fontWeight: 700, cursor: 'pointer' }}>View all →</span>
      </div>
      {loading ? <Spinner/> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
          {featured.map(pkg => (
            <div key={pkg.id} className="pkg-card glass-card" onClick={() => navigate(`/package/${pkg.id}`)}
              style={{ padding: 20, cursor: 'pointer', borderRadius: 16, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 30 }}>{pkg.emoji || '🌍'}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: colors.orange, background: colors.orangeLight, borderRadius: 6, padding: '3px 8px' }}>{pkg.category?.replace('_',' ')}</span>
              </div>
              <p style={{ fontSize: 14.5, fontWeight: 700, color: colors.dark, marginBottom: 2 }}>{pkg.title}</p>
              <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 12, fontWeight: 500 }}>{pkg.vendor_name} · {pkg.destination} · {pkg.duration}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: font.display, fontSize: 22, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</span>
                <span style={{ fontSize: 11.5, color: colors.muted, fontWeight: 600 }}>from £{Math.ceil(pkg.price_gbp/12)}/mo</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── My Booking with Roadmap ──────────────────────────────────
export function MyBooking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [ratingModal, setRatingModal] = useState(null);
  const [rating, setRating]     = useState(5);
  const [review, setReview]     = useState('');
  const [savingRating, setSavingRating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/bookings/mine').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const submitRating = async () => {
    setSavingRating(true);
    await api.post('/ratings', { package_id: ratingModal.package_id, booking_id: ratingModal.id, rating, review });
    setSavingRating(false);
    setRatingModal(null);
    setRating(5); setReview('');
  };

  const getMilestones = (b) => {
    const statuses = ['pending','approved','confirmed'];
    const labels = ['Request Submitted', 'HR Approved', 'Booking Confirmed', 'Adventure Complete'];
    const icons = ['📋','✅','🎟️','🌍'];
    const currentIdx = statuses.indexOf(b.status);
    return labels.map((label, i) => ({
      label, icon: icons[i],
      status: i < currentIdx + 1 ? 'completed' : i === currentIdx + 1 ? 'current' : 'upcoming',
    }));
  };

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 900, margin: '0 auto' }}>
      <SectionHeader label="Employee Portal" title="My Adventure Bookings"/>
      {bookings.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <EmptyState emoji="🌍" title="No bookings yet" subtitle="Browse the marketplace and request your first adventure"
            action={<Button onClick={() => navigate('/marketplace')}>Explore packages</Button>}/>
        </div>
      ) : bookings.map(b => (
        <div key={b.id} className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 36 }}>{b.emoji || '🌍'}</span>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: colors.dark }}>{b.package_title}</h2>
                <p style={{ fontSize: 13.5, color: colors.muted, fontWeight: 500 }}>{b.vendor_name} · {b.destination}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge status={b.status}/>
              {['approved','confirmed'].includes(b.status) && (
                <Button small variant="ghost" onClick={() => setRatingModal(b)}>Rate ★</Button>
              )}
            </div>
          </div>

          {/* Roadmap */}
          <div style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Adventure Roadmap</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {getMilestones(b).map((m, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length-1 ? 1 : 'none' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto',
                      background: m.status === 'completed' ? colors.green : m.status === 'current' ? colors.orange : 'rgba(0,0,0,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      border: m.status === 'current' ? `3px solid ${colors.orange}` : 'none',
                      boxShadow: m.status === 'current' ? `0 0 0 4px ${colors.orangeLight}` : 'none',
                      transition: 'all 0.3s',
                    }}>
                      <span style={{ fontSize: m.status === 'upcoming' ? 14 : 16 }}>{m.status === 'completed' ? '✓' : m.icon}</span>
                    </div>
                    <p style={{ fontSize: 11, fontWeight: m.status === 'current' ? 700 : 500, color: m.status === 'upcoming' ? colors.faint : colors.dark, marginTop: 6, whiteSpace: 'nowrap' }}>{m.label}</p>
                  </div>
                  {i < arr.length-1 && (
                    <div style={{ flex: 1, height: 3, background: m.status === 'completed' ? colors.green : colors.border, margin: '0 8px', marginBottom: 20, borderRadius: 2, transition: 'background 0.3s' }}/>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Departure', value: b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—' },
              { label: 'Duration', value: b.duration || '—' },
              { label: 'Payroll Spread', value: `${b.payroll_months} months` },
              { label: 'Monthly Amount', value: `£${Number(b.monthly_amount).toFixed(2)}` },
            ].map((item, j) => (
              <div key={j} style={{ background: colors.bg, borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: colors.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Vendor notes */}
          {b.vendor_notes && (
            <div style={{ background: colors.orangeLight, border: `1px solid ${colors.orangePale}`, borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.orange, marginBottom: 4 }}>📩 Message from vendor</p>
              <p style={{ fontSize: 13.5, color: colors.dark, lineHeight: 1.5 }}>{b.vendor_notes}</p>
            </div>
          )}

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: colors.muted, fontWeight: 500 }}>Total package cost</span>
            <span style={{ fontFamily: font.display, fontSize: 24, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</span>
          </div>
        </div>
      ))}

      {/* Rating modal */}
      {ratingModal && (
        <Modal title="Rate your adventure" onClose={() => setRatingModal(null)} width={440}>
          <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20, fontWeight: 500 }}>Share your experience with {ratingModal.package_title}. You'll earn 50 Sabba Points for leaving a review!</p>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your rating</p>
            <StarRating rating={rating} onChange={setRating} size={32}/>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Review (optional)</label>
            <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Tell others about your experience…"
              style={{ border: `1.5px solid ${colors.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: colors.dark, background: 'rgba(255,255,255,0.8)', outline: 'none', fontFamily: font.body, width: '100%', resize: 'vertical', minHeight: 80, fontWeight: 500 }}/>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setRatingModal(null)}>Cancel</Button>
            <Button onClick={submitRating} disabled={savingRating}>{savingRating ? 'Submitting…' : 'Submit rating ⭐ +50pts'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Employee Profile ─────────────────────────────────────────
export function EmployeeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({});
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    api.get('/profile').then(r => {
      setProfile(r.data);
      setForm({
        full_name:           r.data.full_name || '',
        department:          r.data.profile?.department || '',
        job_title:           r.data.profile?.job_title || '',
        location:            r.data.profile?.location || '',
        salary_band:         r.data.profile?.salary_band || '',
        bank_name:           r.data.profile?.bank_name || '',
        bank_account_last4:  r.data.profile?.bank_account_last4 || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    await api.patch('/profile', form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <Spinner/>;

  const pts = profile?.profile?.sabba_points || 0;

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 800, margin: '0 auto' }}>
      <SectionHeader label="Employee Portal" title="My Profile"/>

      {/* Points card */}
      <div style={{ background: 'linear-gradient(135deg, #1a1612, #2e2318)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Sabba Points Balance</p>
          <p style={{ fontFamily: font.display, fontSize: 42, color: '#f5a66d' }}>{pts.toLocaleString()}</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>Earn points by completing reviews and bookings</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 48 }}>⭐</span>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Worth £{(pts / 100).toFixed(2)} in credit</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 28 }}>
        {/* Avatar section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
          <Avatar initials={user?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()} src={profile?.profile?.avatar_url} size={64}/>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>{user?.full_name}</p>
            <p style={{ fontSize: 13.5, color: colors.muted, fontWeight: 500 }}>{profile?.profile?.job_title || 'Employee'} · {profile?.profile?.department || '—'}</p>
            <Input style={{ marginTop: 8 }} placeholder="Avatar image URL…" value={form.avatar_url || ''} onChange={set('avatar_url')}/>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <Input label="Full name" value={form.full_name} onChange={set('full_name')}/>
          <Input label="Department" value={form.department} onChange={set('department')} placeholder="e.g. Finance"/>
          <Input label="Job title" value={form.job_title} onChange={set('job_title')} placeholder="e.g. Senior Analyst"/>
          <Input label="Location" value={form.location} onChange={set('location')} placeholder="e.g. London"/>
          <Select label="Salary band" value={form.salary_band} onChange={set('salary_band')}>
            <option value="">Select band…</option>
            {['Band 1','Band 2','Band 3','Band 4','Band 5','Executive'].map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>

        {/* Bank details */}
        <div style={{ paddingTop: 20, borderTop: `1px solid ${colors.border}`, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Bank Details</h3>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16, fontWeight: 500 }}>Used for direct payment option instead of payroll deduction.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Bank name" value={form.bank_name} onChange={set('bank_name')} placeholder="e.g. Barclays"/>
            <Input label="Last 4 digits of account" value={form.bank_account_last4} onChange={set('bank_account_last4')} placeholder="e.g. 4567" maxLength={4}/>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          {saved && <span style={{ fontSize: 13, color: colors.green, fontWeight: 700 }}>✓ Saved!</span>}
        </div>
      </div>

      {/* Points history */}
      {profile?.points_history?.length > 0 && (
        <div className="glass-card" style={{ padding: '22px 24px', marginTop: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Points History</h2>
          {profile.points_history.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < profile.points_history.length-1 ? 12 : 0, marginBottom: i < profile.points_history.length-1 ? 12 : 0, borderBottom: i < profile.points_history.length-1 ? `1px solid ${colors.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>⭐</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{t.reason}</p>
                  <p style={{ fontSize: 11, color: colors.muted }}>{new Date(t.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: t.points > 0 ? colors.green : colors.red }}>
                {t.points > 0 ? '+' : ''}{t.points} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

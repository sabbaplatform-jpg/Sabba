import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, EmptyState, Button } from '../components/UI';
import { colors, font } from '../lib/styles';

export function EmployeeHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get('/packages').then(r => setFeatured(r.data.slice(0,4))).finally(() => setLoading(false));
    api.get('/bookings/mine').then(r => setBookings(r.data));
  }, []);

  const activeBooking = bookings[0];
  const daysUntil = activeBooking?.departure_date
    ? Math.max(0, Math.ceil((new Date(activeBooking.departure_date) - new Date()) / (1000*60*60*24)))
    : null;

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`.pkg-card:hover{border-color:#e06c2a!important;box-shadow:0 4px 20px rgba(224,108,42,0.12)!important}`}</style>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(120deg, #1a1612 0%, #2e2318 60%, #3d2e1a 100%)', borderRadius: 16, padding: '32px 36px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(224,108,42,0.15)' }}/>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(224,108,42,0.08)' }}/>
        <div style={{ zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Your Adventure Awaits</p>
          <h1 style={{ fontFamily: font.display, fontSize: 28, color: '#fff', fontWeight: 400, marginBottom: 8 }}>Good morning, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Explore packages and book your next adventure — paid via payroll.</p>
          <Button onClick={() => navigate('/marketplace')} style={{ background: colors.orange, color: '#fff' }}>Browse the marketplace →</Button>
        </div>
        {daysUntil !== null && (
          <div style={{ background: 'rgba(224,108,42,0.15)', border: '1px solid rgba(224,108,42,0.3)', borderRadius: 12, padding: '16px 24px', textAlign: 'right', zIndex: 1 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Next adventure</p>
            <p style={{ fontFamily: font.display, fontSize: 28, color: '#f5a66d' }}>{daysUntil} days</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{activeBooking.emoji} {activeBooking.package_title}</p>
          </div>
        )}
      </div>

      {/* Categories */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: colors.dark }}>Explore by category</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
          {[
            { icon: '🌍', label: 'Travel', cat: 'travel', color: colors.orange },
            { icon: '🤝', label: 'Volunteering', cat: 'volunteering', color: '#2d7a9a' },
            { icon: '🎓', label: 'Courses', cat: 'courses', color: '#6b5ea8' },
            { icon: '💼', label: 'Jobs Abroad', cat: 'jobs_abroad', color: colors.green },
            { icon: '✈️', label: 'Airlines', cat: 'airlines', color: '#b45309' },
            { icon: '🏠', label: 'Stays', cat: 'accommodation', color: '#7a2d6b' },
          ].map((c, i) => (
            <div key={i} onClick={() => navigate(`/marketplace?category=${c.cat}`)}
              style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 10, padding: '14px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.background = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; }}>
              <span style={{ fontSize: 22 }}>{c.icon}</span>
              <p style={{ fontSize: 12, fontWeight: 600, color: colors.dark, marginTop: 8 }}>{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: colors.dark }}>Featured packages</h2>
        <span onClick={() => navigate('/marketplace')} style={{ fontSize: 12, color: colors.orange, fontWeight: 600, cursor: 'pointer' }}>View all →</span>
      </div>
      {loading ? <Spinner/> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
          {featured.map(pkg => (
            <div key={pkg.id} className="pkg-card" onClick={() => navigate(`/package/${pkg.id}`)}
              style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{pkg.emoji || '🌍'}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: colors.orange, background: colors.orangeLight, borderRadius: 6, padding: '2px 7px' }}>{pkg.category?.replace('_',' ')}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: colors.dark, marginBottom: 2 }}>{pkg.title}</p>
              <p style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>{pkg.vendor_name} · {pkg.destination} · {pkg.duration}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: font.display, fontSize: 20, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</span>
                <span style={{ fontSize: 11, color: colors.muted }}>from £{Math.ceil(pkg.price_gbp/12)}/mo</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MyBooking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/bookings/mine').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Employee Portal</p>
        <h1 style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 400 }}>My Adventure Bookings</h1>
      </div>
      {bookings.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <EmptyState emoji="🌍" title="No bookings yet" subtitle="Browse the marketplace and request your first adventure"/>
          <div style={{ marginTop: 20 }}><Button onClick={() => navigate('/marketplace')}>Explore packages</Button></div>
        </div>
      ) : bookings.map(b => (
        <div key={b.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{b.emoji || '🌍'}</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.dark }}>{b.package_title}</h2>
                <p style={{ fontSize: 13, color: colors.muted }}>{b.vendor_name} · {b.destination}</p>
              </div>
            </div>
            <Badge status={b.status}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Departure', value: b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—' },
              { label: 'Duration', value: b.duration || '—' },
              { label: 'Payroll Spread', value: `${b.payroll_months} months` },
              { label: 'Monthly Amount', value: `£${Number(b.monthly_amount).toLocaleString()}` },
            ].map((item, j) => (
              <div key={j} style={{ background: colors.bg, borderRadius: 8, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: colors.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: colors.dark }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Payroll spread visual */}
          <div style={{ background: colors.bg, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: colors.muted }}>Total package cost</span>
              <span style={{ fontFamily: font.display, fontSize: 20, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[3, 6, 12].map(mo => (
                <div key={mo} style={{ flex: 1, padding: '8px 10px', borderRadius: 7, border: `1px solid ${Number(b.payroll_months) === mo ? colors.orange : colors.border}`, background: Number(b.payroll_months) === mo ? colors.orangeLight : '#fff', textAlign: 'center' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: Number(b.payroll_months) === mo ? colors.orange : colors.mid }}>{mo} months</p>
                  <p style={{ fontSize: 12, color: colors.dark, fontWeight: 600 }}>£{(b.total_amount / mo).toFixed(0)}/mo</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

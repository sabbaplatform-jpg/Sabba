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

  useEffect(() => {
    api.get('/packages').then(r => setFeatured(r.data.slice(0,4))).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(120deg, #1a1612 0%, #2e2318 60%, #3d2e1a 100%)',
        borderRadius: 16, padding: '32px 36px', marginBottom: 32,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(224,108,42,0.15)' }}/>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Your Adventure Awaits</p>
          <h1 style={{ fontFamily: font.display, fontSize: 28, color: '#fff', fontWeight: 400, marginBottom: 8 }}>Good morning, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Explore packages and book your next adventure, paid via payroll.</p>
          <Button onClick={() => navigate('/marketplace')} style={{ background: colors.orange, color: '#fff' }}>Browse the marketplace →</Button>
        </div>
      </div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: colors.dark }}>Featured packages</h2>
        <span onClick={() => navigate('/marketplace')} style={{ fontSize: 12, color: colors.orange, fontWeight: 600, cursor: 'pointer' }}>View all →</span>
      </div>
      {loading ? <Spinner/> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
          {featured.map(pkg => (
            <div key={pkg.id} onClick={() => navigate(`/package/${pkg.id}`)}
              style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = colors.orange; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{pkg.emoji || '🌍'}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: colors.orange, background: colors.orangeLight, borderRadius: 6, padding: '2px 7px' }}>{pkg.category}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: colors.dark, marginBottom: 2 }}>{pkg.title}</p>
              <p style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>{pkg.vendor_name} · {pkg.destination}</p>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
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
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: colors.muted }}>Total package cost</span>
            <span style={{ fontFamily: font.display, fontSize: 22, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

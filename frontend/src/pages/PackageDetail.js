import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button, Spinner, Input, Select } from '../components/UI';
import { colors, font } from '../lib/styles';

export default function PackageDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pkg, setPkg]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({ departure_date: '', payroll_months: 6 });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get(`/packages/${id}`).then(r => setPkg(r.data)).finally(() => setLoading(false));
  }, [id]);

  const monthly = pkg ? (Number(pkg.price_gbp) / booking.payroll_months).toFixed(2) : 0;

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.post('/bookings', { package_id: id, ...booking, payroll_months: Number(booking.payroll_months) });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <Spinner/>;
  if (!pkg) return <div style={{ padding: 40, textAlign: 'center', color: colors.muted }}>Package not found</div>;

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: colors.orange,
        fontWeight: 600, fontSize: 13.5, cursor: 'pointer', marginBottom: 24, fontFamily: font.body }}>← Back</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 16, padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{pkg.emoji || '🌍'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h1 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 400 }}>{pkg.title}</h1>
            {pkg.verified && <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, background: colors.greenLight, borderRadius: 4, padding: '2px 7px' }}>✓ VERIFIED</span>}
          </div>
          <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 24 }}>{pkg.vendor_name} · {pkg.destination} · {pkg.duration}</p>
          {pkg.description && <p style={{ fontSize: 14, color: colors.mid, lineHeight: 1.7, marginBottom: 24 }}>{pkg.description}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[{ label: 'Destination', value: pkg.destination }, { label: 'Duration', value: pkg.duration },
              { label: 'Category', value: pkg.category?.replace('_',' ') }, { label: 'Vendor', value: pkg.vendor_name },
              { label: 'Rating', value: pkg.vendor_rating > 0 ? `★ ${pkg.vendor_rating}` : 'New' },
              { label: 'Price', value: `£${Number(pkg.price_gbp).toLocaleString()}` }
            ].map((item, i) => (
              <div key={i} style={{ background: colors.bg, borderRadius: 8, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: colors.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: colors.dark }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          {success ? (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontFamily: font.display, fontSize: 22, color: colors.dark, marginBottom: 8 }}>Booking submitted!</h2>
              <p style={{ color: colors.muted, fontSize: 13.5, marginBottom: 24 }}>Your HR team will review and approve your adventure request.</p>
              <Button onClick={() => navigate('/my-booking')}>View my booking</Button>
            </div>
          ) : (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>Book this adventure</h2>
              <p style={{ fontSize: 12, color: colors.muted, marginBottom: 22 }}>Cost spread via your employer payroll</p>
              {user?.role !== 'employee' ? (
                <p style={{ color: colors.muted, fontSize: 13.5 }}>Only employees can book packages.</p>
              ) : (
                <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Input label="Departure date" type="date" required value={booking.departure_date}
                    onChange={e => setBooking(b => ({ ...b, departure_date: e.target.value }))}/>
                  <Select label="Payroll spread" value={booking.payroll_months}
                    onChange={e => setBooking(b => ({ ...b, payroll_months: e.target.value }))}>
                    <option value={3}>3 months</option>
                    <option value={6}>6 months</option>
                    <option value={12}>12 months</option>
                  </Select>
                  <div style={{ background: colors.bg, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: colors.muted }}>Total</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${colors.border}` }}>
                      <span style={{ fontSize: 13, color: colors.muted }}>Monthly via payroll</span>
                      <span style={{ fontFamily: font.display, fontSize: 20, color: colors.orange }}>£{monthly}</span>
                    </div>
                  </div>
                  {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
                  <Button type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
                    {submitting ? 'Submitting…' : 'Request booking'}
                  </Button>
                  <p style={{ fontSize: 11.5, color: colors.faint, textAlign: 'center', lineHeight: 1.5 }}>
                    Your request goes to HR for approval before it is confirmed.
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

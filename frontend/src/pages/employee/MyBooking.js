import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Spinner, EmptyState, Button, Modal, StarRating, SkeletonRow } from '../../components/UI';
import { colors, font, gradients } from '../../lib/styles';

const MILESTONES = [
  { key: 'pending',   label: 'Requested',   icon: '📋', desc: 'Awaiting HR review'    },
  { key: 'approved',  label: 'Approved',     icon: '✅', desc: 'HR has approved'       },
  { key: 'confirmed', label: 'Confirmed',    icon: '🎟️', desc: 'Booking confirmed'     },
  { key: 'active',    label: 'On Adventure', icon: '🌍', desc: 'You\'re on your way!'  },
];

function getRoadmapStep(status) {
  const map = { pending: 0, approved: 1, confirmed: 2, active: 3 };
  return map[status] ?? 0;
}

function Roadmap({ status }) {
  const current = getRoadmapStep(status);
  return (
    <div style={{ padding: '20px 0 4px' }}>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 16 }}>Adventure Roadmap</p>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {MILESTONES.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flex: i < MILESTONES.length - 1 ? 1 : 'none' }}>
            {/* Step */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: i < current ? colors.green : i === current ? colors.orange : '#eee',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: i <= current ? 20 : 16,
                boxShadow: i === current ? `0 0 0 4px ${colors.orangeLight}` : 'none',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>
                {i < current ? <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>✓</span> : <span>{m.icon}</span>}
              </div>
              <p style={{ fontSize: 12, fontWeight: i === current ? 700 : 500, color: i <= current ? colors.dark : colors.faint, marginTop: 8, textAlign: 'center', lineHeight: 1.3 }}>{m.label}</p>
              <p style={{ fontSize: 10.5, color: colors.faint, textAlign: 'center', marginTop: 2 }}>{m.desc}</p>
            </div>
            {/* Connector */}
            {i < MILESTONES.length - 1 && (
              <div style={{ flex: 1, height: 3, marginTop: 20, background: i < current ? colors.green : '#eee', borderRadius: 2, transition: 'background 0.4s', margin: '20px 8px 0' }}/>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyBooking() {
  const navigate = useNavigate();
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [ratingModal, setRatingModal] = useState(null);
  const [rating, setRating]         = useState(5);
  const [review, setReview]         = useState('');
  const [savingRating, setSavingRating] = useState(false);
  const [ratedIds, setRatedIds]     = useState(new Set());
  const [filter,    setFilter]      = useState('upcoming');

  useEffect(() => {
    api.get('/bookings/mine').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const submitRating = async () => {
    setSavingRating(true);
    try {
      await api.post('/ratings', { package_id: ratingModal.package_id, booking_id: ratingModal.id, rating, review });
      setRatedIds(s => new Set([...s, ratingModal.id]));
      setRatingModal(null); setRating(5); setReview('');
    } catch {}
    setSavingRating(false);
  };

  if (loading) return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ height: 36, background: '#f0ede9', borderRadius: 8, width: 260 }}/>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 40px' }}>
        {[1,2,3,4].map(i => <SkeletonRow key={i}/>)}
      </div>
    </div>
  );

  // Tab definitions — Upcoming = future departure confirmed/approved, Pending = awaiting HR
  const today = new Date();
  const upcoming = bookings.filter(b =>
    ['approved','confirmed','vendor_confirmed'].includes(b.status) &&
    (!b.departure_date || new Date(b.departure_date) >= today)
  );
  const pendingTab = bookings.filter(b => b.status === 'pending');
  const pastTab    = bookings.filter(b =>
    b.status === 'cancelled' ||
    (['approved','confirmed','vendor_confirmed'].includes(b.status) && b.departure_date && new Date(b.departure_date) < today)
  );

  const TABS = [
    { id: 'upcoming', label: 'Upcoming',  icon: '🌍', bookings: upcoming },
    { id: 'pending',  label: 'Pending',   icon: '⏳', bookings: pendingTab },
    { id: 'past',     label: 'Past',      icon: '📖', bookings: pastTab },
    { id: 'all',      label: 'All',       icon: '📋', bookings: bookings },
  ];

  const activeTab   = TABS.find(t => t.id === filter) || TABS[0];
  const tabBookings = activeTab.bookings;

  const BookingCard = ({ b }) => {
    const gradient = gradients[b.category] || gradients.default;
    const daysUntil = b.departure_date
      ? Math.ceil((new Date(b.departure_date) - new Date()) / (1000*60*60*24))
      : null;
    const isPast   = b.status === 'cancelled';
    const hasHappened = b.departure_date
      ? new Date(b.departure_date) < new Date()
      : false;
    const canRate  = ['approved','confirmed'].includes(b.status) && hasHappened && !ratedIds.has(b.id);

    return (
      <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
        {/* Image header */}
        <div style={{ height: 200, background: gradient, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Emoji large */}
          <span style={{ fontSize: 72, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}>{b.emoji || '🌍'}</span>

          {/* Status badge top-right */}
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <Badge status={b.status}/>
          </div>

          {/* Countdown top-left */}
          {daysUntil !== null && daysUntil > 0 && !isPast && (
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
              <p style={{ fontFamily: font.display, fontSize: 24, color: '#fff', fontWeight: 700, lineHeight: 1 }}>{daysUntil}</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>days to go</p>
            </div>
          )}

          {/* Bottom overlay — package name */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding: '32px 24px 20px' }}>
            <h2 style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: '#fff', marginBottom: 4 }}>{b.package_title}</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{b.vendor_name} · {b.destination}</p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {/* Roadmap */}
          {!isPast && <Roadmap status={b.status}/>}

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 24 }}>
            {[
              { label: 'Departure',      value: b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—' },
              { label: 'Duration',       value: b.duration || '—' },
              { label: 'Payroll Spread', value: `${b.payroll_months} months` },
              { label: 'Monthly Amount', value: `£${Number(b.monthly_amount).toFixed(2)}` },
            ].map((item, j) => (
              <div key={j} style={{ background: '#F7F5F2', borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ fontSize: 10, color: colors.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{item.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Payroll spread visual */}
          <div style={{ marginTop: 16, background: '#F7F5F2', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: colors.muted, fontWeight: 500 }}>Total package cost</span>
            <span style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 700 }}>£{Number(b.total_amount).toLocaleString()}</span>
          </div>

          {/* Vendor notes */}
          {b.vendor_notes && (
            <div style={{ marginTop: 16, background: colors.orangeLight, border: `1px solid ${colors.orangePale}`, borderRadius: 12, padding: '14px 18px' }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.orange, marginBottom: 5 }}>📩 Message from your vendor</p>
              <p style={{ fontSize: 13.5, color: colors.dark, lineHeight: 1.6 }}>{b.vendor_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {canRate && (
              <Button small variant="ghost" onClick={() => setRatingModal(b)}>Rate this adventure ★</Button>
            )}
            {ratedIds.has(b.id) && (
              <span style={{ fontSize: 13, color: colors.green, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>✓ Rated · +50 Sabba Points</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '32px 40px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Employee Portal</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>My Adventure Bookings</h1>
            <Button onClick={() => navigate('/marketplace')} small>+ Book another</Button>
          </div>

          {/* Tabs */}
          {bookings.length > 0 && (
            <div style={{ display: 'flex', gap: 0, marginTop: 24, borderBottom: '2px solid #eee' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setFilter(t.id)}
                  style={{ padding: '10px 22px', background: 'none', border: 'none', borderBottom: `2px solid ${filter === t.id ? colors.orange : 'transparent'}`, marginBottom: -2, color: filter === t.id ? colors.orange : colors.muted, fontSize: 13.5, fontWeight: filter === t.id ? 700 : 500, cursor: 'pointer', fontFamily: font.body, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {t.bookings.length > 0 && (
                    <span style={{ background: filter === t.id ? colors.orange : '#eee', color: filter === t.id ? '#fff' : colors.muted, borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>
                      {t.bookings.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 40px 0' }}>
        {bookings.length === 0 ? (
          <div className="card" style={{ padding: 52, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✈️</div>
            <h2 style={{ fontFamily: font.display, fontSize: 24, fontStyle: 'italic', color: colors.dark, fontWeight: 700, marginBottom: 8 }}>No adventures yet</h2>
            <p style={{ fontSize: 14, color: colors.muted, marginBottom: 24, lineHeight: 1.6 }}>Browse the marketplace and request your first adventure — your employer covers the cost via payroll.</p>
            <Button onClick={() => navigate('/marketplace')}>Explore packages →</Button>
          </div>
        ) : tabBookings.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>{activeTab.icon}</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: colors.dark, marginBottom: 8 }}>No {activeTab.label.toLowerCase()} bookings</p>
            <p style={{ fontSize: 13.5, color: colors.muted }}>{
              activeTab.id === 'upcoming' ? 'Your approved adventures will appear here.' :
              activeTab.id === 'pending'  ? 'No bookings awaiting HR approval.' :
              activeTab.id === 'past'     ? 'Completed and cancelled bookings will appear here.' :
              'No bookings found.'
            }</p>
          </div>
        ) : (
          <div>
            {tabBookings.map(b => <BookingCard key={b.id} b={b}/>)}
          </div>
        )}
      </div>

      {/* Rating modal */}
      {ratingModal && (
        <Modal title={`Rate — ${ratingModal.package_title}`} onClose={() => setRatingModal(null)} width={440}>
          <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20, lineHeight: 1.6 }}>
            Share your experience with {ratingModal.package_title}. You'll earn <strong style={{ color: colors.orange }}>50 Sabba Points ⭐</strong> for leaving a review.
          </p>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your rating</p>
            <StarRating rating={rating} onChange={setRating} size={32}/>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Review (optional)</label>
            <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Tell others about your experience…"
              style={{ border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, width: '100%', resize: 'vertical', minHeight: 90, fontWeight: 500 }}/>
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

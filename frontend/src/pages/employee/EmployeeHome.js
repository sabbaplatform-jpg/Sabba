import { useState, useEffect } from 'react';
import { OnboardingQuiz, TRAVEL_TYPES } from './OnboardingQuiz';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useFlags } from '../../context/FeatureFlagContext';
import { useCart } from '../../context/CartContext';
import { PackageCard, Button, Spinner, SkeletonCard } from '../../components/UI';
import { colors, font, gradients } from '../../lib/styles';

// ── Add to Cart Popup (same as Marketplace) ───────────────────
function AddToCartPopup({ pkg, onClose, onConfirm }) {
  const [departureDate, setDepartureDate] = useState('');
  const [payrollMonths, setPayrollMonths] = useState(6);
  const [error,         setError]         = useState('');
  const [adding,        setAdding]        = useState(false);
  const base = new Date(); base.setDate(base.getDate() + 14);
  const pkgStart = pkg.start_date ? new Date(String(pkg.start_date).split('T')[0]) : null;
  const minDate = pkgStart && pkgStart > base ? pkgStart : base;
  const minStr  = minDate.toISOString().split('T')[0];
  const pkgEndRaw = pkg.end_date ? String(pkg.end_date).split('T')[0] : null;
  const isOpenEnded = !pkgEndRaw || pkgEndRaw >= '2099-01-01';
  const maxStr = isOpenEnded ? undefined : pkgEndRaw;
  const handleConfirm = () => {
    if (!departureDate) { setError('Please select a departure date'); return; }
    if (departureDate < minStr) { setError('That date is before this package is available'); return; }
    if (maxStr && departureDate > maxStr) { setError('That date is after this package closes'); return; }
    setAdding(true);
    onConfirm({ departure_date: departureDate, payroll_months: payrollMonths });
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', fontFamily: font.body }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Add to cart</p>
            <p style={{ fontFamily: font.display, fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: colors.dark }}>{pkg.title}</p>
            <p style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{pkg.destination} · {pkg.duration}</p>
          </div>
          <button onClick={onClose} style={{ background: '#F7F5F2', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: colors.muted, flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Departure date <span style={{ color: colors.orange }}>*</span></label>
          <input type="date" value={departureDate} min={minStr} max={maxStr} onChange={e => { setDepartureDate(e.target.value); setError(''); }}
            style={{ width: '100%', border: `1.5px solid ${error ? colors.red : '#eee'}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
          <p style={{ fontSize: 11, color: colors.faint, marginTop: 5 }}>
            {isOpenEnded
              ? 'Available year-round — pick any date at least 14 days out.'
              : `Available until ${new Date(maxStr).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}.`}
          </p>
          {error && <p style={{ fontSize: 12, color: colors.red, marginTop: 4, fontWeight: 600 }}>{error}</p>}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>Pay via payroll over</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[3, 6, 12].map(mo => (
              <div key={mo} onClick={() => setPayrollMonths(mo)} style={{ flex: 1, padding: '10px 8px', border: `2px solid ${payrollMonths === mo ? colors.orange : '#eee'}`, borderRadius: 10, background: payrollMonths === mo ? colors.orangeLight : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: payrollMonths === mo ? colors.orange : colors.mid }}>{mo} months</p>
                <p style={{ fontSize: 12, color: payrollMonths === mo ? colors.dark : colors.muted, marginTop: 2 }}>£{Math.round(pkg.price_gbp / mo)}/mo</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#F7F5F2', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><p style={{ fontSize: 12, color: colors.muted }}>Total cost</p><p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</p></div>
          <div style={{ textAlign: 'right' }}><p style={{ fontSize: 12, color: colors.muted }}>Monthly payment</p><p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: colors.orange }}>£{(pkg.price_gbp / payrollMonths).toFixed(2)}</p></div>
        </div>
        <button onClick={handleConfirm} disabled={adding}
          style={{ width: '100%', background: adding ? colors.green : colors.dark, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: adding ? 'default' : 'pointer', fontFamily: font.body, transition: 'background 0.2s' }}>
          {adding ? '✓ Adding to cart…' : '🛒 Add to cart'}
        </button>
      </div>
    </div>
  );
}

// ── Employee Home ─────────────────────────────────────────────
export function EmployeeHome() {
  const { user }      = useAuth();
  const { addToCart } = useCart();
  const navigate      = useNavigate();
  const [packages,  setPkgs]      = useState([]);
  const [curated,   setCurated]   = useState([]);
  const [trending,  setTrend]     = useState([]);
  const [quiz,      setQuiz]      = useState(null);
  const [showQuiz,  setShowQuiz]  = useState(false);
  const [bookings,  setBookings]  = useState([]);
  const [allowance, setAllowance] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [cartPopup, setCartPopup] = useState(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Silent expiry check — sends notifications if any booked packages are expiring soon
    api.get('/packages/expiry-check').catch(() => {});

    Promise.all([
      api.get('/packages'),
      api.get('/quiz').catch(() => ({ data: null })),
      api.get('/bookings/mine').catch(() => ({ data: [] })),
      api.get('/allowance').catch(() => ({ data: null })),
    ]).then(([pkgs, q, bkgs, alw]) => {
      const all = pkgs.data;
      setPkgs(all);
      setTrend([...all].sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0)).slice(0, 4));
      setQuiz(q.data);
      setBookings(bkgs.data);

      // Calculate 2026 allowance remaining dynamically
      if (alw.data) {
        const payrollBookings = bkgs.data.filter(b =>
          ['approved','confirmed','vendor_confirmed'].includes(b.status) &&
          (b.payment_method || 'payroll') === 'payroll' &&
          new Date(b.created_at).getFullYear() === currentYear
        );
        const used = payrollBookings.reduce((s, b) => s + Number(b.total_amount || 0), 0);
        const total = Number(alw.data.total_allowance_gbp || 0);
        const remaining = Math.max(0, total - used);
        setAllowance({ ...alw.data, used, remaining, total });
      }

      const dismissed = sessionStorage.getItem('quiz_dismissed');
      if (!q.data?.completed && !dismissed) setShowQuiz(true);
      if (q.data?.completed && q.data?.adventure_types?.length) {
        const matched = all.filter(p => q.data.adventure_types.includes(p.category));
        setCurated(matched.length ? matched.slice(0, 4) : all.slice(0, 4));
      } else {
        setCurated(all.slice(0, 4));
      }
    }).finally(() => setLoading(false));
  }, []);

  const onQuizComplete = async (answers) => {
    setShowQuiz(false);
    sessionStorage.setItem('quiz_dismissed', '1');
    if (!answers) return;
    setQuiz({ ...answers, completed: true });
    const { data } = await api.get('/packages');
    // Use travel_type categories if available, fall back to adventure_types
    const cats = answers.categories || answers.adventure_types || [];
    const matched = data.filter(p => cats.includes(p.category));
    setCurated(matched.length ? matched.slice(0, 4) : data.slice(0, 4));
  };

  // Add to cart requires date popup
  const handleAddToCart = (pkg) => setCartPopup(pkg);
  const confirmAddToCart = async ({ departure_date, payroll_months }) => {
    if (cartPopup) {
      await addToCart(cartPopup.id, { departure_date, payroll_months });
      setCartPopup(null);
    }
  };

  const now = new Date();
  // Upcoming (for the hero countdown): approved/confirmed, departure still in future
  const activeBooking = bookings.find(b =>
    ['approved','confirmed','vendor_confirmed'].includes(b.status) &&
    (!b.departure_date || new Date(b.departure_date) >= now)
  );
  const daysUntil = activeBooking?.departure_date
    ? Math.max(0, Math.ceil((new Date(activeBooking.departure_date) - now) / (1000 * 60 * 60 * 24)))
    : null;

  // Trip currently in progress (employee tapped "I've departed")
  const tripInProgress = bookings.find(b => b.status === 'active');
  // Confirmed trip whose departure date has arrived but not yet started
  const tripReadyToStart = bookings.find(b =>
    ['approved','confirmed','vendor_confirmed'].includes(b.status) &&
    b.departure_date && new Date(b.departure_date) <= now
  );
  const currentTrip = tripInProgress || tripReadyToStart;

  const [tripBusy, setTripBusy] = useState(false);
  const handleStartTrip = async (id) => {
    setTripBusy(true);
    try {
      await api.patch(`/bookings/${id}/start`);
      setBookings(bs => bs.map(b => b.id === id ? { ...b, status: 'active' } : b));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not start trip.');
    } finally { setTripBusy(false); }
  };
  const handleCompleteTrip = async (id) => {
    if (!window.confirm('Mark this trip as complete? This confirms your adventure has finished.')) return;
    setTripBusy(true);
    try {
      await api.patch(`/bookings/${id}/complete`);
      setBookings(bs => bs.map(b => b.id === id ? { ...b, status: 'completed' } : b));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not complete trip.');
    } finally { setTripBusy(false); }
  };

  const cats = [
    { icon: '🌍', label: 'Travel',     cat: 'travel',        grad: gradients.travel },
    { icon: '🤝', label: 'Volunteer',  cat: 'volunteering',  grad: gradients.volunteering },
    { icon: '🎓', label: 'Courses',    cat: 'courses',       grad: gradients.courses },
    { icon: '💼', label: 'Work Abroad',cat: 'jobs_abroad',   grad: gradients.jobs_abroad },
    { icon: '✈️', label: 'Airlines',   cat: 'airlines',      grad: gradients.airlines },
    { icon: '🏠', label: 'Stays',      cat: 'accommodation', grad: gradients.accommodation },
  ];

  if (loading) return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ height: 16, background: '#f0ede9', borderRadius: 6, width: 180, marginBottom: 10 }}/>
        <div style={{ height: 36, background: '#f0ede9', borderRadius: 8, width: 320 }}/>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {[1,2,3].map(i => <SkeletonCard key={i} height={180}/>)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 52 }}>
      {showQuiz && <OnboardingQuiz onComplete={onQuizComplete}/>}
      {cartPopup && <AddToCartPopup pkg={cartPopup} onClose={() => setCartPopup(null)} onConfirm={confirmAddToCart}/>}

      {/* Hero */}
      <div style={{ background: '#1C1916', padding: '56px 40px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -100, top: -100, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.1)' }}/>
        <div style={{ position: 'absolute', right: 40, bottom: -60, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.07)' }}/>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ zIndex: 1, maxWidth: 600 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Welcome back, {user?.full_name?.split(' ')[0]}</p>
            <h1 style={{ fontFamily: font.display, fontSize: 40, color: '#fff', fontWeight: 700, fontStyle: 'italic', lineHeight: 1.2, marginBottom: 14 }}>
              Your platform for <span style={{ color: '#f5a066' }}>discovery,</span> rejuvenation &amp; growth.
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.7 }}>
              Explore packages paid via your employer payroll — a benefit funded by your company.
            </p>
            {allowance && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.orangeLight, border: `1px solid ${colors.orangePale}`, borderRadius: 20, padding: '7px 16px', marginBottom: 24 }}>
                <span style={{ fontSize: 14 }}>💳</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.orange }}>
                  {currentYear} allowance remaining: <strong>£{Number(allowance.remaining).toLocaleString()}</strong>
                  {allowance.total > 0 && <span style={{ color: 'rgba(212,98,42,0.6)' }}> of £{Number(allowance.total).toLocaleString()}</span>}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={() => navigate('/marketplace')} style={{ padding: '12px 24px', fontSize: 14 }}>Browse marketplace</Button>
              {!quiz?.completed && (
                <Button variant="ghost" onClick={() => setShowQuiz(true)} style={{ color: 'rgba(255,255,255,0.75)', borderColor: 'rgba(255,255,255,0.2)', padding: '12px 24px', fontSize: 14 }}>
                  Take adventure quiz ✦
                </Button>
              )}
            </div>
          </div>
          {daysUntil !== null && (
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px 36px', textAlign: 'center', zIndex: 1 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Next adventure</p>
              <p style={{ fontFamily: font.display, fontSize: 56, color: '#f5a066', fontWeight: 700, lineHeight: 1 }}>{daysUntil}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>days away</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>{activeBooking.emoji} {activeBooking.package_title}</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px 0' }}>

        {/* Current trip — image-driven banner */}
        {currentTrip && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', minHeight: 260, background: gradients[currentTrip.category] || gradients.default, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
              {/* Large emoji watermark */}
              <span style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', fontSize: 200, opacity: 0.18, filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))', lineHeight: 1 }}>
                {currentTrip.emoji || '🌍'}
              </span>
              {/* Dark gradient for text legibility */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 45%, transparent 75%)' }}/>

              <div style={{ position: 'relative', padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260 }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '6px 14px', marginBottom: 16 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: tripInProgress ? '#34d399' : '#f5a066', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }}/>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {tripInProgress ? 'On your adventure' : 'Departure day is here'}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: font.display, fontSize: 34, fontWeight: 700, fontStyle: 'italic', color: '#fff', marginBottom: 6, textShadow: '0 2px 12px rgba(0,0,0,0.3)', maxWidth: 560 }}>
                    {currentTrip.package_title}
                  </h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
                    {currentTrip.vendor_name}{currentTrip.destination ? ' · ' + currentTrip.destination : ''}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, flexWrap: 'wrap' }}>
                  {tripInProgress ? (
                    <>
                      <button onClick={() => handleCompleteTrip(currentTrip.id)} disabled={tripBusy}
                        style={{ background: '#fff', color: colors.dark, border: 'none', borderRadius: 12, padding: '13px 24px', fontSize: 14, fontWeight: 700, cursor: tripBusy ? 'default' : 'pointer', fontFamily: font.body, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                        {tripBusy ? 'Completing…' : 'Mark trip complete ✓'}
                      </button>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>Enjoy every moment — mark it complete when you're back.</span>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleStartTrip(currentTrip.id)} disabled={tripBusy}
                        style={{ background: '#fff', color: colors.dark, border: 'none', borderRadius: 12, padding: '13px 24px', fontSize: 14, fontWeight: 700, cursor: tripBusy ? 'default' : 'pointer', fontFamily: font.body, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                        {tripBusy ? 'Starting…' : "I've departed →"}
                      </button>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>Let us know once you've set off.</span>
                    </>
                  )}
                  <button onClick={() => navigate('/my-booking')}
                    style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '13px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                    View booking
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Categories */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div><p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Explore</p><h2 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Browse by category</h2></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {cats.map((c, i) => (
              <div key={i} onClick={() => navigate(`/marketplace?category=${c.cat}`)} style={{ cursor: 'pointer', borderRadius: 14, overflow: 'hidden', border: '1px solid #eee', transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ height: 72, background: c.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{c.icon}</div>
                <div style={{ background: '#fff', padding: '9px 12px' }}><p style={{ fontSize: 12, fontWeight: 700, color: colors.dark, textAlign: 'center' }}>{c.label}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* Curated packages */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{quiz?.completed ? '✦ Curated for you' : 'Packages of the month'}</p>
              <h2 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>{quiz?.completed ? 'Based on your adventure profile' : 'Hand-picked this month'}</h2>
            </div>
            <span onClick={() => navigate('/marketplace')} style={{ fontSize: 13, color: colors.orange, fontWeight: 700, cursor: 'pointer' }}>See all →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {curated.map(pkg => <PackageCard key={pkg.id} pkg={pkg} onAddToCart={() => handleAddToCart(pkg)} onClick={() => navigate(`/package/${pkg.id}`)}/>)}
          </div>
        </section>

        {/* Trending */}
        {trending.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div><p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>🔥 Hot right now</p><h2 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Trending packages</h2></div>
              <span onClick={() => navigate('/marketplace')} style={{ fontSize: 13, color: colors.orange, fontWeight: 700, cursor: 'pointer' }}>See more →</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {trending.map(pkg => <PackageCard key={pkg.id} pkg={pkg} onAddToCart={() => handleAddToCart(pkg)} onClick={() => navigate(`/package/${pkg.id}`)}/>)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

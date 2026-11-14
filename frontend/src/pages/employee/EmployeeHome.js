import { useState, useEffect } from 'react';
import { OnboardingQuiz, TRAVEL_TYPES } from './OnboardingQuiz';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useFlags } from '../../context/FeatureFlagContext';
import { useCart } from '../../context/CartContext';
import { PackageCard, Button, Spinner, SkeletonCard } from '../../components/UI';
import { colors, font, gradients } from '../../lib/styles';

// ── Animated hero scene — ocean-blue mountains, beacon, plane, tent ──────────
// Pure inline SVG (SMIL animation, no JS). Respects prefers-reduced-motion via
// the global stylesheet (.hero-scene animations are disabled there).
function HeroScene() {
  return (
    <svg viewBox="0 0 480 420" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', display: 'block', borderRadius: 18, filter: 'drop-shadow(0 20px 48px rgba(0,0,0,0.4))' }}>
      <defs>
        <radialGradient id="hsSky" cx="50%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#20344A"/>
          <stop offset="100%" stopColor="#141E2C"/>
        </radialGradient>
        <linearGradient id="hsMtnFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1663A0"/>
          <stop offset="100%" stopColor="#0E4C7E"/>
        </linearGradient>
        <linearGradient id="hsMtnPeak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0E6BA8"/>
          <stop offset="100%" stopColor="#15517E"/>
        </linearGradient>
        <linearGradient id="hsMtnMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#28496A"/>
          <stop offset="100%" stopColor="#17293D"/>
        </linearGradient>
        <radialGradient id="hsBeacon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8FCDEF"/>
          <stop offset="100%" stopColor="#8FCDEF" stopOpacity="0"/>
        </radialGradient>
      </defs>

      <rect width="480" height="420" fill="url(#hsSky)" rx="20"/>

      {/* Stars */}
      <g fill="#CFE4F5">
        <circle cx="70" cy="60" r="1.2"><animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite"/></circle>
        <circle cx="140" cy="40" r="1"><animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle>
        <circle cx="250" cy="55" r="1.3"><animate attributeName="opacity" values="0.3;1;0.3" dur="3.2s" begin="1s" repeatCount="indefinite"/></circle>
        <circle cx="120" cy="90" r="0.9"><animate attributeName="opacity" values="0.3;1;0.3" dur="2.8s" begin="1.4s" repeatCount="indefinite"/></circle>
        <circle cx="300" cy="35" r="1"><animate attributeName="opacity" values="0.3;1;0.3" dur="2.6s" begin="0.8s" repeatCount="indefinite"/></circle>
      </g>

      {/* Beacon moon */}
      <circle cx="358" cy="96" r="46" fill="url(#hsBeacon)" opacity="0.55">
        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="358" cy="96" r="22" fill="#CFE8FA"/>
      <circle cx="358" cy="96" r="22" fill="#9FD0F0" opacity="0.5"/>

      {/* Clouds */}
      <g opacity="0.22" fill="#CFE4F5">
        <g><animateTransform attributeName="transform" type="translate" values="0,0;14,0;0,0" dur="9s" repeatCount="indefinite"/>
          <ellipse cx="90" cy="120" rx="34" ry="12"/>
          <ellipse cx="110" cy="113" rx="24" ry="11"/>
        </g>
        <g><animateTransform attributeName="transform" type="translate" values="0,0;-10,0;0,0" dur="12s" repeatCount="indefinite"/>
          <ellipse cx="240" cy="95" rx="28" ry="10"/>
          <ellipse cx="258" cy="89" rx="20" ry="9"/>
        </g>
      </g>

      {/* Back ridges */}
      <polygon points="0,310 90,170 190,310" fill="#223B56" opacity="0.55"/>
      <polygon points="110,310 220,150 330,310" fill="#1E3550" opacity="0.5"/>

      {/* Main mountains */}
      <polygon points="20,372 160,182 300,372" fill="url(#hsMtnFront)"/>
      <polygon points="140,202 160,182 180,202 165,212 155,212" fill="#EAF4FC" opacity="0.92"/>
      <polygon points="200,372 330,196 460,372" fill="url(#hsMtnPeak)"/>
      <polygon points="312,216 330,196 348,216 335,226 325,226" fill="#EAF4FC" opacity="0.92"/>
      <polygon points="0,372 100,252 220,372" fill="url(#hsMtnMid)" opacity="0.95"/>

      {/* Ground */}
      <rect x="0" y="358" width="480" height="62" fill="#122032"/>
      <ellipse cx="240" cy="358" rx="260" ry="16" fill="#152838"/>

      {/* Winding path */}
      <path d="M 80 372 Q 120 342 150 312 Q 180 282 202 262" stroke="#2E8BC0" strokeWidth="2.5" fill="none" strokeDasharray="6 4" opacity="0.8">
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.5s" repeatCount="indefinite"/>
      </path>

      {/* Pine trees */}
      <g fill="#0E2438">
        <polygon points="30,372 42,344 54,372"/>
        <polygon points="36,358 42,338 48,358"/>
        <polygon points="55,372 65,348 75,372"/>
        <polygon points="408,372 420,344 432,372"/>
        <polygon points="414,358 420,338 426,358"/>
      </g>

      {/* Tent at mountain base */}
      <g transform="translate(96,352)">
        <polygon points="0,16 18,-14 22,16" fill="#15517E"/>
        <polygon points="18,16 36,-14 20,-14 2,16" fill="#0E6BA8"/>
        <polygon points="18,16 24,-6 12,16" fill="#0A3A5E"/>
        <line x1="18" y1="-14" x2="18" y2="-18" stroke="#2E8BC0" strokeWidth="1.5"/>
        <ellipse cx="18" cy="17" rx="22" ry="3" fill="#000" opacity="0.25"/>
      </g>

      {/* Plane crossing the sky */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="-70,70; 520,34" dur="14s" repeatCount="indefinite"/>
        <g transform="rotate(-8)">
          <ellipse cx="0" cy="0" rx="15" ry="3.4" fill="#EAF4FC"/>
          <path d="M13,-2.6 Q20,0 13,2.6 Z" fill="#CFE8FA"/>
          <polygon points="-1,-2 -9,-11 -4,-1" fill="#B8D8EF"/>
          <polygon points="-1,2 -9,11 -4,1" fill="#9FC9E8"/>
          <polygon points="-13,-1.5 -17,-7 -12,-0.6" fill="#B8D8EF"/>
          <circle cx="2" cy="0" r="0.8" fill="#2E8BC0"/>
          <circle cx="5" cy="0" r="0.8" fill="#2E8BC0"/>
          <circle cx="-1" cy="0" r="0.8" fill="#2E8BC0"/>
        </g>
        <path d="M-16,1 L-46,4" stroke="#EAF4FC" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
        <path d="M-16,1 L-38,2.5" stroke="#EAF4FC" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
      </g>

      {/* Floating beacon pins */}
      <g transform="translate(135,244)">
        <animateTransform attributeName="transform" type="translate" values="135,244;135,238;135,244" dur="3.5s" repeatCount="indefinite"/>
        <circle r="12" fill="#0E6BA8"/>
        <circle r="5" fill="#fff"/>
        <polygon points="0,12 -5,5 5,5" fill="#0E6BA8"/>
      </g>
      <g transform="translate(286,176)">
        <animateTransform attributeName="transform" type="translate" values="286,176;286,170;286,176" dur="4.2s" begin="0.8s" repeatCount="indefinite"/>
        <circle r="10" fill="#2E8BC0"/>
        <circle r="4" fill="#fff"/>
        <polygon points="0,10 -4,4 4,4" fill="#2E8BC0"/>
      </g>

      {/* Glass badges */}
      <g transform="translate(16, 150)">
        <animateTransform attributeName="transform" type="translate" values="16,150;16,144;16,150" dur="5s" begin="0.5s" repeatCount="indefinite"/>
        <rect width="150" height="34" rx="17" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.22)"/>
        <text x="16" y="22" fontSize="12" fill="#CFE8FA" fontFamily="Inter,sans-serif" fontWeight="700">💳 Paid via payroll</text>
      </g>
      <g transform="translate(286, 316)">
        <animateTransform attributeName="transform" type="translate" values="286,316;286,310;286,316" dur="4.5s" begin="1.2s" repeatCount="indefinite"/>
        <rect width="162" height="34" rx="17" fill="rgba(14,107,168,0.28)" stroke="rgba(143,205,239,0.35)"/>
        <text x="16" y="22" fontSize="12" fill="#EAF4FC" fontFamily="Inter,sans-serif" fontWeight="700">✦ Your next adventure</text>
      </g>
    </svg>
  );
}

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
      api.get('/packages', { params: user?.id ? { employee_id: user.id } : {} }),
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
      // If the API personalised the list, the top rows are the best matches —
      // surface those (flagged with `recommended`) as the curated set.
      const recommended = all.filter(p => p.recommended);
      if (recommended.length) {
        setCurated(recommended.slice(0, 4));
      } else if (q.data?.completed && q.data?.adventure_types?.length) {
        const matched = all.filter(p => q.data.adventure_types.includes(p.category));
        setCurated(matched.length ? matched.slice(0, 4) : all.slice(0, 4));
      } else {
        setCurated(all.slice(0, 4));
      }
    }).finally(() => setLoading(false));
    // Re-run when the authenticated user loads so employee_id is sent for
    // AI ranking. Without `user` here the effect fires once at mount while
    // user is still null — Chrome happened to win the auth race, Safari did
    // not, so personalised results never appeared in Safari.
  }, [user]);

  const onQuizComplete = async (answers) => {
    setShowQuiz(false);
    sessionStorage.setItem('quiz_dismissed', '1');
    if (!answers) return;
    setQuiz({ ...answers, completed: true });
    const { data } = await api.get('/packages', { params: user?.id ? { employee_id: user.id } : {} });
    const recommended = data.filter(p => p.recommended);
    if (recommended.length) { setCurated(recommended.slice(0, 4)); return; }
    // Use travel_type categories if available, fall back to adventure_types
    const cats = answers.categories || answers.adventure_types || [];
    const matched = data.filter(p => cats.includes(p.category));
    setCurated(matched.length ? matched.slice(0, 4) : data.slice(0, 4));
  };

  // Add to cart requires date popup
  const handleAddToCart = (pkg) => {
    if (pkg.date_type === 'fixed') { navigate(`/package/${pkg.id}`); return; }
    setCartPopup(pkg);
  };
  const confirmAddToCart = async ({ departure_date, payroll_months, slot_id }) => {
    const isoDate = departure_date ? new Date(departure_date).toISOString().split('T')[0] : undefined;
    if (cartPopup) {
      await addToCart(cartPopup.id, { departure_date: isoDate, payroll_months, slot_id });
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
        <div style={{ position: 'absolute', right: -80, top: -120, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,107,168,0.20) 0%, transparent 68%)', pointerEvents: 'none' }}/>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40 }}>
          <div style={{ zIndex: 1, maxWidth: 600 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Welcome back, {user?.full_name?.split(' ')[0]}</p>
            <h1 style={{ fontFamily: font.display, fontSize: 40, color: '#fff', fontWeight: 700, fontStyle: 'italic', lineHeight: 1.2, marginBottom: 14 }}>
              Your platform for <span style={{ color: '#2E8BC0' }}>discovery,</span> rejuvenation &amp; growth.
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.7 }}>
              Explore packages paid via your employer payroll — a benefit funded by your company.
            </p>
            {allowance && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.orangeLight, border: `1px solid ${colors.orangePale}`, borderRadius: 20, padding: '7px 16px', marginBottom: 24 }}>
                <span style={{ fontSize: 14 }}>💳</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.orange }}>
                  {currentYear} allowance remaining: <strong>£{Number(allowance.remaining).toLocaleString()}</strong>
                  {allowance.total > 0 && <span style={{ color: 'rgba(14,107,168,0.6)' }}> of £{Number(allowance.total).toLocaleString()}</span>}
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
          {/* Animated adventure scene — ocean-blue mountains, plane, tent, beacon */}
          <div style={{ position: 'relative', width: 440, flexShrink: 0, zIndex: 1 }} className="hero-scene" aria-hidden="true">
            <HeroScene/>
            {daysUntil !== null && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(16,30,46,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', border: '1px solid rgba(143,205,239,0.25)', borderRadius: 20, padding: '24px 32px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Next adventure</p>
                <p style={{ fontFamily: font.display, fontSize: 56, color: '#8FCDEF', fontWeight: 700, lineHeight: 1 }}>{daysUntil}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>days away</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{activeBooking.emoji} {activeBooking.package_title}</p>
              </div>
            )}
          </div>
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
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: tripInProgress ? '#34d399' : '#2E8BC0', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }}/>
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

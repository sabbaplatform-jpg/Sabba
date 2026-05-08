import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button, Spinner, Badge } from '../../components/UI';
import { colors, font } from '../../lib/styles';

// ── Onboarding Quiz ──────────────────────────────────────────
const QUIZ_STEPS = [
  {
    id: 'adventure_types',
    question: "What kind of adventures excite you most?",
    subtitle: "Select all that apply",
    multi: true,
    options: [
      { value: 'travel',       label: 'Travel & Exploration', emoji: '🌍' },
      { value: 'volunteering', label: 'Volunteering',         emoji: '🤝' },
      { value: 'courses',      label: 'Learning & Courses',   emoji: '🎓' },
      { value: 'jobs_abroad',  label: 'Work Abroad',          emoji: '💼' },
      { value: 'wellness',     label: 'Wellness & Retreat',   emoji: '🧘' },
      { value: 'culture',      label: 'Culture & Arts',       emoji: '🎭' },
    ],
  },
  {
    id: 'duration_preference',
    question: "How long is your ideal adventure?",
    subtitle: "Choose one",
    multi: false,
    options: [
      { value: 'short',   label: '1–2 weeks',   emoji: '⚡' },
      { value: 'medium',  label: '3–4 weeks',   emoji: '🗓️' },
      { value: 'long',    label: '1–3 months',  emoji: '📅' },
      { value: 'extended',label: '3+ months',   emoji: '🌟' },
    ],
  },
  {
    id: 'budget_preference',
    question: "What's your budget comfort zone?",
    subtitle: "Via payroll spread",
    multi: false,
    options: [
      { value: 'budget',   label: 'Under £1,500',  emoji: '💚' },
      { value: 'mid',      label: '£1,500–£3,000', emoji: '💛' },
      { value: 'premium',  label: '£3,000–£5,000', emoji: '🧡' },
      { value: 'luxury',   label: '£5,000+',       emoji: '💜' },
    ],
  },
];

export function OnboardingQuiz({ onComplete }) {
  const [step, setStep]           = useState(0);
  const [answers, setAnswers]     = useState({ adventure_types: [], duration_preference: '', budget_preference: '', interests: [] });
  const [saving, setSaving]       = useState(false);

  const current = QUIZ_STEPS[step];

  const toggle = (value) => {
    if (current.multi) {
      setAnswers(a => ({
        ...a,
        [current.id]: a[current.id].includes(value) ? a[current.id].filter(v => v !== value) : [...a[current.id], value],
      }));
    } else {
      setAnswers(a => ({ ...a, [current.id]: value }));
    }
  };

  const isSelected = (value) => {
    const val = answers[current.id];
    return Array.isArray(val) ? val.includes(value) : val === value;
  };

  const canNext = current.multi ? answers[current.id]?.length > 0 : !!answers[current.id];

  const next = async () => {
    if (step < QUIZ_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      setSaving(true);
      await api.post('/quiz', answers);
      setSaving(false);
      onComplete(answers);
    }
  };

  const progress = ((step + 1) / QUIZ_STEPS.length) * 100;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px', width: '100%', maxWidth: 560, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        {/* Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step {step + 1} of {QUIZ_STEPS.length}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.orange }}>+25 pts on completion ⭐</span>
          </div>
          <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${colors.orange}, #f5a66d)`, borderRadius: 2, transition: 'width 0.3s ease' }}/>
          </div>
        </div>

        <h2 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 400, marginBottom: 6 }}>{current.question}</h2>
        <p style={{ fontSize: 14, color: colors.muted, marginBottom: 24, fontWeight: 500 }}>{current.subtitle}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
          {current.options.map(opt => (
            <div key={opt.value} className={`quiz-option ${isSelected(opt.value) ? 'selected' : ''}`}
              onClick={() => toggle(opt.value)}
              style={{ padding: '14px 16px', border: `2px solid ${isSelected(opt.value) ? colors.orange : 'rgba(0,0,0,0.1)'}`, borderRadius: 12, background: isSelected(opt.value) ? colors.orangeLight : '#fff', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <span style={{ fontSize: 22 }}>{opt.emoji}</span>
              <span style={{ fontSize: 13.5, fontWeight: isSelected(opt.value) ? 700 : 500, color: isSelected(opt.value) ? colors.orange : colors.dark }}>{opt.label}</span>
              {isSelected(opt.value) && <span style={{ marginLeft: 'auto', color: colors.orange, fontSize: 16 }}>✓</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {step > 0 && <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>}
          <Button onClick={next} disabled={!canNext || saving}>
            {saving ? 'Saving…' : step < QUIZ_STEPS.length - 1 ? 'Next →' : 'Find my adventures 🚀'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Package Card (image-led) ─────────────────────────────────
export function PackageCard({ pkg, onAddToCart, showBadge }) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded]   = useState(false);

  const handleAdd = async (e) => {
    e.stopPropagation();
    setAdding(true);
    await onAddToCart(pkg.id);
    setAdding(false); setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Placeholder gradient images based on category
  const gradients = {
    travel:       'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    volunteering: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    courses:      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    jobs_abroad:  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    accommodation:'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    airlines:     'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  };

  const gradient = gradients[pkg.category] || gradients.travel;

  return (
    <div className="pkg-card card" onClick={() => navigate(`/package/${pkg.id}`)}
      style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: 16 }}>
      {/* Image area */}
      <div style={{ height: 180, background: gradient, position: 'relative', overflow: 'hidden' }}>
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 52, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>{pkg.emoji || '🌍'}</span>
          </div>
        )}
        {/* Overlay badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '4px 8px', backdropFilter: 'blur(8px)' }}>
            {pkg.category?.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          {showBadge && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: colors.orange, borderRadius: 6, padding: '4px 8px' }}>🔥 TRENDING</span>}
        </div>
        {pkg.verified && (
          <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(26,122,74,0.8)', borderRadius: 6, padding: '3px 8px', backdropFilter: 'blur(8px)' }}>✓ VERIFIED</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px 18px' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 3, lineHeight: 1.3 }}>{pkg.title}</p>
        <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 12, fontWeight: 500 }}>
          {pkg.vendor_name} · {pkg.destination} · {pkg.duration}
        </p>
        {pkg.vendor_rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <span style={{ color: '#f59e0b', fontSize: 13 }}>★</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.dark }}>{pkg.vendor_rating}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: font.display, fontSize: 22, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</span>
            <p style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>from £{Math.ceil(pkg.price_gbp/12)}/mo via payroll</p>
          </div>
          <button onClick={handleAdd} style={{
            background: added ? colors.greenLight : colors.orange, color: added ? colors.green : '#fff',
            border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 12.5, fontWeight: 700,
            cursor: adding ? 'not-allowed' : 'pointer', fontFamily: font.body, transition: 'all 0.2s',
            opacity: adding ? 0.7 : 1,
          }}>
            {added ? '✓ Added' : adding ? '…' : '+ Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Employee Home ────────────────────────────────────────────
export function EmployeeHome() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [packages, setPackages]     = useState([]);
  const [trending, setTrending]     = useState([]);
  const [curated, setCurated]       = useState([]);
  const [quiz, setQuiz]             = useState(null);
  const [showQuiz, setShowQuiz]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [bookings, setBookings]     = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/packages'),
      api.get('/quiz').catch(() => ({ data: null })),
      api.get('/bookings/mine').catch(() => ({ data: [] })),
    ]).then(([pkgs, q, bkgs]) => {
      const all = pkgs.data;
      setPackages(all);
      setTrending([...all].sort((a,b) => (b.trending_score||0) - (a.trending_score||0)).slice(0,4));
      setQuiz(q.data);
      setBookings(bkgs.data);

      // Show quiz if not completed
      if (!q.data?.completed) setShowQuiz(true);

      // Curated — match quiz if done, else random
      if (q.data?.completed && q.data?.adventure_types?.length) {
        const matched = all.filter(p => q.data.adventure_types.includes(p.category));
        setCurated(matched.length ? matched.slice(0,4) : all.slice(0,4));
      } else {
        setCurated(all.slice(0,4));
      }
    }).finally(() => setLoading(false));
  }, []);

  const onQuizComplete = async (answers) => {
    setShowQuiz(false);
    setQuiz({ ...answers, completed: true });
    // Refresh packages with curated results
    const { data } = await api.get('/packages');
    const matched = data.filter(p => answers.adventure_types.includes(p.category));
    setCurated(matched.length ? matched.slice(0,4) : data.slice(0,4));
  };

  const activeBooking = bookings.find(b => ['approved','confirmed'].includes(b.status));
  const daysUntil = activeBooking?.departure_date
    ? Math.max(0, Math.ceil((new Date(activeBooking.departure_date) - new Date()) / (1000*60*60*24)))
    : null;

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: '#fff', minHeight: '100vh' }}>
      {showQuiz && <OnboardingQuiz onComplete={onQuizComplete}/>}

      {/* Hero */}
      <div style={{ background: 'linear-gradient(120deg, #1a1612 0%, #2e2318 50%, #3d2e1a 100%)', padding: '60px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -100, top: -100, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(224,108,42,0.1)' }}/>
        <div style={{ position: 'absolute', right: -40, bottom: -40, width: 250, height: 250, borderRadius: '50%', border: '1px solid rgba(224,108,42,0.07)' }}/>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ zIndex: 1, maxWidth: 580 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Welcome, {user?.full_name?.split(' ')[0]}</p>
            <h1 style={{ fontFamily: font.display, fontSize: 38, color: '#fff', fontWeight: 400, lineHeight: 1.2, marginBottom: 16 }}>
              Sabba is your platform for exploring incredible opportunities for discovery, rejuvenation and growth.
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginBottom: 28, lineHeight: 1.6, fontWeight: 400 }}>
              Explore packages that align with your adventure type.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={() => navigate('/marketplace')} style={{ background: colors.orange, color: '#fff', padding: '12px 24px', fontSize: 14 }}>
                Browse all packages →
              </Button>
              {!quiz?.completed && (
                <Button variant="ghost" onClick={() => setShowQuiz(true)} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', padding: '12px 24px', fontSize: 14 }}>
                  Take adventure quiz ✨
                </Button>
              )}
            </div>
          </div>
          {daysUntil !== null && (
            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '24px 32px', textAlign: 'center', zIndex: 1, backdropFilter: 'blur(10px)' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Next adventure</p>
              <p style={{ fontFamily: font.display, fontSize: 48, color: '#f5a66d', lineHeight: 1 }}>{daysUntil}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 600 }}>days away</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{activeBooking.emoji} {activeBooking.package_title}</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 40px' }}>

        {/* Curated packages */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>
                {quiz?.completed ? '✨ Curated for you' : 'Packages of the month'}
              </p>
              <h2 style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 400 }}>
                {quiz?.completed ? 'Based on your adventure profile' : 'Hand-picked this month'}
              </h2>
            </div>
            <span onClick={() => navigate('/marketplace')} style={{ fontSize: 13, color: colors.orange, fontWeight: 700, cursor: 'pointer' }}>View all →</span>
          </div>
          {curated.length === 0 ? (
            <p style={{ color: colors.muted, fontSize: 14 }}>No packages available yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 20 }}>
              {curated.map(pkg => <PackageCard key={pkg.id} pkg={pkg} onAddToCart={addToCart}/>)}
            </div>
          )}
        </section>

        {/* Trending */}
        {trending.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>🔥 Hot right now</p>
                <h2 style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 400 }}>Trending packages</h2>
              </div>
              <span onClick={() => navigate('/marketplace')} style={{ fontSize: 13, color: colors.orange, fontWeight: 700, cursor: 'pointer' }}>See more →</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 20 }}>
              {trending.map(pkg => <PackageCard key={pkg.id} pkg={pkg} onAddToCart={addToCart} showBadge/>)}
            </div>
          </section>
        )}

        {/* Categories */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>Explore</p>
          <h2 style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 400, marginBottom: 20 }}>Browse by category</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {[
              { icon: '🌍', label: 'Travel',      cat: 'travel',        gradient: 'linear-gradient(135deg,#667eea,#764ba2)' },
              { icon: '🤝', label: 'Volunteering', cat: 'volunteering', gradient: 'linear-gradient(135deg,#11998e,#38ef7d)' },
              { icon: '🎓', label: 'Courses',      cat: 'courses',      gradient: 'linear-gradient(135deg,#f093fb,#f5576c)' },
              { icon: '💼', label: 'Jobs Abroad',  cat: 'jobs_abroad',  gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
              { icon: '✈️', label: 'Airlines',     cat: 'airlines',     gradient: 'linear-gradient(135deg,#fa709a,#fee140)' },
              { icon: '🏠', label: 'Stays',        cat: 'accommodation',gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
            ].map((c, i) => (
              <div key={i} onClick={() => navigate(`/marketplace?category=${c.cat}`)}
                style={{ borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
                <div style={{ height: 80, background: c.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 28 }}>{c.icon}</span>
                </div>
                <div style={{ padding: '10px 12px', background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderTop: 'none', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: colors.dark }}>{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

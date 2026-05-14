import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { PackageCard, Button, Spinner } from '../../components/UI';
import { colors, font, gradients } from '../../lib/styles';

// ── Onboarding Quiz ─────────────────────────────────────────
const QUIZ_STEPS = [
  {
    id: 'adventure_types', question: 'What excites you most?', subtitle: 'Select all that apply', multi: true,
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
    id: 'duration_preference', question: 'Ideal adventure length?', subtitle: 'Choose one', multi: false,
    options: [
      { value: 'short',    label: '1–2 weeks',  emoji: '⚡' },
      { value: 'medium',   label: '3–4 weeks',  emoji: '🗓️' },
      { value: 'long',     label: '1–3 months', emoji: '📅' },
      { value: 'extended', label: '3+ months',  emoji: '🌟' },
    ],
  },
  {
    id: 'budget_preference', question: 'Budget comfort zone?', subtitle: 'Via payroll spread', multi: false,
    options: [
      { value: 'budget',  label: 'Under £1,500',  emoji: '💚' },
      { value: 'mid',     label: '£1,500–£3,000', emoji: '💛' },
      { value: 'premium', label: '£3,000–£5,000', emoji: '🧡' },
      { value: 'luxury',  label: '£5,000+',       emoji: '💜' },
    ],
  },
];

export function OnboardingQuiz({ onComplete }) {
  const [step, setStep]   = useState(0);
  const [answers, setAnswers] = useState({ adventure_types: [], duration_preference: '', budget_preference: '', interests: [] });
  const [saving, setSaving]   = useState(false);
  const current = QUIZ_STEPS[step];

  const toggle = (value) => {
    if (current.multi) {
      setAnswers(a => ({ ...a, [current.id]: a[current.id].includes(value) ? a[current.id].filter(v => v !== value) : [...a[current.id], value] }));
    } else {
      setAnswers(a => ({ ...a, [current.id]: value }));
    }
  };

  const isSelected = (value) => {
    const val = answers[current.id];
    return Array.isArray(val) ? val.includes(value) : val === value;
  };

  const canNext = current.multi ? answers[current.id]?.length > 0 : !!answers[current.id];
  const progress = ((step + 1) / QUIZ_STEPS.length) * 100;

  const next = async () => {
    if (step < QUIZ_STEPS.length - 1) { setStep(s => s + 1); return; }
    setSaving(true);
    await api.post('/quiz', answers);
    setSaving(false);
    onComplete(answers);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 40, width: '100%', maxWidth: 540, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', position: 'relative' }}>
        {/* Dismiss button */}
        <button onClick={() => { sessionStorage.setItem('quiz_dismissed','1'); onComplete(null); }} style={{ position: 'absolute', top: 16, right: 16, background: '#F7F5F2', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#aaa' }}>✕</button>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step {step + 1} of {QUIZ_STEPS.length}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.orange }}>+25 Sabba Points ⭐</span>
          </div>
          <div style={{ height: 4, background: '#eee', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${colors.orange}, #f5a066)`, borderRadius: 2, transition: 'width 0.3s ease' }}/>
          </div>
        </div>
        <h2 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 4 }}>{current.question}</h2>
        <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 22, fontWeight: 500 }}>{current.subtitle}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
          {current.options.map(opt => (
            <div key={opt.value} className={`quiz-opt ${isSelected(opt.value) ? 'sel' : ''}`}
              onClick={() => toggle(opt.value)}
              style={{ padding: '14px 16px', border: `2px solid ${isSelected(opt.value) ? colors.orange : '#eee'}`, borderRadius: 12, background: isSelected(opt.value) ? colors.orangeLight : '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{opt.emoji}</span>
              <span style={{ fontSize: 13.5, fontWeight: isSelected(opt.value) ? 700 : 500, color: isSelected(opt.value) ? colors.orange : colors.dark }}>{opt.label}</span>
              {isSelected(opt.value) && <span style={{ marginLeft: 'auto', color: colors.orange }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {step > 0 && <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>}
          <Button onClick={next} disabled={!canNext || saving}>{saving ? 'Saving…' : step < QUIZ_STEPS.length - 1 ? 'Next →' : 'Find my adventures 🚀'}</Button>
        </div>
      </div>
    </div>
  );
}

// ── Employee Home ────────────────────────────────────────────
export function EmployeeHome() {
  const { user }         = useAuth();
  const { addToCart }    = useCart();
  const navigate         = useNavigate();
  const [packages, setPkgs]   = useState([]);
  const [trending, setTrend]  = useState([]);
  const [curated, setCurated] = useState([]);
  const [quiz, setQuiz]       = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [allowance, setAllowance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      setAllowance(alw.data);
      // Only show quiz if not completed AND not already dismissed this session
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
    if (!answers) return; // dismissed without completing
    setQuiz({ ...answers, completed: true });
    const { data } = await api.get('/packages');
    const matched = data.filter(p => answers.adventure_types.includes(p.category));
    setCurated(matched.length ? matched.slice(0, 4) : data.slice(0, 4));
  };

  const activeBooking = bookings.find(b => ['approved', 'confirmed'].includes(b.status));
  const daysUntil = activeBooking?.departure_date
    ? Math.max(0, Math.ceil((new Date(activeBooking.departure_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const cats = [
    { icon: '🌍', label: 'Travel',      cat: 'travel',        grad: gradients.travel },
    { icon: '🤝', label: 'Volunteer',    cat: 'volunteering',  grad: gradients.volunteering },
    { icon: '🎓', label: 'Courses',      cat: 'courses',       grad: gradients.courses },
    { icon: '💼', label: 'Work Abroad',  cat: 'jobs_abroad',   grad: gradients.jobs_abroad },
    { icon: '✈️', label: 'Airlines',     cat: 'airlines',      grad: gradients.airlines },
    { icon: '🏠', label: 'Stays',        cat: 'accommodation', grad: gradients.accommodation },
  ];

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 52 }}>
      {showQuiz && <OnboardingQuiz onComplete={onQuizComplete}/>}

      {/* HERO */}
      <div style={{ background: '#1C1916', padding: '56px 40px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -100, top: -100, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.1)' }}/>
        <div style={{ position: 'absolute', right: 40, bottom: -60, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.07)' }}/>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ zIndex: 1, maxWidth: 600 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Welcome back, {user?.full_name?.split(' ')[0]}</p>
            <h1 style={{ fontFamily: font.display, fontSize: 40, color: '#fff', fontWeight: 700, fontStyle: 'italic', lineHeight: 1.2, marginBottom: 14 }}>
              Your platform for <span style={{ color: '#f5a066' }}>discovery,</span> rejuvenation &amp; growth.
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.7, fontWeight: 400 }}>
              Explore packages that align with your adventure type — paid via your employer payroll.
            </p>
            {allowance && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.orangeLight, border: `1px solid ${colors.orangePale}`, borderRadius: 20, padding: '7px 16px', marginBottom: 24 }}>
                <span style={{ fontSize: 14 }}>💳</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.orange }}>
                  {new Date().getFullYear()} allowance remaining: <strong>£{Number(allowance.remaining).toLocaleString()}</strong>
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

          {/* Adventure countdown */}
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

        {/* Categories */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Explore</p>
              <h2 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Browse by category</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {cats.map((c, i) => (
              <div key={i} className="cat-card" onClick={() => navigate(`/marketplace?category=${c.cat}`)}>
                <div style={{ height: 72, background: c.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{c.icon}</div>
                <div style={{ background: '#fff', border: '1px solid #eee', borderTop: 'none', padding: '9px 12px', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: colors.dark, textAlign: 'center' }}>{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Curated packages */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                {quiz?.completed ? '✦ Curated for you' : 'Packages of the month'}
              </p>
              <h2 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>
                {quiz?.completed ? 'Based on your adventure profile' : 'Hand-picked this month'}
              </h2>
            </div>
            <span onClick={() => navigate('/marketplace')} style={{ fontSize: 13, color: colors.orange, fontWeight: 700, cursor: 'pointer' }}>See all →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {curated.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} onAddToCart={addToCart} onClick={() => navigate(`/package/${pkg.id}`)}/>
            ))}
          </div>
        </section>

        {/* Trending */}
        {trending.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>🔥 Hot right now</p>
                <h2 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Trending packages</h2>
              </div>
              <span onClick={() => navigate('/marketplace')} style={{ fontSize: 13, color: colors.orange, fontWeight: 700, cursor: 'pointer' }}>See more →</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {trending.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} onAddToCart={addToCart} showTrending onClick={() => navigate(`/package/${pkg.id}`)}/>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

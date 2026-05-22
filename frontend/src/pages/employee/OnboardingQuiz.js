import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { colors, font } from '../../lib/styles';

// ── Travel types ─────────────────────────────────────────────
const TRAVEL_TYPES = {
  A: {
    id:    'adventurer',
    label: 'The Adventurer',
    emoji: '🧗',
    tagline: 'You crave challenge, discovery and the thrill of the unknown.',
    desc: 'You come alive when you\'re outside your comfort zone — whether that\'s trekking through remote landscapes, diving into ocean depths, or exploring cities nobody from home has heard of. You measure a great trip by how many times your heart raced.',
    color: '#D4622A', light: '#FAECE7',
    categories: ['travel', 'airlines', 'jobs_abroad'],
    traits: ['Physical challenge', 'Exploration', 'Adrenaline', 'New cultures'],
  },
  B: {
    id:    'creative',
    label: 'The Creative',
    emoji: '🎨',
    tagline: 'You use leave to create, express, and see the world through an artist\'s lens.',
    desc: 'You need time and space to make things. Whether that\'s writing, painting, music, photography or film — your best work happens when you\'re immersed somewhere inspiring. You travel to see differently, not just to see more.',
    color: '#7B3FA0', light: '#F3EAF8',
    categories: ['courses', 'travel', 'accommodation'],
    traits: ['Expression', 'Inspiration', 'Flow state', 'Craft'],
  },
  C: {
    id:    'scholar',
    label: 'The Scholar',
    emoji: '📚',
    tagline: 'You invest your time in learning, growth and expanding your perspective.',
    desc: 'Leave is an investment for you — a chance to gain skills, deepen expertise, or explore a subject you never had time for. You come back from time off with notebooks full of ideas and a sharper sense of what matters.',
    color: '#2B5EA7', light: '#EBF0FA',
    categories: ['courses', 'volunteering', 'jobs_abroad'],
    traits: ['Knowledge', 'Growth', 'Purpose', 'Expertise'],
  },
  D: {
    id:    'healer',
    label: 'The Healer',
    emoji: '🌿',
    tagline: 'You use leave to restore, reconnect, and come back as your best self.',
    desc: 'You know that recovery is productive. Leave means slowing down intentionally — yoga retreats, nature immersion, wellness programmes, or simply extended time in beautiful places with no agenda. You return lighter, clearer and ready for anything.',
    color: '#1D9E75', light: '#EAF3EE',
    categories: ['accommodation', 'volunteering', 'travel'],
    traits: ['Restoration', 'Mindfulness', 'Nature', 'Balance'],
  },
};

// ── 10 questions ──────────────────────────────────────────────
// Each option has a 'type' key (A/B/C/D) for scoring
const QUESTIONS = [
  {
    id: 'q1',
    question: 'What do you intend to explore on Sabba?',
    subtitle: 'Choose one',
    options: [
      { value: 'a', type: 'A', emoji: '🏔️', label: 'Sabbatical leave', sub: 'An extended break to fully disconnect' },
      { value: 'b', type: 'C', emoji: '🌱', label: 'Annual leave', sub: 'Make the most of my yearly holiday' },
      { value: 'c', type: 'B', emoji: '✈️', label: 'A bit of both', sub: 'Depending on what\'s available' },
      { value: 'd', type: 'D', emoji: '🧘', label: 'Not sure yet', sub: 'Still exploring my options' },
    ]
  },
  {
    id: 'q2',
    question: 'When you have free time, what do you enjoy most?',
    subtitle: 'Pick the one that resonates',
    options: [
      { value: 'a', type: 'A', emoji: '🌍', label: 'Exploring new places', sub: 'Adventurous activities and new environments' },
      { value: 'b', type: 'B', emoji: '🎭', label: 'Creative projects', sub: 'Artistic expression and making things' },
      { value: 'c', type: 'C', emoji: '📖', label: 'Learning and reading', sub: 'Intellectual pursuits and growing knowledge' },
      { value: 'd', type: 'D', emoji: '🌿', label: 'Rest and self-care', sub: 'Relaxation, wellbeing and recharging' },
    ]
  },
  {
    id: 'q3',
    question: 'Which activity appeals to you most?',
    subtitle: 'Be honest — this is your dream leave',
    options: [
      { value: 'a', type: 'A', emoji: '🧗', label: 'Hiking, diving or climbing', sub: 'National parks, oceans and mountains' },
      { value: 'b', type: 'B', emoji: '🎸', label: 'Writing, art or music', sub: 'Painting, filmmaking or performance' },
      { value: 'c', type: 'C', emoji: '🎓', label: 'Courses and research', sub: 'Lectures, certifications and deep dives' },
      { value: 'd', type: 'D', emoji: '🏡', label: 'Yoga, spa and nature', sub: 'Meditation, massages and slow living' },
    ]
  },
  {
    id: 'q4',
    question: 'What is your primary goal for your leave?',
    subtitle: 'Choose the one that matters most to you',
    options: [
      { value: 'a', type: 'A', emoji: '🏅', label: 'Challenge and discovery', sub: 'New cultures, physical tests, pushing limits' },
      { value: 'b', type: 'B', emoji: '✨', label: 'Creativity and expression', sub: 'Produce something meaningful and inspiring' },
      { value: 'c', type: 'C', emoji: '🔬', label: 'Learning and skills', sub: 'Deepen expertise or gain new qualifications' },
      { value: 'd', type: 'D', emoji: '💆', label: 'Rest and restoration', sub: 'De-stress, recharge and improve your health' },
    ]
  },
  {
    id: 'q5',
    question: 'Which word best describes your ideal leave?',
    subtitle: 'Go with your gut',
    options: [
      { value: 'a', type: 'A', emoji: '⚡', label: 'Exciting', sub: 'Fast-paced, unpredictable, exhilarating' },
      { value: 'b', type: 'B', emoji: '🌈', label: 'Creative', sub: 'Expressive, inspired, imaginative' },
      { value: 'c', type: 'C', emoji: '🧠', label: 'Enriching', sub: 'Thoughtful, purposeful, educational' },
      { value: 'd', type: 'D', emoji: '🌊', label: 'Relaxing', sub: 'Slow, peaceful, restorative' },
    ]
  },
  {
    id: 'q6',
    question: 'Where would you most love to spend a month?',
    subtitle: 'Imagine it\'s all paid for',
    options: [
      { value: 'a', type: 'A', emoji: '🇳🇵', label: 'Trekking in Nepal', sub: 'High altitude, raw wilderness, local villages' },
      { value: 'b', type: 'B', emoji: '🇮🇹', label: 'Creating in Florence', sub: 'Art schools, Renaissance history, coffee culture' },
      { value: 'c', type: 'C', emoji: '🇯🇵', label: 'Studying in Kyoto', sub: 'Ancient traditions, precision culture, deep learning' },
      { value: 'd', type: 'D', emoji: '🇧🇦', label: 'Retreating in Bali', sub: 'Rice terraces, yoga, temple ceremonies, silence' },
    ]
  },
  {
    id: 'q7',
    question: 'What would you most regret not doing?',
    subtitle: 'Think about your future self looking back',
    options: [
      { value: 'a', type: 'A', emoji: '🌋', label: 'Not taking the leap', sub: 'That trip you\'ve always said "one day" to' },
      { value: 'b', type: 'B', emoji: '🖼️', label: 'Not finishing the work', sub: 'The book, album or project that\'s been waiting' },
      { value: 'c', type: 'C', emoji: '🎯', label: 'Not investing in yourself', sub: 'Skills or knowledge that would change your trajectory' },
      { value: 'd', type: 'D', emoji: '🫀', label: 'Burning out instead of resting', sub: 'Reaching a point of no return without a break' },
    ]
  },
  {
    id: 'q8',
    question: 'Which type of experience would you choose?',
    subtitle: 'All the same price and duration',
    options: [
      { value: 'a', type: 'A', emoji: '🚣', label: 'Multi-country adventure tour', sub: '3 countries, 4 weeks, fully guided expedition' },
      { value: 'b', type: 'B', emoji: '🎬', label: 'Creative residency abroad', sub: '4 weeks at an artist residency in rural Portugal' },
      { value: 'c', type: 'C', emoji: '🏛️', label: 'University summer programme', sub: 'Intensive course at Oxford or MIT extension school' },
      { value: 'd', type: 'D', emoji: '🌅', label: 'Luxury wellness retreat', sub: 'Maldives, private villa, daily yoga and spa' },
    ]
  },
  {
    id: 'q9',
    question: 'How do you prefer to spend your evenings on leave?',
    subtitle: 'The nights matter too',
    options: [
      { value: 'a', type: 'A', emoji: '🔥', label: 'Around a campfire or at a local bar', sub: 'Stories, strangers and spontaneous nights' },
      { value: 'b', type: 'B', emoji: '📝', label: 'Writing, sketching or editing', sub: 'Deep in flow while everyone else sleeps' },
      { value: 'c', type: 'C', emoji: '📺', label: 'Reading or watching documentaries', sub: 'Learning about the place you\'re in' },
      { value: 'd', type: 'D', emoji: '🫖', label: 'Early nights, herbal tea and journaling', sub: 'Sleep is the greatest luxury' },
    ]
  },
  {
    id: 'q10',
    question: 'How do you feel on the last day of a holiday?',
    subtitle: 'Be honest — no right answer',
    options: [
      { value: 'a', type: 'A', emoji: '😤', label: 'Frustrated it\'s over', sub: 'Already planning the next one in your head' },
      { value: 'b', type: 'B', emoji: '😌', label: 'Satisfied with what you made', sub: 'You created something. That\'s the point.' },
      { value: 'c', type: 'C', emoji: '🤔', label: 'Processing everything you learned', sub: 'Too much to think about — in the best way' },
      { value: 'd', type: 'D', emoji: '😊', label: 'Genuinely restored', sub: 'You feel like yourself again, maybe more' },
    ]
  },
];

// ── Scoring ───────────────────────────────────────────────────
function calcTravelType(answers) {
  const scores = { A: 0, B: 0, C: 0, D: 0 };
  QUESTIONS.forEach(q => {
    const picked = answers[q.id];
    if (picked) {
      const opt = q.options.find(o => o.value === picked);
      if (opt) scores[opt.type]++;
    }
  });
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

// ── Result reveal screen ──────────────────────────────────────
function TravelTypeReveal({ typeKey, onContinue }) {
  const [revealed, setRevealed] = useState(false);
  const [animIn, setAnimIn]     = useState(false);
  const type = TRAVEL_TYPES[typeKey];

  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(true), 600);
    const t2 = setTimeout(() => setAnimIn(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1C1916', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
      {/* Particle ring decorations */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 6, height: 6, borderRadius: '50%',
            background: type.color,
            opacity: animIn ? 0.6 : 0,
            transition: `all 1.2s ease ${i * 0.08}s`,
            left: `${50 + 38 * Math.cos((i / 12) * 2 * Math.PI)}%`,
            top:  `${50 + 38 * Math.sin((i / 12) * 2 * Math.PI)}%`,
            transform: animIn ? 'scale(1)' : 'scale(0)',
          }}/>
        ))}
      </div>

      <div style={{ textAlign: 'center', maxWidth: 520, padding: '0 24px', zIndex: 1 }}>
        {/* Points earned */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,160,102,0.15)', border: '1px solid rgba(245,160,102,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 32, opacity: animIn ? 1 : 0, transition: 'opacity 0.6s 0.4s' }}>
          <span style={{ fontSize: 16 }}>⭐</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F5A066' }}>+100 Sabba Points earned!</span>
        </div>

        {/* Big emoji */}
        <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 20, opacity: animIn ? 1 : 0, transition: 'all 0.8s 0.2s', transform: animIn ? 'scale(1)' : 'scale(0.5)' }}>
          {type.emoji}
        </div>

        {/* Label */}
        <div style={{ opacity: animIn ? 1 : 0, transition: 'opacity 0.6s 0.5s', marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: type.color, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>Your travel type</p>
          <h1 style={{ fontFamily: font.display, fontSize: 52, color: '#fff', fontWeight: 700, fontStyle: 'italic', lineHeight: 1.1, marginBottom: 16 }}>{type.label}</h1>
        </div>

        {/* Tagline */}
        <div style={{ opacity: animIn ? 1 : 0, transition: 'opacity 0.6s 0.7s', marginBottom: 24 }}>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontStyle: 'italic' }}>{type.tagline}</p>
        </div>

        {/* Description */}
        <div style={{ opacity: animIn ? 1 : 0, transition: 'opacity 0.6s 0.9s', marginBottom: 28 }}>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>{type.desc}</p>
        </div>

        {/* Traits */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36, opacity: animIn ? 1 : 0, transition: 'opacity 0.6s 1.0s' }}>
          {type.traits.map(trait => (
            <span key={trait} style={{ background: `${type.color}22`, border: `1px solid ${type.color}44`, color: type.color, borderRadius: 20, padding: '5px 14px', fontSize: 12.5, fontWeight: 700 }}>
              {trait}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div style={{ opacity: animIn ? 1 : 0, transition: 'opacity 0.6s 1.2s' }}>
          <button onClick={onContinue} style={{ background: type.color, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 40px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, boxShadow: `0 8px 28px ${type.color}55`, transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            See my personalised packages →
          </button>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 14 }}>Your recommendations are curated based on your travel type</p>
        </div>
      </div>
    </div>
  );
}

// ── Main quiz component ───────────────────────────────────────
export function OnboardingQuiz({ onComplete }) {
  const [step,       setStep]       = useState(0);
  const [answers,    setAnswers]     = useState({});
  const [saving,     setSaving]      = useState(false);
  const [showResult, setShowResult]  = useState(false);
  const [travelType, setTravelType]  = useState(null);
  const [animDir,    setAnimDir]     = useState(1); // 1=forward, -1=back

  const current  = QUESTIONS[step];
  const total    = QUESTIONS.length;
  const selected = answers[current.id];
  const canNext  = !!selected;
  const pct      = ((step) / total) * 100;

  const pick = (value) => {
    setAnswers(a => ({ ...a, [current.id]: value }));
  };

  const goNext = async () => {
    if (step < total - 1) {
      setAnimDir(1);
      setStep(s => s + 1);
      return;
    }
    // Last question — calculate type and save
    setSaving(true);
    const allAnswers = { ...answers };
    const typeKey = calcTravelType(allAnswers);
    setTravelType(typeKey);
    const typeData = TRAVEL_TYPES[typeKey];
    try {
      await api.post('/quiz', {
        adventure_types:    typeData.categories,
        duration_preference: 'medium',
        budget_preference:   'mid',
        travel_type:         typeKey,
        travel_type_label:   typeData.id,
        answers:             allAnswers,
        completed:           true,
      });
      // Award 100 points
      await api.post('/quiz/points').catch(() => {});
    } catch {}
    setSaving(false);
    setShowResult(true);
  };

  const goBack = () => {
    setAnimDir(-1);
    setStep(s => Math.max(0, s - 1));
  };

  const handleRevealContinue = () => {
    setShowResult(false);
    onComplete({ travel_type: travelType, categories: TRAVEL_TYPES[travelType].categories, completed: true });
  };

  if (showResult && travelType) {
    return <TravelTypeReveal typeKey={travelType} onContinue={handleRevealContinue}/>;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,22,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 580, boxShadow: '0 32px 100px rgba(0,0,0,0.3)', overflow: 'hidden', position: 'relative' }}>

        {/* Close */}
        <button onClick={() => { sessionStorage.setItem('quiz_dismissed','1'); onComplete(null); }}
          style={{ position: 'absolute', top: 16, right: 16, background: '#F7F5F2', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 15, color: '#aaa', zIndex: 10 }}>✕</button>

        {/* Progress header */}
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Question {step + 1} of {total}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>⭐</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.orange }}>+100 points on completion</span>
            </div>
          </div>
          {/* Segmented progress */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 24 }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? colors.orange : '#eee', transition: 'background 0.3s' }}/>
            ))}
          </div>
        </div>

        {/* Question */}
        <div style={{ padding: '0 28px 28px' }}>
          <h2 style={{ fontFamily: font.display, fontSize: 26, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 6, lineHeight: 1.2 }}>{current.question}</h2>
          <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 22 }}>{current.subtitle}</p>

          {/* Options — 2 column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {current.options.map(opt => {
              const isSel = selected === opt.value;
              return (
                <div key={opt.value} onClick={() => pick(opt.value)}
                  style={{ padding: '14px 16px', border: `2px solid ${isSel ? colors.orange : '#eee'}`, borderRadius: 14, cursor: 'pointer', background: isSel ? colors.orangeLight : '#fff', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'all 0.15s', position: 'relative' }}>
                  {/* Selection indicator */}
                  <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isSel ? colors.orange : '#ddd'}`, background: isSel ? colors.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {isSel && <span style={{ fontSize: 10, color: '#fff', fontWeight: 800 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{opt.emoji}</span>
                  <div style={{ paddingRight: 20 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: isSel ? colors.orange : colors.dark, marginBottom: 3 }}>{opt.label}</p>
                    <p style={{ fontSize: 11.5, color: isSel ? colors.orange : colors.muted, lineHeight: 1.4 }}>{opt.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={goBack} disabled={step === 0}
              style={{ background: 'none', border: '1.5px solid #eee', borderRadius: 12, padding: '11px 22px', fontSize: 13.5, color: step === 0 ? '#ccc' : colors.mid, cursor: step === 0 ? 'default' : 'pointer', fontFamily: font.body, fontWeight: 600, transition: 'all 0.15s' }}>
              ← Back
            </button>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {QUESTIONS.map((_, i) => (
                <div key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3, background: i < step ? colors.orange : i === step ? colors.dark : '#eee', transition: 'all 0.3s' }}/>
              ))}
            </div>

            <button onClick={goNext} disabled={!canNext || saving}
              style={{ background: canNext ? colors.dark : '#eee', color: canNext ? '#fff' : '#aaa', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: canNext ? 'pointer' : 'default', fontFamily: font.body, transition: 'all 0.15s' }}>
              {saving ? 'Saving…' : step === total - 1 ? 'Reveal my type ✨' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TRAVEL_TYPES };

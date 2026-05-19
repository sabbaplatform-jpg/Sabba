import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { colors, font } from '../lib/styles';

const STEPS = [
  {
    id: 'business_type',
    title: 'What type of business are you?',
    subtitle: 'This helps us match you with the right employers and employees on the platform.',
    type: 'single',
    options: [
      { value: 'travel_agency',       label: '✈️ Travel Agency',          desc: 'Flights, tours, holidays and travel packages' },
      { value: 'accommodation',       label: '🏨 Accommodation Provider',  desc: 'Hotels, villas, hostels, unique stays' },
      { value: 'volunteering',        label: '🤝 Volunteering Organisation',desc: 'Conservation, community, NGO projects' },
      { value: 'education',           label: '🎓 Education Provider',       desc: 'Courses, bootcamps, professional learning' },
      { value: 'wellness',            label: '🧘 Wellness & Retreat',       desc: 'Yoga, meditation, spa and wellbeing retreats' },
      { value: 'adventure',           label: '🧗 Adventure & Activities',   desc: 'Extreme sports, outdoor experiences, expeditions' },
      { value: 'airline',             label: '✈️ Airline / Aviation',       desc: 'Flights, upgrades, travel credits' },
      { value: 'other',               label: '🌍 Other',                    desc: 'Something else — tell us below' },
    ]
  },
  {
    id: 'categories',
    title: 'Which Sabba categories do your packages fit?',
    subtitle: 'Select all that apply. This determines where your packages appear in the marketplace.',
    type: 'multi',
    options: [
      { value: 'travel',         label: '🌍 Travel' },
      { value: 'volunteering',   label: '🤝 Volunteering' },
      { value: 'courses',        label: '🎓 Courses' },
      { value: 'jobs_abroad',    label: '💼 Work Abroad' },
      { value: 'accommodation',  label: '🏠 Accommodation' },
      { value: 'airlines',       label: '✈️ Airlines' },
    ]
  },
  {
    id: 'about',
    title: 'Tell us about your business',
    subtitle: 'This appears on your vendor profile and is seen by HR admins when they review your account. Make it compelling — this is your pitch.',
    type: 'textarea',
    placeholder: 'Describe who you are, what makes your packages special, and why employees should choose you for their next adventure. Minimum 80 characters.',
    minLength: 80,
    required: true,
  },
  {
    id: 'standout',
    title: 'How will you stand out on Sabba?',
    subtitle: 'HR admins review every vendor before approving them. These are the things that matter most.',
    type: 'checklist',
    options: [
      { value: 'verified_safety',  label: '✅ We meet all safety and insurance standards' },
      { value: 'group_rates',      label: '💷 We can offer corporate/group pricing' },
      { value: 'flexible_dates',   label: '📅 We offer flexible departure dates' },
      { value: 'curated',          label: '⭐ Our packages are curated and unique — not available on generic booking sites' },
      { value: 'sustainability',   label: '🌱 We have a sustainability or responsible travel policy' },
      { value: 'support',          label: '📞 We provide dedicated booking support for corporate clients' },
    ]
  },
  {
    id: 'website',
    title: 'Almost done — a few final details',
    subtitle: 'These help HR admins verify your business before approving your account.',
    type: 'fields',
    fields: [
      { id: 'website',   label: 'Website URL', placeholder: 'https://yourcompany.com', required: false },
      { id: 'company_name', label: 'Company trading name', placeholder: 'e.g. Intrepid Travel Ltd', required: true },
      { id: 'contact_name', label: 'Main contact name', placeholder: 'e.g. Sarah Johnson', required: true },
      { id: 'contact_phone', label: 'Contact phone number', placeholder: '+44 20 7123 4567', required: false },
    ]
  },
];

export default function VendorOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step,     setStep]    = useState(0);
  const [answers,  setAnswers] = useState({});
  const [error,    setError]   = useState('');
  const [saving,   setSaving]  = useState(false);
  const [done,     setDone]    = useState(false);

  const current = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;

  const setAnswer = (key, val) => {
    setAnswers(a => ({ ...a, [key]: val }));
    setError('');
  };

  const toggleMulti = (key, val) => {
    const current = answers[key] || [];
    const next = current.includes(val) ? current.filter(x => x !== val) : [...current, val];
    setAnswer(key, next);
  };

  const validate = () => {
    if (current.type === 'single' && !answers[current.id]) {
      setError('Please select an option to continue'); return false;
    }
    if (current.type === 'multi' && (!answers[current.id] || answers[current.id].length === 0)) {
      setError('Please select at least one category'); return false;
    }
    if (current.type === 'textarea') {
      const val = answers[current.id] || '';
      if (!val.trim()) { setError('This field is required'); return false; }
      if (current.minLength && val.length < current.minLength) {
        setError(`Please write at least ${current.minLength} characters (currently ${val.length})`); return false;
      }
    }
    if (current.type === 'fields') {
      for (const field of current.fields) {
        if (field.required && !answers[field.id]?.trim()) {
          setError(`${field.label} is required`); return false;
        }
      }
    }
    return true;
  };

  const next = async () => {
    if (!validate()) return;
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      // Submit
      setSaving(true);
      try {
        await api.post('/vendors/onboarding', { ...answers });
        setDone(true);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to submit. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  if (done) return <PendingState/>;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F7F5F2', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 600 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontSize: 32, fontWeight: 700, fontStyle: 'italic', color: '#1C1916', fontFamily: 'Georgia, serif' }}>Sabba</p>
          <p style={{ fontSize: 14, color: '#9E8E7E', fontWeight: 500 }}>Vendor onboarding</p>
        </div>

        {/* Progress bar */}
        <div style={{ background: '#E8E4DF', borderRadius: 4, height: 4, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#D4622A', borderRadius: 4, transition: 'width 0.3s ease' }}/>
        </div>

        {/* Step card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #eee' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#D4622A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1C1916', marginBottom: 8, lineHeight: 1.3 }}>{current.title}</h2>
          <p style={{ fontSize: 14, color: '#9E8E7E', marginBottom: 24, lineHeight: 1.6, fontWeight: 500 }}>{current.subtitle}</p>

          {/* Single select */}
          {current.type === 'single' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {current.options.map(opt => {
                const selected = answers[current.id] === opt.value;
                return (
                  <div key={opt.value} onClick={() => setAnswer(current.id, opt.value)} style={{ padding: '14px 16px', border: `2px solid ${selected ? '#D4622A' : '#eee'}`, borderRadius: 12, cursor: 'pointer', background: selected ? '#FAECE7' : '#fff', transition: 'all 0.15s' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: selected ? '#D4622A' : '#1C1916', marginBottom: 3 }}>{opt.label}</p>
                    {opt.desc && <p style={{ fontSize: 12, color: '#9E8E7E', lineHeight: 1.4 }}>{opt.desc}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Multi select */}
          {current.type === 'multi' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {current.options.map(opt => {
                const selected = (answers[current.id] || []).includes(opt.value);
                return (
                  <div key={opt.value} onClick={() => toggleMulti(current.id, opt.value)} style={{ padding: '14px 16px', border: `2px solid ${selected ? '#D4622A' : '#eee'}`, borderRadius: 12, cursor: 'pointer', background: selected ? '#FAECE7' : '#fff', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? '#D4622A' : '#ccc'}`, background: selected ? '#D4622A' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: selected ? '#D4622A' : '#1C1916' }}>{opt.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Textarea */}
          {current.type === 'textarea' && (
            <div>
              <textarea value={answers[current.id] || ''} onChange={e => setAnswer(current.id, e.target.value)}
                placeholder={current.placeholder} rows={6}
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#1C1916', resize: 'vertical', fontFamily: 'Arial, sans-serif', outline: 'none', lineHeight: 1.6 }}/>
              <p style={{ fontSize: 12, color: (answers[current.id] || '').length < (current.minLength || 0) ? '#D4622A' : '#9E8E7E', marginTop: 6 }}>
                {(answers[current.id] || '').length} / {current.minLength} characters minimum
              </p>
            </div>
          )}

          {/* Checklist */}
          {current.type === 'checklist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {current.options.map(opt => {
                const selected = (answers[current.id] || []).includes(opt.value);
                return (
                  <div key={opt.value} onClick={() => toggleMulti(current.id, opt.value)} style={{ padding: '14px 18px', border: `1.5px solid ${selected ? '#D4622A' : '#eee'}`, borderRadius: 12, cursor: 'pointer', background: selected ? '#FAECE7' : '#fff', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${selected ? '#D4622A' : '#ccc'}`, background: selected ? '#D4622A' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: selected ? 700 : 500, color: selected ? '#D4622A' : '#1C1916' }}>{opt.label}</p>
                  </div>
                );
              })}
              <p style={{ fontSize: 12.5, color: '#9E8E7E', marginTop: 4 }}>Select all that apply — the more you select, the stronger your profile.</p>
            </div>
          )}

          {/* Fields */}
          {current.type === 'fields' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {current.fields.map(f => (
                <div key={f.id}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#9E8E7E', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
                    {f.label} {f.required && <span style={{ color: '#D4622A' }}>*</span>}
                  </label>
                  <input value={answers[f.id] || ''} onChange={e => setAnswer(f.id, e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#1C1916', fontFamily: 'Arial, sans-serif', outline: 'none' }}/>
                </div>
              ))}
            </div>
          )}

          {error && <p style={{ fontSize: 13, color: '#C0392B', fontWeight: 600, marginTop: 16 }}>{error}</p>}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
            <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step === 0}
              style={{ background: 'none', border: '1px solid #eee', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, color: step === 0 ? '#ccc' : '#4A4440', cursor: step === 0 ? 'default' : 'pointer', fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>
              ← Back
            </button>
            <button onClick={next} disabled={saving}
              style={{ background: '#D4622A', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif', boxShadow: '0 2px 10px rgba(212,98,42,0.3)' }}>
              {saving ? 'Saving…' : step === STEPS.length - 1 ? 'Submit profile →' : 'Continue →'}
            </button>
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? '#D4622A' : i < step ? '#F5A066' : '#E8E4DF', transition: 'all 0.2s' }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Pending approval state ────────────────────────────────────
export function VendorPendingState() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F7F5F2', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {!dismissed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FAECE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>⏳</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1C1916', marginBottom: 12 }}>Profile pending review</h2>
            <p style={{ fontSize: 14, color: '#9E8E7E', lineHeight: 1.7, marginBottom: 24 }}>
              Thank you for completing your profile. A member of the Sabba team will review your application within <strong style={{ color: '#1C1916' }}>1–2 business days</strong>.
              <br/><br/>
              Once approved, you'll receive an email and can immediately start adding packages to the marketplace.
            </p>
            <div style={{ background: '#F7F5F2', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1916', marginBottom: 8 }}>What happens next?</p>
              {['Sabba reviews your business profile and onboarding answers', 'HR admin verifies your account against your website and credentials', 'You receive an approval email with login instructions', 'You can then add packages — they go live once HR approves them'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 3 ? 8 : 0 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#D4622A', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i+1}</span>
                  <p style={{ fontSize: 12.5, color: '#9E8E7E', lineHeight: 1.5 }}>{item}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setDismissed(true)} style={{ width: '100%', background: '#1C1916', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
              Got it — view my profile
            </button>
          </div>
        </div>
      )}

      {/* Greyed out dashboard preview */}
      <div style={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, border: '1px solid #eee', opacity: 0.6 }}>
          <p style={{ fontSize: 32, fontWeight: 700, fontStyle: 'italic', color: '#1C1916', fontFamily: 'Georgia, serif', marginBottom: 8 }}>Sabba</p>
          <p style={{ fontSize: 15, color: '#9E8E7E' }}>Your vendor dashboard will be available once your account is approved.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 24 }}>
            {['My Packages', 'Bookings', 'Earnings'].map(label => (
              <div key={label} style={{ background: '#F7F5F2', borderRadius: 12, padding: '20px', border: '2px dashed #E8E4DF' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>🔒 {label}</p>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ marginTop: 16, background: 'none', border: 'none', color: '#9E8E7E', cursor: 'pointer', fontSize: 13, fontFamily: 'Arial, sans-serif' }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function PendingState() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F7F5F2', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1C1916', marginBottom: 12 }}>Application submitted!</h2>
        <p style={{ fontSize: 14, color: '#9E8E7E', lineHeight: 1.7, marginBottom: 24 }}>
          Your vendor profile is now under review. We'll be in touch within 1–2 business days.
          <br/><br/>
          In the meantime, log in to see your pending dashboard.
        </p>
        <a href="/login" style={{ display: 'block', background: '#D4622A', color: '#fff', textDecoration: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700 }}>
          Go to login →
        </a>
      </div>
    </div>
  );
}

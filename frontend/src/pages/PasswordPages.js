import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { colors, font } from '../lib/styles';

const inputStyle = {
  width: '100%', border: '1.5px solid #eee', borderRadius: 12,
  padding: '12px 16px', fontSize: 14.5, color: '#1C1916',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

// ── Shared layout wrapper ─────────────────────────────────────
function AuthCard({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: font.body }}>
      {/* Left dark panel */}
      <div style={{ background: '#1C1916', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }}/>
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' }}/>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 48, fontWeight: 700, fontStyle: 'italic', color: '#fff', margin: '0 0 16px', lineHeight: 1 }}>Sabba</p>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.7 }}>
          Discovery, rejuvenation<br/>& growth.
        </p>
        <p style={{ fontSize: 13, color: '#D4622A', margin: '32px 0 0', fontWeight: 600 }}>The Employee Adventure Benefit Platform</p>
      </div>
      {/* Right form panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F2', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FORGOT PASSWORD PAGE — /forgot-password
// ═══════════════════════════════════════════════════════════
export function ForgotPassword() {
  const [emailVal,  setEmailVal]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!emailVal.trim()) { setError('Please enter your email address'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email: emailVal.trim().toLowerCase() });
      setSent(true);
    } catch {
      // Still show success — we don't reveal if email exists
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      {sent ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: colors.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>📧</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#1C1916', margin: '0 0 12px' }}>Check your email</h1>
          <p style={{ fontSize: 14.5, color: '#4A4440', lineHeight: 1.7, margin: '0 0 8px' }}>
            If <strong>{emailVal}</strong> is registered on Sabba, you'll receive a password reset link within a few minutes.
          </p>
          <p style={{ fontSize: 13, color: '#9E8E7E', margin: '0 0 32px' }}>Check your spam folder if you don't see it.</p>
          <Link to="/login" style={{ color: colors.orange, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>← Back to login</Link>
        </div>
      ) : (
        <>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, fontStyle: 'italic', color: '#1C1916', margin: '0 0 8px' }}>Reset your password</h1>
          <p style={{ fontSize: 14.5, color: '#4A4440', margin: '0 0 32px', lineHeight: 1.6 }}>Enter your email and we'll send you a link to reset your password.</p>
          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9E8E7E', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Email address</label>
              <input type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} placeholder="you@company.com" required autoFocus
                style={{ ...inputStyle, borderColor: error ? colors.red : '#eee' }}
                onFocus={e => e.target.style.borderColor = colors.orange}
                onBlur={e => e.target.style.borderColor = error ? colors.red : '#eee'}/>
              {error && <p style={{ fontSize: 12.5, color: colors.red, marginTop: 6, fontWeight: 600 }}>{error}</p>}
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#ddd' : '#1C1916', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: font.body, marginBottom: 20 }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p style={{ fontSize: 13.5, color: '#9E8E7E', textAlign: 'center' }}>
            Remember your password? <Link to="/login" style={{ color: colors.orange, fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
          </p>
        </>
      )}
    </AuthCard>
  );
}

// ═══════════════════════════════════════════════════════════
// RESET PASSWORD PAGE — /reset-password?token=xxx
// ═══════════════════════════════════════════════════════════
export function ResetPassword() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const token       = params.get('token');

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (!token) { setValidating(false); setTokenValid(false); return; }
    api.get(`/auth/reset-password/validate?token=${token}`)
      .then(r => setTokenValid(r.data.valid))
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const passwordStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '#eee' };
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: 'Weak',   color: colors.red };
    if (score <= 3) return { score, label: 'Fair',   color: '#B45309' };
    return              { score, label: 'Strong', color: colors.green };
  };

  const strength = passwordStrength(password);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return <AuthCard><div style={{ textAlign: 'center', padding: '40px 0' }}><div style={{ width: 32, height: 32, border: '3px solid #eee', borderTopColor: colors.orange, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}/></div></AuthCard>;
  }

  if (!token || !tokenValid) {
    return (
      <AuthCard>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, fontStyle: 'italic', color: '#1C1916', margin: '0 0 12px' }}>Link expired</h1>
          <p style={{ fontSize: 14.5, color: '#4A4440', lineHeight: 1.7, margin: '0 0 28px' }}>This reset link is invalid or has expired. Reset links are valid for 1 hour.</p>
          <Link to="/forgot-password" style={{ display: 'inline-block', background: '#1C1916', color: '#fff', textDecoration: 'none', padding: '13px 28px', borderRadius: 12, fontSize: 14.5, fontWeight: 700 }}>Request a new link</Link>
        </div>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: colors.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>✓</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#1C1916', margin: '0 0 12px' }}>Password updated</h1>
          <p style={{ fontSize: 14.5, color: '#4A4440', lineHeight: 1.7, margin: 0 }}>Your password has been changed. Redirecting you to login…</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, fontStyle: 'italic', color: '#1C1916', margin: '0 0 8px' }}>Choose a new password</h1>
      <p style={{ fontSize: 14.5, color: '#4A4440', margin: '0 0 32px', lineHeight: 1.6 }}>Pick something strong — at least 8 characters.</p>
      <form onSubmit={submit}>
        {/* New password */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#9E8E7E', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>New password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required autoFocus
            style={{ ...inputStyle }}
            onFocus={e => e.target.style.borderColor = colors.orange}
            onBlur={e => e.target.style.borderColor = '#eee'}/>
          {/* Strength bar */}
          {password && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : '#eee', transition: 'background 0.2s' }}/>
                ))}
              </div>
              <p style={{ fontSize: 12, color: strength.color, fontWeight: 600, margin: 0 }}>{strength.label}</p>
            </div>
          )}
        </div>
        {/* Confirm */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#9E8E7E', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Confirm password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required
            style={{ ...inputStyle, borderColor: confirm && confirm !== password ? colors.red : '#eee' }}
            onFocus={e => e.target.style.borderColor = colors.orange}
            onBlur={e => e.target.style.borderColor = confirm && confirm !== password ? colors.red : '#eee'}/>
          {confirm && confirm !== password && <p style={{ fontSize: 12.5, color: colors.red, marginTop: 6, fontWeight: 600 }}>Passwords don't match</p>}
        </div>
        {error && <div style={{ background: colors.redLight, border: `1px solid ${colors.red}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}><p style={{ fontSize: 13, color: colors.red, fontWeight: 600, margin: 0 }}>{error}</p></div>}
        <button type="submit" disabled={loading || password !== confirm || password.length < 8}
          style={{ width: '100%', background: password === confirm && password.length >= 8 ? '#1C1916' : '#ddd', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: password === confirm && password.length >= 8 ? 'pointer' : 'default', fontFamily: font.body }}>
          {loading ? 'Updating…' : 'Set new password'}
        </button>
      </form>
    </AuthCard>
  );
}

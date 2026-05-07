import { colors, font, statusStyle } from '../lib/styles';

export function Badge({ status }) {
  const s = statusStyle(status);
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.text,
      borderRadius: 20, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }}/>
      {status}
    </span>
  );
}

export function Avatar({ initials, size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(135deg, #f5e6da, #fcd3b3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: '#c05a1f' }}>
      {initials}
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled, style = {} }) {
  const base = {
    border: 'none', borderRadius: 8, padding: '10px 20px',
    fontSize: 13.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: font.body, transition: 'background 0.15s', display: 'inline-flex',
    alignItems: 'center', gap: 8, opacity: disabled ? 0.6 : 1, ...style,
  };
  const variants = {
    primary:   { background: colors.orange, color: '#fff' },
    secondary: { background: colors.bgCard, color: colors.dark, border: `1px solid ${colors.border}` },
    danger:    { background: '#fef2f2', color: '#b91c1c' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
      {children}
    </button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      <input {...props} style={{
        border: `1px solid ${error ? '#ef4444' : colors.border}`,
        borderRadius: 8, padding: '10px 14px', fontSize: 13.5,
        color: colors.dark, background: '#fff', outline: 'none',
        fontFamily: font.body, width: '100%', boxSizing: 'border-box',
      }}/>
      {error && <span style={{ fontSize: 12, color: '#b91c1c' }}>{error}</span>}
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      <select {...props} style={{
        border: `1px solid ${colors.border}`, borderRadius: 8,
        padding: '10px 14px', fontSize: 13.5, color: colors.dark,
        background: '#fff', fontFamily: font.body, width: '100%',
      }}>
        {children}
      </select>
    </div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`,
      borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${colors.border}`,
        borderTop: `3px solid ${colors.orange}`, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({ emoji = '📭', title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: colors.muted }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: colors.dark, marginBottom: 6 }}>{title}</p>
      {subtitle && <p style={{ fontSize: 13 }}>{subtitle}</p>}
    </div>
  );
}

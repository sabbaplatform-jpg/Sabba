import { colors, font, statusStyle, glass } from '../lib/styles';

export function Badge({ status }) {
  const s = statusStyle(status);
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.text,
      borderRadius: 20, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5,
      letterSpacing: '0.02em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }}/>
      {status}
    </span>
  );
}

export function Avatar({ initials, size = 32, src }) {
  if (src) return (
    <img src={src} alt={initials} style={{ width: size, height: size, borderRadius: size * 0.25, objectFit: 'cover', flexShrink: 0, border: `1px solid ${colors.border}` }}/>
  );
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, flexShrink: 0,
      background: 'linear-gradient(135deg, #f5e6da, #fcd3b3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: '#c05a1f', letterSpacing: '-0.5px' }}>
      {initials}
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled, style = {}, small }) {
  const base = {
    border: 'none', borderRadius: 10, padding: small ? '7px 14px' : '10px 20px',
    fontSize: small ? 12.5 : 13.5, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: font.body, transition: 'all 0.15s', display: 'inline-flex',
    alignItems: 'center', gap: 7, opacity: disabled ? 0.55 : 1, letterSpacing: '0.01em', ...style,
  };
  const variants = {
    primary:   { background: colors.orange, color: '#fff', boxShadow: '0 2px 8px rgba(224,108,42,0.25)' },
    secondary: { background: 'rgba(0,0,0,0.06)', color: colors.dark, border: `1px solid ${colors.border}` },
    danger:    { background: colors.redLight, color: colors.red },
    ghost:     { background: 'transparent', color: colors.orange, border: `1px solid ${colors.orange}` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`btn-${variant}`}
      style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function Input({ label, error, hint, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
      <input {...props} style={{
        border: `1.5px solid ${error ? '#ef4444' : colors.border}`,
        borderRadius: 10, padding: '10px 14px', fontSize: 14,
        color: colors.dark, background: 'rgba(255,255,255,0.8)', outline: 'none',
        fontFamily: font.body, width: '100%', boxSizing: 'border-box', fontWeight: 500,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}/>
      {hint && <span style={{ fontSize: 11.5, color: colors.faint }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: colors.red, fontWeight: 600 }}>{error}</span>}
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
      <textarea {...props} style={{
        border: `1.5px solid ${colors.border}`, borderRadius: 10, padding: '10px 14px',
        fontSize: 14, color: colors.dark, background: 'rgba(255,255,255,0.8)', outline: 'none',
        fontFamily: font.body, width: '100%', resize: 'vertical', minHeight: 80, fontWeight: 500,
      }}/>
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
      <select {...props} style={{
        border: `1.5px solid ${colors.border}`, borderRadius: 10,
        padding: '10px 14px', fontSize: 14, color: colors.dark,
        background: 'rgba(255,255,255,0.8)', fontFamily: font.body, width: '100%', fontWeight: 500,
      }}>
        {children}
      </select>
    </div>
  );
}

export function Card({ children, style = {}, className = 'glass-card' }) {
  return (
    <div className={className} style={{ ...style }}>
      {children}
    </div>
  );
}

export function Spinner({ size = 28 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: size, height: size, border: `3px solid ${colors.border}`,
        borderTop: `3px solid ${colors.orange}`, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function LoaderBar() {
  return <div className="loader-bar"/>;
}

export function EmptyState({ emoji = '📭', title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '52px 24px', color: colors.muted }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>{emoji}</div>
      <p style={{ fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 6 }}>{title}</p>
      {subtitle && <p style={{ fontSize: 13.5, lineHeight: 1.5 }}>{subtitle}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

export function StarRating({ rating, onChange, size = 20 }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(star => (
        <span key={star} onClick={() => onChange && onChange(star)}
          style={{ fontSize: size, cursor: onChange ? 'pointer' : 'default',
            color: star <= rating ? '#f59e0b' : colors.border, transition: 'color 0.1s' }}>
          ★
        </span>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: width, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: font.display, fontSize: 22, color: colors.dark, fontWeight: 400 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: colors.muted }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TableHeader({ cols, template }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: template, padding: '10px 24px', background: 'rgba(0,0,0,0.025)', borderBottom: `1px solid ${colors.border}` }}>
      {cols.map(h => (
        <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{h}</span>
      ))}
    </div>
  );
}

export function SectionHeader({ label, title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        {label && <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>}
        <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 400, letterSpacing: '-0.4px' }}>{title}</h1>
        {subtitle && <p style={{ color: colors.muted, fontSize: 14, marginTop: 4, fontWeight: 500 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, up, icon }) {
  return (
    <div className="stat-card" style={{ padding: '22px 22px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <p style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, lineHeight: 1 }}>{value}</p>
      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
          {up !== undefined && up !== null && (
            <svg width="11" height="11" fill="none" stroke={up ? colors.green : colors.red} strokeWidth="2.5" viewBox="0 0 24 24">
              {up ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
            </svg>
          )}
          <span style={{ fontSize: 12.5, color: up ? colors.green : colors.muted, fontWeight: 600 }}>{sub}</span>
        </div>
      )}
    </div>
  );
}

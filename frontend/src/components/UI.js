import { colors, font, statusStyle, gradients } from '../lib/styles';

export function Badge({ status }) {
  const s = statusStyle(status);
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.text,
      borderRadius: 20, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0, display: 'inline-block' }}/>
      {status}
    </span>
  );
}

export function Avatar({ initials, size = 32, src }) {
  if (src) return (
    <img src={src} alt={initials} style={{ width: size, height: size, borderRadius: size * 0.28,
      objectFit: 'cover', flexShrink: 0, border: '1px solid #eee' }}/>
  );
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: 'linear-gradient(135deg, #D4622A, #f5a066)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
      {initials}
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled, style = {}, small }) {
  const base = {
    border: 'none', borderRadius: 10, padding: small ? '7px 14px' : '11px 20px',
    fontSize: small ? 12 : 13.5, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: font.body, transition: 'all 0.15s', display: 'inline-flex',
    alignItems: 'center', gap: 7, opacity: disabled ? 0.5 : 1, letterSpacing: '0.01em', ...style,
  };
  const variants = {
    primary:   { background: colors.orange, color: '#fff', boxShadow: '0 2px 8px rgba(212,98,42,0.3)' },
    secondary: { background: '#F7F5F2', color: colors.dark, border: '1px solid #eee' },
    danger:    { background: colors.redLight, color: colors.red },
    ghost:     { background: 'transparent', color: colors.orange, border: `1px solid ${colors.orange}` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={variant === 'primary' ? 'btn-p' : 'btn-s'}
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
        border: `1.5px solid ${error ? '#ef4444' : '#eee'}`,
        borderRadius: 10, padding: '10px 14px', fontSize: 14,
        color: colors.dark, background: '#fff', outline: 'none',
        fontFamily: font.body, width: '100%', fontWeight: 500, transition: 'border-color 0.15s, box-shadow 0.15s',
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
        border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px',
        fontSize: 14, color: colors.dark, background: '#fff', outline: 'none',
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
        border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px',
        fontSize: 14, color: colors.dark, background: '#fff', fontFamily: font.body, width: '100%', fontWeight: 500,
      }}>
        {children}
      </select>
    </div>
  );
}


// ── Skeleton loading components ───────────────────────────────
export function SkeletonCard({ height = 200 }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      marginBottom: 16, border: '1px solid #eee',
    }}>
      <div style={{
        height, background: 'linear-gradient(90deg, #f0ede9 25%, #e8e4df 50%, #f0ede9 75%)',
        backgroundSize: '200% 100%',
        animation: 'sabba-shimmer 1.5s infinite',
      }}/>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ height: 14, background: '#f0ede9', borderRadius: 6, width: '45%', marginBottom: 8 }}/>
        <div style={{ height: 12, background: '#f0ede9', borderRadius: 6, width: '70%', marginBottom: 6 }}/>
        <div style={{ height: 12, background: '#f0ede9', borderRadius: 6, width: '55%' }}/>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '16px 20px',
      marginBottom: 10, border: '1px solid #eee',
      display: 'flex', alignItems: 'center', gap: 14
    }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#f0ede9', flexShrink: 0 }}/>
      <div style={{ flex: 1 }}>
        <div style={{ height: 13, background: '#f0ede9', borderRadius: 6, width: '40%', marginBottom: 7 }}/>
        <div style={{ height: 11, background: '#f0ede9', borderRadius: 6, width: '60%' }}/>
      </div>
      <div style={{ width: 80, height: 28, background: '#f0ede9', borderRadius: 8 }}/>
    </div>
  );
}

export function SkeletonText({ lines = 3, widths = [] }) {
  const defaultWidths = ['100%', '85%', '70%', '90%', '60%'];
  return (
    <div style={{ padding: '8px 0' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{
          height: 13, background: '#f0ede9', borderRadius: 6,
          width: widths[i] || defaultWidths[i % defaultWidths.length],
          marginBottom: 8
        }}/>
      ))}
    </div>
  );
}

export function Spinner({ size = 28 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
      <div style={{ width: size, height: size, border: `3px solid #eee`,
        borderTop: `3px solid ${colors.orange}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
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

export function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: width, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: font.display, fontSize: 22, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>{title}</h2>
          <button onClick={onClose} style={{ background: '#F7F5F2', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: colors.muted }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StarRating({ rating, onChange, size = 20 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(star => (
        <span key={star} onClick={() => onChange && onChange(star)}
          style={{ fontSize: size, cursor: onChange ? 'pointer' : 'default', color: star <= rating ? '#f59e0b' : '#ddd', transition: 'color 0.1s' }}>★</span>
      ))}
    </div>
  );
}

// ── Package Card — image-led ──────────────────────────────────
export function PackageCard({ pkg, onAddToCart, showTrending, onClick }) {
  const gradient = gradients[pkg.category] || gradients.default;
  return (
    <div className="pkg-card" onClick={onClick} style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Image */}
      <div style={{ height: 160, background: gradient, position: 'relative', flexShrink: 0 }}>
        {pkg.image_url
          ? <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{pkg.emoji || '🌍'}</div>
        }
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.42)', borderRadius: 6, padding: '4px 8px', backdropFilter: 'blur(8px)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {pkg.category?.replace('_', ' ')}
          </span>
          {showTrending && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: colors.orange, borderRadius: 6, padding: '4px 8px' }}>🔥 Trending</span>}
        </div>
        {pkg.verified && (
          <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(26,122,74,0.75)', borderRadius: 6, padding: '3px 8px', backdropFilter: 'blur(8px)' }}>✓ Verified</span>
          </div>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 14.5, fontWeight: 700, color: colors.dark, marginBottom: 3, lineHeight: 1.3 }}>{pkg.title}</p>
        <p style={{ fontSize: 12, color: colors.muted, fontWeight: 500, marginBottom: 6 }}>
          {pkg.vendor_name} · {pkg.destination} · {pkg.duration}
        </p>
        {(() => {
          const fmt = d => new Date(String(d).split('T')[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          if (pkg.date_type === 'fixed') {
            return <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.orange, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 5, background: colors.orangeLight, borderRadius: 6, padding: '3px 8px' }}>📅 Fixed dates</p>;
          }
          const end = pkg.end_date ? String(pkg.end_date).split('T')[0] : null;
          if (end && end !== '2099-12-31') {
            return <p style={{ fontSize: 11.5, fontWeight: 600, color: colors.muted, marginBottom: 8 }}>📅 Book by {fmt(end)}</p>;
          }
          return <p style={{ fontSize: 11.5, fontWeight: 600, color: colors.muted, marginBottom: 8 }}>📅 Year-round</p>;
        })()}
        {pkg.vendor_rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <span style={{ color: '#f59e0b', fontSize: 12 }}>★</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: colors.dark }}>{pkg.vendor_rating}</span>
          </div>
        )}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: colors.dark, lineHeight: 1 }}>£{Number(pkg.price_gbp).toLocaleString()}</p>
            <p style={{ fontSize: 10.5, color: colors.muted, marginTop: 2 }}>from £{Math.ceil(pkg.price_gbp / 12)}/mo via payroll</p>
          </div>
          {onAddToCart && (
            <button onClick={e => { e.stopPropagation(); onAddToCart(pkg.id); }}
              style={{ background: colors.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = colors.orangeHover}
              onMouseLeave={e => e.currentTarget.style.background = colors.orange}>
              + Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({ label, title, subtitle, action, italic = true }) {
  return (
    <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        {label && <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>}
        <h1 style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 700, fontStyle: italic ? 'italic' : 'normal', letterSpacing: '-0.3px' }}>{title}</h1>
        {subtitle && <p style={{ color: colors.muted, fontSize: 13.5, marginTop: 4, fontWeight: 500 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, up, icon }) {
  return (
    <div className="stat-card" style={{ padding: '20px 22px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <p style={{ fontFamily: font.display, fontSize: 32, color: colors.dark, lineHeight: 1, fontWeight: 700 }}>{value}</p>
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

export function TableHeader({ cols, template }) {
  return (
    <div className="table-head-row" style={{ display: 'grid', gridTemplateColumns: template, padding: '10px 24px', borderBottom: '1px solid #eee' }}>
      {cols.map(h => (
        <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{h}</span>
      ))}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import { PackageCard, Spinner, EmptyState, Input } from '../components/UI';
import { colors, font } from '../lib/styles';

const GOLD   = "#C9882A";
const GOLDLT = "#FDF3E3";

const CATEGORIES = [
  { id: 'all',           label: 'All',         icon: '🔍' },
  { id: 'travel',        label: 'Travel',       icon: '🌍' },
  { id: 'volunteering',  label: 'Volunteering', icon: '🤝' },
  { id: 'courses',       label: 'Courses',      icon: '🎓' },
  { id: 'jobs_abroad',   label: 'Work Abroad',  icon: '💼' },
  { id: 'accommodation', label: 'Stays',        icon: '🏠' },
  { id: 'airlines',      label: 'Airlines',     icon: '✈️' },
];

// ── Exact same popup as EmployeeHome ─────────────────────────
function AddToCartPopup({ pkg, onClose, onConfirm }) {
  const [departureDate,  setDepartureDate]  = useState('');
  const [payrollMonths,  setPayrollMonths]  = useState(6);
  const [error,          setError]          = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const minDate = new Date(); minDate.setDate(minDate.getDate() + 14);
  const minStr  = minDate.toISOString().split('T')[0];

  const handleConfirm = () => {
    if (!departureDate) { setError('Please select a departure date'); return; }
    if (submitting) return;
    setSubmitting(true);
    onConfirm({ departure_date: departureDate, payroll_months: payrollMonths });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', fontFamily: font.body }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Add to cart</p>
            <p style={{ fontFamily: font.display, fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: colors.dark }}>{pkg.title}</p>
            <p style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{pkg.destination} · {pkg.duration}</p>
          </div>
          <button onClick={onClose} style={{ background: '#F7F5F2', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: colors.muted, flexShrink: 0 }}>✕</button>
        </div>

        {/* Departure date */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
            Departure date <span style={{ color: colors.orange }}>*</span>
          </label>
          <input type="date" value={departureDate} min={minStr}
            onChange={e => { setDepartureDate(e.target.value); setError(''); }}
            style={{ width: '100%', border: `1.5px solid ${error ? colors.red : '#eee'}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none', boxSizing: 'border-box' }}/>
          {error && <p style={{ fontSize: 12, color: colors.red, marginTop: 4, fontWeight: 600 }}>{error}</p>}
        </div>

        {/* Payroll spread */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>Pay via payroll over</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[3, 6, 12].map(mo => (
              <div key={mo} onClick={() => setPayrollMonths(mo)}
                style={{ flex: 1, padding: '10px 8px', border: `2px solid ${payrollMonths === mo ? colors.orange : '#eee'}`, borderRadius: 10, background: payrollMonths === mo ? colors.orangeLight : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: payrollMonths === mo ? colors.orange : colors.mid }}>{mo} months</p>
                <p style={{ fontSize: 12, color: payrollMonths === mo ? colors.dark : colors.muted, marginTop: 2 }}>£{Math.round(pkg.price_gbp / mo)}/mo</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: '#F7F5F2', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 12, color: colors.muted }}>Total cost</p>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: colors.muted }}>Monthly payment</p>
            <p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: colors.orange }}>£{(pkg.price_gbp / payrollMonths).toFixed(2)}</p>
          </div>
        </div>

        <button onClick={handleConfirm}
          style={{ width: '100%', background: colors.dark, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
          🛒 Add to cart
        </button>
      </div>
    </div>
  );
}

// ── Featured card — wider, same image-driven style ────────────
function FeaturedCard({ pkg, onClick, onAddToCart }) {
  const GOLD = "#C9882A";
  const endDateStr = pkg?.end_date ? String(pkg.end_date).split('T')[0] : null;
  const daysUntilExpiry = endDateStr && endDateStr !== '2099-12-31'
    ? Math.ceil((new Date(endDateStr) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 14;

  return (
    <div className="pkg-card" onClick={onClick} style={{ display: 'flex', flexDirection: 'column', border: `1.5px solid ${GOLD}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(201,136,42,0.15)', background: GOLDLT }}>
      {/* Image */}
      <div style={{ height: 180, background: 'linear-gradient(135deg, #C9882A, #e8a84a)', position: 'relative', flexShrink: 0 }}>
        {pkg.image_url
          ? <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>{pkg.emoji || '🌍'}</div>
        }
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: GOLD, borderRadius: 6, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⭐ FEATURED
          </span>
          {isExpiringSoon && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(217,119,6,0.85)', borderRadius: 6, padding: '4px 8px', backdropFilter: 'blur(8px)' }}>
              ⏳ {daysUntilExpiry}d left
            </span>
          )}
        </div>
        {pkg.verified && (
          <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(26,122,74,0.75)', borderRadius: 6, padding: '3px 8px', backdropFilter: 'blur(8px)' }}>✓ Verified</span>
          </div>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{pkg.category?.replace('_', ' ')}</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 3, lineHeight: 1.3 }}>{pkg.title}</p>
        <p style={{ fontSize: 12, color: colors.muted, fontWeight: 500, marginBottom: 8 }}>
          {pkg.vendor_name} · {pkg.destination} · {pkg.duration}
        </p>
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
              style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              + Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Marketplace ───────────────────────────────────────────────
export default function Marketplace() {
  const [packages,  setPackages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [category,  setCategory]  = useState('all');
  const [search,    setSearch]    = useState('');
  const [cartPopup, setCartPopup] = useState(null);
  const [fetchError,  setFetchError]  = useState(false);
  const [addedToast,  setAddedToast]  = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true); setFetchError(false);
    const params = {};
    if (category !== 'all') params.category = category;
    if (search) params.search = search;
    api.get('/packages', { params })
      .then(r => setPackages(r.data || []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [category, search]);

  // Same pattern as EmployeeHome
  const handleAddToCart = (pkg) => setCartPopup(pkg);
  const confirmAddToCart = ({ departure_date, payroll_months }) => {
    if (cartPopup) {
      addToCart(cartPopup.id, { departure_date, payroll_months });
      setCartPopup(null);
      setAddedToast(cartPopup.title);
      setTimeout(() => setAddedToast(null), 3000);
    }
  };

  const sponsored = packages.filter(p => p.is_sponsored);
  const regular   = packages.filter(p => !p.is_sponsored);

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>

      {/* AddToCartPopup — identical to home page */}
      {cartPopup && (
        <AddToCartPopup
          pkg={cartPopup}
          onClose={() => setCartPopup(null)}
          onConfirm={confirmAddToCart}
        />
      )}

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '32px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Marketplace</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 20 }}>Find your adventure</h1>
          <div style={{ maxWidth: 480, marginBottom: 20 }}>
            <Input placeholder="Search destinations, packages, vendors…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                padding: '8px 16px', borderRadius: 20,
                border: `1.5px solid ${category === c.id ? colors.orange : '#eee'}`,
                background: category === c.id ? colors.orangeLight : '#fff',
                color: category === c.id ? colors.orange : colors.mid,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font.body,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Added to cart toast — rendered via portal to escape any CSS stacking context */}
      {addedToast && createPortal(
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#1A2E44', color: '#fff', borderRadius: 14, padding: '16px 22px', fontSize: 14, fontWeight: 600, fontFamily: 'Arial, sans-serif', zIndex: 99999, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.35)', minWidth: 280, pointerEvents: 'all' }}>
          <span style={{ fontSize: 22 }}>🛒</span>
          <span style={{ flex: 1 }}>{addedToast} added!</span>
          <button onClick={() => navigate('/cart')} style={{ background: '#E05A2B', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
            View cart
          </button>
          <button onClick={() => setAddedToast(null)} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 9px', fontSize: 13, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
            ✕
          </button>
        </div>,
        document.body
      )}

      {/* Results */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        {loading ? (
          <Spinner/>
        ) : fetchError ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 8 }}>Couldn't load packages</p>
            <p style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>Check your connection and try again.</p>
            <button onClick={() => { setFetchError(false); setLoading(true); api.get('/packages').then(r => setPackages(r.data || [])).catch(() => setFetchError(true)).finally(() => setLoading(false)); }}
              style={{ background: colors.orange, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              Try again
            </button>
          </div>
        ) : packages.length === 0 ? (
          <EmptyState emoji="🔍" title="No packages found" subtitle="Try a different search or category"/>
        ) : (
          <>
            {/* Featured / Sponsored — wider cards */}
            {sponsored.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>⭐</span>
                  <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Featured adventures</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px,1fr))', gap: 20 }}>
                  {sponsored.map(pkg => (
                    <FeaturedCard
                      key={pkg.id}
                      pkg={pkg}
                      onClick={() => navigate(`/package/${pkg.id}`)}
                      onAddToCart={() => handleAddToCart(pkg)}
                    />
                  ))}
                </div>
                {regular.length > 0 && <div style={{ borderBottom: '1px solid #eee', marginTop: 36 }}/>}
              </div>
            )}

            {/* All packages — use exact same PackageCard as home page */}
            {regular.length > 0 && (
              <div>
                {sponsored.length > 0 && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, marginTop: 24 }}>
                    All adventures
                  </p>
                )}
                <p style={{ fontSize: 13, color: colors.muted, fontWeight: 500, marginBottom: 20 }}>
                  {packages.length} package{packages.length !== 1 ? 's' : ''} available
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
                  {regular.map(pkg => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      onAddToCart={() => handleAddToCart(pkg)}
                      onClick={() => navigate(`/package/${pkg.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

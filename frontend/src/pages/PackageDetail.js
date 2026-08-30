import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Spinner } from '../components/UI';
import { colors, font, gradients } from '../lib/styles';

const GOLD = "#C9882A";

// ── Exact same popup as EmployeeHome ──────────────────────────
function AddToCartPopup({ pkg, onClose, onConfirm, initialMonths }) {
  const [departureDate, setDepartureDate] = useState('');
  const [payrollMonths, setPayrollMonths] = useState(initialMonths || 6);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Earliest bookable = max(today+14, package start date)
  const base = new Date(); base.setDate(base.getDate() + 14);
  const pkgStart = pkg.start_date ? new Date(String(pkg.start_date).split('T')[0]) : null;
  const minDate = pkgStart && pkgStart > base ? pkgStart : base;
  const minStr  = minDate.toISOString().split('T')[0];

  // Fixed end date? (2099 sentinel = open-ended)
  const pkgEndRaw = pkg.end_date ? String(pkg.end_date).split('T')[0] : null;
  const isOpenEnded = !pkgEndRaw || pkgEndRaw >= '2099-01-01';
  const maxStr = isOpenEnded ? undefined : pkgEndRaw;

  const handleConfirm = () => {
    if (!departureDate) { setError('Please select a departure date'); return; }
    if (departureDate < minStr) { setError('That date is before this package is available'); return; }
    if (maxStr && departureDate > maxStr) { setError('That date is after this package closes'); return; }
    if (submitting) return;
    setSubmitting(true);
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
          <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
            Departure date <span style={{ color: colors.orange }}>*</span>
          </label>
          <input type="date" value={departureDate} min={minStr} max={maxStr}
            onChange={e => { setDepartureDate(e.target.value); setError(''); }}
            style={{ width: '100%', border: `1.5px solid ${error ? colors.red : '#eee'}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none', boxSizing: 'border-box' }}/>
          <p style={{ fontSize: 11, color: colors.faint, marginTop: 5 }}>
            {isOpenEnded
              ? 'This package is available year-round — pick any date at least 14 days out.'
              : `Available between ${new Date(minStr).toLocaleDateString('en-GB',{day:'numeric',month:'short'})} and ${new Date(maxStr).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}.`}
          </p>
          {error && <p style={{ fontSize: 12, color: colors.red, marginTop: 4, fontWeight: 600 }}>{error}</p>}
        </div>
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

// ── Cost Breakdown — interactive, shown before Add to Cart ──
function CostBreakdown({ pkg, onMonthsChange }) {
  const [selected, setSelected] = useState(6);
  const price = Number(pkg.price_gbp);

  const handleSelect = (mo) => {
    setSelected(mo);
    if (onMonthsChange) onMonthsChange(mo);
  };

  return (
    <div style={{ background: '#F7F5F2', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Cost breakdown
      </p>
      <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>Pay via payroll over</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[3, 6, 12].map(mo => (
          <div key={mo} onClick={() => handleSelect(mo)}
            style={{ flex: 1, padding: '10px 8px', border: `2px solid ${selected === mo ? colors.orange : '#eee'}`, borderRadius: 10, background: selected === mo ? colors.orangeLight : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: selected === mo ? colors.orange : colors.mid }}>{mo} months</p>
            <p style={{ fontSize: 12, color: selected === mo ? colors.dark : colors.muted, marginTop: 2 }}>£{Math.ceil(price / mo)}/mo</p>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12.5, color: colors.muted }}>Package price</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.dark }}>£{price.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12.5, color: colors.muted }}>Spread over</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.dark }}>{selected} months</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #eee' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>Monthly via payroll</span>
          <span style={{ fontFamily: font.display, fontSize: 20, fontWeight: 700, color: colors.orange }}>£{Math.ceil(price / selected)}</span>
        </div>
      </div>
      <p style={{ fontSize: 11, color: colors.faint, marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
        Deducted from your employer payroll. HR reviews before deductions begin.
      </p>
    </div>
  );
}

// ── Package Detail ────────────────────────────────────────────
export default function PackageDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [pkg,       setPkg]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [cartPopup,     setCartPopup]     = useState(false);
  const [addedToast,    setAddedToast]    = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(6);

  useEffect(() => {
    api.get(`/packages/${id}`).then(r => setPkg(r.data)).finally(() => setLoading(false));
  }, [id]);

  const confirmAddToCart = ({ departure_date, payroll_months }) => {
    if (pkg) {
      addToCart(pkg.id, { departure_date, payroll_months });
      setCartPopup(false);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
    }
  };

  // Expiry
  const endDateStr = pkg?.end_date ? String(pkg.end_date).split('T')[0] : null;
  const daysUntilExpiry = endDateStr && endDateStr !== '2099-12-31'
    ? Math.ceil((new Date(endDateStr) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 14;
  const isExpired      = daysUntilExpiry !== null && daysUntilExpiry < 0;

  const gradient = pkg ? (gradients?.[pkg.category] || 'linear-gradient(135deg, #1A2E44, #2d4a6e)') : '';

  if (loading) return <Spinner/>;
  if (!pkg) return <div style={{ padding: 60, textAlign: 'center', color: colors.muted, fontFamily: font.body }}>Package not found</div>;

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh' }}>

      {/* Add to cart popup — identical to home page */}
      {cartPopup && (
        <AddToCartPopup
          pkg={pkg}
          onClose={() => setCartPopup(false)}
          onConfirm={confirmAddToCart}
          initialMonths={selectedMonths}
        />
      )}

      {/* Added to cart toast — rendered via portal to escape any CSS stacking context */}
      {addedToast && createPortal(
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#1A2E44', color: '#fff', borderRadius: 14, padding: '16px 22px', fontSize: 14, fontWeight: 600, fontFamily: 'Arial, sans-serif', zIndex: 99999, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.35)', minWidth: 260, pointerEvents: 'all' }}>
          <span style={{ fontSize: 22 }}>🛒</span>
          <span style={{ flex: 1 }}>Added to cart!</span>
          <button onClick={() => navigate('/cart')} style={{ background: '#E05A2B', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
            View cart
          </button>
        </div>,
        document.body
      )}

      {/* Back */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '14px 40px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: colors.orange, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: font.body, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>
      </div>

      {/* Hero image — full width, image driven */}
      <div style={{ height: 340, background: gradient, position: 'relative', overflow: 'hidden' }}>
        {pkg.image_url
          ? <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100 }}>{pkg.emoji || '🌍'}</div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }}/>

        {/* Top badges */}
        <div style={{ position: 'absolute', top: 16, left: 20, display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.45)', borderRadius: 6, padding: '4px 10px', backdropFilter: 'blur(8px)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {pkg.category?.replace('_', ' ')}
          </span>
          {pkg.verified && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(26,158,117,0.75)', borderRadius: 6, padding: '4px 10px', backdropFilter: 'blur(8px)' }}>
              ✓ Verified
            </span>
          )}
          {pkg.is_sponsored && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: GOLD, borderRadius: 6, padding: '4px 10px' }}>⭐ Featured</span>
          )}
        </div>

        {isExpiringSoon && !isExpired && (
          <div style={{ position: 'absolute', top: 16, right: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(217,119,6,0.85)', borderRadius: 6, padding: '4px 10px', backdropFilter: 'blur(8px)' }}>
              ⏳ {daysUntilExpiry === 0 ? 'Expires today' : `${daysUntilExpiry}d left`}
            </span>
          </div>
        )}

        {/* Title on image */}
        <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
          <h1 style={{ fontFamily: font.display, fontSize: 32, fontWeight: 700, fontStyle: 'italic', color: '#fff', marginBottom: 6, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {pkg.title}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
            {pkg.vendor_name} · {pkg.destination} · {pkg.duration}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 40px 80px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>

        {/* Left */}
        <div>
          {isExpired && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🚫</span>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#DC2626', marginBottom: 2 }}>This package is no longer available</p>
                <p style={{ fontSize: 12, color: '#B91C1C' }}>The vendor has closed bookings for this adventure.</p>
              </div>
            </div>
          )}
          {isExpiringSoon && !isExpired && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#D97706', marginBottom: 2 }}>
                  Expires in {daysUntilExpiry === 0 ? 'less than 24 hours' : `${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`}
                </p>
                <p style={{ fontSize: 12, color: '#B45309' }}>
                  Book before it's gone — closes on {new Date(endDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                </p>
              </div>
            </div>
          )}

          {pkg.description && (
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>About this adventure</p>
              <p style={{ fontSize: 14.5, color: colors.mid, lineHeight: 1.75 }}>{pkg.description}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { label: 'Destination', value: pkg.destination },
              { label: 'Duration',    value: pkg.duration },
              { label: 'Category',    value: pkg.category?.replace(/_/g,' ') },
              { label: 'Vendor',      value: pkg.vendor_name },
              { label: 'Rating',      value: pkg.vendor_rating > 0 ? `★ ${pkg.vendor_rating}` : 'New listing' },
              { label: 'Status',      value: pkg.verified ? '✓ Verified' : 'Unverified' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ fontSize: 10, color: colors.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark, textTransform: 'capitalize' }}>{item.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — sticky panel */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: '24px 22px' }}>

            {/* Price */}
            <p style={{ fontFamily: font.display, fontSize: 34, fontWeight: 700, color: colors.dark, marginBottom: 2 }}>
              £{Number(pkg.price_gbp).toLocaleString()}
            </p>
            <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 20 }}>
              Paid via payroll — choose your spread below
            </p>

            {/* Cost breakdown — self-contained, notifies parent of month selection */}
            <CostBreakdown pkg={pkg} onMonthsChange={(mo) => setSelectedMonths(mo)}/>

            {/* Add to cart — show for employees, hide expired */}
            {isExpired ? (
              <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>Bookings closed</p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setCartPopup(true)}
                  style={{ width: '100%', background: colors.orange, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, marginBottom: 10 }}>
                  🛒 Add to cart
                </button>
                <p style={{ fontSize: 11.5, color: colors.faint, textAlign: 'center', lineHeight: 1.5 }}>
                  Your cart is reviewed by HR before payroll deductions begin.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

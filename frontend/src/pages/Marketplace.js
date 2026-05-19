import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import { PackageCard, Spinner, EmptyState, Input } from '../components/UI';
import { colors, font, gradients } from '../lib/styles';

const CATS = ['all','travel','volunteering','courses','jobs_abroad','accommodation','airlines'];
const CAT_LABELS = { all:'All', travel:'Travel', volunteering:'Volunteering', courses:'Courses', jobs_abroad:'Work Abroad', accommodation:'Stays', airlines:'Airlines' };
const CAT_ICONS  = { all:'🔍', travel:'🌍', volunteering:'🤝', courses:'🎓', jobs_abroad:'💼', accommodation:'🏠', airlines:'✈️' };

// ── Add to Cart popup ────────────────────────────────────────
function AddToCartPopup({ pkg, onClose, onConfirm }) {
  const [departureDate,  setDepartureDate]  = useState('');
  const [payrollMonths,  setPayrollMonths]  = useState(6);
  const [error,          setError]          = useState('');

  const monthly = pkg ? (Number(pkg.price_gbp) / payrollMonths).toFixed(2) : 0;
  const minDate  = new Date(); minDate.setDate(minDate.getDate() + 14);
  const minStr   = minDate.toISOString().split('T')[0];

  const handleConfirm = () => {
    if (!departureDate) { setError('Please select a departure date'); return; }
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

        {/* Departure date */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Departure date <span style={{ color: colors.orange }}>*</span></label>
          <input type="date" value={departureDate} min={minStr} onChange={e => { setDepartureDate(e.target.value); setError(''); }}
            style={{ width: '100%', border: `1.5px solid ${error ? colors.red : '#eee'}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
          {error && <p style={{ fontSize: 12, color: colors.red, marginTop: 4, fontWeight: 600 }}>{error}</p>}
        </div>

        {/* Payroll spread */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>Pay via payroll over</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[3, 6, 12].map(mo => (
              <div key={mo} onClick={() => setPayrollMonths(mo)} style={{ flex: 1, padding: '10px 8px', border: `2px solid ${payrollMonths === mo ? colors.orange : '#eee'}`, borderRadius: 10, background: payrollMonths === mo ? colors.orangeLight : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: payrollMonths === mo ? colors.orange : colors.mid }}>{mo} months</p>
                <p style={{ fontSize: 12, color: payrollMonths === mo ? colors.dark : colors.muted, marginTop: 2 }}>£{(pkg.price_gbp / mo).toFixed(0)}/mo</p>
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
            <p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: colors.orange }}>£{monthly}</p>
          </div>
        </div>

        <button onClick={handleConfirm} style={{ width: '100%', background: colors.dark, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
          🛒 Add to cart
        </button>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { addToCart }   = useCart();
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const [packages, setPkgs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCat]    = useState(params.get('category') || 'all');
  const [search, setSearch]   = useState('');
  const [cartPopup, setCartPopup] = useState(null); // pkg to add

  useEffect(() => {
    setLoading(true);
    const p = {};
    if (category !== 'all') p.category = category;
    if (search) p.search = search;
    api.get('/packages', { params: p }).then(r => setPkgs(r.data)).finally(() => setLoading(false));
  }, [category, search]);

  const handleAddToCart = (pkg) => {
    setCartPopup(pkg);
  };

  const confirmAddToCart = async ({ departure_date, payroll_months }) => {
    if (cartPopup) {
      await addToCart(cartPopup.id, { departure_date, payroll_months });
      setCartPopup(null);
    }
  };

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
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
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${category === c ? colors.orange : '#eee'}`, background: category === c ? colors.orangeLight : '#fff', color: category === c ? colors.orange : colors.mid, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{CAT_ICONS[c]}</span> {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ height: 160, background: 'linear-gradient(90deg, #f0ede9 25%, #e8e4df 50%, #f0ede9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }}/>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ height: 16, borderRadius: 6, background: 'linear-gradient(90deg, #f0ede9 25%, #e8e4df 50%, #f0ede9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', marginBottom: 8 }}/>
                  <div style={{ height: 12, borderRadius: 6, background: 'linear-gradient(90deg, #f0ede9 25%, #e8e4df 50%, #f0ede9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: '60%' }}/>
                </div>
                <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <EmptyState emoji="🔍" title="No packages found" subtitle="Try a different search or category"/>
        ) : (
          <>
            <p style={{ fontSize: 13, color: colors.muted, fontWeight: 500, marginBottom: 20 }}>
              {packages.length} package{packages.length !== 1 ? 's' : ''} available
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 20 }}>
              {packages.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} onAddToCart={() => handleAddToCart(pkg)} onClick={() => navigate(`/package/${pkg.id}`)}/>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

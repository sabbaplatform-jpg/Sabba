import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button, Spinner, StarRating } from '../components/UI';
import { colors, font, gradients } from '../lib/styles';

export default function PackageDetail() {
  const { id }           = useParams();
  const { user }         = useAuth();
  const { addToCart, items: cartItems } = useCart();
  const navigate         = useNavigate();
  const [pkg, setPkg]         = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payrollMonths, setPayrollMonths] = useState(6);
  const [departureDate, setDepartureDate] = useState('');
  const [adding, setAdding]   = useState(false);
  const [added, setAdded]     = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/packages/${id}`),
      api.get(`/ratings/package/${id}`).catch(() => ({ data: [] })),
    ]).then(([p, r]) => { setPkg(p.data); setRatings(r.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const isInCart = cartItems.some(c => c.package_id === id);

  const handleAddToCart = async () => {
    if (!departureDate) {
      alert('Please select a departure date first');
      return;
    }
    setAdding(true);
    await addToCart(id, { payroll_months: payrollMonths, departure_date: departureDate });
    setAdding(false);
    setAdded(true);
  };

  const monthly = pkg ? (Number(pkg.price_gbp) / payrollMonths).toFixed(2) : 0;
  const gradient = pkg ? (gradients[pkg.category] || gradients.default) : gradients.default;
  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : null;

  if (loading) return <Spinner/>;
  if (!pkg) return <div style={{ padding: 60, textAlign: 'center', color: colors.muted, fontFamily: font.body }}>Package not found</div>;

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Hero image */}
      <div style={{ height: 300, background: gradient, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {pkg.image_url
          ? <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : <span style={{ fontSize: 96, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}>{pkg.emoji || '🌍'}</span>
        }
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}/>
        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 20, left: 24, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font.body, backdropFilter: 'blur(8px)' }}>
          ← Back
        </button>
        {/* Category badge */}
        <div style={{ position: 'absolute', top: 20, right: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.42)', borderRadius: 8, padding: '5px 12px', backdropFilter: 'blur(8px)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {pkg.category?.replace('_', ' ')}
          </span>
        </div>
        {/* Title overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 40px 28px' }}>
          <h1 style={{ fontFamily: font.display, fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#fff', marginBottom: 6 }}>{pkg.title}</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{pkg.vendor_name} · {pkg.destination} · {pkg.duration}</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28 }}>

        {/* Left: details */}
        <div>
          {/* Meta tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Destination', value: pkg.destination },
              { label: 'Duration',    value: pkg.duration },
              { label: 'Category',    value: pkg.category?.replace('_', ' ') },
              { label: 'Vendor',      value: pkg.vendor_name },
              { label: 'Rating',      value: avgRating ? `★ ${avgRating} (${ratings.length})` : 'New listing' },
              { label: 'Status',      value: pkg.verified ? '✓ Verified Vendor' : 'Unverified' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 10, color: colors.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{item.label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {pkg.description && (
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: '24px 28px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 12 }}>About this adventure</p>
              <p style={{ fontSize: 14, color: colors.mid, lineHeight: 1.7 }}>{pkg.description}</p>
            </div>
          )}

          {/* Ratings */}
          {ratings.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Reviews</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StarRating rating={Math.round(avgRating)} size={16}/>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>{avgRating}</span>
                  <span style={{ fontSize: 12, color: colors.muted }}>({ratings.length} review{ratings.length !== 1 ? 's' : ''})</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {ratings.slice(0, 5).map((r, i) => (
                  <div key={i} style={{ paddingBottom: i < Math.min(ratings.length, 5) - 1 ? 16 : 0, borderBottom: i < Math.min(ratings.length, 5) - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                          {r.employee_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{r.employee_name}</span>
                      </div>
                      <StarRating rating={r.rating} size={14}/>
                    </div>
                    {r.review && <p style={{ fontSize: 13, color: colors.mid, lineHeight: 1.5 }}>{r.review}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Add to Cart */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'sticky', top: 80 }}>

            {/* Price */}
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f5f5f5' }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Package price</p>
              <p style={{ fontFamily: font.display, fontSize: 42, fontWeight: 700, color: colors.dark, lineHeight: 1 }}>£{Number(pkg.price_gbp).toLocaleString()}</p>
              <p style={{ fontSize: 12.5, color: colors.muted, marginTop: 4 }}>from £{Math.ceil(pkg.price_gbp / 12)}/mo via payroll</p>
            </div>

            {user?.role === 'employee' ? (
              <>
                {/* Departure date */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Departure date</label>
                  <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)}
                    style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, fontWeight: 500 }}/>
                </div>

                {/* Payroll spread */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Payroll spread</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[3, 6, 12].map(mo => (
                      <div key={mo} onClick={() => setPayrollMonths(mo)} style={{ flex: 1, padding: '10px 8px', border: `2px solid ${payrollMonths === mo ? colors.orange : '#eee'}`, borderRadius: 10, background: payrollMonths === mo ? colors.orangeLight : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: payrollMonths === mo ? colors.orange : colors.mid }}>{mo}mo</p>
                        <p style={{ fontSize: 11.5, color: payrollMonths === mo ? colors.dark : colors.muted, fontWeight: 600, marginTop: 2 }}>£{(pkg.price_gbp / mo).toFixed(0)}/mo</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly summary */}
                <div style={{ background: '#F7F5F2', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: colors.muted }}>Total cost</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #eee' }}>
                    <span style={{ fontSize: 13, color: colors.muted }}>Monthly via payroll</span>
                    <span style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: colors.orange }}>£{monthly}</span>
                  </div>
                </div>

                {/* Add to Cart button */}
                {added || isInCart ? (
                  <div>
                    <div style={{ background: colors.greenLight, color: colors.green, borderRadius: 12, padding: '14px', textAlign: 'center', marginBottom: 12 }}>
                      <p style={{ fontSize: 14, fontWeight: 700 }}>✓ Added to cart</p>
                      <p style={{ fontSize: 12, marginTop: 3 }}>Review your cart before checkout</p>
                    </div>
                    <Button onClick={() => navigate('/cart')} style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 14 }}>
                      View cart →
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleAddToCart} disabled={adding} style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15 }}>
                    {adding ? 'Adding…' : '🛒 Add to cart'}
                  </Button>
                )}

                <p style={{ fontSize: 11.5, color: colors.faint, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                  Your cart is reviewed by HR before payroll deductions begin.
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 14, color: colors.muted, lineHeight: 1.6 }}>
                  {user?.role === 'hr' ? 'Log in as an employee to book packages.' : 'Only employees can book packages.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

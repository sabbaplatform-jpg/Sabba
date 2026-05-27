import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Spinner } from '../components/UI';
import { colors, font, gradients } from '../lib/styles';

const GOLD = "#C9882A";

export default function PackageDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [pkg, setPkg]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [added, setAdded]       = useState(false);

  useEffect(() => {
    api.get(`/packages/${id}`).then(r => setPkg(r.data)).finally(() => setLoading(false));
  }, [id]);

  // Expiry countdown
  const endDateStr = pkg?.end_date ? String(pkg.end_date).split('T')[0] : null;
  const daysUntilExpiry = endDateStr && endDateStr !== '2099-12-31'
    ? Math.ceil((new Date(endDateStr) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 14;
  const isExpired      = daysUntilExpiry !== null && daysUntilExpiry < 0;

  const handleAddToCart = () => {
    addToCart(pkg);
    setAdded(true);
    setTimeout(() => navigate('/cart'), 800);
  };

  const gradient = gradients?.[pkg?.category] || 'linear-gradient(135deg, #1A2E44, #2d4a6e)';

  if (loading) return <Spinner/>;
  if (!pkg) return (
    <div style={{ padding: 60, textAlign: 'center', color: colors.muted, fontFamily: font.body }}>
      Package not found
    </div>
  );

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh' }}>
      {/* Back button */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '14px 40px' }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: colors.orange,
          fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: font.body,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          ← Back to marketplace
        </button>
      </div>

      {/* Hero image — full width, image driven */}
      <div style={{ height: 340, background: gradient, position: 'relative', overflow: 'hidden' }}>
        {pkg.image_url
          ? <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100 }}>{pkg.emoji || '🌍'}</div>
        }
        {/* Dark overlay for text legibility */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }}/>

        {/* Badges */}
        <div style={{ position: 'absolute', top: 16, left: 20, display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.45)', borderRadius: 6, padding: '4px 10px', backdropFilter: 'blur(8px)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {pkg.category?.replace('_', ' ')}
          </span>
          {pkg.verified && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(26,158,117,0.75)', borderRadius: 6, padding: '4px 10px', backdropFilter: 'blur(8px)' }}>
              ✓ Verified vendor
            </span>
          )}
          {pkg.is_sponsored && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: GOLD, borderRadius: 6, padding: '4px 10px' }}>
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Expiry badge on hero */}
        {isExpiringSoon && !isExpired && (
          <div style={{ position: 'absolute', top: 16, right: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(217,119,6,0.85)', borderRadius: 6, padding: '4px 10px', backdropFilter: 'blur(8px)' }}>
              ⏳ {daysUntilExpiry === 0 ? 'Expires today' : `${daysUntilExpiry}d left`}
            </span>
          </div>
        )}

        {/* Title overlay on image */}
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

        {/* Left — details */}
        <div>
          {/* Expiry banners */}
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
                  Book before it's gone — bookings close on {new Date(endDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                </p>
              </div>
            </div>
          )}

          {/* About */}
          {pkg.description && (
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>About this adventure</p>
              <p style={{ fontSize: 14.5, color: colors.mid, lineHeight: 1.75 }}>{pkg.description}</p>
            </div>
          )}

          {/* Stats grid */}
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

        {/* Right — add to cart panel */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: '24px 22px' }}>
            {/* Price */}
            <p style={{ fontSize: 34, fontFamily: font.display, fontWeight: 700, color: colors.dark, marginBottom: 2 }}>
              £{Number(pkg.price_gbp).toLocaleString()}
            </p>
            <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 20 }}>
              from £{Math.ceil(pkg.price_gbp / 12)}/mo via payroll
            </p>

            {/* Payroll spread preview */}
            <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Payroll spread</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[3, 6, 12].map(mo => (
                  <div key={mo} style={{ flex: 1, textAlign: 'center', background: mo === 6 ? colors.dark : '#fff', borderRadius: 8, padding: '8px 4px', border: `1px solid ${mo === 6 ? colors.dark : '#eee'}` }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: mo === 6 ? '#fff' : colors.dark }}>{mo}mo</p>
                    <p style={{ fontSize: 11, color: mo === 6 ? 'rgba(255,255,255,0.7)' : colors.muted, marginTop: 2 }}>£{Math.ceil(pkg.price_gbp / mo)}/mo</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: colors.faint, marginTop: 8, textAlign: 'center' }}>Choose your spread in the cart</p>
            </div>

            {user?.role === 'employee' ? (
              isExpired ? (
                <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>Bookings closed</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleAddToCart}
                    disabled={added}
                    style={{
                      width: '100%', background: added ? colors.green : colors.orange,
                      color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
                      fontSize: 15, fontWeight: 700, cursor: added ? 'default' : 'pointer',
                      fontFamily: font.body, transition: 'background 0.2s', marginBottom: 10
                    }}>
                    {added ? '✓ Added to cart — going to cart…' : '🛒 Add to cart'}
                  </button>
                  <p style={{ fontSize: 11.5, color: colors.faint, textAlign: 'center', lineHeight: 1.5 }}>
                    Your cart is reviewed by HR before payroll deductions begin.
                  </p>
                </>
              )
            ) : (
              <p style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
                Log in as an employee to book this package.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

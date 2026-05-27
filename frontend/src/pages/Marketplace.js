import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import { colors, font, gradients } from '../lib/styles';
import { Spinner, EmptyState, Input } from '../components/UI';

const CATEGORIES = ['all','travel','volunteering','courses','jobs_abroad','accommodation','airlines'];
const CATEGORY_LABELS = { all:'All', travel:'Travel', volunteering:'Volunteering', courses:'Courses', jobs_abroad:'Work Abroad', accommodation:'Stays', airlines:'Airlines' };
const CATEGORY_ICONS  = { all:'🔍', travel:'🌍', volunteering:'🤝', courses:'🎓', jobs_abroad:'💼', accommodation:'🏠', airlines:'✈️' };

const GOLD   = "#C9882A";
const GOLDLT = "#FDF3E3";

export default function Marketplace() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch]     = useState('');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category !== 'all') params.category = category;
    if (search) params.search = search;
    api.get('/packages', { params })
      .then(r => setPackages(r.data))
      .finally(() => setLoading(false));
  }, [category, search]);

  const sponsored = packages.filter(p => p.is_sponsored);
  const regular   = packages.filter(p => !p.is_sponsored);

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '32px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Marketplace</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 20 }}>Find your adventure</h1>

          {/* Search */}
          <div style={{ maxWidth: 480, marginBottom: 20 }}>
            <Input placeholder="Search destinations, packages, vendors…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '8px 16px', borderRadius: 20,
                border: `1.5px solid ${category === c ? colors.orange : '#eee'}`,
                background: category === c ? colors.orangeLight : '#fff',
                color: category === c ? colors.orange : colors.mid,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font.body,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>{CATEGORY_ICONS[c]}</span> {CATEGORY_LABELS[c]}
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
                <div style={{ height: 160, background: 'linear-gradient(90deg, #f0ede9 25%, #e8e4df 50%, #f0ede9 75%)' }}/>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ height: 16, borderRadius: 6, background: '#f0ede9', marginBottom: 8 }}/>
                  <div style={{ height: 12, borderRadius: 6, background: '#f0ede9', width: '60%' }}/>
                </div>
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <EmptyState emoji="🔍" title="No packages found" subtitle="Try a different search or category"/>
        ) : (
          <>
            {/* ── Sponsored / Featured section ── */}
            {sponsored.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>⭐</span>
                  <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Featured adventures
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px,1fr))', gap: 20 }}>
                  {sponsored.map(pkg => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      featured
                      onAddToCart={() => addToCart(pkg)}
                      onClick={() => navigate(`/package/${pkg.id}`)}
                    />
                  ))}
                </div>
                {regular.length > 0 && (
                  <div style={{ borderBottom: '1px solid #eee', marginTop: 36 }}/>
                )}
              </div>
            )}

            {/* ── Regular packages ── */}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 20 }}>
                  {regular.map(pkg => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      onAddToCart={() => addToCart(pkg)}
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

function PackageCard({ pkg, onAddToCart, onClick, featured, showTrending }) {
  const gradient = gradients?.[pkg.category] || 'linear-gradient(135deg, #1A2E44, #2d4a6e)';

  // Expiry countdown
  const endDate = pkg.end_date ? String(pkg.end_date).split('T')[0] : null;
  const daysUntilExpiry = endDate && endDate !== '2099-12-31' ?
    Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 14;

  return (
    <div className="pkg-card" onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column',
        border: featured ? `1.5px solid ${GOLD}` : undefined,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: featured ? '0 4px 20px rgba(201,136,42,0.15)' : undefined,
        background: featured ? GOLDLT : '#fff',
      }}>

      {/* Image area */}
      <div style={{ height: 160, background: gradient, position: 'relative', flexShrink: 0 }}>
        {pkg.image_url
          ? <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{pkg.emoji || '🌍'}</div>
        }

        {/* Top badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {featured ? (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: GOLD, borderRadius: 6, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              ⭐ FEATURED
            </span>
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.42)', borderRadius: 6, padding: '4px 8px', backdropFilter: 'blur(8px)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {pkg.category?.replace('_', ' ')}
            </span>
          )}
          {showTrending && (
            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: colors.orange, borderRadius: 6, padding: '4px 8px' }}>🔥 Trending</span>
          )}
          {isExpiringSoon && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(217,119,6,0.85)', borderRadius: 6, padding: '4px 8px', backdropFilter: 'blur(8px)' }}>
              ⏳ {daysUntilExpiry}d left
            </span>
          )}
        </div>

        {/* Verified badge */}
        {pkg.verified && (
          <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(26,122,74,0.75)', borderRadius: 6, padding: '3px 8px', backdropFilter: 'blur(8px)' }}>✓ Verified</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 14.5, fontWeight: 700, color: colors.dark, marginBottom: 3, lineHeight: 1.3 }}>{pkg.title}</p>
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
            <p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: colors.dark, lineHeight: 1 }}>
              £{Number(pkg.price_gbp).toLocaleString()}
            </p>
            <p style={{ fontSize: 10.5, color: colors.muted, marginTop: 2 }}>
              from £{Math.ceil(pkg.price_gbp / 12)}/mo via payroll
            </p>
          </div>
          {onAddToCart && (
            <button
              onClick={e => { e.stopPropagation(); onAddToCart(pkg); }}
              style={{ background: colors.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              + Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { colors, font } from '../lib/styles';
import { Spinner, EmptyState, Input } from '../components/UI';

const CATEGORIES = ['all','travel','volunteering','courses','jobs_abroad','accommodation','airlines'];
const CATEGORY_ICONS = { travel:'🌍', volunteering:'🤝', courses:'🎓', jobs_abroad:'💼', accommodation:'🏠', airlines:'✈️', all:'🔍' };

const GOLD   = "#C9882A";
const GOLDLT = "#FDF3E3";

export default function Marketplace() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch]     = useState('');
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
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Marketplace</p>
        <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 400, marginBottom: 8 }}>Find your adventure</h1>
        <p style={{ color: colors.muted, fontSize: 14 }}>Curated packages from verified vendors, paid via your employer payroll.</p>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input placeholder="Search destinations or packages…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '8px 14px', borderRadius: 20, border: `1px solid ${category === c ? colors.orange : colors.border}`,
              background: category === c ? colors.orangeLight : '#fff',
              color: category === c ? colors.orange : colors.mid,
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: font.body,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {CATEGORY_ICONS[c]} {c.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner/> : packages.length === 0 ? (
        <EmptyState emoji="🔍" title="No packages found" subtitle="Try a different search or category"/>
      ) : (
        <>
          {/* ── Featured / Sponsored ── */}
          {sponsored.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 16 }}>⭐</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Featured adventures</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
                {sponsored.map(pkg => (
                  <PackageCard key={pkg.id} pkg={pkg} onClick={() => navigate(`/package/${pkg.id}`)} featured/>
                ))}
              </div>
              {regular.length > 0 && (
                <div style={{ borderBottom: '1px solid #eee', marginTop: 36, marginBottom: 0 }}/>
              )}
            </div>
          )}

          {/* ── All / regular packages ── */}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
                {regular.map(pkg => (
                  <PackageCard key={pkg.id} pkg={pkg} onClick={() => navigate(`/package/${pkg.id}`)}/>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PackageCard({ pkg, onClick, featured }) {
  const [hovered, setHovered] = useState(false);

  // Expiry countdown
  const daysUntilExpiry = pkg.end_date && pkg.end_date !== '2099-12-31' ? (() => {
    return Math.ceil((new Date(pkg.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  })() : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 14;

  const borderColor = featured
    ? (hovered ? GOLD : "#F0C060")
    : (hovered ? colors.orange : colors.border);

  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: featured ? GOLDLT : '#fff',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: hovered
          ? (featured ? '0 6px 24px rgba(201,136,42,0.18)' : '0 4px 20px rgba(224,108,42,0.12)')
          : '0 1px 4px rgba(0,0,0,0.04)',
        position: 'relative',
      }}>

      {/* Featured badge */}
      {featured && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: GOLD, color: '#fff', borderRadius: 6, padding: '3px 9px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
          ⭐ FEATURED
        </div>
      )}

      {/* Expiring soon badge */}
      {isExpiringSoon && (
        <div style={{ position: 'absolute', top: featured ? 38 : 12, right: 12, background: '#FEF3C7', color: '#D97706', borderRadius: 6, padding: '3px 9px', fontSize: 10, fontWeight: 700 }}>
          ⏳ {daysUntilExpiry}d left
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 32 }}>{pkg.emoji || '🌍'}</span>
        {!featured && (
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.orange,
            background: colors.orangeLight, borderRadius: 6, padding: '3px 8px' }}>
            {pkg.category?.replace('_',' ')}
          </span>
        )}
        {featured && (
          <span style={{ fontSize: 11, fontWeight: 600, color: GOLD,
            background: 'rgba(201,136,42,0.12)', borderRadius: 6, padding: '3px 8px', marginTop: 28 }}>
            {pkg.category?.replace('_',' ')}
          </span>
        )}
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>{pkg.title}</h3>
      <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 12 }}>
        {pkg.vendor_name} · {pkg.destination} · {pkg.duration}
      </p>
      {pkg.description && (
        <p style={{ fontSize: 12.5, color: colors.mid, marginBottom: 14, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {pkg.description}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: font.display, fontSize: 22, color: colors.dark }}>
            £{Number(pkg.price_gbp).toLocaleString()}
          </span>
          <p style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
            from £{Math.round(pkg.price_gbp / 12)}/mo via payroll
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {pkg.verified && <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, background: colors.greenLight, borderRadius: 4, padding: '2px 6px' }}>✓ Verified</span>}
          {pkg.vendor_rating > 0 && <span style={{ fontSize: 12, color: colors.muted }}>★ {pkg.vendor_rating}</span>}
        </div>
      </div>
    </div>
  );
}

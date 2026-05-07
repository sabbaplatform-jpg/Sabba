import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { colors, font } from '../lib/styles';
import { Spinner, EmptyState, Input } from '../components/UI';

const CATEGORIES = ['all','travel','volunteering','courses','jobs_abroad','accommodation','airlines'];
const CATEGORY_ICONS = { travel:'🌍', volunteering:'🤝', courses:'🎓', jobs_abroad:'💼', accommodation:'🏠', airlines:'✈️', all:'🔍' };

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

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Marketplace</p>
        <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 400, marginBottom: 8 }}>Find your adventure</h1>
        <p style={{ color: colors.muted, fontSize: 14 }}>Curated packages from verified vendors, paid via your employer payroll.</p>
      </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
          {packages.map(pkg => (
            <div key={pkg.id} onClick={() => navigate(`/package/${pkg.id}`)}
              style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = colors.orange; e.currentTarget.style.boxShadow = '0 4px 20px rgba(224,108,42,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ fontSize: 32 }}>{pkg.emoji || '🌍'}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.orange, background: colors.orangeLight, borderRadius: 6, padding: '3px 8px' }}>
                  {pkg.category?.replace('_',' ')}
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>{pkg.title}</h3>
              <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 12 }}>{pkg.vendor_name} · {pkg.destination} · {pkg.duration}</p>
              {pkg.description && (
                <p style={{ fontSize: 12.5, color: colors.mid, marginBottom: 14, lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {pkg.description}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: font.display, fontSize: 22, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {pkg.verified && <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, background: colors.greenLight, borderRadius: 4, padding: '2px 6px' }}>✓ VERIFIED</span>}
                  {pkg.vendor_rating > 0 && <span style={{ fontSize: 12, color: colors.muted }}>★ {pkg.vendor_rating}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

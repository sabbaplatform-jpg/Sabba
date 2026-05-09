import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import { PackageCard, Spinner, EmptyState, Input } from '../components/UI';
import { colors, font, gradients } from '../lib/styles';

const CATS = ['all','travel','volunteering','courses','jobs_abroad','accommodation','airlines'];
const CAT_LABELS = { all:'All', travel:'Travel', volunteering:'Volunteering', courses:'Courses', jobs_abroad:'Work Abroad', accommodation:'Stays', airlines:'Airlines' };
const CAT_ICONS  = { all:'🔍', travel:'🌍', volunteering:'🤝', courses:'🎓', jobs_abroad:'💼', accommodation:'🏠', airlines:'✈️' };

export default function Marketplace() {
  const { addToCart }   = useCart();
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const [packages, setPkgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCat]  = useState(params.get('category') || 'all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const p = {};
    if (category !== 'all') p.category = category;
    if (search) p.search = search;
    api.get('/packages', { params: p }).then(r => setPkgs(r.data)).finally(() => setLoading(false));
  }, [category, search]);

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
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: '8px 16px', borderRadius: 20,
                border: `1.5px solid ${category === c ? colors.orange : '#eee'}`,
                background: category === c ? colors.orangeLight : '#fff',
                color: category === c ? colors.orange : colors.mid,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>{CAT_ICONS[c]}</span> {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        {loading ? <Spinner/> : packages.length === 0 ? (
          <EmptyState emoji="🔍" title="No packages found" subtitle="Try a different search or category"/>
        ) : (
          <>
            <p style={{ fontSize: 13, color: colors.muted, fontWeight: 500, marginBottom: 20 }}>
              {packages.length} package{packages.length !== 1 ? 's' : ''} available
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 20 }}>
              {packages.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} onAddToCart={addToCart} onClick={() => navigate(`/package/${pkg.id}`)}/>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Spinner, EmptyState, Button, Input, Select, Avatar, StarRating, Modal, Textarea, StatCard, TableHeader } from '../../components/UI';
import { colors, font, gradients } from '../../lib/styles';

const CATEGORIES = ['travel','volunteering','courses','jobs_abroad','accommodation','airlines'];
const EMOJIS = ['🌍','🇯🇵','🇮🇩','🇵🇹','🇰🇪','🇪🇸','🎓','🤝','💼','✈️','🏠','🇨🇷','🇲🇦','🇧🇷','🇮🇳'];

// ── Vendor Pending State ──────────────────────────────────────
function VendorPendingScreen({ profile }) {
  const { logout } = useAuth();
  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 40, border: '1px solid #eee', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: colors.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>⏳</div>
          <h2 style={{ fontFamily: font.display, fontSize: 26, fontWeight: 700, fontStyle: 'italic', color: colors.dark, marginBottom: 12 }}>
            {profile?.onboarding_completed ? 'Pending verification' : 'Complete your profile'}
          </h2>
          <p style={{ fontSize: 14, color: colors.muted, lineHeight: 1.7, marginBottom: 24 }}>
            {profile?.onboarding_completed
              ? 'Your profile is under review by a Sabba admin. We\'ll notify you by email within 1–2 business days. Once verified, you can add packages to the marketplace.'
              : 'Please complete your vendor onboarding to submit your profile for review.'}
          </p>
          <div style={{ background: '#F7F5F2', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
            {[
              { done: true,                           text: 'Account created' },
              { done: !!profile?.onboarding_completed, text: 'Onboarding Q&A completed' },
              { done: !!profile?.verified,             text: 'Account verified by Sabba admin' },
              { done: false,                           text: 'Packages live on marketplace' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: step.done ? colors.green : '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {step.done
                    ? <span style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>✓</span>
                    : <span style={{ fontSize: 10, color: colors.faint, fontWeight: 700 }}>{i+1}</span>
                  }
                </div>
                <p style={{ fontSize: 13, color: step.done ? colors.dark : colors.muted, fontWeight: step.done ? 600 : 400 }}>{step.text}</p>
              </div>
            ))}
          </div>
          {!profile?.onboarding_completed && (
            <Button onClick={() => window.location.href = '/vendor/onboarding'} style={{ width: '100%', justifyContent: 'center' }}>
              Complete onboarding →
            </Button>
          )}
        </div>
        <button onClick={() => { logout(); window.location.href = '/login'; }} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: 13, fontFamily: font.body }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Vendor Dashboard ─────────────────────────────────────────
export function VendorDashboard() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/packages/vendor/mine'),
      api.get('/bookings/vendor'),
      api.get('/vendors/profile').catch(() => ({ data: null })),
    ]).then(([pkgs, bkgs, prof]) => {
      setPackages(pkgs.data); setBookings(bkgs.data); setProfile(prof.data);
    }).finally(() => setLoading(false));
  }, []);

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const grossEarnings   = confirmedBookings.reduce((s, b) => s + Number(b.total_amount), 0);
  const commissionTotal = confirmedBookings.reduce((s, b) => s + Number(b.commission_amount || 0), 0);
  const netEarnings     = grossEarnings - commissionTotal;

  const stats = [
    { label: 'Active Packages',   value: packages.filter(p => p.status === 'live').length, sub: `${packages.length} total`,                                  icon: '📦' },
    { label: 'Total Bookings',    value: bookings.length,                                   sub: `${confirmedBookings.length} confirmed`, icon: '📅', up: true },
    { label: 'Net Revenue',       value: `£${netEarnings.toLocaleString()}`,                sub: `after ${Math.round((commissionTotal/grossEarnings||0)*100)}% commission`,  icon: '💷', up: true },
    { label: 'Avg Rating',        value: profile?.rating > 0 ? `${profile.rating} ★` : '—', sub: `${profile?.total_reviews || 0} reviews`,                  icon: '⭐' },
  ];

  if (loading) return <Spinner/>;

  // No profile row yet = just registered, redirect to onboarding
  if (!profile) {
    return <VendorPendingScreen profile={null}/>;
  }

  // Has profile but not yet verified = pending review
  if (!profile.verified) {
    return <VendorPendingScreen profile={profile}/>;
  }

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Banner */}
      {profile?.banner_url && (
        <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
          <img src={profile.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))' }}/>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', border: '1px solid #eee' }}/>
              : <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🌍</div>
            }
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <p style={{ fontFamily: font.display, fontSize: 28, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>
                  Good morning, {user?.full_name?.split(' ')[0]}
                </p>
                {profile?.verified && <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, background: colors.greenLight, borderRadius: 6, padding: '3px 8px' }}>✓ VERIFIED</span>}
              </div>
              <p style={{ fontSize: 13.5, color: colors.muted, fontWeight: 500 }}>Manage your listings and track bookings from Sabba employers.</p>
            </div>
          </div>
          <Button onClick={() => window.location.href = '/vendor/packages'}>+ Add Package</Button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {stats.map((s, i) => <StatCard key={i} {...s}/>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          {/* Bookings table */}
          <div className="table-wrap">
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>Recent Bookings</p>
                <p style={{ fontSize: 12.5, color: colors.muted, marginTop: 2 }}>Employees via employer portals</p>
              </div>
              <Button small variant="ghost" onClick={() => window.location.href = '/vendor/bookings'}>View all →</Button>
            </div>
            <TableHeader cols={['Employee','Employer','Package','Departure','Status']} template="1.8fr 1.2fr 1.4fr 0.9fr 1fr"/>
            {bookings.length === 0 ? (
              <EmptyState emoji="📬" title="No bookings yet" subtitle="Once employees book your packages they'll appear here"/>
            ) : bookings.slice(0,6).map((b, i) => (
              <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1.4fr 0.9fr 1fr', padding: '12px 24px', alignItems: 'center', borderBottom: i < Math.min(bookings.length,6)-1 ? '1px solid #f5f5f5' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={b.employee_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}/>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{b.employee_name}</span>
                </div>
                <span style={{ fontSize: 13, color: colors.mid, fontWeight: 500 }}>{b.company_name}</span>
                <span style={{ fontSize: 13, color: colors.mid }}>{b.emoji} {b.package_title}</span>
                <span style={{ fontSize: 13, color: colors.mid }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—'}</span>
                <Badge status={b.status}/>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile card */}
            <div className="card" style={{ padding: 22 }}>
              <StarRating rating={Math.round(profile?.rating || 0)} size={18}/>
              <p style={{ fontSize: 12.5, color: colors.muted, marginTop: 6, fontWeight: 500 }}>
                {profile?.rating > 0 ? `${profile.rating} / 5` : 'No ratings yet'} · {profile?.total_reviews || 0} reviews
              </p>
              {profile?.about && <p style={{ fontSize: 13, color: colors.mid, lineHeight: 1.5, marginTop: 12 }}>{profile.about}</p>}
              <button onClick={() => window.location.href = '/vendor/profile'} style={{ marginTop: 14, fontSize: 12, color: colors.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: font.body }}>Edit profile →</button>
            </div>

            {/* Activity */}
            <div className="card" style={{ padding: 22, flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 14 }}>Recent Activity</p>
              {bookings.slice(0,4).map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: i<3?12:0, marginBottom: i<3?12:0, borderBottom: i<3?'1px solid #f5f5f5':'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: colors.orange, flexShrink: 0, marginTop: 5 }}/>
                  <div>
                    <p style={{ fontSize: 12.5, color: colors.dark, lineHeight: 1.4, fontWeight: 500 }}>{b.employee_name} booked {b.package_title}</p>
                    <p style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>via {b.company_name}</p>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && <p style={{ fontSize: 13, color: colors.muted }}>No activity yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Packages ──────────────────────────────────────────
export function VendorPackages() {
  const [packages,     setPackages]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editPkg,      setEditPkg]      = useState(null);
  const [showImport,   setShowImport]   = useState(false);
  const [importFile,   setImportFile]   = useState(null);
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fetchPackages = () => {
    api.get('/packages/vendor/mine').then(r => setPackages(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchPackages(); }, []);

  const toggleStatus = async (pkg) => {
    await api.patch(`/packages/${pkg.id}`, { status: pkg.status === 'live' ? 'draft' : 'live' });
    fetchPackages();
  };
  const deletePackage = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    await api.delete(`/packages/${id}`);
    fetchPackages();
  };

  const downloadTemplate = () => {
    const rows = [
      'title,description,category,destination,duration,price_gbp,emoji,image_url,status,start_date,end_date',
      '"Japan Cultural Immersion","Explore Tokyo and Kyoto with guided cultural experiences.","travel","Japan","3 weeks",2800,"🗼","https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800","live"',
      '# COLUMN GUIDE:',
      '# category: travel | volunteering | courses | work_abroad | accommodation | airlines',
      '# status: live | draft (default: draft)',
      '# price_gbp: number only e.g. 2800',
      '# image_url: full https:// URL (optional)',
      '# start_date: YYYY-MM-DD format (default: 2026-01-01)',
      '# end_date: YYYY-MM-DD format (default: 2099-12-31 for ongoing)',
      '# Required: title, description, category, destination, duration, price_gbp',
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    a.download = 'sabba_packages_template.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true); setImportResult(null);
    try {
      // Parse CSV client-side
      const text = await importFile.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      if (lines.length < 2) { setImportResult({ error: 'CSV must have a header row and at least one data row' }); setImporting(false); return; }

      const parseRow = (line) => {
        const cols = []; let cur = ''; let inQuote = false;
        for (const ch of line) {
          if (ch === '"') inQuote = !inQuote;
          else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
          else cur += ch;
        }
        cols.push(cur.trim());
        return cols.map(v => v.replace(/^"|"$/g,'').trim());
      };

      const headers = parseRow(lines[0]).map(h => h.toLowerCase().trim());
      const packages = lines.slice(1).map(line => {
        const vals = parseRow(line);
        const row = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ''; });
        return row;
      }).filter(r => Object.values(r).some(v => v)); // skip empty rows

      const { data } = await api.post('/packages/import', { packages });
      setImportResult(data);
      if (data.created > 0) fetchPackages();
    } catch (err) {
      setImportResult({ error: err.response?.data?.error || 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Vendor Portal</p>
            <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>My Packages</h1>
            <p style={{ color: colors.muted, fontSize: 14, marginTop: 4, fontWeight: 500 }}>Manage your listings on the Sabba marketplace</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowImport(s => !s); setImportResult(null); setImportFile(null); }}
              style={{ background: showImport ? colors.orangeLight : '#F7F5F2', color: showImport ? colors.orange : colors.mid, border: `1.5px solid ${showImport ? colors.orange : '#eee'}`, borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              ⬆ Import CSV
            </button>
            <Button onClick={() => { setEditPkg(null); setShowForm(true); }}>+ Add Package</Button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 40px' }}>

        {/* CSV Import Panel */}
        {showImport && (
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '24px 28px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Import packages from CSV</h3>
                <p style={{ fontSize: 13.5, color: colors.muted }}>Upload multiple packages at once. Max 200 packages per file.</p>
              </div>
              <button onClick={() => { setShowImport(false); setImportFile(null); setImportResult(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: colors.muted }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, background: '#F7F5F2', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>1️⃣</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>Download the template</p>
                  <p style={{ fontSize: 12, color: colors.muted }}>Fill in your packages using the correct column format.</p>
                </div>
                <button onClick={downloadTemplate}
                  style={{ background: colors.dark, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, flexShrink: 0 }}>
                  ⬇ Template
                </button>
              </div>
              <div style={{ flex: 1, background: '#F7F5F2', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>2️⃣</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>Upload your CSV</p>
                  <p style={{ fontSize: 12, color: colors.muted }}>{importFile ? importFile.name : 'Choose a completed CSV file.'}</p>
                </div>
                <label style={{ flexShrink: 0, cursor: 'pointer' }}>
                  <span style={{ background: importFile ? colors.greenLight : '#fff', color: importFile ? colors.green : colors.mid, border: `1.5px solid ${importFile ? colors.green : '#eee'}`, borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, fontFamily: font.body }}>
                    {importFile ? '✓ Ready' : 'Choose file'}
                  </span>
                  <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { setImportFile(e.target.files[0]); setImportResult(null); }}/>
                </label>
              </div>
            </div>

            {importFile && !importResult && (
              <button onClick={handleImport} disabled={importing}
                style={{ width: '100%', background: importing ? '#eee' : colors.orange, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: importing ? 'default' : 'pointer', fontFamily: font.body, marginBottom: 12 }}>
                {importing ? 'Importing…' : `Import packages from ${importFile.name}`}
              </button>
            )}

            {importResult && (
              <div style={{ borderRadius: 10, padding: '14px 18px', background: importResult.error ? colors.redLight : colors.greenLight, border: `1px solid ${importResult.error ? colors.red : colors.green}`, marginBottom: 12 }}>
                {importResult.error
                  ? <p style={{ fontSize: 13.5, color: colors.red, fontWeight: 700 }}>⚠ {importResult.error}</p>
                  : <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: colors.green, marginBottom: importResult.skipped > 0 ? 6 : 0 }}>
                        ✓ {importResult.created} package{importResult.created !== 1 ? 's' : ''} imported successfully
                      </p>
                      {importResult.skipped > 0 && <p style={{ fontSize: 13, color: '#b45309' }}>⚠ {importResult.skipped} row{importResult.skipped !== 1 ? 's' : ''} skipped — missing required fields</p>}
                      {importResult.errors?.slice(0,3).map((e,i) => <p key={i} style={{ fontSize: 12, color: colors.red, marginTop: 4 }}>Row {e.row}: {e.message}</p>)}
                    </div>
                }
              </div>
            )}

            <div style={{ padding: '10px 14px', background: '#F7F5F2', borderRadius: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Required columns</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
                {[['title','*'],['description','*'],['category','travel / volunteering / courses / work_abroad / accommodation / airlines *'],['destination','*'],['duration','e.g. 3 weeks *'],['price_gbp','number *'],['emoji','optional'],['image_url','https:// optional'],['status','live or draft']].map(([c,d])=>(
                  <span key={c} style={{ fontSize: 11, color: colors.muted }}>
                    <strong style={{ color: colors.orange, fontFamily: 'monospace' }}>{c}</strong> {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {showForm && <PackageForm initial={editPkg} onClose={() => { setShowForm(false); setEditPkg(null); }} onSaved={() => { setShowForm(false); setEditPkg(null); fetchPackages(); }}/>}

        {loading ? <Spinner/> : packages.length === 0 ? (
          <EmptyState emoji="📦" title="No packages yet" subtitle="Add your first package to appear on the Sabba marketplace" action={<Button onClick={() => setShowForm(true)}>Add Package</Button>}/>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {packages.map(pkg => {
              const gradient = gradients[pkg.category] || gradients.default;
              return (
                <div key={pkg.id} className="card" style={{ overflow: 'hidden' }}>
                  {/* Image */}
                  <div style={{ height: 160, background: gradient, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {pkg.image_url
                      ? <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      : <span style={{ fontSize: 52 }}>{pkg.emoji || '🌍'}</span>
                    }
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.42)', borderRadius: 6, padding: '4px 8px', backdropFilter: 'blur(8px)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {pkg.category?.replace('_',' ')}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                      <Badge status={pkg.status}/>
                    </div>
                    {pkg.admin_status && pkg.admin_status !== 'approved' && (
                      <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                        <Badge status={pkg.admin_status}/>
                      </div>
                    )}
                  </div>
                  {/* Body */}
                  <div style={{ padding: '16px 18px 18px' }}>
                    <p style={{ fontSize: 14.5, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>{pkg.title}</p>
                    <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 14, fontWeight: 500 }}>{pkg.destination} · {pkg.duration}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {pkg.display_status === 'expired' ? (
                        <span style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, fontFamily: font.body }}>
                          Expired
                        </span>
                      ) : pkg.display_status === 'expiring_soon' ? (
                        <span style={{ background: '#FEF3C7', color: '#D97706', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, fontFamily: font.body }}>
                          ⏳ Expires in {pkg.days_until_expiry}d
                        </span>
                      ) : (
                        <button onClick={() => toggleStatus(pkg)} style={{ background: pkg.status === 'live' ? colors.redLight : colors.greenLight, color: pkg.status === 'live' ? colors.red : colors.green, border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                          {pkg.status === 'live' ? 'Unpublish' : 'Publish'}
                        </button>
                      )}
                        <button onClick={() => { setEditPkg(pkg); setShowForm(true); }} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Edit</button>
                        <button onClick={() => deletePackage(pkg.id)} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vendor Bookings ──────────────────────────────────────────
export function VendorBookings() {
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [notesModal,  setNotesModal]  = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [notes,       setNotes]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');

  const fetchBookings = () => {
    api.get('/bookings/vendor').then(r => setBookings(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const sendNotes = async () => {
    setSaving(true);
    await api.patch(`/vendors/bookings/${notesModal.id}/notes`, { vendor_notes: notes });
    setSaving(false); setNotesModal(null); setNotes('');
    fetchBookings();
  };

  const confirmBooking = async (id) => {
    await api.patch(`/bookings/${id}/status`, { status: 'confirmed' });
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
  };

  const allStatuses = ['all', 'pending', 'approved', 'vendor_confirmed', 'confirmed', 'cancelled'];
  const filtered = bookings.filter(b => {
    const matchFilter = filter === 'all' || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.employee_name?.toLowerCase().includes(q) || b.package_title?.toLowerCase().includes(q) || b.company_name?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // Pipeline counts
  const pendingHR     = bookings.filter(b => b.status === 'pending' && (b.payment_method||'payroll') === 'payroll').length;
  const awaitingVendor = bookings.filter(b => b.status === 'approved').length;
  const confirmed     = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Booking Review Modal */}
      {reviewModal && (
        <Modal title="Booking Details" onClose={() => setReviewModal(null)} width={520}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, padding: 14, background: '#F7F5F2', borderRadius: 12, alignItems: 'center' }}>
            <Avatar initials={reviewModal.employee_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()} size={44}/>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>{reviewModal.employee_name}</p>
              <p style={{ fontSize: 12.5, color: colors.muted }}>{reviewModal.company_name}</p>
            </div>
            <div style={{ marginLeft: 'auto' }}><Badge status={reviewModal.status}/></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Package',     value: `${reviewModal.emoji || ''} ${reviewModal.package_title}` },
              { label: 'Destination', value: reviewModal.destination },
              { label: 'Departure',   value: reviewModal.departure_date ? new Date(reviewModal.departure_date).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'}) : '—' },
              { label: 'Payment',     value: reviewModal.payment_method === 'card' ? 'Card (Stripe)' : `Payroll — ${reviewModal.payroll_months} months` },
              { label: 'Monthly',     value: reviewModal.payment_method === 'payroll' ? `£${Number(reviewModal.monthly_amount||0).toFixed(2)}/mo` : '—' },
              { label: 'Total Value', value: `£${Number(reviewModal.total_amount||0).toLocaleString()}` },
            ].map((item, i) => (
              <div key={i} style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{item.value || '—'}</p>
              </div>
            ))}
          </div>
          {/* Payroll pipeline explainer */}
          {(reviewModal.payment_method||'payroll') === 'payroll' && reviewModal.status === 'pending' && (
            <div style={{ background: colors.orangeLight, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: colors.orange, marginBottom: 4 }}>Awaiting HR approval</p>
              <p style={{ fontSize: 12, color: colors.orange }}>This payroll booking is pending HR review. Once HR approves, you'll be asked to confirm the booking.</p>
            </div>
          )}
          {reviewModal.status === 'approved' && (
            <div style={{ background: colors.greenLight, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: colors.green, marginBottom: 4 }}>Ready for your confirmation</p>
              <p style={{ fontSize: 12, color: colors.green }}>{reviewModal.payment_method === 'card' ? 'Card payment confirmed. Please review and confirm this booking.' : 'HR has approved this payroll booking. Please confirm you can fulfil it.'}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setReviewModal(null)}>Close</Button>
            {reviewModal.status === 'approved' && (
              <button onClick={() => { confirmBooking(reviewModal.id); setReviewModal(null); }}
                style={{ background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                ✓ Confirm booking
              </button>
            )}
          </div>
        </Modal>
      )}

      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Vendor Portal</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 16 }}>Bookings</h1>

          {/* Pipeline summary */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Awaiting HR approval', count: pendingHR,      color: colors.amber,  bg: colors.amberLight  },
              { label: 'Awaiting your confirmation', count: awaitingVendor, color: colors.green,  bg: colors.greenLight  },
              { label: 'Confirmed',           count: confirmed,        color: colors.orange, bg: colors.orangeLight },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: s.bg, borderRadius: 20, padding: '7px 16px', border: `1px solid ${s.color}22` }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }}/>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: s.color }}>{s.count} {s.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F5F2', border: '1px solid #eee', borderRadius: 10, padding: '9px 16px', flex: 1, maxWidth: 360 }}>
              <svg width="15" height="15" fill="none" stroke={colors.faint} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee, package, employer…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: colors.dark, width: '100%', fontFamily: font.body }}/>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {allStatuses.map(s => (
                <button key={s} onClick={() => setFilter(s)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${filter===s ? colors.orange : '#eee'}`, background: filter===s ? colors.orangeLight : '#fff', color: filter===s ? colors.orange : colors.mid, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                  {s === 'vendor_confirmed' ? 'Vendor Confirmed' : s.charAt(0).toUpperCase()+s.slice(1)} ({s==='all' ? bookings.length : bookings.filter(b=>b.status===s).length})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        <div className="table-wrap">
          <TableHeader cols={['Employee','Employer','Package','Payment','Total','Status','Actions']} template="1.8fr 1.2fr 1.4fr 0.9fr 0.9fr 1fr 1.6fr"/>
          {loading ? <Spinner/> : filtered.length === 0 ? (
            <EmptyState emoji="📬" title="No bookings yet" subtitle="Bookings from employees will appear here"/>
          ) : filtered.map((b, i) => (
            <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1.4fr 0.9fr 0.9fr 1fr 1.6fr', padding: '12px 24px', alignItems: 'center', borderBottom: i<filtered.length-1?'1px solid #f5f5f5':'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={b.employee_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}/>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{b.employee_name}</p>
                  <p style={{ fontSize: 10.5, color: colors.faint }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}) : 'No date'}</p>
                </div>
              </div>
              <span style={{ fontSize: 13, color: colors.mid, fontWeight: 500 }}>{b.company_name}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.emoji} {b.package_title}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: (b.payment_method||'payroll')==='card' ? colors.blue : colors.orange, background: (b.payment_method||'payroll')==='card' ? colors.blueLight : colors.orangeLight, borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>{(b.payment_method||'payroll')=='card' ? 'Card' : 'Payroll'}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</span>
              <Badge status={b.status}/>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setReviewModal(b)} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Review</button>
                {b.status === 'approved' && (
                  <button onClick={() => confirmBooking(b.id)} style={{ background: colors.greenLight, color: colors.green, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>✓ Confirm</button>
                )}
                <button onClick={() => { setNotesModal(b); setNotes(b.vendor_notes || ''); }} style={{ background: colors.orangeLight, color: colors.orange, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Send Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {notesModal && (
        <Modal title={`Send details to ${notesModal.employee_name}`} onClose={() => setNotesModal(null)} width={480}>
          <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 16, lineHeight: 1.6 }}>Send booking details, meeting points, packing lists or any important information about their adventure.</p>
          <Textarea label="Message" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Please arrive at Heathrow Terminal 3 by 6am…"/>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setNotesModal(null)}>Cancel</Button>
            <Button onClick={sendNotes} disabled={saving || !notes}>{saving ? 'Sending…' : 'Send to employee'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}



// ── Vendor Earnings ──────────────────────────────────────────
export function VendorEarnings() {
  const [data, setData]   = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/vendors/earnings'),
      api.get('/bookings/vendor'),
    ]).then(([e, b]) => { setData(e.data); setBookings(b.data); }).finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    const headers = ['Employee','Employer','Package','Destination','Departure','Payroll Months','Monthly Amount (£)','Total Amount (£)','Status'];
    const rows = bookings.map(b => [
      b.employee_name || '',
      b.company_name || '',
      b.package_title || '',
      b.destination || '',
      b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB') : '',
      b.payroll_months || '',
      Number(b.monthly_amount || 0).toFixed(2),
      Number(b.total_amount || 0).toFixed(2),
      b.status || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sabba-earnings-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <Spinner/>;

  const monthly  = data?.monthly || [];
  const totals   = data?.totals  || {};
  const maxRev   = Math.max(...monthly.map(m => Number(m.revenue || 0)), 1);

  const stats = [
    { label: 'Total Bookings',    value: totals.total_bookings || 0, icon: '📅', up: true },
    { label: 'Confirmed Revenue', value: `£${Number(totals.confirmed_revenue || 0).toLocaleString()}`, icon: '💷', up: true },
    { label: 'Avg Rating',        value: totals.avg_rating ? `${Number(totals.avg_rating).toFixed(1)} ★` : '—', icon: '⭐' },
    { label: 'This Month',        value: `£${Number(monthly[0]?.revenue || 0).toLocaleString()}`, icon: '📈', up: true },
  ];

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Vendor Portal</p>
            <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Earnings</h1>
            <p style={{ color: colors.muted, fontSize: 14, marginTop: 4, fontWeight: 500 }}>Analytics and revenue from your Sabba packages.</p>
          </div>
          <button onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, boxShadow: '0 2px 8px rgba(29,158,117,0.3)', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#0f6e56'}
            onMouseLeave={e => e.currentTarget.style.background=colors.green}>
            <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export .csv
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {stats.map((s, i) => <StatCard key={i} {...s}/>)}
        </div>

        {/* Dark earnings hero */}
        <div style={{ background: '#1C1916', borderRadius: 20, padding: '36px 40px', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -80, top: -80, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.1)' }}/>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Confirmed Revenue</p>
            <p style={{ fontFamily: font.display, fontSize: 56, fontWeight: 700, color: '#f5a066', lineHeight: 1, marginBottom: 8 }}>£{Number(totals.confirmed_revenue || 0).toLocaleString()}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>From {totals.total_bookings || 0} total bookings</p>
          </div>
          {/* Bar chart */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 16 }}>Monthly Revenue</p>
            {monthly.length === 0 ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No data yet</p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
                  {[...monthly].reverse().map((m, i) => {
                    const pct = (Number(m.revenue || 0) / maxRev) * 100;
                    const isLatest = i === monthly.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                        {Number(m.revenue) > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: isLatest ? '#f5a066' : 'rgba(255,255,255,0.25)' }}>£{Math.round(m.revenue/1000)}k</span>}
                        <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 4)}%`, background: isLatest ? `linear-gradient(to top, ${colors.orange}, #f5a066)` : 'rgba(255,255,255,0.12)' }}/>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {[...monthly].reverse().map((m, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{new Date(m.month).toLocaleDateString('en-GB',{month:'short'})}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Monthly breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Monthly Breakdown</p>
            {monthly.length === 0 ? <p style={{ fontSize: 13, color: colors.muted }}>No data yet</p> : monthly.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i<monthly.length-1?12:0, marginBottom: i<monthly.length-1?12:0, borderBottom: i<monthly.length-1?'1px solid #f5f5f5':'none' }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{new Date(m.month).toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</p>
                  <p style={{ fontSize: 11.5, color: colors.muted, fontWeight: 500 }}>{m.bookings} booking{m.bookings!==1?'s':''}</p>
                </div>
                <p style={{ fontFamily: font.display, fontSize: 20, color: i===0 ? colors.orange : colors.dark, fontWeight: 700 }}>£{Number(m.revenue||0).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Recent Confirmed Bookings</p>
            {bookings.filter(b => b.status === 'confirmed').slice(0,5).map((b, i, arr) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i<arr.length-1?12:0, marginBottom: i<arr.length-1?12:0, borderBottom: i<arr.length-1?'1px solid #f5f5f5':'none' }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{b.employee_name}</p>
                  <p style={{ fontSize: 11.5, color: colors.muted }}>{b.package_title} · {b.company_name}</p>
                </div>
                <p style={{ fontFamily: font.display, fontSize: 18, fontWeight: 700, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</p>
              </div>
            ))}
            {bookings.filter(b => b.status === 'confirmed').length === 0 && <p style={{ fontSize: 13, color: colors.muted }}>No confirmed bookings yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Profile ───────────────────────────────────────────
export function VendorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [form, setForm]       = useState({});

  useEffect(() => {
    api.get('/vendors/profile').then(r => {
      setProfile(r.data);
      setForm({ company_name: r.data.company_name || '', about: r.data.about || '', website: r.data.website || '', avatar_url: r.data.avatar_url || '', banner_url: r.data.banner_url || '' });
    }).finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    await api.patch('/vendors/profile', form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Banner preview */}
      {form.banner_url && (
        <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
          <img src={form.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))' }}/>
        </div>
      )}

      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Vendor Portal</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Vendor Profile</h1>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 40px' }}>
        <div className="card" style={{ padding: 32 }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ position: 'relative' }}>
              {form.avatar_url
                ? <img src={form.avatar_url} alt="avatar" style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover', border: '1px solid #eee' }}/>
                : <div style={{ width: 72, height: 72, borderRadius: 18, background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🌍</div>
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: colors.dark }}>{profile?.company_name}</p>
                {profile?.verified && <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, background: colors.greenLight, borderRadius: 6, padding: '3px 8px' }}>✓ VERIFIED</span>}
              </div>
              <p style={{ fontSize: 13.5, color: colors.muted, fontWeight: 500 }}>{profile?.category} · Sabba Marketplace Partner</p>
              <StarRating rating={Math.round(profile?.rating || 0)} size={16}/>
            </div>
          </div>

          {/* Avatar URL */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Avatar image URL</label>
            <input value={form.avatar_url} onChange={set('avatar_url')} placeholder="https://… (square image, min 200×200px)" style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, fontWeight: 500 }}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Company name</label>
              <input value={form.company_name} onChange={set('company_name')} style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, fontWeight: 500 }}/>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Website</label>
              <input value={form.website} onChange={set('website')} placeholder="https://yourcompany.com" style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, fontWeight: 500 }}/>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>About us</label>
            <textarea value={form.about} onChange={set('about')} placeholder="Describe your company and what makes your packages special…"
              style={{ border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, width: '100%', resize: 'vertical', minHeight: 100, fontWeight: 500 }}/>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Banner image URL</label>
            <input value={form.banner_url} onChange={set('banner_url')} placeholder="https://… (recommended: 1400×400px)" style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, fontWeight: 500 }}/>
            {form.banner_url && <p style={{ fontSize: 11.5, color: colors.faint, marginTop: 5 }}>Preview shown at the top of this page ↑</p>}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
            {saved && <span style={{ fontSize: 13, color: colors.green, fontWeight: 700 }}>✓ Saved!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Package Form Modal ───────────────────────────────────────
// ── Package image uploader ────────────────────────────────────
function PackageImageUploader({ imageUrl, onUpload, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB'); return; }
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'packages');
      fd.append('folder', 'images');
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpload(data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed — try again');
    } finally { setUploading(false); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
        Package image <span style={{ fontWeight: 400, color: colors.faint }}>(optional)</span>
      </label>

      {!imageUrl ? (
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `2px dashed ${dragOver ? colors.orange : uploading ? colors.green : '#ddd'}`,
            borderRadius: 12, padding: '24px 20px', textAlign: 'center',
            background: dragOver ? colors.orangeLight : '#fafafa',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
          onClick={() => !uploading && fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}/>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{uploading ? '⏳' : '🖼️'}</div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: uploading ? colors.green : colors.mid, marginBottom: 4 }}>
            {uploading ? 'Uploading…' : 'Click to upload or drag & drop'}
          </p>
          <p style={{ fontSize: 12, color: colors.faint }}>
            {uploading ? 'Please wait' : 'JPG, PNG, WebP · Max 10MB · Landscape recommended'}
          </p>
          {error && <p style={{ fontSize: 12, color: colors.red, fontWeight: 600, marginTop: 8 }}>{error}</p>}
        </div>
      ) : (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #eee' }}>
          <img src={imageUrl} alt="Package preview"
            style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
            onError={() => onRemove()}/>
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              📷 Change
            </button>
            <button type="button" onClick={onRemove}
              style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              ✕
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}/>
        </div>
      )}
      <p style={{ fontSize: 11, color: colors.faint, marginTop: 4 }}>
        If left blank, a colour gradient based on the category will be shown instead.
      </p>
    </div>
  );
}

function PackageForm({ initial, onClose, onSaved }) {
  const stripDate = v => v ? String(v).split('T')[0] : '';
  const [form, setForm]   = useState(initial ? {
    ...initial,
    start_date: stripDate(initial.start_date) || '2026-01-01',
    end_date:   stripDate(initial.end_date)   || '2099-12-31',
  } : { title: '', description: '', category: 'travel', destination: '', duration: '', price_gbp: '', emoji: '🌍', image_url: '', start_date: '2026-01-01', end_date: '2099-12-31' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (initial) await api.patch(`/packages/${initial.id}`, form);
      else         await api.post('/packages', form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={initial ? 'Edit Package' : 'Add New Package'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Package title" required value={form.title} onChange={set('title')} placeholder="Japan Explorer — 3 Weeks"/>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Description</label>
          <textarea value={form.description} onChange={set('description')} placeholder="Describe this adventure for employees…"
            style={{ border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, width: '100%', resize: 'vertical', minHeight: 70, fontWeight: 500 }}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Category" value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
          </Select>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Emoji</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {EMOJIS.map(em => (
                <span key={em} onClick={() => setForm(f => ({...f, emoji: em}))}
                  style={{ fontSize: 18, cursor: 'pointer', padding: 3, borderRadius: 4, background: form.emoji === em ? colors.orangeLight : 'transparent', border: form.emoji === em ? `1px solid ${colors.orange}` : '1px solid transparent' }}>
                  {em}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Destination" required value={form.destination} onChange={set('destination')} placeholder="Tokyo & Kyoto"/>
          <Input label="Duration" required value={form.duration} onChange={set('duration')} placeholder="3 weeks"/>
        </div>
        <Input label="Price (£)" type="number" required min="1" value={form.price_gbp} onChange={set('price_gbp')} placeholder="3200"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Availability start date</label>
            <input type="date" value={form.start_date || '2026-01-01'} onChange={set('start_date')}
              style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, fontWeight: 500 }}/>
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Availability end date <span style={{ fontWeight: 400, color: colors.orange }}>*</span></label>
            <input type="date" value={form.end_date || '2099-12-31'} onChange={set('end_date')}
              style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, fontWeight: 500 }}/>
            <p style={{ fontSize: 11, color: colors.faint, marginTop: 4 }}>Leave as-is for an ongoing package. Set a specific date if the package has a fixed end.</p>
          </div>
        </div>
        <PackageImageUploader
          imageUrl={form.image_url}
          onUpload={url => setForm(f => ({ ...f, image_url: url }))}
          onRemove={() => setForm(f => ({ ...f, image_url: '' }))}
        />
        {error && <p style={{ color: colors.red, fontSize: 13, fontWeight: 600 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Create package'}</Button>
        </div>
      </form>
    </Modal>
  );
}

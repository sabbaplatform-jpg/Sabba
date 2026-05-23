import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Avatar, Spinner, EmptyState, Button, Modal, TableHeader } from '../../components/UI';
import { colors, font } from '../../lib/styles';

// ── Shared admin nav ──────────────────────────────────────────
function AdminNav({ active }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const links = [
    { id: 'dashboard',  label: 'Dashboard',     icon: '🏠', path: '/admin' },
    { id: 'employers',  label: 'Employers',      icon: '🏢', path: '/admin/employers' },
    { id: 'vendors',    label: 'Vendors',         icon: '🏪', path: '/admin/vendors' },
    { id: 'analytics',  label: 'Analytics',       icon: '📊', path: '/admin/analytics' },
    { id: 'billing',    label: 'Billing',          icon: '💳', path: '/admin/billing' },
    { id: 'flags',      label: 'Feature flags',   icon: '🚩', path: '/admin/flags' },
    { id: 'audit',      label: 'Audit log',        icon: '📋', path: '/admin/audit' },
  ];
  return (
    <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 220, background: '#1C1916', display: 'flex', flexDirection: 'column', zIndex: 200 }}>
      <div style={{ padding: '24px 20px 20px' }}>
        <p style={{ fontFamily: font.display, fontSize: 20, color: '#fff', fontStyle: 'italic', fontWeight: 700 }}>Sabba</p>
        <p style={{ fontSize: 10, fontWeight: 700, color: colors.orange, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Super Admin</p>
      </div>
      <div style={{ flex: 1, padding: '8px 12px' }}>
        {links.map(l => (
          <div key={l.id} onClick={() => navigate(l.path)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 2, cursor: 'pointer', background: active === l.id ? 'rgba(212,98,42,0.15)' : 'transparent', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (active !== l.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (active !== l.id) e.currentTarget.style.background = 'transparent'; }}>
            <span style={{ fontSize: 16 }}>{l.icon}</span>
            <span style={{ fontSize: 13.5, fontWeight: active === l.id ? 700 : 500, color: active === l.id ? colors.orange : 'rgba(255,255,255,0.65)' }}>{l.label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div onClick={() => { logout(); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: 0.5 }}>
          <span style={{ fontSize: 16 }}>↩</span>
          <span style={{ fontSize: 13, color: '#fff' }}>Sign out</span>
        </div>
      </div>
    </div>
  );
}

function AdminLayout({ children, active }) {
  return (
    <div style={{ fontFamily: font.body, display: 'flex', minHeight: '100vh', background: '#F7F5F2' }}>
      <AdminNav active={active}/>
      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '20px 22px', borderTop: `3px solid ${accent || colors.orange}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
      </div>
      <p style={{ fontFamily: font.display, fontSize: 32, fontWeight: 700, color: colors.dark, lineHeight: 1, marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: colors.muted }}>{label}</p>
      {sub && <p style={{ fontSize: 11.5, color: colors.faint, marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 1. DASHBOARD
// ═══════════════════════════════════════════════════════════
export function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); const iv = setInterval(fetch, 60000); return () => clearInterval(iv); }, [fetch]);

  const months = stats?.monthly?.slice().reverse() || [];
  const maxGmv = Math.max(...months.map(m => Number(m.gmv)), 1);

  return (
    <AdminLayout active="dashboard">
      <div style={{ background: '#1C1916', padding: '32px 36px 28px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(212,98,42,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
          Super Admin · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 style={{ fontFamily: font.display, fontSize: 36, color: '#fff', fontWeight: 700, fontStyle: 'italic' }}>Platform overview</h1>
        {stats?.pending_vendors > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,98,42,0.15)', border: '1px solid rgba(212,98,42,0.3)', borderRadius: 20, padding: '5px 14px', marginTop: 12 }}>
            <span style={{ fontSize: 12 }}>⚠</span>
            <span style={{ fontSize: 12, color: colors.orange, fontWeight: 700 }}>{stats.pending_vendors} vendor{stats.pending_vendors !== 1 ? 's' : ''} awaiting verification</span>
          </div>
        )}
      </div>

      <div style={{ padding: '28px 36px' }}>
        {loading ? <Spinner/> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 24 }}>
              <StatCard icon="🏢" label="Employer clients"  value={stats.companies}  sub="active accounts"         accent={colors.blue}/>
              <StatCard icon="👤" label="Total employees"   value={stats.employees.toLocaleString()} sub="across all companies"   accent={colors.green}/>
              <StatCard icon="🏪" label="Vendor partners"   value={stats.vendors}    sub={`${stats.pending_vendors} pending`} accent={colors.orange}/>
              <StatCard icon="📋" label="Total bookings"    value={stats.bookings.toLocaleString()}  sub="all time"               accent="#7B3FA0"/>
              <StatCard icon="💷" label="Platform GMV"      value={`£${Math.round(stats.gmv / 1000)}K`} sub="confirmed value" accent={colors.green}/>
              <StatCard icon="⭐" label="Pending vendors"   value={stats.pending_vendors} sub="need verification"    accent={stats.pending_vendors > 0 ? colors.red : colors.green}/>
            </div>

            {/* GMV chart */}
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Monthly GMV (last 6 months)</p>
              <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 20 }}>Confirmed booking value across all employer clients</p>
              {months.length === 0 ? (
                <p style={{ fontSize: 13, color: colors.muted }}>No booking data yet</p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
                  {months.map((m, i) => {
                    const pct = (Number(m.gmv) / maxGmv) * 100;
                    const isLast = i === months.length - 1;
                    const monthLabel = new Date(m.month).toLocaleDateString('en-GB', { month: 'short' });
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                        {Number(m.gmv) > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: isLast ? colors.orange : colors.faint }}>£{Math.round(Number(m.gmv)/1000)}K</span>}
                        <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 4)}%`, background: isLast ? colors.orange : '#E8E4DF' }}/>
                        <span style={{ fontSize: 10.5, color: colors.faint, fontWeight: 600 }}>{monthLabel}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. EMPLOYERS
// ═══════════════════════════════════════════════════════════
export function AdminEmployers() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [companies,   setCompanies]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [createForm,  setCreateForm]  = useState({ name: '', admin_name: '', admin_email: '', plan: 'starter' });
  const [creating,    setCreating]    = useState(false);
  const [search,      setSearch]      = useState('');
  const [impersonating, setImpersonating] = useState(null);

  useEffect(() => {
    api.get('/admin/companies').then(r => setCompanies(r.data)).finally(() => setLoading(false));
  }, []);

  const createCompany = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/admin/companies', createForm);
      setCompanies(cs => [data, ...cs]);
      setShowCreate(false);
      setCreateForm({ name: '', admin_name: '', admin_email: '', plan: 'starter' });
    } catch (err) { alert(err.response?.data?.error || 'Failed to create'); }
    finally { setCreating(false); }
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/companies/${id}`, { status });
    setCompanies(cs => cs.map(c => c.id === id ? { ...c, status } : c));
  };

  const impersonate = async (company) => {
    setImpersonating(company.id);
    try {
      // Get the first HR admin for this company
      const hrs = await api.get('/admin/companies').then(r => r.data);
      const target = hrs.find(c => c.id === company.id);
      if (!target) { alert('No HR admin found for this company'); return; }
      // We'll need to get HR users — for now navigate to their context
      alert(`Context switching to ${company.name} — full impersonation requires HR user selection. Coming in next build.`);
    } catch { alert('Failed to switch context'); }
    finally { setImpersonating(null); }
  };

  const filtered = companies.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()));

  const PLAN_COLORS = { starter: colors.muted, growth: colors.blue, enterprise: colors.orange, global: '#7B3FA0' };
  const STATUS_COLORS = { active: colors.green, suspended: colors.red, trial: colors.orange, churned: colors.faint };

  return (
    <AdminLayout active="employers">
      {showCreate && (
        <Modal title="Create employer account" onClose={() => setShowCreate(false)} width={520}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            {[
              { key: 'name',        label: 'Company name',    placeholder: 'e.g. Barclays PLC', wide: true },
              { key: 'admin_name',  label: 'HR admin name',   placeholder: 'e.g. Sarah Chen' },
              { key: 'admin_email', label: 'HR admin email',  placeholder: 'sarah@company.com' },
            ].map(f => (
              <div key={f.key} style={{ gridColumn: f.wide ? '1 / -1' : undefined }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input value={createForm[f.key]} onChange={e => setCreateForm(cf => ({ ...cf, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '9px 13px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>Subscription plan</label>
              <select value={createForm.plan} onChange={e => setCreateForm(cf => ({ ...cf, plan: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '9px 13px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', background: '#fff' }}>
                {['starter','growth','enterprise','global'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: colors.muted }}>A HR admin account will be created with temporary password <strong style={{ color: colors.dark }}>Welcome2Sabba!</strong></p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createCompany} disabled={creating || !createForm.name || !createForm.admin_email}>{creating ? 'Creating…' : 'Create employer'}</Button>
          </div>
        </Modal>
      )}

      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
            <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Employer accounts</h1>
          </div>
          <Button onClick={() => setShowCreate(true)}>+ New employer</Button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F5F2', border: '1px solid #eee', borderRadius: 10, padding: '8px 14px', maxWidth: 380 }}>
          <svg width="14" height="14" fill="none" stroke={colors.faint} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: colors.dark, width: '100%', fontFamily: font.body }}/>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>
        <div className="table-wrap">
          <TableHeader cols={['Company','Plan','Employees','Bookings','GMV','Status','Actions']} template="2fr 0.9fr 0.8fr 0.8fr 1fr 0.9fr 1.6fr"/>
          {loading ? <Spinner/> : filtered.length === 0 ? (
            <EmptyState emoji="🏢" title="No employers yet" subtitle="Create your first employer account above"/>
          ) : filtered.map((co, i) => (
            <div key={co.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '2fr 0.9fr 0.8fr 0.8fr 1fr 0.9fr 1.6fr', padding: '12px 24px', alignItems: 'center', borderBottom: i < filtered.length-1 ? '1px solid #f5f5f5' : 'none' }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{co.name}</p>
                <p style={{ fontSize: 11, color: colors.faint }}>{co.id?.slice(0,8)}…</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: PLAN_COLORS[co.plan] || colors.muted, background: '#F7F5F2', borderRadius: 6, padding: '3px 8px', display: 'inline-block', textTransform: 'capitalize' }}>{co.plan || 'starter'}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{co.employee_count || 0}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{co.booking_count || 0}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Math.round(Number(co.total_gmv || 0) / 1000)}K</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLORS[co.status] || colors.green, background: '#F7F5F2', borderRadius: 6, padding: '3px 8px', display: 'inline-block', textTransform: 'capitalize' }}>{co.status || 'active'}</span>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => navigate(`/admin/employers/${co.id}`)} style={{ background: colors.dark, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>View →</button>
                <button onClick={() => impersonate(co)} disabled={impersonating === co.id} style={{ background: colors.orangeLight, color: colors.orange, border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Login as HR</button>
                {(co.status === 'active' || !co.status) ? (
                  <button onClick={() => updateStatus(co.id, 'suspended')} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Suspend</button>
                ) : (
                  <button onClick={() => updateStatus(co.id, 'active')} style={{ background: colors.greenLight, color: colors.green, border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Activate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// 3. VENDORS
// ═══════════════════════════════════════════════════════════
export function AdminVendors() {
  const [vendors,  setVendors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    api.get('/admin/vendors').then(r => setVendors(r.data)).finally(() => setLoading(false));
  }, []);

  const toggleVerify = async (id, verified) => {
    await api.patch(`/vendors/${id}/verify`, { verified: !verified });
    setVendors(vs => vs.map(v => v.id === id ? { ...v, verified: !verified } : v));
  };

  const filtered = vendors.filter(v => {
    const matchFilter = filter === 'all' || (filter === 'pending' && !v.verified && v.onboarding_completed) || (filter === 'verified' && v.verified) || (filter === 'incomplete' && !v.onboarding_completed);
    const q = search.toLowerCase();
    return matchFilter && (!q || v.company_name?.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q));
  });

  return (
    <AdminLayout active="vendors">
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>All vendors</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all','pending','verified','incomplete'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${filter===f ? colors.orange : '#eee'}`, background: filter===f ? colors.orangeLight : '#fff', color: filter===f ? colors.orange : colors.mid, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, textTransform: 'capitalize' }}>
                {f} ({f==='all' ? vendors.length : f==='pending' ? vendors.filter(v=>!v.verified&&v.onboarding_completed).length : f==='verified' ? vendors.filter(v=>v.verified).length : vendors.filter(v=>!v.onboarding_completed).length})
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F5F2', border: '1px solid #eee', borderRadius: 10, padding: '8px 14px', maxWidth: 380 }}>
          <svg width="14" height="14" fill="none" stroke={colors.faint} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: colors.dark, width: '100%', fontFamily: font.body }}/>
        </div>
      </div>
      <div style={{ padding: '24px 36px' }}>
        <div className="table-wrap">
          <TableHeader cols={['Vendor','Category','Packages','Bookings','Revenue','Onboarding','Status','Actions']} template="1.8fr 1fr 0.7fr 0.7fr 0.9fr 1fr 0.9fr 1.2fr"/>
          {loading ? <Spinner/> : filtered.length === 0 ? (
            <EmptyState emoji="🏪" title="No vendors" subtitle="Vendors appear here once they register"/>
          ) : filtered.map((v, i) => (
            <div key={v.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.7fr 0.7fr 0.9fr 1fr 0.9fr 1.2fr', padding: '11px 24px', alignItems: 'center', borderBottom: i<filtered.length-1?'1px solid #f5f5f5':'none' }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{v.company_name}</p>
                <p style={{ fontSize: 11, color: colors.faint }}>{v.email}</p>
              </div>
              <span style={{ fontSize: 12.5, color: colors.mid, textTransform: 'capitalize' }}>{v.category?.replace(/_/g,' ') || '—'}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{v.package_count || 0}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{v.booking_count || 0}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Math.round(Number(v.total_revenue||0)/1000)}K</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: v.onboarding_completed ? colors.green : colors.amber, background: v.onboarding_completed ? colors.greenLight : '#FEF3C7', borderRadius: 6, padding: '2px 8px', display: 'inline-block' }}>{v.onboarding_completed ? 'Complete' : 'Incomplete'}</span>
              <Badge status={v.verified ? 'verified' : 'unverified'}/>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => toggleVerify(v.id, v.verified)} style={{ background: v.verified ? colors.redLight : colors.greenLight, color: v.verified ? colors.red : colors.green, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                  {v.verified ? 'Revoke' : 'Verify'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. ANALYTICS
// ═══════════════════════════════════════════════════════════
export function AdminAnalytics() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/admin/bookings').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const totalGmv   = bookings.filter(b => ['approved','confirmed','vendor_confirmed'].includes(b.status)).reduce((s,b) => s+Number(b.total_amount||0), 0);
  const byCompany  = bookings.reduce((a, b) => { a[b.company_name] = (a[b.company_name]||0)+1; return a; }, {});
  const byVendor   = bookings.reduce((a, b) => { a[b.vendor_name]  = (a[b.vendor_name]||0)+Number(b.total_amount||0); return a; }, {});
  const byCategory = bookings.reduce((a, b) => { a[b.category]     = (a[b.category]||0)+1; return a; }, {});
  const payroll    = bookings.filter(b => (b.payment_method||'payroll')==='payroll').length;
  const card       = bookings.filter(b => b.payment_method==='card').length;

  if (loading) return <AdminLayout active="analytics"><div style={{ padding: 40 }}><Spinner/></div></AdminLayout>;

  return (
    <AdminLayout active="analytics">
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Platform analytics</h1>
      </div>
      <div style={{ padding: '24px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard icon="📋" label="Total bookings"  value={bookings.length} accent={colors.blue}/>
          <StatCard icon="💷" label="Total GMV"        value={`£${Math.round(totalGmv/1000)}K`} accent={colors.green}/>
          <StatCard icon="💳" label="Payroll bookings" value={payroll} sub={`${bookings.length ? Math.round(payroll/bookings.length*100) : 0}%`} accent={colors.orange}/>
          <StatCard icon="🏦" label="Card bookings"    value={card}    sub={`${bookings.length ? Math.round(card/bookings.length*100) : 0}%`}    accent="#7B3FA0"/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Top employers */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Top employers by bookings</p>
            {Object.entries(byCompany).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name, count], i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{name}</span>
                  <span style={{ fontSize: 12, color: colors.muted }}>{count}</span>
                </div>
                <div style={{ height: 5, background: '#eee', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${(count/Math.max(...Object.values(byCompany)))*100}%`, background: colors.blue, borderRadius: 3 }}/>
                </div>
              </div>
            ))}
          </div>
          {/* Top vendors */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Top vendors by revenue</p>
            {Object.entries(byVendor).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name, rev], i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{name}</span>
                  <span style={{ fontSize: 12, color: colors.muted }}>£{Math.round(rev/1000)}K</span>
                </div>
                <div style={{ height: 5, background: '#eee', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${(rev/Math.max(...Object.values(byVendor)))*100}%`, background: colors.green, borderRadius: 3 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// 5. BILLING
// ═══════════════════════════════════════════════════════════
export function AdminBilling() {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get('/admin/companies').then(r => setCompanies(r.data)).finally(() => setLoading(false));
  }, []);

  const PLAN_FEES = { starter: 15000, growth: 27000, enterprise: 66000, global: 100000 };
  const totalArr  = companies.reduce((s, c) => s + (PLAN_FEES[c.plan || 'starter'] || 15000), 0);

  const updatePlan = async (id, plan) => {
    await api.patch(`/admin/companies/${id}`, { plan });
    setCompanies(cs => cs.map(c => c.id === id ? { ...c, plan } : c));
  };

  return (
    <AdminLayout active="billing">
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Billing & subscriptions</h1>
          <div style={{ background: colors.greenLight, borderRadius: 10, padding: '8px 16px', textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: colors.green, fontWeight: 700 }}>PROJECTED ARR</p>
            <p style={{ fontFamily: font.display, fontSize: 24, color: colors.green }}>£{Math.round(totalArr/1000)}K</p>
          </div>
        </div>
      </div>
      <div style={{ padding: '24px 36px' }}>
        <div className="table-wrap">
          <TableHeader cols={['Company','Plan','Annual fee','Renews','Status','Change plan']} template="2fr 1fr 1fr 1.2fr 0.9fr 1.6fr"/>
          {loading ? <Spinner/> : companies.map((co, i) => {
            const fee = PLAN_FEES[co.plan || 'starter'] || 15000;
            const renewDate = co.plan_renews_at ? new Date(co.plan_renews_at).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'}) : 'Unknown';
            const daysLeft  = co.plan_renews_at ? Math.ceil((new Date(co.plan_renews_at)-new Date())/(1000*60*60*24)) : null;
            return (
              <div key={co.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 0.9fr 1.6fr', padding: '12px 24px', alignItems: 'center', borderBottom: i<companies.length-1?'1px solid #f5f5f5':'none' }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{co.name}</p>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.orange, textTransform: 'capitalize' }}>{co.plan || 'starter'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Math.round(fee/1000)}K/yr</span>
                <div>
                  <p style={{ fontSize: 13, color: colors.dark }}>{renewDate}</p>
                  {daysLeft !== null && <p style={{ fontSize: 11, color: daysLeft < 30 ? colors.red : colors.faint }}>{daysLeft > 0 ? `${daysLeft} days` : 'Expired'}</p>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: co.status==='suspended' ? colors.red : colors.green, textTransform: 'capitalize' }}>{co.status || 'active'}</span>
                <select value={co.plan || 'starter'} onChange={e => updatePlan(co.id, e.target.value)}
                  style={{ border: '1.5px solid #eee', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, color: colors.dark, fontFamily: font.body, outline: 'none', background: '#fff' }}>
                  {['starter','growth','enterprise','global'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// 6. FEATURE FLAGS
// ═══════════════════════════════════════════════════════════
export function AdminFeatureFlags() {
  const [flags,     setFlags]     = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selCompany,setSelCompany]= useState('global');

  useEffect(() => {
    Promise.all([
      api.get('/admin/feature-flags').catch(() => ({ data: [] })),
      api.get('/admin/companies'),
    ]).then(([fl, co]) => {
      setFlags(fl.data);
      setCompanies(co.data);
    }).finally(() => setLoading(false));
  }, []);

  const DEFAULT_FLAGS = [
    { name: 'messaging',         label: 'In-app messaging',     desc: 'Threaded inbox and direct messages between HR, employees and vendors' },
    { name: 'sabba_points',      label: 'Sabba Points',         desc: 'Rewards system — earn points on bookings and quiz, redeem at checkout' },
    { name: 'adventure_quiz',    label: 'Adventure quiz',       desc: 'Gamified 10-question onboarding quiz with travel type reveal' },
    { name: 'card_payments',     label: 'Card payments',        desc: 'Stripe card checkout — bypasses HR approval and payroll' },
    { name: 'vendor_onboarding', label: 'Vendor onboarding',    desc: '5-step Q&A for new vendors before they can list packages' },
    { name: 'csv_import',        label: 'CSV employee import',  desc: 'Bulk upload of up to 500 employees from spreadsheet' },
    { name: 'analytics',         label: 'HR analytics',         desc: 'Analytics page for HR admins showing payment split, trends, destinations' },
  ];

  const isEnabled = (name) => {
    const f = flags.find(fl => fl.name === name && (selCompany === 'global' ? !fl.company_id : fl.company_id === selCompany));
    return f ? f.enabled : true; // default true
  };

  const toggle = async (name) => {
    const current = isEnabled(name);
    await api.patch(`/admin/feature-flags/${name}`, { enabled: !current, company_id: selCompany === 'global' ? null : selCompany }).catch(() => {});
    setFlags(fs => {
      const existing = fs.findIndex(fl => fl.name === name && (selCompany === 'global' ? !fl.company_id : fl.company_id === selCompany));
      if (existing >= 0) return fs.map((fl,i) => i === existing ? { ...fl, enabled: !current } : fl);
      return [...fs, { name, enabled: !current, company_id: selCompany === 'global' ? null : selCompany }];
    });
  };

  return (
    <AdminLayout active="flags">
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Feature flags</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: colors.muted }}>Scope:</span>
            <select value={selCompany} onChange={e => setSelCompany(e.target.value)}
              style={{ border: '1.5px solid #eee', borderRadius: 10, padding: '8px 14px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', background: '#fff' }}>
              <option value="global">Global (all employers)</option>
              {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div style={{ padding: '24px 36px' }}>
        {loading ? <Spinner/> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEFAULT_FLAGS.map(f => {
              const on = isEnabled(f.name);
              return (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: '#fff', border: '1px solid #eee', borderRadius: 14 }}>
                  <div>
                    <p style={{ fontSize: 14.5, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>{f.label}</p>
                    <p style={{ fontSize: 13, color: colors.muted }}>{f.desc}</p>
                  </div>
                  <div onClick={() => toggle(f.name)} style={{ width: 48, height: 26, borderRadius: 13, background: on ? colors.green : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: on ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// 7. AUDIT LOG
// ═══════════════════════════════════════════════════════════
export function AdminAuditLog() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');

  useEffect(() => {
    api.get('/admin/audit-log').then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => !filter || l.action?.toLowerCase().includes(filter.toLowerCase()) || l.actor_name?.toLowerCase().includes(filter.toLowerCase()));

  const ACTION_COLORS = { impersonate: colors.orange, suspend: colors.red, activate: colors.green, verify: colors.green, create: colors.blue };

  return (
    <AdminLayout active="audit">
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Audit log</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F5F2', border: '1px solid #eee', borderRadius: 10, padding: '8px 14px' }}>
            <svg width="14" height="14" fill="none" stroke={colors.faint} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by action or actor…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: colors.dark, width: 220, fontFamily: font.body }}/>
          </div>
        </div>
      </div>
      <div style={{ padding: '24px 36px' }}>
        {loading ? <Spinner/> : filtered.length === 0 ? (
          <EmptyState emoji="📋" title="No audit entries yet" subtitle="Admin actions will be logged here automatically"/>
        ) : (
          <div className="table-wrap">
            <TableHeader cols={['Time','Actor','Action','Target','Details']} template="1.2fr 1.5fr 1fr 1fr 2fr"/>
            {filtered.map((log, i) => (
              <div key={log.id || i} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 2fr', padding: '11px 24px', alignItems: 'center', borderBottom: i<filtered.length-1?'1px solid #f5f5f5':'none' }}>
                <span style={{ fontSize: 12, color: colors.faint }}>{log.created_at ? new Date(log.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{log.actor_name}</p>
                  <p style={{ fontSize: 11, color: colors.faint }}>{log.actor_email}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: ACTION_COLORS[log.action] || colors.mid, background: '#F7F5F2', borderRadius: 6, padding: '2px 8px', display: 'inline-block', textTransform: 'capitalize' }}>{log.action}</span>
                <span style={{ fontSize: 12.5, color: colors.mid, textTransform: 'capitalize' }}>{log.target_type}: {log.target_id?.slice(0,8)}…</span>
                <span style={{ fontSize: 12, color: colors.muted }}>{log.meta ? JSON.stringify(log.meta).slice(0,60) : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

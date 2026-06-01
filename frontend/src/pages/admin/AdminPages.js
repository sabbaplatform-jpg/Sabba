import { useState, useEffect, useCallback, useRef } from 'react';
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
    { id: 'packages',   label: 'Packages',         icon: '📦', path: '/admin/packages' },
    { id: 'integrations', label: 'Integrations',   icon: '🔌', path: '/admin/integrations' },
    { id: 'settings',     label: 'Settings & team', icon: '⚙️', path: '/admin/settings' },
    { id: 'email-templates', label: 'Email templates', icon: '✉️', path: '/admin/email-templates' },
    { id: 'analytics',  label: 'Analytics',       icon: '📊', path: '/admin/analytics' },
    { id: 'sponsored',  label: 'Sponsored listings', icon: '⭐', path: '/admin/sponsored' },
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
        {loading ? <Spinner/> : !stats ? (
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: colors.red, fontWeight: 700 }}>⚠ Failed to load platform stats</p>
            <p style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>Check backend connectivity and try refreshing.</p>
          </div>
        ) : (
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
// ── Create Employer Wizard ────────────────────────────────────
const INDUSTRIES = ['Technology','Financial Services','Professional Services','Healthcare','Legal','Retail','Media & Entertainment','Education','Manufacturing','Logistics','Energy','Other'];
const SIZES      = ['1–50','51–200','201–500','501–1,000','1,001–5,000','5,000+'];
const PLANS      = [
  { id:'starter',    label:'Starter',    fee:'£12K–£18K/yr',    desc:'Up to 500 employees · Core portal · Email support' },
  { id:'growth',     label:'Growth',     fee:'£18K–£36K/yr',    desc:'Up to 2,000 employees · Analytics · Priority support' },
  { id:'enterprise', label:'Enterprise', fee:'£36K–£96K/yr',    desc:'Up to 10,000 employees · HRIS + dedicated AM' },
  { id:'global',     label:'Global',     fee:'£100K+ (custom)', desc:'Unlimited · White-label · Multi-jurisdiction' },
];
const HRIS_SYSTEMS = ['Workday','BambooHR','Rippling','SAP SuccessFactors','Oracle HCM','Personio','HiBob','Other','None'];
const PAYROLL_SYSTEMS = ['ADP','Sage Payroll','Xero','QuickBooks','Moorepay','Zellis','Custom','None'];
const CONN_TYPES = ['REST API','SFTP scheduled sync','SSL Postback','Webhook','Manual import','TBD'];

// Shared input/label styles used across wizard — module level so they're never recreated on render
const iStyle = { width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '9px 13px', fontSize: 13.5, color: '#4A4440', fontFamily: 'Inter, DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' };
const lStyle = { fontSize: 11, fontWeight: 700, color: '#9E8E7E', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 };

function CreateEmployerWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const TOTAL = 5;
  const [form, setForm] = useState({
    // Step 1
    name: '', industry: '', size: '', website: '', address: '',
    // Step 2
    plan: 'starter', billing_name: '', billing_email: '', billing_address: '',
    // Step 3
    admin_first: '', admin_last: '', admin_email: '', admin_title: '',
    // Step 4
    hris: '', hris_conn: '', payroll: '', payroll_conn: '', integration_notes: '',
    // Generated
    temp_password: 'Welcome2Sabba!',
  });
  const [creating, setCreating] = useState(false);
  const [created,  setCreated]  = useState(null);
  const [error,    setError]    = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 1) return form.name && form.industry && form.size;
    if (step === 2) return form.plan && form.billing_name && form.billing_email;
    if (step === 3) return form.admin_first && form.admin_last && form.admin_email;
    return true;
  };

  const submit = async () => {
    setCreating(true); setError('');
    try {
      const { data } = await api.post('/admin/companies', {
        name:            form.name,
        industry:        form.industry,
        size:            form.size,
        website:         form.website,
        address:         form.address,
        plan:            form.plan,
        billing_name:    form.billing_name,
        billing_email:   form.billing_email,
        billing_address: form.billing_address,
        admin_name:      `${form.admin_first} ${form.admin_last}`.trim(),
        admin_email:     form.admin_email,
        admin_title:     form.admin_title,
        hris:            form.hris,
        hris_conn:       form.hris_conn,
        payroll:         form.payroll,
        payroll_conn:    form.payroll_conn,
        integration_notes: form.integration_notes,
      });
      setCreated(data);
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create employer');
    } finally {
      setCreating(false);
    }
  };

  const F = ({ label, k, placeholder, type='text', wide=false }) => (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
        style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '9px 13px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
    </div>
  );
  const S = ({ label, k, opts }) => (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>{label}</label>
      <select value={form[k]} onChange={e => set(k, e.target.value)}
        style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '9px 13px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', background: '#fff' }}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const STEP_LABELS = ['Company basics','Subscription','HR admin','Integrations','Review'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 660, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', fontFamily: font.body }}>

        {/* Header */}
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                {created ? 'Complete' : `Step ${step} of ${TOTAL}`}
              </p>
              <h2 style={{ fontFamily: font.display, fontSize: 24, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>
                {created ? 'Employer created!' : STEP_LABELS[step-1]}
              </h2>
            </div>
            <button onClick={onClose} style={{ background: '#F7F5F2', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: colors.muted }}>✕</button>
          </div>

          {/* Progress bar */}
          {!created && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
              {STEP_LABELS.map((label, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ height: 3, borderRadius: 2, background: i < step ? colors.orange : '#eee', transition: 'background 0.3s', marginBottom: 5 }}/>
                  <p style={{ fontSize: 10, color: i < step ? colors.orange : i === step-1 ? colors.dark : colors.faint, fontWeight: i === step-1 ? 700 : 400, textAlign: 'center' }}>{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '0 28px 28px' }}>

          {/* ── STEP 1: Company basics ── */}
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lStyle}>Company name *</label>
                <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Barclays PLC" style={iStyle}/>
              </div>
              <div>
                <label style={lStyle}>Industry *</label>
                <select value={form.industry} onChange={e=>set('industry',e.target.value)} style={{...iStyle,background:'#fff'}}>
                  <option value="">Select…</option>
                  {INDUSTRIES.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={lStyle}>Company size *</label>
                <select value={form.size} onChange={e=>set('size',e.target.value)} style={{...iStyle,background:'#fff'}}>
                  <option value="">Select…</option>
                  {SIZES.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={lStyle}>Website</label>
                <input value={form.website} onChange={e=>set('website',e.target.value)} placeholder="https://company.com" style={iStyle}/>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lStyle}>Registered address</label>
                <input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="1 Churchill Place, London, E14 5HP" style={iStyle}/>
              </div>
            </div>
          )}

          {/* ── STEP 2: Subscription plan ── */}
          {step === 2 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {PLANS.map(p => (
                  <div key={p.id} onClick={() => set('plan', p.id)}
                    style={{ padding: '14px 16px', border: `2px solid ${form.plan === p.id ? colors.orange : '#eee'}`, borderRadius: 12, cursor: 'pointer', background: form.plan === p.id ? colors.orangeLight : '#fff', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: form.plan === p.id ? colors.orange : colors.dark }}>{p.label}</p>
                      {form.plan === p.id && <span style={{ fontSize: 12, color: colors.orange }}>✓</span>}
                    </div>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: form.plan === p.id ? colors.orange : colors.mid, marginBottom: 4 }}>{p.fee}</p>
                    <p style={{ fontSize: 11.5, color: colors.muted }}>{p.desc}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lStyle}>Billing contact name *</label>
                  <input value={form.billing_name} onChange={e=>set('billing_name',e.target.value)} placeholder="Jane Smith" style={iStyle}/>
                </div>
                <div>
                  <label style={lStyle}>Billing email *</label>
                  <input type="email" value={form.billing_email} onChange={e=>set('billing_email',e.target.value)} placeholder="finance@company.com" style={iStyle}/>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lStyle}>Billing address</label>
                  <input value={form.billing_address} onChange={e=>set('billing_address',e.target.value)} placeholder="Same as registered address" style={iStyle}/>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: HR admin ── */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20, lineHeight: 1.6 }}>
                This person will be the primary HR admin for the employer account. They'll receive login credentials and can add additional admins once inside.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lStyle}>First name *</label>
                  <input value={form.admin_first} onChange={e=>set('admin_first',e.target.value)} placeholder="Sarah" style={iStyle}/>
                </div>
                <div>
                  <label style={lStyle}>Last name *</label>
                  <input value={form.admin_last} onChange={e=>set('admin_last',e.target.value)} placeholder="Chen" style={iStyle}/>
                </div>
                <div>
                  <label style={lStyle}>Email *</label>
                  <input type="email" value={form.admin_email} onChange={e=>set('admin_email',e.target.value)} placeholder="sarah.chen@company.com" style={iStyle}/>
                </div>
                <div>
                  <label style={lStyle}>Job title</label>
                  <input value={form.admin_title} onChange={e=>set('admin_title',e.target.value)} placeholder="HR Director" style={iStyle}/>
                </div>
              </div>
              <div style={{ background: colors.orangeLight, border: `1px solid rgba(212,98,42,0.2)`, borderRadius: 10, padding: '12px 16px', marginTop: 16 }}>
                <p style={{ fontSize: 13, color: colors.dark, fontWeight: 700, marginBottom: 3 }}>Temporary password</p>
                <p style={{ fontSize: 13, color: colors.muted }}>The HR admin will log in with <strong style={{ color: colors.dark, fontFamily: 'monospace' }}>Welcome2Sabba!</strong> and will be prompted to change it on first login.</p>
              </div>
            </div>
          )}

          {/* ── STEP 4: Integrations ── */}
          {step === 4 && (
            <div>
              <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20, lineHeight: 1.6 }}>
                Select which HRIS and payroll systems this employer uses. These create integration stubs that can be fully configured in the Integrations tab.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={lStyle}>HRIS system</label>
                  <select value={form.hris} onChange={e=>set('hris',e.target.value)} style={{...iStyle,background:'#fff'}}>
                    <option value="">Select…</option>
                    {HRIS_SYSTEMS.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lStyle}>HRIS connection type</label>
                  <select value={form.hris_conn} onChange={e=>set('hris_conn',e.target.value)} style={{...iStyle,background:'#fff'}}>
                    <option value="">Select…</option>
                    {CONN_TYPES.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lStyle}>Payroll system</label>
                  <select value={form.payroll} onChange={e=>set('payroll',e.target.value)} style={{...iStyle,background:'#fff'}}>
                    <option value="">Select…</option>
                    {PAYROLL_SYSTEMS.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lStyle}>Payroll connection</label>
                  <select value={form.payroll_conn} onChange={e=>set('payroll_conn',e.target.value)} style={{...iStyle,background:'#fff'}}>
                    <option value="">Select…</option>
                    {CONN_TYPES.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>Integration notes</label>
                <textarea value={form.integration_notes} onChange={e => set('integration_notes', e.target.value)}
                  placeholder="Any specific requirements, existing API keys, data format preferences, or timeline notes…"
                  style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 13px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', resize: 'vertical', minHeight: 90 }}/>
              </div>
              <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 14px', marginTop: 14 }}>
                <p style={{ fontSize: 12, color: colors.muted }}>
                  Integration credentials and full configuration happen after account creation in the <strong style={{ color: colors.dark }}>Integrations tab</strong>. These selections just record what's planned.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 5: Review ── */}
          {step === 5 && !created && (
            <div>
              <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20, lineHeight: 1.6 }}>
                Review all details before creating the employer account. A Company ID will be auto-generated on creation.
              </p>
              {[
                { title: 'Company', icon: '🏢', rows: [
                  ['Name',       form.name],
                  ['Industry',   form.industry],
                  ['Size',       form.size],
                  ['Website',    form.website || '—'],
                  ['Address',    form.address || '—'],
                ]},
                { title: 'Subscription', icon: '💳', rows: [
                  ['Plan',            PLANS.find(p=>p.id===form.plan)?.label],
                  ['Annual fee',      PLANS.find(p=>p.id===form.plan)?.fee],
                  ['Billing contact', form.billing_name],
                  ['Billing email',   form.billing_email],
                ]},
                { title: 'HR Admin', icon: '👤', rows: [
                  ['Name',      `${form.admin_first} ${form.admin_last}`],
                  ['Email',     form.admin_email],
                  ['Job title', form.admin_title || '—'],
                  ['Password',  'Welcome2Sabba! (temporary)'],
                ]},
                { title: 'Integrations', icon: '🔌', rows: [
                  ['HRIS',        form.hris || 'Not specified'],
                  ['HRIS conn.',  form.hris_conn || '—'],
                  ['Payroll',     form.payroll || 'Not specified'],
                  ['Payroll conn.', form.payroll_conn || '—'],
                ]},
              ].map((section, si) => (
                <div key={si} style={{ marginBottom: 14, background: '#F7F5F2', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ background: colors.dark, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{section.icon}</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{section.title}</p>
                  </div>
                  {section.rows.map(([label, value], ri) => (
                    <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: ri < section.rows.length-1 ? '1px solid #eee' : 'none' }}>
                      <span style={{ fontSize: 13, color: colors.muted }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark, maxWidth: '55%', textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              ))}
              {error && <p style={{ fontSize: 13, color: colors.red, fontWeight: 700, marginBottom: 14 }}>⚠ {error}</p>}
            </div>
          )}

          {/* ── CREATED ── */}
          {created && (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <p style={{ fontFamily: font.display, fontSize: 24, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 8 }}>
                {created.name} is live!
              </p>
              <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20, lineHeight: 1.7 }}>
                The employer account has been created. HR admin login details have been set up. Company ID was auto-generated below.
              </p>
              <div style={{ background: '#F7F5F2', borderRadius: 12, padding: '14px 20px', marginBottom: 24, textAlign: 'left' }}>
                {[
                  ['Company ID',     created.id],
                  ['Plan',          created.plan?.charAt(0).toUpperCase()+created.plan?.slice(1)],
                  ['HR admin email', form.admin_email],
                  ['Temp password', 'Welcome2Sabba!'],
                ].map(([label, value], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i < 3 ? 10 : 0, marginBottom: i < 3 ? 10 : 0, borderBottom: i < 3 ? '1px solid #eee' : 'none' }}>
                    <span style={{ fontSize: 13, color: colors.muted }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark, fontFamily: label === 'Company ID' ? 'monospace' : font.body, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
                  </div>
                ))}
              </div>
              <Button onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>Done</Button>
            </div>
          )}

          {/* Navigation */}
          {!created && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
              <button onClick={() => step > 1 ? setStep(s => s-1) : onClose()}
                style={{ background: '#F7F5F2', border: '1px solid #eee', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 600, color: colors.mid, cursor: 'pointer', fontFamily: font.body }}>
                {step === 1 ? 'Cancel' : '← Back'}
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: TOTAL }).map((_,i) => (
                  <div key={i} style={{ width: i === step-1 ? 20 : 7, height: 7, borderRadius: 4, background: i < step ? colors.orange : '#eee', transition: 'all 0.3s' }}/>
                ))}
              </div>
              {step < TOTAL
                ? <button onClick={() => setStep(s => s+1)} disabled={!canNext()}
                    style={{ background: canNext() ? colors.dark : '#eee', color: canNext() ? '#fff' : '#aaa', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13.5, fontWeight: 700, cursor: canNext() ? 'pointer' : 'default', fontFamily: font.body }}>
                    Next →
                  </button>
                : <button onClick={submit} disabled={creating}
                    style={{ background: creating ? '#eee' : colors.orange, color: creating ? '#aaa' : '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13.5, fontWeight: 700, cursor: creating ? 'default' : 'pointer', fontFamily: font.body, boxShadow: creating ? 'none' : `0 4px 14px rgba(212,98,42,0.35)` }}>
                    {creating ? 'Creating…' : '🚀 Create employer'}
                  </button>
              }
            </div>
          )}
        </div>
      </div>
    </div>
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
  const [search,      setSearch]      = useState('');
  const [impersonating, setImpersonating] = useState(null);

  useEffect(() => {
    api.get('/admin/companies').then(r => setCompanies(r.data)).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/companies/${id}`, { status });
    setCompanies(cs => cs.map(c => c.id === id ? { ...c, status } : c));
  };

  const impersonate = async (company) => {
    setImpersonating(company.id);
    try {
      alert(`Context switching to ${company.name} — full impersonation coming in next build.`);
    } catch { alert('Failed to switch context'); }
    finally { setImpersonating(null); }
  };

  const filtered = companies.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()));

  const PLAN_COLORS   = { starter: colors.muted, growth: colors.blue, enterprise: colors.orange, global: '#7B3FA0' };
  const STATUS_COLORS = { active: colors.green, suspended: colors.red, trial: colors.orange, churned: colors.faint };

  return (
    <AdminLayout active="employers">
      {showCreate && (
        <CreateEmployerWizard
          onClose={() => setShowCreate(false)}
          onCreated={co => setCompanies(cs => [co, ...cs])}
        />
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
                {(co.status === 'active' || !co.status)
                  ? <button onClick={() => updateStatus(co.id, 'suspended')} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Suspend</button>
                  : <button onClick={() => updateStatus(co.id, 'active')}    style={{ background: colors.greenLight, color: colors.green, border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Activate</button>
                }
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

function VendorReviewModal({ vendor, companies, onClose, onVerify, onReject, onAccessChange }) {
  const [rejectMode,  setRejectMode]  = useState(false);
  const [reason,      setReason]      = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const od = vendor.onboarding_data || {};

  const handleVerify = async () => {
    setSubmitting(true);
    await onVerify(vendor.id);
    setSubmitting(false); onClose();
  };
  const handleReject = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    await onReject(vendor.id, reason);
    setSubmitting(false); onClose();
  };

  return (
    <Modal title="Vendor review" onClose={onClose} width={640}>
      {/* Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: '#F7F5F2', borderRadius: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏪</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: colors.dark }}>{vendor.company_name}</p>
            <Badge status={vendor.verified ? 'verified' : 'unverified'}/>
          </div>
          <p style={{ fontSize: 13, color: colors.muted }}>{vendor.email} · {vendor.category}</p>
          {vendor.website && <p style={{ fontSize: 12, color: colors.orange, marginTop: 2 }}>{vendor.website}</p>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Packages',     value: vendor.package_count || 0 },
          { label: 'Bookings',     value: vendor.booking_count || 0 },
          { label: 'Revenue',      value: `£${Math.round(Number(vendor.total_revenue||0)/1000)}K` },
          { label: 'Pending since', value: vendor.pending_since ? new Date(vendor.pending_since).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—' },
        ].map((s,i) => (
          <div key={i} style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: colors.dark }}>{s.value}</p>
            <p style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* About */}
      {vendor.about && (
        <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>About</p>
          <p style={{ fontSize: 13.5, color: colors.mid, lineHeight: 1.7 }}>{vendor.about}</p>
        </div>
      )}

      {/* Onboarding Q&A */}
      {(od.business_type || od.categories?.length || od.standout?.length) && (
        <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Onboarding answers</p>
          {od.business_type && <p style={{ fontSize: 13, color: colors.mid, marginBottom: 6 }}><strong style={{ color: colors.dark }}>Business type:</strong> {od.business_type}</p>}
          {od.categories?.length > 0 && <p style={{ fontSize: 13, color: colors.mid, marginBottom: 6 }}><strong style={{ color: colors.dark }}>Categories:</strong> {od.categories.join(', ')}</p>}
          {od.standout?.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>How they stand out:</p>
              {od.standout.map((s,i) => <p key={i} style={{ fontSize: 12.5, color: colors.mid, marginBottom: 2 }}>✓ {s.replace(/_/g,' ')}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Employer access control */}
      {companies.length > 0 && (
        <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Employer access control</p>
          <p style={{ fontSize: 12, color: colors.muted, marginBottom: 10 }}>Toggle which employers can see this vendor's packages.</p>
          {companies.map(co => {
            const access = vendor.employer_access?.find(a => a.company_id === co.id);
            const enabled = access ? access.enabled : true;
            return (
              <div key={co.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13.5, color: colors.dark }}>{co.name}</span>
                <div onClick={() => onAccessChange(vendor.id, co.id, !enabled)}
                  style={{ width: 42, height: 22, borderRadius: 11, background: enabled ? colors.green : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: enabled ? 21 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection reason input */}
      {rejectMode && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Rejection reason <span style={{ color: colors.red }}>*</span></label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this vendor is being rejected. This will be sent to them via notification."
            style={{ width: '100%', border: `1.5px solid ${!reason.trim() ? colors.red : '#eee'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', resize: 'vertical', minHeight: 80 }}/>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {!rejectMode && <Button variant="secondary" onClick={onClose}>Close</Button>}
        {rejectMode ? (
          <>
            <button onClick={() => setRejectMode(false)} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>← Back</button>
            <button onClick={handleReject} disabled={!reason.trim() || submitting}
              style={{ background: submitting ? '#eee' : colors.red, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              {submitting ? 'Rejecting…' : 'Confirm rejection'}
            </button>
          </>
        ) : (
          <>
            {!vendor.verified && <button onClick={() => setRejectMode(true)}
              style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              Reject vendor
            </button>}
            {vendor.verified
              ? <button onClick={() => { onVerify(vendor.id, false); onClose(); }}
                  style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                  Revoke verification
                </button>
              : <button onClick={handleVerify} disabled={submitting}
                  style={{ background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                  {submitting ? 'Verifying…' : '✓ Verify vendor'}
                </button>
            }
          </>
        )}
      </div>
    </Modal>
  );
}

export function AdminVendors() {
  const [vendors,    setVendors]    = useState([]);
  const [companies,  setCompanies]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all');
  const [reviewing,  setReviewing]  = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/vendors'),
      api.get('/admin/companies'),
    ]).then(([v, c]) => {
      setVendors(v.data);
      setCompanies(c.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id, verified = true) => {
    await api.patch(`/vendors/${id}/verify`, { verified });
    setVendors(vs => vs.map(v => v.id === id ? { ...v, verified } : v));
    if (reviewing?.id === id) setReviewing(r => ({ ...r, verified }));
  };

  const handleReject = async (id, reason) => {
    await api.patch(`/admin/vendors/${id}/reject`, { reason });
    setVendors(vs => vs.map(v => v.id === id ? { ...v, verified: false, rejected: true, rejection_reason: reason } : v));
  };

  const handleAccessChange = async (vendorId, companyId, enabled) => {
    await api.patch(`/admin/vendors/${vendorId}/access`, { company_id: companyId, enabled });
    setVendors(vs => vs.map(v => {
      if (v.id !== vendorId) return v;
      const existing = v.employer_access || [];
      const idx = existing.findIndex(a => a.company_id === companyId);
      const updated = idx >= 0
        ? existing.map((a,i) => i === idx ? { ...a, enabled } : a)
        : [...existing, { company_id: companyId, enabled }];
      return { ...v, employer_access: updated };
    }));
    if (reviewing?.id === vendorId) {
      setReviewing(r => {
        const existing = r.employer_access || [];
        const idx = existing.findIndex(a => a.company_id === companyId);
        const updated = idx >= 0
          ? existing.map((a,i) => i === idx ? { ...a, enabled } : a)
          : [...existing, { company_id: companyId, enabled }];
        return { ...r, employer_access: updated };
      });
    }
  };

  const filtered = vendors.filter(v => {
    const matchFilter = filter === 'all'
      || (filter === 'pending'    && !v.verified && v.onboarding_completed)
      || (filter === 'verified'   && v.verified)
      || (filter === 'incomplete' && !v.onboarding_completed)
      || (filter === 'rejected'   && v.rejected);
    const q = search.toLowerCase();
    return matchFilter && (!q || v.company_name?.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q));
  });

  const counts = {
    all:        vendors.length,
    pending:    vendors.filter(v => !v.verified && v.onboarding_completed && !v.rejected).length,
    verified:   vendors.filter(v => v.verified).length,
    incomplete: vendors.filter(v => !v.onboarding_completed).length,
    rejected:   vendors.filter(v => v.rejected).length,
  };

  return (
    <AdminLayout active="vendors">
      {reviewing && (
        <VendorReviewModal
          vendor={reviewing}
          companies={companies}
          onClose={() => setReviewing(null)}
          onVerify={handleVerify}
          onReject={handleReject}
          onAccessChange={handleAccessChange}
        />
      )}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>All vendors</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(counts).map(([f, count]) => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${filter===f ? colors.orange : '#eee'}`, background: filter===f ? colors.orangeLight : '#fff', color: filter===f ? colors.orange : colors.mid, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, textTransform: 'capitalize' }}>
                {f} ({count})
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
          <TableHeader cols={['Vendor','Category','Packages','Bookings','Revenue','Onboarding','Status','Actions']} template="1.8fr 1fr 0.7fr 0.7fr 0.9fr 1fr 0.9fr 1.4fr"/>
          {loading ? <Spinner/> : filtered.length === 0 ? (
            <EmptyState emoji="🏪" title="No vendors" subtitle="Vendors appear here once they register"/>
          ) : filtered.map((v, i) => (
            <div key={v.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.7fr 0.7fr 0.9fr 1fr 0.9fr 1.4fr', padding: '11px 24px', alignItems: 'center', borderBottom: i<filtered.length-1?'1px solid #f5f5f5':'none' }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{v.company_name}</p>
                <p style={{ fontSize: 11, color: colors.faint }}>{v.email}</p>
              </div>
              <span style={{ fontSize: 12.5, color: colors.mid, textTransform: 'capitalize' }}>{v.category?.replace(/_/g,' ') || '—'}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{v.package_count || 0}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{v.booking_count || 0}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Math.round(Number(v.total_revenue||0)/1000)}K</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: v.onboarding_completed ? colors.green : '#b45309', background: v.onboarding_completed ? colors.greenLight : '#FEF3C7', borderRadius: 6, padding: '2px 8px', display: 'inline-block' }}>{v.onboarding_completed ? 'Complete' : 'Incomplete'}</span>
              <Badge status={v.verified ? 'verified' : v.rejected ? 'rejected' : 'unverified'}/>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => setReviewing(v)} style={{ background: colors.dark, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Review</button>
                <button onClick={() => handleVerify(v.id, !v.verified)} style={{ background: v.verified ? colors.redLight : colors.greenLight, color: v.verified ? colors.red : colors.green, border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
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
// 3b. PACKAGES (new tab)
// ═══════════════════════════════════════════════════════════
export function AdminPackages() {
  const [packages,  setPackages]  = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/packages'),
      api.get('/admin/companies'),
    ]).then(([p, c]) => {
      setPackages(p.data);
      setCompanies(c.data);
    }).finally(() => setLoading(false));
  }, []);

  const updatePkg = async (id, fields) => {
    await api.patch(`/admin/packages/${id}`, fields);
    setPackages(ps => ps.map(p => p.id === id ? { ...p, ...fields } : p));
  };

  const rejectPkg = async (id, reason) => {
    await api.patch(`/admin/packages/${id}`, { admin_status: 'rejected', admin_rejection_reason: reason });
    setPackages(ps => ps.map(p => p.id === id ? { ...p, admin_status: 'rejected', admin_rejection_reason: reason } : p));
    setReviewing(null); setRejectMode(false); setRejectReason('');
  };

  const toggleAccess = async (pkgId, companyId, allowed) => {
    await api.patch(`/admin/packages/${pkgId}/access`, { company_id: companyId, allowed });
    setPackages(ps => ps.map(p => {
      if (p.id !== pkgId) return p;
      const existing = p.employer_access || [];
      const idx = existing.findIndex(a => a.company_id === companyId);
      const updated = idx >= 0
        ? existing.map((a,i) => i === idx ? { ...a, allowed } : a)
        : [...existing, { company_id: companyId, allowed }];
      return { ...p, employer_access: updated };
    }));
  };

  const filtered = packages.filter(p => {
    const s = p.admin_status || 'pending';
    const matchFilter = filter === 'all' || s === filter;
    const q = search.toLowerCase();
    return matchFilter && (!q || p.title?.toLowerCase().includes(q) || p.vendor_name?.toLowerCase().includes(q) || p.destination?.toLowerCase().includes(q));
  });

  const counts = {
    all: packages.length,
    pending:  packages.filter(p => (p.admin_status||'pending') === 'pending').length,
    approved: packages.filter(p => p.admin_status === 'approved').length,
    rejected: packages.filter(p => p.admin_status === 'rejected').length,
  };

  const STATUS_BADGE = { pending: {c:'#b45309',bg:'#FEF3C7'}, approved: {c:colors.green,bg:colors.greenLight}, rejected: {c:colors.red,bg:colors.redLight} };

  return (
    <AdminLayout active="packages">
      {/* Package review modal */}
      {reviewing && (
        <Modal title="Package review" onClose={() => { setReviewing(null); setRejectMode(false); setRejectReason(''); }} width={620}>
          {/* Image/emoji header */}
          <div style={{ height: 180, background: `linear-gradient(135deg, #1C1916, #2A2320)`, borderRadius: 12, overflow: 'hidden', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {reviewing.image_url
              ? <img src={reviewing.image_url} alt={reviewing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : <span style={{ fontSize: 64 }}>{reviewing.emoji || '🌍'}</span>
            }
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }}/>
            <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
              <p style={{ fontFamily: font.display, fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: '#fff' }}>{reviewing.title}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{reviewing.vendor_name} · {reviewing.destination}</p>
            </div>
            <div style={{ position: 'absolute', top: 12, right: 12 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: STATUS_BADGE[reviewing.admin_status||'pending'].c, background: STATUS_BADGE[reviewing.admin_status||'pending'].bg, borderRadius: 8, padding: '4px 10px' }}>
                {(reviewing.admin_status||'pending').charAt(0).toUpperCase()+(reviewing.admin_status||'pending').slice(1)}
              </span>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Category',    value: reviewing.category?.replace(/_/g,' ') },
              { label: 'Duration',    value: reviewing.duration },
              { label: 'Price',       value: `£${Number(reviewing.price_gbp||0).toLocaleString()}` },
              { label: 'Destination', value: reviewing.destination },
              { label: 'Vendor',      value: reviewing.vendor_name },
              { label: 'Status',      value: reviewing.status },
            ].map((d,i) => (
              <div key={i} style={{ background: '#F7F5F2', borderRadius: 8, padding: '9px 12px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{d.label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark, textTransform: 'capitalize' }}>{d.value || '—'}</p>
              </div>
            ))}
          </div>

          {reviewing.description && (
            <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Description</p>
              <p style={{ fontSize: 13, color: colors.mid, lineHeight: 1.7 }}>{reviewing.description}</p>
            </div>
          )}

          {/* Employer access */}
          {companies.length > 0 && (
            <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Restrict to specific employers</p>
              <p style={{ fontSize: 12, color: colors.muted, marginBottom: 10 }}>By default packages are visible to all employers. Toggle off to restrict.</p>
              {companies.map(co => {
                const access = reviewing.employer_access?.find(a => a.company_id === co.id);
                const allowed = access ? access.allowed : true;
                return (
                  <div key={co.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13.5, color: colors.dark }}>{co.name}</span>
                    <div onClick={() => toggleAccess(reviewing.id, co.id, !allowed)}
                      style={{ width: 42, height: 22, borderRadius: 11, background: allowed ? colors.green : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: 2, left: allowed ? 21 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rejection reason */}
          {rejectMode && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Rejection reason <span style={{ color: colors.red }}>*</span></label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why this package is being rejected. This will be sent to the vendor."
                style={{ width: '100%', border: `1.5px solid ${!rejectReason.trim() ? colors.red : '#eee'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', resize: 'vertical', minHeight: 80 }}/>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            {rejectMode ? (
              <>
                <button onClick={() => setRejectMode(false)} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>← Back</button>
                <button onClick={() => rejectPkg(reviewing.id, rejectReason)} disabled={!rejectReason.trim()}
                  style={{ background: colors.red, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                  Confirm rejection
                </button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setReviewing(null)}>Close</Button>
                {(reviewing.admin_status||'pending') !== 'rejected' && (
                  <button onClick={() => setRejectMode(true)}
                    style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                    Reject
                  </button>
                )}
                {(reviewing.admin_status||'pending') !== 'approved' && (
                  <button onClick={() => { updatePkg(reviewing.id, { admin_status: 'approved' }); setReviewing(null); }}
                    style={{ background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                    ✓ Approve
                  </button>
                )}
              </>
            )}
          </div>
        </Modal>
      )}

      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>All packages</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(counts).map(([f, count]) => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${filter===f?colors.orange:'#eee'}`, background: filter===f?colors.orangeLight:'#fff', color: filter===f?colors.orange:colors.mid, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, textTransform: 'capitalize' }}>
                {f} ({count})
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F5F2', border: '1px solid #eee', borderRadius: 10, padding: '8px 14px', maxWidth: 420 }}>
          <svg width="14" height="14" fill="none" stroke={colors.faint} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, vendor or destination…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: colors.dark, width: '100%', fontFamily: font.body }}/>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>
        <div className="table-wrap">
          <TableHeader cols={['Package','Vendor','Category','Price','Status','Admin','Actions']} template="2fr 1.4fr 1fr 0.9fr 0.9fr 1fr 1.4fr"/>
          {loading ? <Spinner/> : filtered.length === 0 ? (
            <EmptyState emoji="📦" title="No packages" subtitle="Vendor packages appear here once added"/>
          ) : filtered.map((p, i) => {
            const sb = STATUS_BADGE[p.admin_status||'pending'];
            return (
              <div key={p.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 0.9fr 0.9fr 1fr 1.4fr', padding: '11px 24px', alignItems: 'center', borderBottom: i<filtered.length-1?'1px solid #f5f5f5':'none' }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{p.emoji} {p.title}</p>
                  <p style={{ fontSize: 11, color: colors.faint }}>{p.destination}</p>
                </div>
                <span style={{ fontSize: 12.5, color: colors.mid }}>{p.vendor_name}</span>
                <span style={{ fontSize: 12.5, color: colors.mid, textTransform: 'capitalize' }}>{p.category?.replace(/_/g,' ')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Number(p.price_gbp||0).toLocaleString()}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: p.status === 'live' ? colors.green : colors.muted, background: p.status === 'live' ? colors.greenLight : '#F7F5F2', borderRadius: 6, padding: '2px 8px', display: 'inline-block', textTransform: 'capitalize' }}>{p.status}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: sb.c, background: sb.bg, borderRadius: 6, padding: '2px 8px', display: 'inline-block', textTransform: 'capitalize' }}>{p.admin_status||'pending'}</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => setReviewing(p)} style={{ background: colors.dark, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Review</button>
                  {(p.admin_status||'pending') !== 'approved' && <button onClick={() => { updatePkg(p.id, { admin_status: 'approved' }); }} style={{ background: colors.greenLight, color: colors.green, border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Approve</button>}
                  {(p.admin_status||'pending') !== 'rejected' && <button onClick={() => { setReviewing(p); setRejectMode(true); }} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Reject</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. ANALYTICS
// ═══════════════════════════════════════════════════════════
export function AdminAnalytics() {
  const [bookings,  setBookings]  = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState(0);
  const [loading,   setLoading]   = useState(true);

  // Report builder filters
  const [fEmployer,  setFEmployer]  = useState('');
  const [fVendor,    setFVendor]    = useState('');
  const [fStatus,    setFStatus]    = useState('');
  const [fPayment,   setFPayment]   = useState('');
  const [fCategory,  setFCategory]  = useState('');
  const [fDateFrom,  setFDateFrom]  = useState('');
  const [fDateTo,    setFDateTo]    = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/bookings'),
      api.get('/admin/companies'),
      api.get('/admin/stats'),
    ]).then(([b, c, s]) => {
      setBookings(b.data);
      setCompanies(c.data);
      setEmployees(s.data.employees || 0);
    }).finally(() => setLoading(false));
  }, []);

  // Apply report filters
  const filtered = bookings.filter(b => {
    if (fEmployer  && b.company_name !== fEmployer) return false;
    if (fVendor    && b.vendor_name  !== fVendor)   return false;
    if (fStatus    && b.status       !== fStatus)   return false;
    if (fPayment   && (b.payment_method||'payroll') !== fPayment) return false;
    if (fCategory  && b.category     !== fCategory) return false;
    if (fDateFrom  && new Date(b.created_at) < new Date(fDateFrom)) return false;
    if (fDateTo    && new Date(b.created_at) > new Date(fDateTo+'T23:59:59')) return false;
    return true;
  });

  // Core metrics from filtered set
  const confirmed = filtered.filter(b => ['approved','confirmed','vendor_confirmed'].includes(b.status));
  const totalGmv  = confirmed.reduce((s,b) => s+Number(b.total_amount||0), 0);
  const avgVal    = confirmed.length ? totalGmv / confirmed.length : 0;
  const payroll   = filtered.filter(b => (b.payment_method||'payroll')==='payroll').length;
  const card      = filtered.filter(b => b.payment_method==='card').length;

  // Aggregations
  const byCompany  = filtered.reduce((a,b) => { a[b.company_name] = (a[b.company_name]||0)+1; return a; }, {});
  const byVendor   = filtered.reduce((a,b) => { a[b.vendor_name]  = (a[b.vendor_name]||0)+Number(b.total_amount||0); return a; }, {});
  const byCategory = filtered.reduce((a,b) => { const k=b.category?.replace(/_/g,' ')||'Other'; a[k]=(a[k]||0)+1; return a; }, {});
  const byStatus   = filtered.reduce((a,b) => { a[b.status]=(a[b.status]||0)+1; return a; }, {});

  // Monthly GMV from ALL bookings (not filtered — for trend line)
  const monthlyGmv = bookings.filter(b=>['approved','confirmed','vendor_confirmed'].includes(b.status)).reduce((a,b) => {
    const m = b.created_at?.slice(0,7) || 'unknown';
    a[m] = (a[m]||0)+Number(b.total_amount||0);
    return a;
  }, {});
  const monthKeys = Object.keys(monthlyGmv).sort().slice(-6);

  // CSV export of filtered results
  const exportCSV = () => {
    const headers = ['ID','Employee','Employer','Vendor','Package','Category','Destination','Departure','Payment','Total (£)','Status','Date'];
    const rows = filtered.map(b => [
      b.id, b.employee_name, b.company_name, b.vendor_name, b.package_title,
      b.category, b.destination,
      b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB') : '',
      b.payment_method||'payroll',
      Number(b.total_amount||0).toFixed(2),
      b.status,
      b.created_at ? new Date(b.created_at).toLocaleDateString('en-GB') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `sabba_report_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const resetFilters = () => {
    setFEmployer(''); setFVendor(''); setFStatus('');
    setFPayment(''); setFCategory(''); setFDateFrom(''); setFDateTo('');
  };

  const hasFilters = fEmployer||fVendor||fStatus||fPayment||fCategory||fDateFrom||fDateTo;

  // Unique values for filter dropdowns
  const allVendors    = [...new Set(bookings.map(b=>b.vendor_name).filter(Boolean))].sort();
  const allCategories = [...new Set(bookings.map(b=>b.category?.replace(/_/g,' ')).filter(Boolean))].sort();

  const BarRow = ({ label, value, max, accent, fmt }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark, textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: 12, color: colors.muted }}>{fmt ? fmt(value) : value}</span>
      </div>
      <div style={{ height: 5, background: '#eee', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${max > 0 ? (value/max)*100 : 0}%`, background: accent, borderRadius: 3, transition: 'width 0.4s' }}/>
      </div>
    </div>
  );

  const selStyle = { border: '1.5px solid #eee', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: colors.dark, fontFamily: font.body, outline: 'none', background: '#fff', cursor: 'pointer' };
  const inpStyle = { border: '1.5px solid #eee', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: colors.dark, fontFamily: font.body, outline: 'none' };

  if (loading) return <AdminLayout active="analytics"><div style={{ padding: 40 }}><Spinner/></div></AdminLayout>;

  return (
    <AdminLayout active="analytics">
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Platform analytics</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {hasFilters && <span style={{ fontSize: 12.5, color: colors.orange, fontWeight: 700 }}>Filters active · {filtered.length} of {bookings.length} bookings</span>}
            <button onClick={exportCSV} style={{ background: colors.dark, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              ⬇ Export CSV
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>

        {/* ── Report builder ── */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '18px 22px', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Report filters</p>
            {hasFilters && <button onClick={resetFilters} style={{ background: 'none', border: 'none', fontSize: 12.5, color: colors.orange, cursor: 'pointer', fontWeight: 700, fontFamily: font.body }}>Clear all</button>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 10 }}>
            <div>
              <p style={lStyle}>Employer</p>
              <select value={fEmployer} onChange={e=>setFEmployer(e.target.value)} style={selStyle}>
                <option value="">All employers</option>
                {companies.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <p style={lStyle}>Vendor</p>
              <select value={fVendor} onChange={e=>setFVendor(e.target.value)} style={selStyle}>
                <option value="">All vendors</option>
                {allVendors.map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <p style={lStyle}>Status</p>
              <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={selStyle}>
                <option value="">All statuses</option>
                {['pending','approved','vendor_confirmed','confirmed','cancelled'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <p style={lStyle}>Payment</p>
              <select value={fPayment} onChange={e=>setFPayment(e.target.value)} style={selStyle}>
                <option value="">All methods</option>
                <option value="payroll">Payroll</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div>
              <p style={lStyle}>Category</p>
              <select value={fCategory} onChange={e=>setFCategory(e.target.value)} style={selStyle}>
                <option value="">All categories</option>
                {allCategories.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <p style={lStyle}>Date from</p>
              <input type="date" value={fDateFrom} onChange={e=>setFDateFrom(e.target.value)} style={inpStyle}/>
            </div>
            <div>
              <p style={lStyle}>Date to</p>
              <input type="date" value={fDateTo} onChange={e=>setFDateTo(e.target.value)} style={inpStyle}/>
            </div>
          </div>
        </div>

        {/* ── 8 metric cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          <StatCard icon="📋" label="Bookings"        value={filtered.length}                                     accent={colors.blue}   sub={hasFilters ? `of ${bookings.length} total` : 'all time'}/>
          <StatCard icon="💷" label="Total GMV"        value={`£${Math.round(totalGmv/1000)}K`}                    accent={colors.green}  sub="confirmed value"/>
          <StatCard icon="📊" label="Avg booking value" value={`£${Math.round(avgVal).toLocaleString()}`}          accent={colors.orange} sub="per confirmed booking"/>
          <StatCard icon="👥" label="Total employees"   value={employees.toLocaleString()}                          accent="#7B3FA0"        sub="across all employers"/>
          <StatCard icon="💳" label="Payroll bookings"  value={payroll} accent={colors.orange}                      sub={`${filtered.length ? Math.round(payroll/filtered.length*100) : 0}% of bookings`}/>
          <StatCard icon="🏦" label="Card bookings"     value={card}    accent={colors.blue}                        sub={`${filtered.length ? Math.round(card/filtered.length*100) : 0}% of bookings`}/>
          <StatCard icon="✅" label="Confirmed"         value={confirmed.length} accent={colors.green}              sub={`${filtered.length ? Math.round(confirmed.length/filtered.length*100) : 0}% completion rate`}/>
          <StatCard icon="⏳" label="Pending"           value={filtered.filter(b=>b.status==='pending').length}     accent={colors.muted}  sub="awaiting HR approval"/>
        </div>

        {/* ── Monthly GMV trend ── */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '20px 24px', marginBottom: 22 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Monthly GMV trend</p>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 20 }}>Confirmed booking value across all employer clients (last 6 months)</p>
          {monthKeys.length === 0
            ? <p style={{ fontSize: 13, color: colors.muted }}>No booking data yet</p>
            : <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 100 }}>
                {monthKeys.map((m,i) => {
                  const val = monthlyGmv[m] || 0;
                  const maxVal = Math.max(...monthKeys.map(k=>monthlyGmv[k]||0),1);
                  const pct = (val/maxVal)*100;
                  const isLast = i === monthKeys.length-1;
                  const label = new Date(m+'-01').toLocaleDateString('en-GB',{month:'short',year:'2-digit'});
                  return (
                    <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
                      {val > 0 && <span style={{ fontSize:10, fontWeight:700, color:isLast?colors.orange:colors.faint }}>£{Math.round(val/1000)}K</span>}
                      <div style={{ width:'100%', height:`${Math.max(pct,4)}%`, background:isLast?colors.orange:'#E8E4DF', borderRadius:'4px 4px 0 0', transition:'height 0.3s' }}/>
                      <span style={{ fontSize:10, color:colors.faint, fontWeight:600 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
          }
        </div>

        {/* ── 4 charts row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
          {/* Top employers */}
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '20px 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Top employers by bookings</p>
            {Object.keys(byCompany).length === 0
              ? <p style={{ fontSize:13,color:colors.muted }}>No data</p>
              : Object.entries(byCompany).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,count],i)=>(
                  <BarRow key={i} label={name} value={count} max={Math.max(...Object.values(byCompany))} accent={colors.blue}/>
                ))
            }
          </div>
          {/* Top vendors */}
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '20px 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Top vendors by revenue</p>
            {Object.keys(byVendor).length === 0
              ? <p style={{ fontSize:13,color:colors.muted }}>No data</p>
              : Object.entries(byVendor).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,rev],i)=>(
                  <BarRow key={i} label={name} value={rev} max={Math.max(...Object.values(byVendor))} accent={colors.green} fmt={v=>`£${Math.round(v/1000)}K`}/>
                ))
            }
          </div>
          {/* By category */}
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '20px 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Bookings by category</p>
            {Object.keys(byCategory).length === 0
              ? <p style={{ fontSize:13,color:colors.muted }}>No data</p>
              : Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([cat,count],i)=>(
                  <BarRow key={i} label={cat||'Other'} value={count} max={Math.max(...Object.values(byCategory))} accent={colors.orange}/>
                ))
            }
          </div>
          {/* By status */}
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '20px 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Bookings by status</p>
            {Object.keys(byStatus).length === 0
              ? <p style={{ fontSize:13,color:colors.muted }}>No data</p>
              : Object.entries(byStatus).sort((a,b)=>b[1]-a[1]).map(([status,count],i)=>{
                  const sc = {pending:colors.amber,approved:colors.blue,vendor_confirmed:'#7B3FA0',confirmed:colors.green,cancelled:colors.red}[status]||colors.muted;
                  return <BarRow key={i} label={status.replace(/_/g,' ')} value={count} max={Math.max(...Object.values(byStatus))} accent={sc}/>;
                })
            }
          </div>
        </div>

        {/* ── Filtered bookings table ── */}
        {hasFilters && (
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Filtered results — {filtered.length} booking{filtered.length!==1?'s':''}</p>
              <button onClick={exportCSV} style={{ background: colors.orangeLight, color: colors.orange, border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>⬇ Export</button>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr', padding: '10px 22px', background: '#F7F5F2' }}>
                {['Employee','Employer','Vendor','Package','Payment','Total','Status'].map(h=>(
                  <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>
              {filtered.map((b,i)=>(
                <div key={b.id} style={{ display:'grid', gridTemplateColumns:'1.5fr 1.2fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr', padding:'10px 22px', borderTop:'1px solid #f5f5f5', alignItems:'center' }}>
                  <span style={{ fontSize:13, fontWeight:600, color:colors.dark }}>{b.employee_name}</span>
                  <span style={{ fontSize:12.5, color:colors.mid }}>{b.company_name}</span>
                  <span style={{ fontSize:12.5, color:colors.mid }}>{b.vendor_name}</span>
                  <span style={{ fontSize:12.5, color:colors.mid }}>{b.package_title}</span>
                  <span style={{ fontSize:11.5, fontWeight:700, color:(b.payment_method||'payroll')==='card'?colors.blue:colors.orange, textTransform:'capitalize' }}>{b.payment_method||'payroll'}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:colors.dark }}>£{Number(b.total_amount||0).toLocaleString()}</span>
                  <Badge status={b.status}/>
                </div>
              ))}
            </div>
          </div>
        )}
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

// ═══════════════════════════════════════════════════════════
// INTEGRATIONS TAB
// ═══════════════════════════════════════════════════════════
const CONN_STATUS = {
  connected:    { label: 'Connected',     color: '#1D9E75', bg: '#EAF3EE' },
  pending:      { label: 'Pending',       color: '#B45309', bg: '#FEF3C7' },
  error:        { label: 'Error',         color: '#C0392B', bg: '#FDECEA' },
  disconnected: { label: 'Disconnected',  color: '#9E8E7E', bg: '#F7F5F2' },
  not_set:      { label: 'Not configured',color: '#9E8E7E', bg: '#F7F5F2' },
};

function IntegrationCard({ name, type, status, lastSync, endpoint, notes, onEdit, onTest, onDelete }) {
  const st = CONN_STATUS[status] || CONN_STATUS.not_set;
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '18px 20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 14.5, fontWeight: 700, color: colors.dark }}>{name}</p>
            <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 6, padding: '2px 8px' }}>{st.label}</span>
          </div>
          <p style={{ fontSize: 12.5, color: colors.muted }}>{type}</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onTest} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Test</button>
          <button onClick={onEdit} style={{ background: colors.dark, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Edit</button>
          <button onClick={onDelete} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Remove</button>
        </div>
      </div>
      {endpoint && (
        <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '7px 12px', marginBottom: 8, fontFamily: 'monospace', fontSize: 12, color: colors.mid, wordBreak: 'break-all' }}>
          {endpoint}
        </div>
      )}
      <div style={{ display: 'flex', gap: 16 }}>
        {lastSync && <p style={{ fontSize: 12, color: colors.faint }}>Last sync: {new Date(lastSync).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
        {notes && <p style={{ fontSize: 12, color: colors.faint, fontStyle: 'italic' }}>{notes}</p>}
      </div>
    </div>
  );
}

function EditIntegrationModal({ integration, onClose, onSave }) {
  const isNew = !integration.id;
  const [form, setForm] = useState({
    name:        integration.name || '',
    type:        integration.type || 'REST API',
    category:    integration.category || 'hris',
    endpoint:    integration.endpoint || '',
    api_key:     '',
    secret:      '',
    status:      integration.status || 'pending',
    notes:       integration.notes || '',
    postback_url: integration.postback_url || '',
    postback_events: integration.postback_events || [],
  });
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const EVENTS = ['booking.created','booking.approved','booking.confirmed','booking.cancelled','employee.created','employee.updated'];

  const save = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title={isNew ? 'Add integration' : `Edit — ${integration.name}`} onClose={onClose} width={580}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lStyle}>Integration name</label>
          <input value={form.name} onChange={e=>f('name',e.target.value)} placeholder="e.g. Workday Production" style={iStyle}/>
        </div>
        <div>
          <label style={lStyle}>Category</label>
          <select value={form.category} onChange={e=>f('category',e.target.value)} style={{...iStyle, background:'#fff'}}>
            <option value="hris">HRIS</option>
            <option value="payroll">Payroll</option>
            <option value="sso">SSO</option>
            <option value="postback">SSL Postback</option>
            <option value="webhook">Webhook</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label style={lStyle}>Connection type</label>
          <select value={form.type} onChange={e=>f('type',e.target.value)} style={{...iStyle, background:'#fff'}}>
            {['REST API','SFTP','SSL Postback','Webhook','OAuth 2.0','SAML','Manual'].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lStyle}>API endpoint / URL</label>
          <input value={form.endpoint} onChange={e=>f('endpoint',e.target.value)} placeholder="https://api.workday.com/v1/..." style={iStyle}/>
        </div>
        {form.category === 'postback' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={lStyle}>Postback URL</label>
            <input value={form.postback_url} onChange={e=>f('postback_url',e.target.value)} placeholder="https://partner.com/webhook/sabba" style={iStyle}/>
          </div>
        )}
        <div>
          <label style={lStyle}>API key</label>
          <input value={form.api_key} onChange={e=>f('api_key',e.target.value)} placeholder="sk-…  (leave blank to keep existing)" type="password" style={iStyle}/>
        </div>
        <div>
          <label style={lStyle}>Secret / token</label>
          <input value={form.secret} onChange={e=>f('secret',e.target.value)} placeholder="Leave blank to keep existing" type="password" style={iStyle}/>
        </div>
        <div>
          <label style={lStyle}>Status</label>
          <select value={form.status} onChange={e=>f('status',e.target.value)} style={{...iStyle, background:'#fff'}}>
            {Object.keys(CONN_STATUS).map(s=><option key={s} value={s}>{CONN_STATUS[s].label}</option>)}
          </select>
        </div>
        <div>
          <label style={lStyle}>Notes</label>
          <input value={form.notes} onChange={e=>f('notes',e.target.value)} placeholder="Any context or requirements" style={iStyle}/>
        </div>
        {form.category === 'postback' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={lStyle}>Postback events</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {EVENTS.map(ev => {
                const checked = form.postback_events.includes(ev);
                return (
                  <div key={ev} onClick={() => f('postback_events', checked ? form.postback_events.filter(e=>e!==ev) : [...form.postback_events, ev])}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${checked?colors.orange:'#eee'}`, background: checked?colors.orangeLight:'#fff', fontSize: 12.5, fontWeight: 600, color: checked?colors.orange:colors.mid, cursor: 'pointer', userSelect: 'none' }}>
                    {ev}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: colors.muted }}>API keys and secrets are stored encrypted. They are never displayed after saving.</p>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Cancel</button>
        <button onClick={save} disabled={saving || !form.name}
          style={{ background: form.name ? colors.dark : '#eee', color: form.name ? '#fff' : '#aaa', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13.5, fontWeight: 700, cursor: form.name ? 'pointer' : 'default', fontFamily: font.body }}>
          {saving ? 'Saving…' : isNew ? 'Add integration' : 'Save changes'}
        </button>
      </div>
    </Modal>
  );
}

export function AdminIntegrations() {
  const [companies,    setCompanies]    = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selCompany,   setSelCompany]   = useState('');
  const [editing,      setEditing]      = useState(null);
  const [testResult,   setTestResult]   = useState(null);
  const [testing,      setTesting]      = useState(null);

  useEffect(() => {
    api.get('/admin/companies').then(r => {
      setCompanies(r.data);
      if (r.data.length > 0) setSelCompany(r.data[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selCompany) return;
    api.get(`/admin/integrations/${selCompany}`).then(r => setIntegrations(r.data)).catch(() => setIntegrations([]));
  }, [selCompany]);

  const saveIntegration = async (form) => {
    if (editing?.id) {
      const { data } = await api.patch(`/admin/integrations/${selCompany}/${editing.id}`, form);
      setIntegrations(is => is.map(i => i.id === editing.id ? data : i));
    } else {
      const { data } = await api.post(`/admin/integrations/${selCompany}`, form);
      setIntegrations(is => [...is, data]);
    }
  };

  const deleteIntegration = async (id) => {
    if (!window.confirm('Remove this integration?')) return;
    await api.delete(`/admin/integrations/${selCompany}/${id}`).catch(() => {});
    setIntegrations(is => is.filter(i => i.id !== id));
  };

  const testIntegration = async (integration) => {
    setTesting(integration.id); setTestResult(null);
    try {
      const { data } = await api.post(`/admin/integrations/${selCompany}/${integration.id}/test`);
      setTestResult({ id: integration.id, success: data.success, message: data.message || (data.success ? 'Connection successful' : 'Connection failed') });
    } catch (err) {
      setTestResult({ id: integration.id, success: false, message: err.response?.data?.error || 'Test failed — check endpoint and credentials' });
    } finally {
      setTesting(null);
    }
  };

  const company = companies.find(c => c.id === selCompany);

  // Group by category
  const grouped = integrations.reduce((a, i) => {
    const k = i.category || 'other';
    a[k] = [...(a[k]||[]), i];
    return a;
  }, {});

  const CATEGORY_LABELS = { hris: 'HRIS Systems', payroll: 'Payroll', sso: 'SSO & Authentication', postback: 'SSL Postbacks', webhook: 'Webhooks', other: 'Other' };
  const CATEGORY_ICONS  = { hris: '🏗', payroll: '💷', sso: '🔐', postback: '🔄', webhook: '⚡', other: '🔌' };

  return (
    <AdminLayout active="integrations">
      {editing && (
        <EditIntegrationModal
          integration={editing}
          onClose={() => setEditing(null)}
          onSave={saveIntegration}
        />
      )}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Integrations</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={selCompany} onChange={e => setSelCompany(e.target.value)}
              style={{ border: '1.5px solid #eee', borderRadius: 10, padding: '8px 14px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', background: '#fff' }}>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setEditing({ category: 'hris' })}
              style={{ background: colors.dark, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              + Add integration
            </button>
          </div>
        </div>

        {/* Summary strip */}
        {company && (
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #eee' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>{company.name}</p>
            <p style={{ fontSize: 12.5, color: colors.muted }}>Plan: <strong style={{ color: colors.orange, textTransform: 'capitalize' }}>{company.plan || 'starter'}</strong></p>
            <p style={{ fontSize: 12.5, color: colors.muted }}>HRIS: <strong style={{ color: colors.dark }}>{company.hris || 'Not set'}</strong></p>
            <p style={{ fontSize: 12.5, color: colors.muted }}>Payroll: <strong style={{ color: colors.dark }}>{company.payroll || 'Not set'}</strong></p>
            <span style={{ fontSize: 12, fontWeight: 700, color: integrations.filter(i=>i.status==='connected').length > 0 ? colors.green : colors.muted, background: integrations.filter(i=>i.status==='connected').length > 0 ? colors.greenLight : '#F7F5F2', borderRadius: 6, padding: '2px 10px' }}>
              {integrations.filter(i=>i.status==='connected').length} connected · {integrations.length} total
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '24px 36px' }}>
        {loading ? <Spinner/> : integrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
            <p style={{ fontSize: 17, fontWeight: 700, color: colors.dark, marginBottom: 8 }}>No integrations configured</p>
            <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 24 }}>
              {company?.hris ? `${company.hris} was noted during onboarding — add the connection details below.` : 'Add HRIS, payroll, SSO or postback integrations for this employer.'}
            </p>
            <button onClick={() => setEditing({ category: company?.hris ? 'hris' : 'other', name: company?.hris || '' })}
              style={{ background: colors.dark, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              + Add first integration
            </button>
          </div>
        ) : (
          <>
            {testResult && (
              <div style={{ marginBottom: 16, padding: '12px 18px', background: testResult.success ? colors.greenLight : colors.redLight, border: `1px solid ${testResult.success ? colors.green : colors.red}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: testResult.success ? colors.green : colors.red }}>
                  {testResult.success ? '✓' : '⚠'} {testResult.message}
                </p>
                <button onClick={() => setTestResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: colors.muted }}>✕</button>
              </div>
            )}
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[cat] || '🔌'}</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: colors.dark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{CATEGORY_LABELS[cat] || cat}</p>
                  <span style={{ fontSize: 11.5, color: colors.muted, fontWeight: 600 }}>{items.length} integration{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(integ => (
                    <IntegrationCard
                      key={integ.id}
                      {...integ}
                      onEdit={() => setEditing(integ)}
                      onTest={() => testIntegration(integ)}
                      onDelete={() => deleteIntegration(integ.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Planned integrations from onboarding */}
        {company && (company.hris || company.payroll) && integrations.length === 0 && (
          <div style={{ marginTop: 24, background: '#F7F5F2', borderRadius: 14, padding: '18px 22px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 10 }}>Planned from onboarding</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {company.hris && (
                <div onClick={() => setEditing({ name: company.hris, category: 'hris', type: company.hris_conn || 'REST API' })}
                  style={{ background: '#fff', border: '1.5px dashed #ddd', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🏗</span>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{company.hris}</p>
                    <p style={{ fontSize: 12, color: colors.muted }}>{company.hris_conn || 'Connection type TBC'} · Click to configure</p>
                  </div>
                </div>
              )}
              {company.payroll && (
                <div onClick={() => setEditing({ name: company.payroll, category: 'payroll', type: company.payroll_conn || 'REST API' })}
                  style={{ background: '#fff', border: '1.5px dashed #ddd', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>💷</span>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{company.payroll}</p>
                    <p style={{ fontSize: 12, color: colors.muted }}>{company.payroll_conn || 'Connection type TBC'} · Click to configure</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// SETTINGS & TEAM — Add super admins + impersonate HR
// ═══════════════════════════════════════════════════════════
export function AdminSettings() {
  // AdminProfile is rendered inline at the top of this page
  const { user: currentUser } = useAuth();

  // Super admin team state
  const [admins,       setAdmins]       = useState([]);
  const [companies,    setCompanies]    = useState([]);
  const [loadingAdmins,setLoadingAdmins]= useState(true);

  // Add admin form
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [addForm,      setAddForm]      = useState({ full_name: '', email: '' });
  const [addError,     setAddError]     = useState('');
  const [addSaving,    setAddSaving]    = useState(false);
  const [addSuccess,   setAddSuccess]   = useState('');

  // Impersonation
  const [impersSelCompany, setImpersSelCompany] = useState('');
  const [hrUsers,           setHrUsers]          = useState([]);
  const [loadingHr,         setLoadingHr]        = useState(false);
  const [impersonating,     setImpersonating]    = useState(false);
  const [impersonateResult, setImpersonateResult]= useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/team'),
      api.get('/admin/companies'),
    ]).then(([t, c]) => {
      setAdmins(t.data);
      setCompanies(c.data);
      if (c.data.length > 0) setImpersSelCompany(c.data[0].id);
    }).finally(() => setLoadingAdmins(false));
  }, []);

  // Load HR users when employer changes
  useEffect(() => {
    if (!impersSelCompany) return;
    setLoadingHr(true); setHrUsers([]); setImpersonateResult(null);
    api.get(`/admin/companies/${impersSelCompany}/hr-users`)
      .then(r => setHrUsers(r.data))
      .catch(() => setHrUsers([]))
      .finally(() => setLoadingHr(false));
  }, [impersSelCompany]);

  const addAdmin = async () => {
    if (!addForm.full_name || !addForm.email) { setAddError('Name and email are required'); return; }
    setAddSaving(true); setAddError('');
    try {
      const { data } = await api.post('/admin/team', addForm);
      setAdmins(a => [...a, data]);
      setAddSuccess(`Super admin created. Temp password: Sabba@Admin2026!`);
      setAddForm({ full_name: '', email: '' });
      setTimeout(() => setAddSuccess(''), 8000);
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to create admin');
    } finally {
      setAddSaving(false);
    }
  };

  const deactivateAdmin = async (id) => {
    if (!window.confirm('Deactivate this super admin?')) return;
    await api.patch(`/admin/team/${id}`, { active: false });
    setAdmins(a => a.map(x => x.id === id ? { ...x, active: false } : x));
  };

  const impersonate = async (hrUser) => {
    setImpersonating(true); setImpersonateResult(null);
    try {
      const { data } = await api.post('/admin/impersonate', { user_id: hrUser.id });
      setImpersonateResult({ success: true, user: hrUser, token: data.token });
    } catch (err) {
      setImpersonateResult({ success: false, message: err.response?.data?.error || 'Failed to impersonate' });
    } finally {
      setImpersonating(false);
    }
  };

  const launchImpersonation = (token, user) => {
    const adminToken = localStorage.getItem('sabba_token');
    sessionStorage.setItem('sabba_admin_token', adminToken);
    sessionStorage.setItem('sabba_impersonating', JSON.stringify({ name: user.full_name, email: user.email, company: user.company_name || '' }));
    localStorage.setItem('sabba_token', token);
    window.location.href = '/hr';
  };

  const company = companies.find(c => c.id === impersSelCompany);

  return (
    <AdminLayout active="settings">
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Settings & team</h1>
      </div>

      {/* Super admin profile */}
      <div style={{ padding: '28px 36px 0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>My profile</h2>
        <AdminProfile/>
        <div style={{ height: 1, background: '#eee', margin: '28px 0' }}/>
      </div>

      <div style={{ padding: '0 36px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Super admin team ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>Super admin team</h2>
              <p style={{ fontSize: 13, color: colors.muted }}>Manage who has platform-wide admin access.</p>
            </div>
            <button onClick={() => setShowAddAdmin(s => !s)}
              style={{ background: colors.dark, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              {showAddAdmin ? 'Cancel' : '+ Add admin'}
            </button>
          </div>

          {/* Add admin form */}
          {showAddAdmin && (
            <div style={{ background: '#F7F5F2', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 12 }}>New super admin</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={lStyle}>Full name</label>
                  <input value={addForm.full_name} onChange={e => setAddForm(f=>({...f,full_name:e.target.value}))}
                    placeholder="e.g. Amara Osei" style={iStyle}/>
                </div>
                <div>
                  <label style={lStyle}>Email address</label>
                  <input type="email" value={addForm.email} onChange={e => setAddForm(f=>({...f,email:e.target.value}))}
                    placeholder="amara@sabbaplatform.com" style={iStyle}/>
                </div>
              </div>
              {addError   && <p style={{ fontSize: 12.5, color: colors.red, fontWeight: 600, marginBottom: 8 }}>⚠ {addError}</p>}
              {addSuccess  && (
                <div style={{ background: colors.greenLight, borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                  <p style={{ fontSize: 12.5, color: colors.green, fontWeight: 700 }}>✓ {addSuccess}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, background: colors.orangeLight, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                <span style={{ fontSize: 14 }}>🔑</span>
                <p style={{ fontSize: 12, color: colors.orange }}>Temporary password: <strong>Sabba@Admin2026!</strong> — ask them to change it on first login.</p>
              </div>
              <button onClick={addAdmin} disabled={addSaving}
                style={{ background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, width: '100%' }}>
                {addSaving ? 'Creating…' : 'Create super admin'}
              </button>
            </div>
          )}

          {/* Admin list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingAdmins ? <Spinner/> : admins.length === 0 ? (
              <p style={{ fontSize: 13, color: colors.muted }}>No admins found.</p>
            ) : admins.map(admin => {
              const isCurrentUser = admin.id === currentUser?.id;
              return (
                <div key={admin.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fff', border: '1px solid #eee', borderRadius: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: isCurrentUser ? `linear-gradient(135deg, ${colors.orange}, #f5a066)` : colors.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {admin.full_name?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark }}>{admin.full_name}</p>
                      {isCurrentUser && <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.orange, background: colors.orangeLight, borderRadius: 5, padding: '1px 7px' }}>You</span>}
                      {admin.active === false && <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.red, background: colors.redLight, borderRadius: 5, padding: '1px 7px' }}>Inactive</span>}
                    </div>
                    <p style={{ fontSize: 12, color: colors.muted }}>{admin.email}</p>
                    <p style={{ fontSize: 11, color: colors.faint }}>Added {admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'}</p>
                  </div>
                  {!isCurrentUser && admin.active !== false && (
                    <button onClick={() => deactivateAdmin(admin.id)}
                      style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, flexShrink: 0 }}>
                      Deactivate
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Impersonate HR admin ── */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>Impersonate HR admin</h2>
            <p style={{ fontSize: 13, color: colors.muted }}>Log in as an HR admin to view and troubleshoot their exact experience. Every impersonation is logged.</p>
          </div>

          {/* Warning */}
          <div style={{ display: 'flex', gap: 10, background: '#FEF3C7', border: '1px solid #fbbf24', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.6 }}>
              Impersonation gives you full access to the employer's account. Actions taken during impersonation appear as if performed by that HR admin. Use only for support purposes.
            </p>
          </div>

          {/* Employer select */}
          <div style={{ marginBottom: 12 }}>
            <label style={lStyle}>Select employer</label>
            <select value={impersSelCompany} onChange={e => setImpersSelCompany(e.target.value)}
              style={{ ...iStyle, background: '#fff' }}>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* HR users for selected company */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ ...lStyle, marginBottom: 10 }}>Select HR admin to impersonate</label>
            {loadingHr ? <Spinner/> : hrUsers.length === 0 ? (
              <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: colors.muted }}>No HR admins found for {company?.name}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hrUsers.map(hr => (
                  <div key={hr.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #eee', borderRadius: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: colors.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {hr.full_name?.charAt(0) || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, marginBottom: 2 }}>{hr.full_name}</p>
                      <p style={{ fontSize: 12, color: colors.muted }}>{hr.email}</p>
                    </div>
                    <button onClick={() => impersonate(hr)} disabled={impersonating}
                      style={{ background: colors.orangeLight, color: colors.orange, border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, flexShrink: 0 }}>
                      {impersonating ? '…' : 'Login as'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Impersonation result */}
          {impersonateResult && (
            <div style={{ background: impersonateResult.success ? colors.greenLight : colors.redLight, border: `1px solid ${impersonateResult.success ? colors.green : colors.red}`, borderRadius: 12, padding: '16px 18px' }}>
              {impersonateResult.success ? (
                <>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.green, marginBottom: 8 }}>
                    ✓ Ready to impersonate {impersonateResult.user.full_name}
                  </p>
                  <p style={{ fontSize: 12.5, color: colors.green, marginBottom: 12, lineHeight: 1.6 }}>
                    This will open the HR portal as {impersonateResult.user.email}. An impersonation banner will appear at the top. Click "Exit impersonation" to return to your admin session.
                  </p>
                  <button onClick={() => launchImpersonation(impersonateResult.token, impersonateResult.user)}
                    style={{ background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, width: '100%' }}>
                    Open HR portal as {impersonateResult.user.full_name} →
                  </button>
                </>
              ) : (
                <p style={{ fontSize: 13, color: colors.red, fontWeight: 600 }}>⚠ {impersonateResult.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// EMAIL TEMPLATES PAGE
// ═══════════════════════════════════════════════════════════
const EMAIL_TYPES = [
  { id: 'welcome_employee',    label: 'Welcome — Employee',     icon: '👋', globalOnly: false, desc: 'Sent when an employee is imported via CSV or created' },
  { id: 'welcome_hr',          label: 'Welcome — HR Admin',     icon: '🏢', globalOnly: false, desc: 'Sent when a new employer account is created' },
  { id: 'booking_submitted',   label: 'Booking submitted',      icon: '📋', globalOnly: false, desc: 'Sent to employee when they submit a booking' },
  { id: 'booking_approved',    label: 'Booking approved',       icon: '✅', globalOnly: false, desc: 'Sent to employee when HR approves their booking' },
  { id: 'hr_approval_request', label: 'HR approval request',    icon: '⏳', globalOnly: false, desc: 'Sent to HR admin when an employee submits a booking' },
  { id: 'vendor_rejected',     label: 'Vendor rejected',        icon: '🚫', globalOnly: false, desc: 'Sent to vendor when their application is rejected' },
  { id: 'password_reset',      label: 'Password reset',         icon: '🔑', globalOnly: true,  desc: 'Sent when any user requests a password reset — global only' },
];

const VAR_CHIPS = {
  welcome_employee:    ['{{first_name}}','{{full_name}}','{{email}}','{{company_name}}','{{temp_password}}'],
  welcome_hr:          ['{{first_name}}','{{full_name}}','{{email}}','{{company_name}}','{{temp_password}}'],
  booking_submitted:   ['{{first_name}}','{{full_name}}','{{package_title}}','{{destination}}'],
  booking_approved:    ['{{first_name}}','{{full_name}}','{{package_title}}','{{destination}}','{{departure_date}}','{{total_amount}}','{{payment_method}}'],
  hr_approval_request: ['{{first_name}}','{{hr_name}}','{{employee_name}}','{{package_title}}','{{destination}}','{{total_amount}}'],
  vendor_rejected:     ['{{company_name}}','{{reason}}'],
  password_reset:      ['{{first_name}}','{{full_name}}','{{reset_url}}'],
};

export function AdminEmailTemplates() {
  const [companies,    setCompanies]    = useState([]);
  const [templates,    setTemplates]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selCompany,   setSelCompany]   = useState('global');
  const [selType,      setSelType]      = useState('welcome_employee');
  const [form,         setForm]         = useState({ subject: '', body_html: '' });
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [preview,      setPreview]      = useState('');
  const [showPreview,  setShowPreview]  = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/companies').then(r => setCompanies(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const cid = selCompany === 'global' ? '' : selCompany;
    api.get(`/admin/email-templates${cid ? `?company_id=${cid}` : ''}`)
      .then(r => setTemplates(r.data))
      .catch(() => setTemplates([]));
  }, [selCompany]);

  // Load template when type/company changes
  useEffect(() => {
    const existing = templates.find(t => t.email_type === selType);
    if (existing) {
      setForm({ subject: existing.subject, body_html: existing.body_html });
    } else {
      // Load default from DEFAULTS via API or set placeholder
      setForm({ subject: '', body_html: '' });
    }
    setShowPreview(false); setPreview('');
  }, [selType, templates]);

  const currentType = EMAIL_TYPES.find(t => t.id === selType);
  const existingTemplate = templates.find(t => t.email_type === selType);
  const isGlobalOnly = currentType?.globalOnly;
  const isCustomised = !!existingTemplate;

  const save = async () => {
    if (!form.subject || !form.body_html) return;
    setSaving(true); setSaved(false);
    try {
      const cid = selCompany === 'global' ? null : selCompany;
      const { data } = await api.put('/admin/email-templates', {
        email_type: selType,
        subject:    form.subject,
        body_html:  form.body_html,
        company_id: cid,
      });
      setTemplates(ts => {
        const idx = ts.findIndex(t => t.email_type === selType);
        return idx >= 0 ? ts.map((t,i) => i===idx ? data : t) : [...ts, data];
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const revertToDefault = async () => {
    if (!existingTemplate) return;
    if (!window.confirm('Revert to default template? This will delete the custom version.')) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/email-templates/${existingTemplate.id}`);
      setTemplates(ts => ts.filter(t => t.email_type !== selType));
      setForm({ subject: '', body_html: '' });
    } catch {}
    finally { setDeleting(false); }
  };

  const loadPreview = async () => {
    if (!form.body_html) return;
    setPreviewLoading(true);
    try {
      const { data } = await api.post('/admin/email-templates/preview', { body_html: form.body_html, subject: form.subject });
      setPreview(data.html);
      setShowPreview(true);
    } catch {}
    finally { setPreviewLoading(false); }
  };

  const insertVar = (v) => {
    setForm(f => ({ ...f, body_html: f.body_html + v }));
  };

  return (
    <AdminLayout active="email-templates">
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '24px 36px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Super Admin</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Email templates</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: colors.muted }}>Scope:</span>
            <select value={selCompany} onChange={e => setSelCompany(e.target.value)}
              style={{ border: '1.5px solid #eee', borderRadius: 10, padding: '8px 14px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', background: '#fff' }}>
              <option value="global">Global (all employers)</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: 'calc(100vh - 100px)' }}>

        {/* ── Left: email type list ── */}
        <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', background: '#fff' }}>
          {EMAIL_TYPES.map(type => {
            const isCustom = templates.some(t => t.email_type === type.id);
            const isSelected = selType === type.id;
            const disabled = type.globalOnly && selCompany !== 'global';
            return (
              <div key={type.id} onClick={() => !disabled && setSelType(type.id)}
                style={{ padding: '14px 20px', borderBottom: '1px solid #f5f5f5', cursor: disabled ? 'default' : 'pointer', background: isSelected ? colors.orangeLight : 'transparent', opacity: disabled ? 0.4 : 1, transition: 'background 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{type.icon}</span>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: isSelected ? colors.orange : colors.dark, flex: 1 }}>{type.label}</p>
                  {isCustom && <span style={{ fontSize: 10, fontWeight: 700, color: colors.orange, background: colors.orangeLight, borderRadius: 5, padding: '1px 6px' }}>Custom</span>}
                  {type.globalOnly && <span style={{ fontSize: 10, fontWeight: 700, color: colors.muted, background: '#F7F5F2', borderRadius: 5, padding: '1px 6px' }}>Global</span>}
                </div>
                <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.4, paddingLeft: 24 }}>{type.desc}</p>
              </div>
            );
          })}
        </div>

        {/* ── Right: editor ── */}
        <div style={{ overflowY: 'auto', padding: '24px 28px' }}>
          {/* Scope info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: isCustomised ? colors.orangeLight : '#F7F5F2', borderRadius: 10 }}>
            <span style={{ fontSize: 14 }}>{isCustomised ? '✏️' : '📄'}</span>
            <p style={{ fontSize: 13, color: isCustomised ? colors.orange : colors.muted, flex: 1 }}>
              {isCustomised
                ? `Custom template for ${selCompany === 'global' ? 'all employers' : companies.find(c=>c.id===selCompany)?.name}. Changes are live immediately.`
                : `Using ${selCompany === 'global' ? 'hardcoded default' : 'global or default'} template. Save to create a custom version.`
              }
            </p>
            {isCustomised && (
              <button onClick={revertToDefault} disabled={deleting}
                style={{ background: 'none', border: `1px solid ${colors.orange}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, color: colors.orange, cursor: 'pointer', fontWeight: 700, fontFamily: font.body }}>
                {deleting ? 'Reverting…' : 'Revert to default'}
              </button>
            )}
          </div>

          {isGlobalOnly && selCompany !== 'global' && (
            <div style={{ background: '#FEF3C7', border: '1px solid #fbbf24', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#92400E' }}>Password reset emails are global only — switch scope to Global to edit this template.</p>
            </div>
          )}

          {/* Subject */}
          <div style={{ marginBottom: 16 }}>
            <label style={lStyle}>Subject line</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Enter email subject…"
              style={{ ...iStyle }}/>
          </div>

          {/* Variable chips */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ ...lStyle, marginBottom: 8 }}>Available variables — click to insert</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(VAR_CHIPS[selType] || []).map(v => (
                <button key={v} onClick={() => insertVar(v)}
                  style={{ background: '#F7F5F2', border: '1px solid #eee', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: colors.dark, cursor: 'pointer', fontFamily: 'monospace' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Body HTML editor */}
          <div style={{ marginBottom: 16 }}>
            <label style={lStyle}>Email body (HTML)</label>
            <textarea value={form.body_html}
              onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))}
              placeholder="Enter HTML content… Use variables like {{first_name}} and basic HTML tags like <h1>, <p>, <strong>, <a>."
              style={{ ...iStyle, minHeight: 280, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}/>
            <p style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>Use the <code style={{ background: '#F7F5F2', padding: '1px 5px', borderRadius: 3 }}>.info-box</code> class for the grey info boxes. Example: <code style={{ background: '#F7F5F2', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>&lt;div class="info-box"&gt;...&lt;/div&gt;</code></p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
            <button onClick={loadPreview} disabled={!form.body_html || previewLoading}
              style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              {previewLoading ? 'Loading…' : '👁 Preview email'}
            </button>
            <button onClick={save} disabled={saving || !form.subject || !form.body_html}
              style={{ background: form.subject && form.body_html ? colors.dark : '#eee', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              {saving ? 'Saving…' : 'Save template'}
            </button>
            {saved && <span style={{ fontSize: 13, color: colors.green, fontWeight: 700 }}>✓ Saved</span>}
          </div>

          {/* Preview iframe */}
          {showPreview && preview && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>Email preview</p>
                <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: colors.muted, fontFamily: font.body }}>✕ Close</button>
              </div>
              <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
                <iframe
                  srcDoc={preview}
                  style={{ width: '100%', height: 600, border: 'none' }}
                  title="Email preview"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// SUPER ADMIN PROFILE (added to Settings page)
// ═══════════════════════════════════════════════════════════
export function AdminProfile() {
  const fileRef  = useRef(null);
  const [profile,  setProfile]   = useState(null);
  const [loading,  setLoading]   = useState(true);
  const [avatar,   setAvatar]    = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [form,     setForm]      = useState({ full_name: '', email: '' });
  const [pwForm,   setPwForm]    = useState({ current: '', newPw: '', confirm: '' });
  const [saving,   setSaving]    = useState(false);
  const [savingPw, setSavingPw]  = useState(false);
  const [msg,      setMsg]       = useState('');
  const [err,      setErr]       = useState('');
  const [pwMsg,    setPwMsg]     = useState('');
  const [pwErr,    setPwErr]     = useState('');

  useEffect(() => {
    api.get('/admin/profile').then(r => {
      setProfile(r.data);
      setForm({ full_name: r.data.full_name || '', email: r.data.email || '' });
      if (r.data.avatar_url) setAvatar(r.data.avatar_url);
    }).finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = e => {
    const file = e.target.files[0]; if (!file) return;
    setAvatarFile(file);
    setAvatar(URL.createObjectURL(file));
  };

  const saveAvatar = async () => {
    if (!avatarFile) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', avatarFile);
      const { data } = await api.post('/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.patch('/admin/profile/avatar', { avatar_url: data.url });
      setMsg('Photo updated'); setAvatarFile(null);
    } catch { setErr('Upload failed'); }
    finally { setSaving(false); }
  };

  const saveProfile = async () => {
    setSaving(true); setMsg(''); setErr('');
    try {
      const { data } = await api.patch('/admin/profile', { full_name: form.full_name, email: form.email });
      setProfile(p => ({ ...p, ...data }));
      setMsg('Profile updated successfully');
    } catch (e) { setErr(e.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) { setPwErr('New passwords do not match'); return; }
    if (pwForm.newPw.length < 8) { setPwErr('Password must be at least 8 characters'); return; }
    setSavingPw(true); setPwMsg(''); setPwErr('');
    try {
      await api.patch('/admin/profile', { current_password: pwForm.current, new_password: pwForm.newPw });
      setPwMsg('Password changed successfully');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (e) { setPwErr(e.response?.data?.error || 'Failed to change password'); }
    finally { setSavingPw(false); }
  };

  const initials = profile?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'SA';

  if (loading) return <div style={{ padding: 40 }}><Spinner/></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '22px 24px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 18 }}>Profile details</h2>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatar
              ? <img src={avatar} alt="Avatar" style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: '3px solid #eee' }}/>
              : <div style={{ width: 72, height: 72, borderRadius: 16, background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>{initials}</div>
            }
            <button onClick={() => fileRef.current?.click()}
              style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: colors.dark, border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
              ✏️
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }}/>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>{profile?.full_name}</p>
            <p style={{ fontSize: 13, color: colors.muted }}>Super Admin · {profile?.email}</p>
          </div>
          {avatarFile && (
            <button onClick={saveAvatar} disabled={saving}
              style={{ marginLeft: 'auto', background: colors.dark, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
              {saving ? 'Uploading…' : 'Save photo'}
            </button>
          )}
        </div>

        {/* Profile fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={lStyle}>Full name</label>
            <input value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} style={iStyle}/>
          </div>
          <div>
            <label style={lStyle}>Email address</label>
            <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} style={iStyle}/>
          </div>
        </div>
        {msg && <p style={{ fontSize: 13, color: colors.green, fontWeight: 700, marginBottom: 10 }}>✓ {msg}</p>}
        {err && <p style={{ fontSize: 13, color: colors.red,   fontWeight: 700, marginBottom: 10 }}>⚠ {err}</p>}
        <button onClick={saveProfile} disabled={saving}
          style={{ background: colors.dark, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>

      {/* Password change */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '22px 24px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 18 }}>Change password</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
          {[['current','Current password'],['newPw','New password'],['confirm','Confirm new password']].map(([k,label])=>(
            <div key={k}>
              <label style={lStyle}>{label}</label>
              <input type="password" value={pwForm[k]} onChange={e=>setPwForm(f=>({...f,[k]:e.target.value}))} style={iStyle}/>
            </div>
          ))}
        </div>
        {pwMsg && <p style={{ fontSize: 13, color: colors.green, fontWeight: 700, marginBottom: 10 }}>✓ {pwMsg}</p>}
        {pwErr && <p style={{ fontSize: 13, color: colors.red,   fontWeight: 700, marginBottom: 10 }}>⚠ {pwErr}</p>}
        <button onClick={changePassword} disabled={savingPw || !pwForm.current || !pwForm.newPw || !pwForm.confirm}
          style={{ background: pwForm.current && pwForm.newPw ? colors.dark : '#eee', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
          {savingPw ? 'Updating…' : 'Change password'}
        </button>
      </div>
    </div>
  );
}


// ── Admin Sponsored Listings ─────────────────────────────────
export function AdminSponsored() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [vendors,  setVendors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [vendorFilter, setVendorFilter] = useState('');
  const [form, setForm] = useState({ package_id: '', vendor_id: '', slot_number: 1, listing_type: 'marketplace', monthly_fee_gbp: 2000, start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '' });
  const toDateStr = (val) => val ? String(val).split('T')[0] : '';
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const fetch_all = () => {
    Promise.all([
      api.get('/packages/sponsored/all'),
      api.get('/packages'),
      api.get('/vendors/all'),
    ]).then(([l, p, v]) => {
      setListings(l.data || []);
      setPackages(p.data || []);
      setVendors(v.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch_all(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/packages/sponsored', form);
      setShowForm(false);
      setForm({ package_id: '', vendor_id: '', slot_number: 1, listing_type: 'marketplace', monthly_fee_gbp: 2000, start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '' });
      fetch_all();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create sponsored listing');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this sponsored listing?')) return;
    await api.delete(`/packages/sponsored/${id}`);
    fetch_all();
  };

  const today = new Date().toISOString().split('T')[0];

  const activeListings  = listings.filter(l => toDateStr(l.end_date) >= today);
  const expiredListings = listings.filter(l => toDateStr(l.end_date) < today);

  const lStyle = { fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 };
  const iStyle = { width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, fontWeight: 500 };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}><Spinner/></div>;

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', padding: '32px 36px', paddingBottom: 80 }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: colors.orange, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: font.body, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          ← Back to dashboard
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 6 }}>Sponsored listings</h1>
          <p style={{ fontSize: 13.5, color: colors.muted }}>Manage marketplace featured slots and platinum community sidebar placements.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add sponsored listing</Button>
      </div>

      {/* Slot status overview — Marketplace */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>⭐ Marketplace slots — top of Explore page</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[1, 2, 3].map(slot => {
            const active = activeListings.find(l => Number(l.slot_number) === slot && l.listing_type !== 'platinum');
            return (
              <div key={slot} style={{ background: active ? '#FDF3E3' : '#fff', border: `1px solid ${active ? '#F59E0B' : '#eee'}`, borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Slot {slot}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, background: active ? '#FEF3C7' : '#F3F4F6', color: active ? '#D97706' : colors.faint, borderRadius: 6, padding: '3px 8px' }}>
                    {active ? '⭐ OCCUPIED' : 'AVAILABLE'}
                  </span>
                </div>
                {active ? (
                  <>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>{active.package_title}</p>
                    <p style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>{active.vendor_name}</p>
                    <p style={{ fontSize: 12, color: colors.orange, fontWeight: 600 }}>£{Number(active.monthly_fee_gbp).toLocaleString()}/mo · until {new Date(toDateStr(active.end_date)).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</p>
                    <button onClick={() => handleDelete(active.id)} style={{ marginTop: 8, background: 'none', border: 'none', color: colors.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font.body, padding: 0 }}>Remove</button>
                  </>
                ) : (
                  <p style={{ fontSize: 12.5, color: colors.faint, marginTop: 4 }}>Empty — click '+ Add' to assign a package.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot status overview — Platinum */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>💎 Platinum slots — community page sidebars</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[1, 2, 3, 4].map(slot => {
            const active = activeListings.find(l => Number(l.slot_number) === slot && l.listing_type === 'platinum');
            const sideLabel = slot <= 2 ? 'Left sidebar' : 'Right sidebar';
            return (
              <div key={slot} style={{ background: active ? '#F5F3FF' : '#fff', border: `1px solid ${active ? '#8B5CF6' : '#eee'}`, borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Slot {slot}</p>
                    <p style={{ fontSize: 10, color: colors.faint }}>{sideLabel}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: active ? '#EDE9FE' : '#F3F4F6', color: active ? '#7C3AED' : colors.faint, borderRadius: 6, padding: '3px 8px' }}>
                    {active ? '💎 OCCUPIED' : 'AVAILABLE'}
                  </span>
                </div>
                {active ? (
                  <>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>{active.package_title}</p>
                    <p style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>{active.vendor_name}</p>
                    <p style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>£{Number(active.monthly_fee_gbp).toLocaleString()}/mo · until {new Date(toDateStr(active.end_date)).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</p>
                    <button onClick={() => handleDelete(active.id)} style={{ marginTop: 8, background: 'none', border: 'none', color: colors.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font.body, padding: 0 }}>Remove</button>
                  </>
                ) : (
                  <p style={{ fontSize: 12.5, color: colors.faint, marginTop: 4 }}>Empty — click '+ Add' to assign a package.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue summary */}
      {activeListings.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 32, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Monthly sponsorship revenue</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: font.display, color: colors.dark }}>£{activeListings.reduce((s, l) => s + Number(l.monthly_fee_gbp), 0).toLocaleString()}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Active slots</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: font.display, color: colors.dark }}>{activeListings.length} / 7</p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Annual run rate</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: font.display, color: colors.orange }}>£{(activeListings.reduce((s, l) => s + Number(l.monthly_fee_gbp), 0) * 12).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* All listings table */}
      {listings.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>All sponsored listings</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F7F5F2' }}>
                {['Slot','Package','Vendor','Fee/mo','Start','End','Status',''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map(l => {
                const isActive = toDateStr(l.end_date) >= today;
                return (
                  <tr key={l.id} style={{ borderTop: '1px solid #F7F5F2' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: l.listing_type === 'platinum' ? '#F3E8FF' : (isActive ? '#FEF3C7' : '#F3F4F6'), color: l.listing_type === 'platinum' ? '#7C3AED' : (isActive ? '#D97706' : colors.faint), borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }}>
                        {l.listing_type === 'platinum' ? '💎' : '⭐'} {l.slot_number}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13.5, color: colors.dark, fontWeight: 500 }}>{l.package_title}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: colors.muted }}>{l.vendor_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: colors.dark, fontWeight: 600 }}>£{Number(l.monthly_fee_gbp).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12.5, color: colors.muted }}>{new Date(toDateStr(l.start_date)).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12.5, color: colors.muted }}>{new Date(toDateStr(l.end_date)).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: isActive ? '#DCFCE7' : '#F3F4F6', color: isActive ? colors.green : colors.faint, borderRadius: 6, padding: '3px 8px' }}>
                        {isActive ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isActive && (
                        <button onClick={() => handleDelete(l.id)} style={{ background: 'none', border: 'none', color: colors.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font.body }}>Remove</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {listings.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>⭐</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: colors.dark, marginBottom: 8 }}>No sponsored listings yet</p>
          <p style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>Assign vendor packages to the 3 featured slots at the top of the marketplace.</p>
          <Button onClick={() => setShowForm(true)}>Add first sponsored listing</Button>
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <Modal title="Add sponsored listing" onClose={() => { setShowForm(false); setError(''); }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lStyle}>Listing type <span style={{ color: colors.orange }}>*</span></label>
              <select value={form.listing_type} onChange={e => setForm(f => ({...f, listing_type: e.target.value, slot_number: 1}))} style={iStyle} required>
                <option value="marketplace">⭐ Marketplace — featured at top of Explore page</option>
                <option value="platinum">💎 Platinum — sidebar on Community page</option>
              </select>
            </div>
            <div>
              <label style={lStyle}>Slot number <span style={{ color: colors.orange }}>*</span></label>
              <select value={form.slot_number} onChange={e => setForm(f => ({...f, slot_number: Number(e.target.value)}))} style={iStyle} required>
                {form.listing_type === 'marketplace' ? (
                  <>
                    <option value={1}>Slot 1 — first featured position</option>
                    <option value={2}>Slot 2 — second featured position</option>
                    <option value={3}>Slot 3 — third featured position</option>
                  </>
                ) : (
                  <>
                    <option value={1}>Slot 1 — left sidebar</option>
                    <option value={2}>Slot 2 — left sidebar</option>
                    <option value={3}>Slot 3 — right sidebar</option>
                    <option value={4}>Slot 4 — right sidebar</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label style={lStyle}>Filter by vendor</label>
              <select value={vendorFilter} onChange={e => { setVendorFilter(e.target.value); setForm(f => ({...f, package_id: ''})); }} style={iStyle}>
                <option value="">All vendors</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lStyle}>Package <span style={{ color: colors.orange }}>*</span></label>
              <select value={form.package_id} onChange={e => {
                const pkg = packages.find(p => p.id === e.target.value);
                setForm(f => ({...f, package_id: e.target.value, vendor_id: pkg?.vendor_id || f.vendor_id}));
              }} style={iStyle} required>
                <option value="">Select a package…</option>
                {packages
                  .filter(p => p.status === 'live' && (!vendorFilter || p.vendor_id === vendorFilter))
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.title} — {p.vendor_name} (£{Number(p.price_gbp).toLocaleString()})</option>
                  ))
                }
              </select>
              {vendorFilter && packages.filter(p => p.status === 'live' && p.vendor_id === vendorFilter).length === 0 && (
                <p style={{ fontSize: 11, color: colors.orange, marginTop: 4 }}>No live packages for this vendor yet.</p>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lStyle}>Start date <span style={{ color: colors.orange }}>*</span></label>
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} style={iStyle} required/>
              </div>
              <div>
                <label style={lStyle}>End date <span style={{ color: colors.orange }}>*</span></label>
                <input type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} style={iStyle} required/>
              </div>
            </div>
            <div>
              <label style={lStyle}>Monthly fee (£) <span style={{ color: colors.orange }}>*</span></label>
              <input type="number" value={form.monthly_fee_gbp} onChange={e => setForm(f => ({...f, monthly_fee_gbp: e.target.value}))} style={iStyle} min="500" required/>
              <p style={{ fontSize: 11, color: colors.faint, marginTop: 4 }}>Standard range: £500–£5,000 per month depending on slot position and vendor size.</p>
            </div>
            <div>
              <label style={lStyle}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Any internal notes about this sponsorship arrangement…"
                style={{ ...iStyle, resize: 'vertical', minHeight: 60 }}/>
            </div>
            {error && <p style={{ color: colors.red, fontSize: 13, fontWeight: 600 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <Button variant="secondary" onClick={() => { setShowForm(false); setError(''); }}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create sponsored listing'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

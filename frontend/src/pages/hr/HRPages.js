import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Avatar, Spinner, EmptyState, Button, Input, Modal, TableHeader, StatCard } from '../../components/UI';
import { colors, font, gradients } from '../../lib/styles';

// ── Adventures ───────────────────────────────────────────────
export function HRAdventures() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    api.get('/bookings/company').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/bookings/${id}/status`, { status });
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
  };

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter;
    const matchSearch = !search || b.employee_name?.toLowerCase().includes(search.toLowerCase()) || b.package_title?.toLowerCase().includes(search.toLowerCase()) || b.destination?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statuses = ['all','pending','approved','confirmed','cancelled'];

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 16 }}>Adventures</h1>

          {/* Search + filter row */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F5F2', border: '1px solid #eee', borderRadius: 10, padding: '8px 14px', flex: 1, maxWidth: 360 }}>
              <svg width="15" height="15" fill="none" stroke={colors.faint} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee, package, destination…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: colors.dark, width: '100%', fontFamily: font.body }}/>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {statuses.map(s => (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${filter===s ? colors.orange : '#eee'}`,
                  background: filter===s ? colors.orangeLight : '#fff', color: filter===s ? colors.orange : colors.mid,
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, transition: 'all 0.15s',
                }}>
                  {s.charAt(0).toUpperCase()+s.slice(1)} ({s==='all' ? bookings.length : bookings.filter(b=>b.status===s).length})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        <div className="table-wrap">
          <TableHeader cols={['Employee','Package','Destination','Departure','Payroll','Total','Payment','Action']} template="1.8fr 1.4fr 1fr 0.9fr 0.7fr 0.9fr 0.9fr 1.4fr"/>
          {loading ? <Spinner/> : filtered.length === 0 ? (
            <EmptyState emoji="🌍" title="No adventures found" subtitle="Try adjusting your search or filter"/>
          ) : filtered.map((b, i) => (
            <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1fr 0.9fr 0.7fr 0.9fr 0.9fr 1.4fr', padding: '12px 24px', alignItems: 'center', borderBottom: i < filtered.length-1 ? '1px solid #f5f5f5' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={b.employee_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}/>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{b.employee_name}</p>
                  <p style={{ fontSize: 11, color: colors.faint }}>{b.employee_email}</p>
                </div>
              </div>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.emoji} {b.package_title}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.destination}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}) : '—'}</span>
              <span style={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>{b.payroll_months}mo</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: b.payment_method === 'card' ? colors.blue : colors.orange, background: b.payment_method === 'card' ? colors.blueLight : colors.orangeLight, borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>{b.payment_method || 'payroll'}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {b.status === 'pending' ? (
                  <>
                    <button onClick={() => updateStatus(b.id,'approved')} style={{ background: colors.greenLight, color: colors.green, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Approve</button>
                    <button onClick={() => updateStatus(b.id,'cancelled')} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Reject</button>
                  </>
                ) : <Badge status={b.status}/>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Marketplace ──────────────────────────────────────────────
export function HRMarketplace() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    api.get('/packages').then(r => setPackages(r.data)).finally(() => setLoading(false));
  }, []);

  const approvePackage = async (id, admin_status) => {
    await api.patch(`/packages/${id}`, { admin_status });
    setPackages(ps => ps.map(p => p.id === id ? { ...p, admin_status } : p));
  };

  const filtered = filter === 'all' ? packages : packages.filter(p => (p.admin_status || 'pending') === filter);

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 16 }}>Marketplace</h1>
          <p style={{ color: colors.muted, fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Review and approve vendor packages before employees can book them.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all','pending','approved','rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${filter===f ? colors.orange : '#eee'}`, background: filter===f ? colors.orangeLight : '#fff', color: filter===f ? colors.orange : colors.mid, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, transition: 'all 0.15s' }}>
                {f.charAt(0).toUpperCase()+f.slice(1)} ({f==='all' ? packages.length : packages.filter(p=>(p.admin_status||'pending')===f).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        {loading ? <Spinner/> : filtered.length === 0 ? (
          <EmptyState emoji="📦" title="No packages found" subtitle="Vendors need to add packages first"/>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {filtered.map(pkg => {
              const gradient = gradients[pkg.category] || gradients.default;
              const adminStatus = pkg.admin_status || 'pending';
              return (
                <div key={pkg.id} className="card" style={{ overflow: 'hidden' }}>
                  {/* Image */}
                  <div style={{ height: 160, background: gradient, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 52 }}>{pkg.emoji || '🌍'}</span>
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.42)', borderRadius: 6, padding: '4px 8px', backdropFilter: 'blur(8px)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {pkg.category?.replace('_',' ')}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                      <Badge status={adminStatus}/>
                    </div>
                    {pkg.verified && (
                      <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(26,122,74,0.75)', borderRadius: 6, padding: '3px 8px' }}>✓ Verified Vendor</span>
                      </div>
                    )}
                  </div>
                  {/* Body */}
                  <div style={{ padding: '16px 18px 18px' }}>
                    <p style={{ fontSize: 14.5, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>{pkg.title}</p>
                    <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 12, fontWeight: 500 }}>{pkg.vendor_name} · {pkg.destination} · {pkg.duration}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {adminStatus !== 'approved' && (
                          <button onClick={() => approvePackage(pkg.id,'approved')} style={{ background: colors.greenLight, color: colors.green, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Approve</button>
                        )}
                        {adminStatus !== 'rejected' && (
                          <button onClick={() => approvePackage(pkg.id,'rejected')} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Reject</button>
                        )}
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

// ── Analytics ────────────────────────────────────────────────
export function HRAnalytics() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    api.get('/bookings/company').then(r => setBookings(r.data));
  }, []);

  const totalValue  = bookings.reduce((s, b) => s + Number(b.total_amount), 0);
  const confirmed   = bookings.filter(b => b.status === 'confirmed').length;
  const pending     = bookings.filter(b => b.status === 'pending').length;
  const avgValue    = bookings.length ? (totalValue / bookings.length).toFixed(0) : 0;

  const byDest = bookings.reduce((acc, b) => {
    const k = b.destination || 'Other';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const byMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    const count = bookings.filter(b => {
      const bd = new Date(b.created_at);
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
    }).length;
    return { month, count };
  });

  const maxCount = Math.max(...byMonth.map(m => m.count), 1);

  const handleExport = () => {
    const headers = ['Employee','Email','Package','Destination','Departure','Payroll Months','Monthly Amount (£)','Total Amount (£)','Payment Method','Status'];
    const rows = bookings.map(b => [
      b.employee_name || '',
      b.employee_email || '',
      b.package_title || '',
      b.destination || '',
      b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB') : '',
      b.payroll_months || '',
      Number(b.monthly_amount || 0).toFixed(2),
      Number(b.total_amount || 0).toFixed(2),
      b.payment_method || 'payroll',
      b.status || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sabba-analytics-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: 'Total Requests',    value: bookings.length, icon: '📋' },
    { label: 'Confirmed',         value: confirmed,       icon: '✅', up: true },
    { label: 'Pending Approval',  value: pending,         icon: '⏳' },
    { label: 'Avg Package Value', value: `£${Number(avgValue).toLocaleString()}`, icon: '💷', up: true },
  ];

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
            <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Analytics</h1>
            <p style={{ color: colors.muted, fontSize: 14, marginTop: 4, fontWeight: 500 }}>Insights on your workforce adventure programme.</p>
          </div>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, boxShadow: '0 2px 8px rgba(29,158,117,0.3)', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#0f6e56'}
            onMouseLeave={e => e.currentTarget.style.background=colors.green}>
            <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export .csv
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {stats.map((s, i) => <StatCard key={i} {...s}/>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Total value */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Total Programme Value</p>
            <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 20 }}>Cumulative booking value</p>
            <p style={{ fontFamily: font.display, fontSize: 48, fontWeight: 700, color: colors.dark, lineHeight: 1 }}>£{totalValue.toLocaleString()}</p>
            <p style={{ fontSize: 13, color: colors.muted, marginTop: 10, fontWeight: 500 }}>Across {bookings.length} adventure requests</p>
            <div style={{ marginTop: 20, height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((confirmed/Math.max(bookings.length,1))*100,100)}%`, background: `linear-gradient(90deg, ${colors.orange}, #f5a066)`, borderRadius: 3, transition: 'width 0.6s ease' }}/>
            </div>
            <p style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>{confirmed} of {bookings.length} confirmed</p>
          </div>

          {/* Monthly chart */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Monthly Bookings</p>
            <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 20 }}>Last 6 months</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
              {byMonth.map((m, i) => {
                const pct = (m.count / maxCount) * 100;
                const isLast = i === byMonth.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    {m.count > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, color: isLast ? colors.orange : colors.faint }}>{m.count}</span>}
                    <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 4)}%`, background: isLast ? `linear-gradient(to top, ${colors.orange}, #f5a066)` : '#F0EDE9', transition: 'height 0.4s ease' }}/>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {byMonth.map((m, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{ fontSize: 10.5, color: colors.faint, fontWeight: 600 }}>{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Destinations */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Bookings by Destination</p>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 20 }}>Where your employees are adventuring</p>
          {Object.keys(byDest).length === 0 ? (
            <p style={{ fontSize: 13, color: colors.muted }}>No data yet</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {Object.entries(byDest).slice(0,8).map(([dest, count], i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{dest}</span>
                    <span style={{ fontSize: 12.5, color: colors.muted, fontWeight: 600 }}>{count} booking{count!==1?'s':''}</span>
                  </div>
                  <div style={{ height: 5, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count/bookings.length)*100}%`, background: colors.orange, borderRadius: 3 }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Integrations with vendor verify ─────────────────────────
export function HRIntegrations() {
  const [vendors, setVendors] = useState([]);

  useEffect(() => { api.get('/vendors').then(r => setVendors(r.data)); }, []);

  const toggleVerify = async (id, verified) => {
    await api.patch(`/vendors/${id}/verify`, { verified: !verified });
    setVendors(vs => vs.map(v => v.id === id ? { ...v, verified: !verified } : v));
  };

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Integrations</h1>
          <p style={{ color: colors.muted, fontSize: 14, marginTop: 4, fontWeight: 500 }}>Manage vendor verification and API connections.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Vendor verification */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Vendor Verification</p>
            <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>Approve vendors to appear on the marketplace</p>
            {vendors.length === 0 ? <p style={{ fontSize: 13, color: colors.muted }}>No vendors yet</p> : vendors.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i<vendors.length-1?14:0, marginBottom: i<vendors.length-1?14:0, borderBottom: i<vendors.length-1?'1px solid #f5f5f5':'none' }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{v.company_name}</p>
                  <p style={{ fontSize: 11.5, color: colors.muted }}>{v.category} · {v.email}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Badge status={v.verified ? 'verified' : 'unverified'}/>
                  <button onClick={() => toggleVerify(v.id, v.verified)} style={{ background: v.verified ? colors.redLight : colors.greenLight, color: v.verified ? colors.red : colors.green, border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                    {v.verified ? 'Revoke' : 'Verify'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* API connections */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>API & Payroll Connections</p>
            <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>SSL Postback and HRIS integrations</p>
            {[
              { name: 'Workday HRIS',       type: 'REST API',    status: 'Connected',     last: '2 mins ago',  dot: colors.green },
              { name: 'ADP Payroll',         type: 'SSL Postback',status: 'Connected',     last: '5 mins ago',  dot: colors.green },
              { name: 'BambooHR',            type: 'REST API',    status: 'Connected',     last: '12 mins ago', dot: colors.green },
              { name: 'SAP SuccessFactors',  type: 'REST API',    status: 'Pending setup', last: '—',           dot: '#f59e0b'    },
              { name: 'Stripe Payroll',      type: 'Webhooks',    status: 'Connected',     last: '1 min ago',   dot: colors.green },
            ].map((intg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i<4?12:0, marginBottom: i<4?12:0, borderBottom: i<4?'1px solid #f5f5f5':'none' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: intg.dot }}/>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{intg.name}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: colors.muted, marginTop: 2 }}>{intg.type} · Last sync: {intg.last}</p>
                </div>
                <span style={{ fontSize: 12, color: intg.dot, fontWeight: 700 }}>{intg.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Avatar, Spinner, EmptyState, Button, Modal, TableHeader } from '../../components/UI';
import { colors, font, gradients } from '../../lib/styles';

// ── Booking Review Modal ──────────────────────────────────────
function BookingReviewModal({ booking: b, onClose, onApprove, onReject, onUndo }) {
  return (
    <Modal title="Booking Review" onClose={onClose} width={560}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, padding: 16, background: '#F7F5F2', borderRadius: 12, alignItems: 'center' }}>
        <Avatar initials={b.employee_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()} size={48}/>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: colors.dark }}>{b.employee_name}</p>
          <p style={{ fontSize: 13, color: colors.muted }}>{b.employee_email}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}><Badge status={b.status}/></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Package',     value: `${b.emoji || ''} ${b.package_title}` },
          { label: 'Vendor',      value: b.vendor_name },
          { label: 'Destination', value: b.destination },
          { label: 'Duration',    value: b.duration || '—' },
          { label: 'Departure',   value: b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
          { label: 'Payment',     value: b.payment_method === 'card' ? 'Card (Stripe)' : `Payroll — ${b.payroll_months} months` },
          { label: 'Monthly',     value: b.payment_method === 'payroll' ? `£${Number(b.monthly_amount || 0).toFixed(2)}/mo` : '—' },
          { label: 'Total',       value: `£${Number(b.total_amount || 0).toLocaleString()}` },
        ].map((item, i) => (
          <div key={i} style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{item.label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{item.value || '—'}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        {['approved', 'confirmed', 'vendor_confirmed'].includes(b.status) && (
          <button onClick={() => { onUndo(b.id); onClose(); }} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
            ↩ Change decision
          </button>
        )}
        {b.status === 'pending' && (
          <>
            <button onClick={() => { onReject(b.id); onClose(); }} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Reject</button>
            <button onClick={() => { onApprove(b.id); onClose(); }} style={{ background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>✓ Approve</button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Adventures ─────────────────────────────────────────────
export function HRAdventures() {
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => {
    api.get('/bookings/company').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const [processing, setProcessing] = useState({});

  const updateStatus = async (id, status) => {
    setProcessing(p => ({ ...p, [id]: status }));
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
    } finally {
      setProcessing(p => { const n = {...p}; delete n[id]; return n; });
    }
  };

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.employee_name?.toLowerCase().includes(q) || b.package_title?.toLowerCase().includes(q) || b.destination?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      {reviewing && (
        <BookingReviewModal
          booking={reviewing}
          onClose={() => setReviewing(null)}
          onApprove={id => updateStatus(id, 'approved')}
          onReject={id => updateStatus(id, 'cancelled')}
          onUndo={id => updateStatus(id, 'pending')}
        />
      )}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 16 }}>Adventures</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F5F2', border: '1px solid #eee', borderRadius: 10, padding: '8px 14px', flex: 1, maxWidth: 360 }}>
              <svg width="15" height="15" fill="none" stroke={colors.faint} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee, package, destination…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: colors.dark, width: '100%', fontFamily: font.body }}/>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['all','pending','approved','confirmed','cancelled'].map(s => (
                <button key={s} onClick={() => setFilter(s)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${filter === s ? colors.orange : '#eee'}`, background: filter === s ? colors.orangeLight : '#fff', color: filter === s ? colors.orange : colors.mid, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        <div className="table-wrap">
          <TableHeader cols={['Employee','Package','Destination','Departure','Payment','Total','Status','Actions']} template="1.6fr 1.3fr 0.9fr 0.9fr 0.8fr 0.8fr 1fr 1.4fr"/>
          {loading ? <Spinner/> : filtered.length === 0 ? (
            <EmptyState emoji="🌍" title="No adventures found" subtitle="Adjust your search or filter"/>
          ) : filtered.map((b, i) => (
            <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.3fr 0.9fr 0.9fr 0.8fr 0.8fr 1fr 1.4fr', padding: '12px 24px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={b.employee_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}/>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{b.employee_name}</p>
                  <p style={{ fontSize: 10.5, color: colors.faint }}>{b.employee_email}</p>
                </div>
              </div>
              <span style={{ fontSize: 12.5, color: colors.mid }}>{b.emoji} {b.package_title}</span>
              <span style={{ fontSize: 12.5, color: colors.mid }}>{b.destination}</span>
              <span style={{ fontSize: 12.5, color: colors.mid }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: b.payment_method === 'card' ? colors.blue : colors.orange, background: b.payment_method === 'card' ? colors.blueLight : colors.orangeLight, borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>{b.payment_method === 'card' ? 'Card' : 'Payroll'}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</span>
              <Badge status={b.status}/>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setReviewing(b)} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Review</button>
                {b.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(b.id, 'approved')} disabled={!!processing[b.id]}
                      style={{ background: processing[b.id]==='approved' ? colors.green : colors.greenLight, color: processing[b.id]==='approved' ? '#fff' : colors.green, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: processing[b.id] ? 'default' : 'pointer', fontFamily: font.body, opacity: processing[b.id] && processing[b.id]!=='approved' ? 0.5 : 1, transition: 'all 0.15s' }}>
                      {processing[b.id]==='approved' ? '✓ Approving…' : 'Approve'}
                    </button>
                    <button onClick={() => updateStatus(b.id, 'cancelled')} disabled={!!processing[b.id]}
                      style={{ background: processing[b.id]==='cancelled' ? colors.red : colors.redLight, color: processing[b.id]==='cancelled' ? '#fff' : colors.red, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: processing[b.id] ? 'default' : 'pointer', fontFamily: font.body, opacity: processing[b.id] && processing[b.id]!=='cancelled' ? 0.5 : 1, transition: 'all 0.15s' }}>
                      {processing[b.id]==='cancelled' ? '✗ Rejecting…' : 'Reject'}
                    </button>
                  </>
                )}
                {['approved','confirmed','vendor_confirmed'].includes(b.status) && (
                  <button onClick={() => updateStatus(b.id, 'pending')} disabled={!!processing[b.id]}
                    style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: processing[b.id] ? 'default' : 'pointer', fontFamily: font.body, opacity: processing[b.id] ? 0.5 : 1 }}>
                    {processing[b.id]==='pending' ? '↩ Undoing…' : '↩ Undo'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Package Review Modal ──────────────────────────────────────
function PackageReviewModal({ pkg, onClose, onApprove, onReject }) {
  const gradient = gradients[pkg.category] || gradients.default;
  const adminStatus = pkg.admin_status || 'pending';
  return (
    <Modal title="Package Review" onClose={onClose} width={620}>
      <div style={{ height: 200, background: gradient, borderRadius: 12, overflow: 'hidden', marginBottom: 20, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {pkg.image_url ? <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <span style={{ fontSize: 72 }}>{pkg.emoji || '🌍'}</span>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }}/>
        <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
          <p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: '#fff' }}>{pkg.title}</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{pkg.vendor_name} · {pkg.destination}</p>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12 }}><Badge status={adminStatus}/></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[{ label: 'Category', value: pkg.category?.replace(/_/g,' ') }, { label: 'Duration', value: pkg.duration }, { label: 'Price', value: `£${Number(pkg.price_gbp || 0).toLocaleString()}` }, { label: 'Destination', value: pkg.destination }, { label: 'Vendor', value: pkg.vendor_name }, { label: 'Verified', value: pkg.verified ? '✓ Yes' : 'Not yet' }].map((item, i) => (
          <div key={i} style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{item.label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{item.value || '—'}</p>
          </div>
        ))}
      </div>
      {pkg.description && <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}><p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Description</p><p style={{ fontSize: 13.5, color: colors.mid, lineHeight: 1.7 }}>{pkg.description}</p></div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        {adminStatus !== 'rejected' && <button onClick={() => { onReject(pkg.id); onClose(); }} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Reject</button>}
        {adminStatus !== 'approved' && <button onClick={() => { onApprove(pkg.id); onClose(); }} style={{ background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>✓ Approve</button>}
      </div>
    </Modal>
  );
}

// ── Marketplace ───────────────────────────────────────────────
export function HRMarketplace() {
  const [packages,  setPackages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => { api.get('/packages').then(r => setPackages(r.data)).finally(() => setLoading(false)); }, []);

  const updatePkg = async (id, admin_status) => {
    await api.patch(`/packages/${id}`, { admin_status });
    setPackages(ps => ps.map(p => p.id === id ? { ...p, admin_status } : p));
  };

  const filtered = filter === 'all' ? packages : packages.filter(p => (p.admin_status || 'pending') === filter);

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      {reviewing && <PackageReviewModal pkg={reviewing} onClose={() => setReviewing(null)} onApprove={id => updatePkg(id, 'approved')} onReject={id => updatePkg(id, 'rejected')}/>}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 12 }}>Marketplace</h1>
          <p style={{ color: colors.muted, fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Review vendor packages before employees can book them.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all','pending','approved','rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${filter === f ? colors.orange : '#eee'}`, background: filter === f ? colors.orangeLight : '#fff', color: filter === f ? colors.orange : colors.mid, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? packages.length : packages.filter(p => (p.admin_status || 'pending') === f).length})
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        {loading ? <Spinner/> : filtered.length === 0 ? <EmptyState emoji="📦" title="No packages" subtitle="Vendors need to add packages first"/> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {filtered.map(pkg => {
              const gradient = gradients[pkg.category] || gradients.default;
              const adminStatus = pkg.admin_status || 'pending';
              return (
                <div key={pkg.id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ height: 160, background: gradient, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {pkg.image_url ? <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <span style={{ fontSize: 52 }}>{pkg.emoji || '🌍'}</span>}
                    <div style={{ position: 'absolute', top: 12, left: 12 }}><span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.42)', borderRadius: 6, padding: '4px 8px', textTransform: 'uppercase' }}>{pkg.category?.replace(/_/g,' ')}</span></div>
                    <div style={{ position: 'absolute', top: 12, right: 12 }}><Badge status={adminStatus}/></div>
                  </div>
                  <div style={{ padding: '16px 18px 18px' }}>
                    <p style={{ fontSize: 14.5, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>{pkg.title}</p>
                    <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 14 }}>{pkg.vendor_name} · {pkg.destination} · {pkg.duration}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, color: colors.dark }}>£{Number(pkg.price_gbp || 0).toLocaleString()}</p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setReviewing(pkg)} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Review</button>
                        {adminStatus !== 'approved' && <button onClick={() => updatePkg(pkg.id, 'approved')} style={{ background: colors.greenLight, color: colors.green, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Approve</button>}
                        {adminStatus !== 'rejected' && <button onClick={() => updatePkg(pkg.id, 'rejected')} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Reject</button>}
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

// ── Analytics ─────────────────────────────────────────────────
export function HRAnalytics() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { api.get('/bookings/company').then(r => setBookings(r.data)).finally(() => setLoading(false)); }, []);

  const year = new Date().getFullYear();
  const totalValue     = bookings.reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const confirmed      = bookings.filter(b => b.status === 'confirmed').length;
  const pending        = bookings.filter(b => b.status === 'pending').length;
  const avgValue       = bookings.length ? (totalValue / bookings.length) : 0;
  const payrollCount   = bookings.filter(b => (b.payment_method || 'payroll') === 'payroll').length;
  const cardCount      = bookings.filter(b => b.payment_method === 'card').length;
  const payrollValue   = bookings.filter(b => (b.payment_method||'payroll')==='payroll').reduce((s,b) => s+Number(b.total_amount||0), 0);
  const cardValue      = bookings.filter(b => b.payment_method==='card').reduce((s,b) => s+Number(b.total_amount||0), 0);

  const byCategory = bookings.reduce((acc, b) => {
    const k = b.category || 'Other';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

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
    const value = bookings.filter(b => {
      const bd = new Date(b.created_at);
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
    }).reduce((s, b) => s + Number(b.total_amount || 0), 0);
    return { month, count, value };
  });

  const maxCount = Math.max(...byMonth.map(m => m.count), 1);

  const handleExport = () => {
    const headers = ['Employee','Email','Package','Destination','Departure','Payroll Months','Monthly Amount (£)','Total Amount (£)','Payment Method','Status','Date'];
    const rows = bookings.map(b => [b.employee_name||'', b.employee_email||'', b.package_title||'', b.destination||'', b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB') : '', b.payroll_months||'', Number(b.monthly_amount||0).toFixed(2), Number(b.total_amount||0).toFixed(2), b.payment_method||'payroll', b.status||'', new Date(b.created_at).toLocaleDateString('en-GB')]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sabba-analytics-${year}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) return <Spinner/>;

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
            <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Analytics</h1>
            <p style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>Programme performance · {year}</p>
          </div>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
            ⬇ Export CSV
          </button>
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>

        {/* Row 1: 4 key stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Requests',      value: bookings.length,                           icon: '📋', sub: 'all time' },
            { label: 'Confirmed',           value: confirmed,                                  icon: '✅', sub: `${bookings.length ? Math.round(confirmed/bookings.length*100) : 0}% conversion`, up: true },
            { label: 'Total Programme Value', value: `£${totalValue.toLocaleString()}`,       icon: '💷', sub: 'gross bookings', up: true },
            { label: 'Avg Booking Value',   value: `£${Math.round(avgValue).toLocaleString()}`, icon: '📈', sub: 'per booking', up: true },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                {s.up && <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, background: colors.greenLight, borderRadius: 6, padding: '2px 7px' }}>↑</span>}
              </div>
              <p style={{ fontFamily: font.display, fontSize: 30, fontWeight: 700, color: colors.dark, lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: colors.muted }}>{s.label}</p>
              <p style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Row 2: Monthly trend + Payment split */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Monthly booking trend</p>
            <p style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>Last 6 months — bookings and value</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {byMonth.map((m, i) => {
                const pct = (m.count / maxCount) * 100;
                const isLast = i === byMonth.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    {m.count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: isLast ? colors.orange : colors.faint }}>{m.count}</span>}
                    <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 4)}%`, background: isLast ? `linear-gradient(to top, ${colors.orange}, #f5a066)` : '#E8E4DF' }}/>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {byMonth.map((m, i) => <div key={i} style={{ flex: 1, textAlign: 'center' }}><span style={{ fontSize: 10.5, color: colors.faint, fontWeight: 600 }}>{m.month}</span></div>)}
            </div>
          </div>
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Payment method split</p>
            <p style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>Payroll vs card</p>
            {bookings.length === 0 ? <p style={{ fontSize: 13, color: colors.muted }}>No data yet</p> : (
              <>
                {[
                  { label: 'Payroll deduction', count: payrollCount, value: payrollValue, color: colors.orange, bg: colors.orangeLight },
                  { label: 'Card (Stripe)',     count: cardCount,    value: cardValue,    color: colors.blue,   bg: colors.blueLight },
                ].map((row, i) => (
                  <div key={i} style={{ marginBottom: i === 0 ? 16 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: colors.muted }}>{row.count} bookings · £{row.value.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${bookings.length ? (row.count / bookings.length) * 100 : 0}%`, background: row.color, borderRadius: 4 }}/>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 20, padding: '12px', background: '#F7F5F2', borderRadius: 10 }}>
                  <p style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
                    {bookings.length ? Math.round(payrollCount/bookings.length*100) : 0}% payroll · {bookings.length ? Math.round(cardCount/bookings.length*100) : 0}% card
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Row 3: Top destinations + Category breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Top destinations</p>
            <p style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>Most popular booking destinations</p>
            {Object.keys(byDest).length === 0 ? <p style={{ fontSize: 13, color: colors.muted }}>No data yet</p> : (
              Object.entries(byDest).sort((a,b) => b[1]-a[1]).slice(0, 6).map(([dest, count], i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{dest}</span>
                    <span style={{ fontSize: 12.5, color: colors.muted }}>{count} booking{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ height: 5, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count/bookings.length)*100}%`, background: colors.orange, borderRadius: 3 }}/>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Bookings by category</p>
            <p style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>Adventure type breakdown</p>
            {Object.keys(byCategory).length === 0 ? <p style={{ fontSize: 13, color: colors.muted }}>No data yet</p> : (
              Object.entries(byCategory).sort((a,b) => b[1]-a[1]).slice(0, 6).map(([cat, count], i) => {
                const EMOJIS = { travel: '🌍', volunteering: '🤝', courses: '🎓', jobs_abroad: '💼', accommodation: '🏠', airlines: '✈️' };
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < 5 ? 10 : 0, marginBottom: i < 5 ? 10 : 0, borderBottom: i < 5 ? '1px solid #f5f5f5' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{EMOJIS[cat] || '📦'}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark, textTransform: 'capitalize' }}>{cat.replace(/_/g,' ')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, color: colors.muted }}>{count}</span>
                      <div style={{ width: 60, height: 5, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count/bookings.length)*100}%`, background: colors.orange, borderRadius: 3 }}/>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Review Modal ───────────────────────────────────────
function VendorReviewModal({ vendor, onClose, onVerify, onRevoke }) {
  return (
    <Modal title="Vendor Review" onClose={onClose} width={580}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: '#F7F5F2', borderRadius: 12 }}>
        {vendor.avatar_url ? <img src={vendor.avatar_url} alt={vendor.company_name} style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }}/> : <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏢</div>}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>{vendor.company_name}</p>
            <Badge status={vendor.verified ? 'verified' : 'unverified'}/>
          </div>
          <p style={{ fontSize: 13, color: colors.muted }}>{vendor.category} · {vendor.email}</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[{ label: 'Category', value: vendor.category }, { label: 'Packages', value: `${vendor.package_count || 0} listed` }, { label: 'Website', value: vendor.website || 'Not provided' }, { label: 'Rating', value: vendor.rating > 0 ? `${vendor.rating} ★` : 'No ratings yet' }, { label: 'Member since', value: vendor.created_at ? new Date(vendor.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }, { label: 'Pending since', value: vendor.pending_since ? new Date(vendor.pending_since).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }].map((item, i) => (
          <div key={i} style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{item.label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{item.value || '—'}</p>
          </div>
        ))}
      </div>
      {vendor.about && <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}><p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>About</p><p style={{ fontSize: 13.5, color: colors.mid, lineHeight: 1.7 }}>{vendor.about}</p></div>}
      {vendor.onboarding_data && vendor.onboarding_data.standout?.length > 0 && (
        <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>How they plan to stand out</p>
          {vendor.onboarding_data.standout.map((s, i) => <p key={i} style={{ fontSize: 12.5, color: colors.mid, marginBottom: 3 }}>✓ {s.replace(/_/g,' ')}</p>)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        {vendor.verified ? (
          <button onClick={() => { onRevoke(vendor.id); onClose(); }} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Revoke verification</button>
        ) : (
          <button onClick={() => { onVerify(vendor.id); onClose(); }} style={{ background: colors.green, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>✓ Verify vendor</button>
        )}
      </div>
    </Modal>
  );
}

// ── Integrations ──────────────────────────────────────────────
export function HRIntegrations() {
  const [vendors, setVendors] = useState([]);
  const [reviewingVendor, setReviewingVendor] = useState(null);

  useEffect(() => { api.get('/vendors').then(r => setVendors(r.data)); }, []);

  const toggleVerify = async (id, verified) => {
    await api.patch(`/vendors/${id}/verify`, { verified: !verified });
    setVendors(vs => vs.map(v => v.id === id ? { ...v, verified: !verified } : v));
  };

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      {reviewingVendor && <VendorReviewModal vendor={reviewingVendor} onClose={() => setReviewingVendor(null)} onVerify={id => toggleVerify(id, false)} onRevoke={id => toggleVerify(id, true)}/>}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Integrations</h1>
          <p style={{ color: colors.muted, fontSize: 14, marginTop: 4, fontWeight: 500 }}>Review vendor profiles and manage API connections.</p>
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Vendor Verification</p>
            <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>Click Review to inspect a vendor before approving</p>
            {vendors.length === 0 ? <p style={{ fontSize: 13, color: colors.muted }}>No vendors yet</p> : vendors.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < vendors.length - 1 ? 14 : 0, marginBottom: i < vendors.length - 1 ? 14 : 0, borderBottom: i < vendors.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{v.company_name}</p>
                  <p style={{ fontSize: 11.5, color: colors.muted }}>{v.category} · {v.email}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge status={v.verified ? 'verified' : 'unverified'}/>
                  <button onClick={() => setReviewingVendor(v)} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Review</button>
                  <button onClick={() => toggleVerify(v.id, v.verified)} style={{ background: v.verified ? colors.redLight : colors.greenLight, color: v.verified ? colors.red : colors.green, border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>{v.verified ? 'Revoke' : 'Verify'}</button>
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>API & Payroll Connections</p>
            <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>HRIS and payroll integrations</p>
            {[{ name: 'Workday HRIS', type: 'REST API', status: 'Connected', last: '2 mins ago', dot: colors.green }, { name: 'ADP Payroll', type: 'SSL Postback', status: 'Connected', last: '5 mins ago', dot: colors.green }, { name: 'BambooHR', type: 'REST API', status: 'Connected', last: '12 mins ago', dot: colors.green }, { name: 'SAP SuccessFactors', type: 'REST API', status: 'Pending setup', last: '—', dot: '#f59e0b' }, { name: 'Stripe Payroll', type: 'Webhooks', status: 'Connected', last: '1 min ago', dot: colors.green }].map((intg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < 4 ? 12 : 0, marginBottom: i < 4 ? 12 : 0, borderBottom: i < 4 ? '1px solid #f5f5f5' : 'none' }}>
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

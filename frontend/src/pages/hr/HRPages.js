// HR Adventures page
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Badge, Spinner, EmptyState, Avatar, SectionHeader, Button, TableHeader } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export function HRAdventures() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    api.get('/bookings/company').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/bookings/${id}/status`, { status });
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeader label="HR Admin" title="Adventures" subtitle="All employee adventure requests and bookings."/>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all','pending','approved','confirmed','cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 14px', borderRadius: 20, border: `1px solid ${filter === f ? colors.orange : colors.border}`,
            background: filter === f ? colors.orangeLight : 'rgba(255,255,255,0.7)',
            color: filter === f ? colors.orange : colors.mid,
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, transition: 'all 0.15s',
          }}>{f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${bookings.length})` : `(${bookings.filter(b=>b.status===f).length})`}</button>
        ))}
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <TableHeader cols={['Employee','Package','Destination','Departure','Payroll','Total','Payment','Action']} template="1.8fr 1.4fr 1fr 0.9fr 0.8fr 0.9fr 0.9fr 1.4fr"/>
        {loading ? <Spinner/> : filtered.length === 0 ? (
          <EmptyState emoji="🌍" title="No adventures found" subtitle="Try a different filter"/>
        ) : filtered.map((b, i) => (
          <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1fr 0.9fr 0.8fr 0.9fr 0.9fr 1.4fr', padding: '13px 24px', alignItems: 'center', borderBottom: i < filtered.length-1 ? `1px solid ${colors.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={b.employee_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}/>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{b.employee_name}</p>
                <p style={{ fontSize: 11, color: colors.faint }}>{b.employee_email}</p>
              </div>
            </div>
            <span style={{ fontSize: 13, color: colors.mid, fontWeight: 500 }}>{b.emoji} {b.package_title}</span>
            <span style={{ fontSize: 13, color: colors.mid }}>{b.destination}</span>
            <span style={{ fontSize: 13, color: colors.mid }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}) : '—'}</span>
            <span style={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>{b.payroll_months}mo</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: b.payment_method === 'card' ? colors.blue : colors.orange, background: b.payment_method === 'card' ? colors.blueLight : colors.orangeLight, borderRadius: 6, padding: '3px 8px' }}>{b.payment_method || 'payroll'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
  );
}

export function HRMarketplace() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/packages').then(r => setPackages(r.data)).finally(() => setLoading(false));
  }, []);

  const approvePackage = async (id, admin_status) => {
    await api.patch(`/packages/${id}`, { admin_status });
    setPackages(ps => ps.map(p => p.id === id ? { ...p, admin_status } : p));
  };

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeader label="HR Admin" title="Marketplace" subtitle="Review and approve vendor packages before employees can book them."/>
      {loading ? <Spinner/> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {packages.map(pkg => (
            <div key={pkg.id} className="glass-card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{pkg.emoji || '🌍'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{pkg.title}</p>
                  {pkg.verified && <span style={{ fontSize: 10, fontWeight: 700, color: colors.green, background: colors.greenLight, borderRadius: 4, padding: '2px 6px' }}>✓ VERIFIED VENDOR</span>}
                </div>
                <p style={{ fontSize: 12.5, color: colors.muted, fontWeight: 500 }}>{pkg.vendor_name} · {pkg.destination} · {pkg.duration} · {pkg.category?.replace('_',' ')}</p>
              </div>
              <span style={{ fontFamily: font.display, fontSize: 20, color: colors.dark }}>£{Number(pkg.price_gbp).toLocaleString()}</span>
              <Badge status={pkg.admin_status || 'pending'}/>
              <div style={{ display: 'flex', gap: 8 }}>
                {pkg.admin_status !== 'approved' && <button onClick={() => approvePackage(pkg.id,'approved')} style={{ background: colors.greenLight, color: colors.green, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Approve</button>}
                {pkg.admin_status !== 'rejected' && <button onClick={() => approvePackage(pkg.id,'rejected')} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Reject</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HRAnalytics() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => { api.get('/bookings/company').then(r => setBookings(r.data)); }, []);

  const totalValue = bookings.reduce((s, b) => s + Number(b.total_amount), 0);
  const confirmed  = bookings.filter(b => b.status === 'confirmed').length;
  const pending    = bookings.filter(b => b.status === 'pending').length;
  const avgValue   = bookings.length ? (totalValue / bookings.length).toFixed(0) : 0;

  const byCategory = bookings.reduce((acc, b) => {
    const cat = b.destination || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeader label="HR Admin" title="Analytics" subtitle="Insights on your workforce adventure programme."/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Requests', value: bookings.length, icon: '📋' },
          { label: 'Confirmed', value: confirmed, icon: '✅', up: true },
          { label: 'Pending Approval', value: pending, icon: '⏳' },
          { label: 'Avg Package Value', value: `£${Number(avgValue).toLocaleString()}`, icon: '💷', up: true },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '22px 22px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</p>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
            </div>
            <p style={{ fontFamily: font.display, fontSize: 32, color: colors.dark, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Total Programme Value</h2>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>Cumulative booking value</p>
          <p style={{ fontFamily: font.display, fontSize: 42, color: colors.dark }}>£{totalValue.toLocaleString()}</p>
          <p style={{ fontSize: 13, color: colors.muted, marginTop: 8, fontWeight: 500 }}>Across {bookings.length} adventure requests</p>
          <div style={{ marginTop: 20, height: 6, background: colors.border, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((confirmed/Math.max(bookings.length,1))*100, 100)}%`, background: `linear-gradient(90deg, ${colors.orange}, #f5a66d)`, borderRadius: 3, transition: 'width 0.6s ease' }}/>
          </div>
          <p style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>{confirmed} of {bookings.length} confirmed</p>
        </div>

        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Bookings by Destination</h2>
          {Object.entries(byCategory).slice(0,6).map(([dest, count], i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{dest}</span>
                <span style={{ fontSize: 12, color: colors.muted, fontWeight: 600 }}>{count}</span>
              </div>
              <div style={{ height: 5, background: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(count/bookings.length)*100}%`, background: colors.orange, borderRadius: 3 }}/>
              </div>
            </div>
          ))}
          {Object.keys(byCategory).length === 0 && <p style={{ fontSize: 13, color: colors.muted }}>No data yet</p>}
        </div>
      </div>
    </div>
  );
}

export function HRIntegrations() {
  const [vendors, setVendors] = useState([]);

  useEffect(() => { api.get('/vendors').then(r => setVendors(r.data)); }, []);

  const toggleVerify = async (id, verified) => {
    await api.patch(`/vendors/${id}/verify`, { verified: !verified });
    setVendors(vs => vs.map(v => v.id === id ? { ...v, verified: !verified } : v));
  };

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeader label="HR Admin" title="Integrations" subtitle="Manage vendor verification and API connections."/>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Vendor verification */}
        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Vendor Verification</h2>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>Approve vendors to appear on the marketplace</p>
          {vendors.length === 0 ? <p style={{ fontSize: 13, color: colors.muted }}>No vendors yet</p> : vendors.map((v, i) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < vendors.length-1 ? 14 : 0, marginBottom: i < vendors.length-1 ? 14 : 0, borderBottom: i < vendors.length-1 ? `1px solid ${colors.border}` : 'none' }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{v.company_name}</p>
                <p style={{ fontSize: 11.5, color: colors.muted }}>{v.category} · {v.email}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge status={v.verified ? 'verified' : 'unverified'}/>
                <button onClick={() => toggleVerify(v.id, v.verified)} style={{
                  background: v.verified ? colors.redLight : colors.greenLight,
                  color: v.verified ? colors.red : colors.green,
                  border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body,
                }}>{v.verified ? 'Revoke' : 'Verify'}</button>
              </div>
            </div>
          ))}
        </div>

        {/* API connections */}
        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>API & Payroll Connections</h2>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>SSL Postback and HRIS integrations</p>
          {[
            { name: 'Workday HRIS', type: 'REST API', status: 'Connected', last: '2 mins ago', dot: colors.green },
            { name: 'ADP Payroll', type: 'SSL Postback', status: 'Connected', last: '5 mins ago', dot: colors.green },
            { name: 'BambooHR', type: 'REST API', status: 'Connected', last: '12 mins ago', dot: colors.green },
            { name: 'SAP SuccessFactors', type: 'REST API', status: 'Pending setup', last: '—', dot: '#f59e0b' },
            { name: 'Stripe Payroll', type: 'Webhooks', status: 'Connected', last: '1 min ago', dot: colors.green },
          ].map((intg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < 4 ? 12 : 0, marginBottom: i < 4 ? 12 : 0, borderBottom: i < 4 ? `1px solid ${colors.border}` : 'none' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
  );
}

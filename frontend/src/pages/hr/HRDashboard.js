import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Avatar, Spinner, EmptyState, Button, StatCard, TableHeader } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export default function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings,   setBookings]   = useState([]);
  const [vendors,    setVendors]    = useState([]);
  const [empCount,   setEmpCount]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/bookings/company'),
      api.get('/vendors'),
      api.get('/employees/count'),
    ]).then(([b, v, e]) => {
      setBookings(b.data);
      setVendors(v.data);
      setEmpCount(e.data.count);
    }).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/bookings/${id}/status`, { status });
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
  };

  const thisMonth = bookings.filter(b => new Date(b.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length;
  const active    = bookings.filter(b => ['approved','confirmed'].includes(b.status)).length;
  const pending   = bookings.filter(b => b.status === 'pending').length;

  const stats = [
    { label: 'Employees on Platform', value: empCount === null ? '…' : empCount, sub: 'via your portal',     icon: '👥' },
    { label: 'Active Adventures',     value: active,     sub: 'currently booked',  icon: '🌍', up: true },
    { label: 'Bookings This Month',   value: thisMonth,  sub: 'last 30 days',       icon: '📅', up: true },
    { label: 'Pending Approval',      value: pending,    sub: 'awaiting your review', icon: '⏳' },
  ];

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const quickActions = [
    { icon: '👥', label: 'Import employees', sub: 'CSV upload', to: '/hr/employees' },
    { icon: '📋', label: 'Review adventures', sub: `${pending} pending`, to: '/hr/adventures' },
    { icon: '🏪', label: 'Approve packages', sub: 'Vendor listings', to: '/hr/marketplace' },
    { icon: '📊', label: 'View analytics', sub: 'Programme data', to: '/hr/analytics' },
  ];

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── Premium welcome banner ── */}
      <div style={{ background: '#1C1916', position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: -120, top: -120, width: 420, height: 420, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.1)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.07)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', left: -80, bottom: -80, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(245,160,102,0.06)', pointerEvents: 'none' }}/>

        {/* Banner content */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 40px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(212,98,42,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                HR Admin · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 style={{ fontFamily: font.display, fontSize: 42, color: '#fff', fontWeight: 700, fontStyle: 'italic', lineHeight: 1.1, marginBottom: 10 }}>
                Good morning, {firstName} 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: 500, maxWidth: 480 }}>
                Here's your workforce adventure programme overview.
                {pending > 0 && <span style={{ color: '#f5a066' }}> You have {pending} booking{pending !== 1 ? 's' : ''} awaiting approval.</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={() => navigate('/hr/adventures')} style={{ background: colors.orange, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, boxShadow: '0 4px 14px rgba(212,98,42,0.35)' }}>
                Review pipeline →
              </button>
            </div>
          </div>

          {/* Quick action tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, paddingBottom: 0 }}>
            {quickActions.map((qa, i) => (
              <div key={i} onClick={() => navigate(qa.to)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 14 }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{qa.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{qa.label}</p>
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{qa.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 16 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontFamily: font.display, fontSize: 34, fontWeight: 700, color: s.up ? '#f5a066' : '#fff', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', marginTop: 4, fontWeight: 500 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>

        {/* Pipeline */}
        <div className="table-wrap" style={{ marginBottom: 20 }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>Adventure Pipeline</p>
              <p style={{ fontSize: 12.5, color: colors.muted, marginTop: 2 }}>Recent employee booking requests</p>
            </div>
            <Button small variant="ghost" onClick={() => navigate('/hr/adventures')}>View all →</Button>
          </div>
          <TableHeader cols={['Employee','Package','Destination','Departure','Payroll','Total','Action']} template="1.8fr 1.4fr 1fr 0.9fr 0.7fr 0.9fr 1.4fr"/>
          {loading ? <Spinner/> : bookings.length === 0 ? (
            <EmptyState emoji="📋" title="No requests yet" subtitle="Employee booking requests will appear here"/>
          ) : bookings.slice(0,5).map((b, i) => (
            <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1fr 0.9fr 0.7fr 0.9fr 1.4fr', padding: '12px 24px', alignItems: 'center', borderBottom: i < Math.min(bookings.length,5)-1 ? '1px solid #f5f5f5' : 'none' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Vendors */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Vendor Partners</p>
            <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>Marketplace partners</p>
            {vendors.slice(0,4).map((v, i) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: i<3?14:0, marginBottom: i<3?14:0, borderBottom: i<3?'1px solid #f5f5f5':'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F7F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏢</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{v.company_name}</p>
                  <p style={{ fontSize: 11.5, color: colors.muted }}>{v.category}</p>
                </div>
                <Badge status={v.verified ? 'verified' : 'unverified'}/>
              </div>
            ))}
            {vendors.length === 0 && <p style={{ fontSize: 13, color: colors.muted }}>No vendors yet</p>}
          </div>

          {/* Integrations */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Integrations</p>
            <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>API & payroll status</p>
            {[
              { name: 'Workday HRIS',      dot: colors.green, status: 'Connected'     },
              { name: 'ADP Payroll',        dot: colors.green, status: 'Connected'     },
              { name: 'BambooHR',           dot: colors.green, status: 'Connected'     },
              { name: 'SAP SuccessFactors', dot: '#f59e0b',    status: 'Pending setup' },
            ].map((intg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i<3?11:0, marginBottom: i<3?11:0, borderBottom: i<3?'1px solid #f5f5f5':'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: intg.dot }}/>
                  <span style={{ fontSize: 13, color: colors.dark, fontWeight: 500 }}>{intg.name}</span>
                </div>
                <span style={{ fontSize: 11.5, color: intg.dot, fontWeight: 700 }}>{intg.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

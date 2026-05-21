import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Avatar, Spinner, EmptyState, Button, TableHeader } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export default function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings,     setBookings]     = useState([]);
  const [vendors,      setVendors]      = useState([]);
  const [empCount,     setEmpCount]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const fetchData = useCallback(() => {
    Promise.all([
      api.get('/bookings/company').catch(() => ({ data: [] })),
      api.get('/vendors').catch(() => ({ data: [] })),
      api.get('/employees/count').catch(() => ({ data: { count: 0 } })),
    ]).then(([b, v, e]) => {
      setBookings(b.data);
      setVendors(v.data);
      setEmpCount(e.data.count);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const updateStatus = async (id, status) => {
    await api.patch(`/bookings/${id}/status`, { status });
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
  };

  const pending   = bookings.filter(b => b.status === 'pending').length;
  const active    = bookings.filter(b => ['approved','confirmed','vendor_confirmed'].includes(b.status)).length;
  const thisMonth = bookings.filter(b => {
    const d = new Date(b.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const quickActions = [
    { icon: '👥', label: 'Import employees', sub: 'CSV upload',        action: () => navigate('/hr/employees?import=1') },
    { icon: '📋', label: 'Review adventures', sub: `${pending} pending`, action: () => navigate('/hr/adventures') },
    { icon: '🏪', label: 'Approve packages',  sub: 'Vendor listings',   action: () => navigate('/hr/marketplace') },
    { icon: '📊', label: 'View analytics',    sub: 'Programme data',    action: () => navigate('/hr/analytics') },
  ];

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Banner */}
      <div style={{ background: '#1C1916', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -120, top: -120, width: 420, height: 420, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.1)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(212,98,42,0.07)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', left: -80, bottom: -80, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(245,160,102,0.06)', pointerEvents: 'none' }}/>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 40px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(212,98,42,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                HR Admin · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h1 style={{ fontFamily: font.display, fontSize: 42, color: '#fff', fontWeight: 700, fontStyle: 'italic', lineHeight: 1.1, marginBottom: 10 }}>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName} 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: 500, maxWidth: 480 }}>
                Your workforce adventure programme.
                {pending > 0 && <span style={{ color: '#f5a066' }}> {pending} booking{pending !== 1 ? 's' : ''} awaiting approval.</span>}
              </p>
            </div>
            <button onClick={() => navigate('/hr/adventures')} style={{ background: colors.orange, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, boxShadow: '0 4px 14px rgba(212,98,42,0.35)', flexShrink: 0 }}>
              Review pipeline →
            </button>
          </div>

          {/* Quick action tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {quickActions.map((qa, i) => (
              <div key={i} onClick={qa.action} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 14 }}
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

          {/* Live stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 16 }}>
            {[
              { label: 'Employees on Platform', value: loading ? '…' : (empCount ?? 0) },
              { label: 'Active Adventures',      value: loading ? '…' : active,    accent: true },
              { label: 'Bookings This Month',    value: loading ? '…' : thisMonth, accent: true },
              { label: 'Pending Approval',       value: loading ? '…' : pending },
            ].map((s, i) => (
              <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontFamily: font.display, fontSize: 34, fontWeight: 700, color: s.accent ? '#f5a066' : '#fff', lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>

        {/* Adventure Pipeline */}
        <div className="table-wrap" style={{ marginBottom: 20 }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>Adventure Pipeline</p>
              <p style={{ fontSize: 12.5, color: colors.muted, marginTop: 2 }}>Live employee booking requests</p>
            </div>
            <Button small variant="ghost" onClick={() => navigate('/hr/adventures')}>View all →</Button>
          </div>
          <TableHeader cols={['Employee','Package','Destination','Departure','Payroll','Total','Status']} template="1.8fr 1.4fr 1fr 0.9fr 0.7fr 0.9fr 1.4fr"/>
          {loading ? <Spinner/> : bookings.length === 0 ? (
            <EmptyState emoji="📋" title="No requests yet" subtitle="Employee booking requests will appear here"/>
          ) : bookings.slice(0, 6).map((b, i) => (
            <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1fr 0.9fr 0.7fr 0.9fr 1.4fr', padding: '12px 24px', alignItems: 'center', borderBottom: i < Math.min(bookings.length, 6) - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={b.employee_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}/>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{b.employee_name}</p>
                  <p style={{ fontSize: 11, color: colors.faint }}>{b.employee_email}</p>
                </div>
              </div>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.emoji} {b.package_title}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.destination}</span>
              <span style={{ fontSize: 13, color: colors.mid }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</span>
              <span style={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>{b.payroll_months}mo</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {b.status === 'pending' ? (
                  <>
                    <button onClick={() => updateStatus(b.id, 'approved')} style={{ background: colors.greenLight, color: colors.green, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Approve</button>
                    <button onClick={() => updateStatus(b.id, 'cancelled')} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Reject</button>
                  </>
                ) : <Badge status={b.status}/>}
              </div>
            </div>
          ))}
        </div>

        {/* Vendor Partners — full width */}
        <div className="card" style={{ padding: '22px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>Vendor Partners</p>
              <p style={{ fontSize: 12.5, color: colors.muted }}>{vendors.length} partner{vendors.length !== 1 ? 's' : ''} on the marketplace</p>
            </div>
            <Button small variant="ghost" onClick={() => navigate('/hr/integrations')}>Manage →</Button>
          </div>
          {vendors.length === 0 ? (
            <p style={{ fontSize: 13, color: colors.muted }}>No vendors yet. They appear here once registered and verified.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {vendors.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#F7F5F2', borderRadius: 12, border: '1px solid #eee' }}>
                  {v.avatar_url
                    ? <img src={v.avatar_url} alt={v.company_name} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
                    : <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${colors.orange}, #f5a066)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏢</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.company_name}</p>
                    <p style={{ fontSize: 11.5, color: colors.muted, textTransform: 'capitalize' }}>{v.category?.replace(/_/g, ' ')}</p>
                  </div>
                  <Badge status={v.verified ? 'verified' : 'unverified'}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

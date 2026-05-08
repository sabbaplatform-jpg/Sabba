import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, EmptyState, Avatar } from '../components/UI';
import { colors, font } from '../lib/styles';

export default function HRDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchBookings = () => {
    api.get('/bookings/company').then(r => setBookings(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/bookings/${id}/status`, { status });
    fetchBookings();
  };

  const stats = [
    { label: 'Adventure Requests', value: bookings.length, sub: 'all time', up: null },
    { label: 'Pending Approval',   value: bookings.filter(b => b.status === 'pending').length, sub: 'need action', up: null },
    { label: 'Approved',           value: bookings.filter(b => b.status === 'approved').length, sub: 'in progress', up: true },
    { label: 'Confirmed',          value: bookings.filter(b => b.status === 'confirmed').length, sub: 'fully booked', up: true },
  ];

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`.stat-card{transition:box-shadow 0.15s,transform 0.15s}.stat-card:hover{box-shadow:0 6px 24px rgba(0,0,0,0.08)!important;transform:translateY(-2px)}.row-hover:hover{background:#fdf7f3!important}`}</style>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>HR Admin</p>
        <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 400 }}>Good morning, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>Here's your workforce adventure overview for today.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '22px 22px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontFamily: font.display, fontSize: 32, color: colors.dark, lineHeight: 1 }}>{s.value}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
              {s.up !== null && <svg width="11" height="11" fill="none" stroke={colors.green} strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>}
              <span style={{ fontSize: 12, color: s.up ? colors.green : colors.muted }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 20 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.dark }}>Adventure Pipeline</h2>
            <p style={{ fontSize: 12, color: colors.faint, marginTop: 2 }}>All employee booking requests</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1fr 0.8fr 0.8fr 1fr 1.4fr', padding: '10px 24px', background: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
          {['Employee','Package','Destination','Departure','Payroll','Total','Action'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: colors.faint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        {loading ? <Spinner/> : bookings.length === 0 ? (
          <EmptyState emoji="📋" title="No booking requests yet" subtitle="Once employees book packages they'll appear here"/>
        ) : bookings.map((b, i) => (
          <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1fr 0.8fr 0.8fr 1fr 1.4fr', padding: '13px 24px', alignItems: 'center', borderBottom: i < bookings.length - 1 ? `1px solid ${colors.border}` : 'none', transition: 'background 0.12s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={b.employee_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}/>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: colors.dark }}>{b.employee_name}</p>
                <p style={{ fontSize: 11, color: colors.faint }}>{b.employee_email}</p>
              </div>
            </div>
            <span style={{ fontSize: 13, color: colors.mid }}>{b.emoji} {b.package_title}</span>
            <span style={{ fontSize: 13, color: colors.mid }}>{b.destination}</span>
            <span style={{ fontSize: 13, color: colors.mid }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}) : '—'}</span>
            <span style={{ fontSize: 12, color: colors.muted }}>{b.payroll_months}mo</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {b.status === 'pending' ? (
                <>
                  <button onClick={() => updateStatus(b.id, 'approved')} style={{ background: colors.greenLight, color: colors.green, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: font.body }}>Approve</button>
                  <button onClick={() => updateStatus(b.id, 'cancelled')} style={{ background: '#fef2f2', color: '#b91c1c', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: font.body }}>Reject</button>
                </>
              ) : <Badge status={b.status}/>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>Integrations</h2>
          <p style={{ fontSize: 12, color: colors.faint, marginBottom: 16 }}>API & SSL Postback status</p>
          {[
            { name: 'Workday HRIS', status: 'Connected', dot: colors.green },
            { name: 'ADP Payroll', status: 'Connected', dot: colors.green },
            { name: 'BambooHR', status: 'Connected', dot: colors.green },
            { name: 'SAP SuccessFactors', status: 'Pending setup', dot: '#f59e0b' },
          ].map((intg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < 3 ? 12 : 0, marginBottom: i < 3 ? 12 : 0, borderBottom: i < 3 ? `1px solid ${colors.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: intg.dot }}/>
                <span style={{ fontSize: 13, color: colors.dark }}>{intg.name}</span>
              </div>
              <span style={{ fontSize: 11, color: intg.dot, fontWeight: 600 }}>{intg.status}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.dark, marginBottom: 16 }}>Quick Actions</h2>
          {[{ icon: '📊', label: 'View analytics report' }, { icon: '👥', label: 'Manage employees' }, { icon: '🔗', label: 'Configure integrations' }, { icon: '📋', label: 'Export leave report' }].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, cursor: 'pointer', marginBottom: i < 3 ? 8 : 0, transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = colors.orangeLight}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <span style={{ fontSize: 13, color: colors.dark, fontWeight: 500 }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

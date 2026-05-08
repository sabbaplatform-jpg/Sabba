import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Spinner, EmptyState, Avatar, StatCard, SectionHeader, Button, Modal, Input, Select, TableHeader } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export default function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/bookings/company'),
      api.get('/vendors'),
    ]).then(([b, v]) => { setBookings(b.data); setVendors(v.data); }).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/bookings/${id}/status`, { status });
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
  };

  const stats = [
    { label: 'Employees on Platform', value: '—', sub: 'via your portal', icon: '👥' },
    { label: 'Active Adventures', value: bookings.filter(b => ['approved','confirmed'].includes(b.status)).length, sub: 'currently booked', up: true, icon: '🌍' },
    { label: 'Bookings This Month', value: bookings.filter(b => new Date(b.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length, sub: 'last 30 days', up: true, icon: '📅' },
    { label: 'Retention Rate', value: '94.2%', sub: '+2.1% vs last year', up: true, icon: '📈' },
  ];

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeader
        label="HR Admin"
        title={`Good morning, ${user?.full_name?.split(' ')[0]} 👋`}
        subtitle="Here's your workforce adventure overview for today."
        action={<Button onClick={() => navigate('/hr/adventures')}>+ New Request</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => <StatCard key={i} {...s}/>)}
      </div>

      {/* Pipeline */}
      <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>Adventure Pipeline</h2>
            <p style={{ fontSize: 12.5, color: colors.muted, marginTop: 2, fontWeight: 500 }}>Recent employee booking requests</p>
          </div>
          <Button small variant="ghost" onClick={() => navigate('/hr/adventures')}>View all →</Button>
        </div>
        <TableHeader cols={['Employee','Package','Destination','Departure','Payroll','Total','Action']} template="1.8fr 1.4fr 1fr 0.8fr 0.8fr 1fr 1.4fr"/>
        {loading ? <Spinner/> : bookings.length === 0 ? (
          <EmptyState emoji="📋" title="No requests yet" subtitle="Employee booking requests will appear here"/>
        ) : bookings.slice(0,6).map((b, i) => (
          <div key={b.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1fr 0.8fr 0.8fr 1fr 1.4fr', padding: '13px 24px', alignItems: 'center', borderBottom: i < Math.min(bookings.length,6)-1 ? `1px solid ${colors.border}` : 'none' }}>
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

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Vendor status */}
        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Vendors</h2>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16, fontWeight: 500 }}>Marketplace partners</p>
          {vendors.slice(0,4).map((v, i) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < 3 ? 12 : 0, marginBottom: i < 3 ? 12 : 0, borderBottom: i < 3 ? `1px solid ${colors.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏢</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{v.company_name}</p>
                  <p style={{ fontSize: 11, color: colors.muted }}>{v.category} · {v.package_count} packages</p>
                </div>
              </div>
              <Badge status={v.verified ? 'verified' : 'unverified'}/>
            </div>
          ))}
          {vendors.length === 0 && <p style={{ fontSize: 13, color: colors.muted }}>No vendors yet</p>}
          <button onClick={() => navigate('/hr/integrations')} style={{ marginTop: 14, fontSize: 12, color: colors.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: font.body }}>Manage vendors →</button>
        </div>

        {/* Integrations */}
        <div className="glass-card" style={{ padding: '22px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Integrations</h2>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16, fontWeight: 500 }}>API & SSL Postback status</p>
          {[
            { name: 'Workday HRIS', status: 'Connected', dot: colors.green },
            { name: 'ADP Payroll', status: 'Connected', dot: colors.green },
            { name: 'BambooHR', status: 'Connected', dot: colors.green },
            { name: 'SAP SuccessFactors', status: 'Pending setup', dot: '#f59e0b' },
          ].map((intg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < 3 ? 12 : 0, marginBottom: i < 3 ? 12 : 0, borderBottom: i < 3 ? `1px solid ${colors.border}` : 'none' }}>
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
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button, Spinner, Badge } from '../../components/UI';
import { colors, font } from '../../lib/styles';

// Simple SVG pie chart
function PieChart({ used, pending, remaining, total }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const strokeWidth = 28;

  const pct = (val) => (val / total) * 100;
  const circumference = 2 * Math.PI * r;

  const usedPct    = pct(used);
  const pendingPct = pct(pending);
  const remPct     = pct(remaining);

  const dashArray = (pct) => `${(pct / 100) * circumference} ${circumference}`;

  let usedOffset    = 0;
  let pendingOffset = -((usedPct / 100) * circumference);
  let remOffset     = -(((usedPct + pendingPct) / 100) * circumference);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth}/>
      {/* Remaining */}
      {remaining > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(26,122,74,0.2)" strokeWidth={strokeWidth}
          strokeDasharray={dashArray(remPct)} strokeDashoffset={remOffset} strokeLinecap="round"/>
      )}
      {/* Pending */}
      {pending > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth={strokeWidth}
          strokeDasharray={dashArray(pendingPct)} strokeDashoffset={pendingOffset} strokeLinecap="round"/>
      )}
      {/* Used */}
      {used > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.orange} strokeWidth={strokeWidth}
          strokeDasharray={dashArray(usedPct)} strokeDashoffset={usedOffset} strokeLinecap="round"/>
      )}
    </svg>
  );
}

export default function Allowance() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear]       = useState(new Date().getFullYear());

  const fetchAllowance = (y) => {
    setLoading(true);
    api.get('/allowance', { params: { year: y } })
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAllowance(year); }, [year]);

  if (loading) return <Spinner/>;

  const { total_allowance, used, pending, remaining, bookings, available_years, sabba_points } = data;
  const usedPct    = total_allowance > 0 ? ((used / total_allowance) * 100).toFixed(0) : 0;
  const pendingPct = total_allowance > 0 ? ((pending / total_allowance) * 100).toFixed(0) : 0;
  const remPct     = total_allowance > 0 ? ((remaining / total_allowance) * 100).toFixed(0) : 100;

  return (
    <div style={{ fontFamily: font.body, background: '#fff', minHeight: '100vh', padding: '36px 40px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4 }}>Employee Portal</p>
          <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 400 }}>Travel Allowance</h1>
          <p style={{ color: colors.muted, fontSize: 14, marginTop: 4, fontWeight: 500 }}>Your annual payroll allowance for Sabba adventures. Card payments are not counted against this limit.</p>
        </div>
        {/* Year selector */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Always include current year + any years with data */}
        {([...new Set([...(available_years || []), new Date().getFullYear()])].sort((a,b)=>b-a)).map(y => (
            <button key={y} onClick={() => setYear(y)} style={{
              padding: '7px 14px', borderRadius: 20,
              border: `1.5px solid ${year === y ? colors.orange : colors.border}`,
              background: year === y ? colors.orangeLight : '#fff',
              color: year === y ? colors.orange : colors.mid,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, transition: 'all 0.15s',
            }}>{y}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Total allowance */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 8 }}>{year} Payroll Allowance {year === new Date().getFullYear() ? '· Current' : ''}</h2>
          <p style={{ fontSize: 13.5, color: colors.muted, lineHeight: 1.6, marginBottom: 24, fontWeight: 500 }}>
            Here's your total travel allowance for the year. This is the amount your company has permitted you to commit towards Sabba packages via payroll deduction.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ position: 'relative' }}>
              <PieChart used={used} pending={pending} remaining={remaining} total={total_allowance || 1}/>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontFamily: font.display, fontSize: 22, color: colors.dark, lineHeight: 1 }}>£{Number(total_allowance).toLocaleString()}</p>
                <p style={{ fontSize: 10, color: colors.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</p>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {[
                { label: 'Used', value: used, pct: usedPct, color: colors.orange },
                { label: 'Pending approval', value: pending, pct: pendingPct, color: '#f59e0b' },
                { label: 'Remaining', value: remaining, pct: remPct, color: colors.green },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }}/>
                      <span style={{ fontSize: 13, color: colors.dark, fontWeight: 600 }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Number(item.value).toLocaleString()}</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 3, transition: 'width 0.5s ease' }}/>
                  </div>
                  <p style={{ fontSize: 11, color: colors.faint, marginTop: 3 }}>{item.pct}% of total</p>
                </div>
              ))}
              <Button onClick={() => navigate('/marketplace')} style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>
                Spend allowance →
              </Button>
            </div>
          </div>
        </div>

        {/* Sabba Points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'linear-gradient(135deg, #1a1612, #2e2318)', borderRadius: 16, padding: '28px', flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Sabba Points</p>
            <p style={{ fontFamily: font.display, fontSize: 48, color: '#f5a66d', lineHeight: 1 }}>{(sabba_points || 0).toLocaleString()}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.5, fontWeight: 500 }}>
              Worth £{((sabba_points || 0) / 100).toFixed(2)} in booking credit
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>EARNED</p>
                <p style={{ fontFamily: font.display, fontSize: 18, color: '#f5a66d', marginTop: 2 }}>{sabba_points || 0}</p>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>VALUE</p>
                <p style={{ fontFamily: font.display, fontSize: 18, color: '#f5a66d', marginTop: 2 }}>£{((sabba_points||0)/100).toFixed(0)}</p>
              </div>
            </div>
            <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', marginTop: 16, lineHeight: 1.5 }}>
              Earn points by booking packages, leaving reviews, and completing your adventure profile.
            </p>
          </div>

          {/* Quick stats */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 14 }}>At a glance — {year}</h3>
            {[
              { label: 'Total bookings', value: bookings.length },
              { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length },
              { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length },
              { label: 'Total spent', value: `£${Number(used).toLocaleString()}` },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i < 3 ? 10 : 0, marginBottom: i < 3 ? 10 : 0, borderBottom: i < 3 ? `1px solid ${colors.border}` : 'none' }}>
                <span style={{ fontSize: 13, color: colors.muted, fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking history */}
      {bookings.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>Bookings in {year}</h2>
          </div>
          {bookings.map((b, i) => (
            <div key={b.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: i < bookings.length-1 ? `1px solid ${colors.border}` : 'none' }}>
              <span style={{ fontSize: 24 }}>{b.emoji || '🌍'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>{b.package_title}</p>
                <p style={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>{b.destination} · {new Date(b.departure_date || b.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</p>
              </div>
              <Badge status={b.status}/>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: font.display, fontSize: 18, color: colors.dark }}>£{Number(b.total_amount).toLocaleString()}</p>
                <p style={{ fontSize: 11, color: colors.muted }}>{b.payroll_months}mo payroll</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {bookings.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>✈️</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 6 }}>No bookings in {year}</p>
          <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20 }}>You have £{Number(remaining).toLocaleString()} remaining to spend this year.</p>
          <Button onClick={() => navigate('/marketplace')}>Start exploring →</Button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Avatar, Spinner, EmptyState, Badge, Button, Input, Modal, Select, SectionHeader, TableHeader } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export default function HREmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [limitModal, setLimitModal] = useState(null);
  const [limitVal, setLimitVal]   = useState('');
  const [saving, setSaving]       = useState(false);

  const fetchEmployees = (q = '') => {
    setLoading(true);
    api.get('/employees', { params: q ? { search: q } : {} })
      .then(r => setEmployees(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { const t = setTimeout(() => fetchEmployees(search), 350); return () => clearTimeout(t); }, [search]);

  const openEmployee = async (emp) => {
    const { data } = await api.get(`/employees/${emp.id}`);
    setSelected(data);
  };

  const saveLimit = async () => {
    setSaving(true);
    await api.patch(`/employees/${limitModal.id}/spend-limit`, { spend_limit_gbp: parseFloat(limitVal) });
    setSaving(false);
    setLimitModal(null);
    fetchEmployees(search);
  };

  return (
    <div style={{ fontFamily: font.body, background: colors.bg, minHeight: '100vh', padding: '36px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeader label="HR Admin" title="Employees" subtitle="Search and manage your workforce on Sabba."/>

      {/* Search */}
      <div style={{ marginBottom: 20, maxWidth: 420 }}>
        <Input placeholder="Search by name, email or department…" value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <TableHeader cols={['Employee','Department','Job Title','Location','Spend Limit','Points','Adventures','Action']} template="1.8fr 1.2fr 1.2fr 1fr 1fr 0.8fr 0.8fr 1.2fr"/>
        {loading ? <Spinner/> : employees.length === 0 ? (
          <EmptyState emoji="👥" title="No employees found" subtitle="Try a different search term"/>
        ) : employees.map((emp, i) => (
          <div key={emp.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1.2fr 1fr 1fr 0.8fr 0.8fr 1.2fr', padding: '13px 24px', alignItems: 'center', borderBottom: i < employees.length-1 ? `1px solid ${colors.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={emp.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()} src={emp.avatar_url}/>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{emp.full_name}</p>
                <p style={{ fontSize: 11, color: colors.faint }}>{emp.email}</p>
              </div>
            </div>
            <span style={{ fontSize: 13, color: colors.mid, fontWeight: 500 }}>{emp.department || '—'}</span>
            <span style={{ fontSize: 13, color: colors.mid }}>{emp.job_title || '—'}</span>
            <span style={{ fontSize: 13, color: colors.mid }}>{emp.location || '—'}</span>
            <div>
              {emp.spend_limit_gbp
                ? <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>£{Number(emp.spend_limit_gbp).toLocaleString()}</span>
                : <span style={{ fontSize: 12, color: colors.muted }}>No limit</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.orange }}>{emp.sabba_points || 0}</span>
              <span style={{ fontSize: 10, color: colors.muted }}>pts</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{emp.booking_count}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEmployee(emp)} style={{ background: colors.orangeLight, color: colors.orange, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>View</button>
              <button onClick={() => { setLimitModal(emp); setLimitVal(emp.spend_limit_gbp || ''); }} style={{ background: 'rgba(0,0,0,0.05)', color: colors.mid, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Limit</button>
            </div>
          </div>
        ))}
      </div>

      {/* Employee detail modal */}
      {selected && (
        <Modal title={selected.full_name} onClose={() => setSelected(null)} width={620}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Email', value: selected.email },
              { label: 'Department', value: selected.department || '—' },
              { label: 'Job Title', value: selected.job_title || '—' },
              { label: 'Location', value: selected.location || '—' },
              { label: 'Salary Band', value: selected.salary_band || '—' },
              { label: 'Spend Limit', value: selected.spend_limit_gbp ? `£${Number(selected.spend_limit_gbp).toLocaleString()}` : 'No limit' },
              { label: 'Sabba Points', value: `${selected.sabba_points || 0} pts` },
              { label: 'Member Since', value: new Date(selected.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) },
            ].map((item, i) => (
              <div key={i} style={{ background: colors.bg, borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: colors.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{item.value}</p>
              </div>
            ))}
          </div>
          {selected.bookings?.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 12 }}>Booking History</h3>
              {selected.bookings.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: colors.bg, borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{b.emoji}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{b.package_title}</p>
                      <p style={{ fontSize: 11, color: colors.muted }}>{b.destination}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge status={b.status}/>
                    <p style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>£{Number(b.total_amount).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </Modal>
      )}

      {/* Spend limit modal */}
      {limitModal && (
        <Modal title={`Set spend limit — ${limitModal.full_name}`} onClose={() => setLimitModal(null)} width={400}>
          <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20, fontWeight: 500 }}>Set the maximum amount this employee can spend on Sabba packages via payroll deduction.</p>
          <Input label="Spend limit (£)" type="number" min="0" value={limitVal} onChange={e => setLimitVal(e.target.value)} placeholder="e.g. 5000"/>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setLimitModal(null)}>Cancel</Button>
            <Button onClick={saveLimit} disabled={saving}>{saving ? 'Saving…' : 'Save limit'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

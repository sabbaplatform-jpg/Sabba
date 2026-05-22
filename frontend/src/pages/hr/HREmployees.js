import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { Avatar, Spinner, EmptyState, Badge, Button, Input, Modal, TableHeader } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export default function HREmployees() {
  const [searchParams]               = useSearchParams();
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [limitModal, setLimitModal] = useState(null);
  const [pwdModal, setPwdModal]     = useState(null);
  const [limitVal, setLimitVal]     = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [saving, setSaving]         = useState(false);
  const [pwdSaving, setPwdSaving]   = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError]     = useState('');
  const [showImport, setShowImport] = useState(searchParams.get('import') === '1');
  const [editModal,  setEditModal]  = useState(null);
  const [editForm,   setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editSaved,  setEditSaved]  = useState(false);

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

  const saveEdit = async () => {
    setEditSaving(true); setEditSaved(false);
    try {
      await api.patch(`/employees/${editModal.id}`, editForm);
      setEditSaved(true);
      fetchEmployees(search);
      setTimeout(() => { setEditModal(null); setEditSaved(false); }, 1500);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setEditSaving(false);
    }
  };

  const saveLimit = async () => {
    setSaving(true);
    await api.patch(`/employees/${limitModal.id}/spend-limit`, { spend_limit_gbp: parseFloat(limitVal) });
    setSaving(false);
    setLimitModal(null);
    fetchEmployees(search);
  };

  const resetPassword = async () => {
    if (newPassword !== pwdConfirm) { setPwdError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setPwdError('Password must be at least 8 characters'); return; }
    setPwdSaving(true); setPwdError('');
    try {
      await api.post(`/employees/${pwdModal.id}/reset-password`, { new_password: newPassword });
      setPwdSuccess(true);
      setTimeout(() => { setPwdModal(null); setPwdSuccess(false); setNewPassword(''); setPwdConfirm(''); }, 2000);
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 16 }}>Employees</h1>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F5F2', border: '1px solid #eee', borderRadius: 10, padding: '9px 16px', maxWidth: 420 }}>
            <svg width="15" height="15" fill="none" stroke={colors.faint} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or department…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: colors.dark, width: '100%', fontFamily: font.body }}/>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 40px' }}>
        <div className="table-wrap">
          <TableHeader cols={['Employee','Department','Job Title','Location','Spend Limit','Points','Bookings','Actions']} template="1.8fr 1.1fr 1.2fr 1fr 1fr 0.8fr 0.7fr 1.6fr"/>
          {loading ? <Spinner/> : employees.length === 0 ? (
            <EmptyState emoji="👥" title="No employees found" subtitle="Try a different search term"/>
          ) : employees.map((emp, i) => (
            <div key={emp.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.1fr 1.2fr 1fr 1fr 0.8fr 0.7fr 1.6fr', padding: '12px 24px', alignItems: 'center', borderBottom: i<employees.length-1?'1px solid #f5f5f5':'none' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.orange }}>{emp.sabba_points || 0}</span>
                <span style={{ fontSize: 10, color: colors.muted }}>pts</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{emp.booking_count}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => openEmployee(emp)} style={{ background: colors.orangeLight, color: colors.orange, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>View</button>
                <button onClick={() => { setLimitModal(emp); setLimitVal(emp.spend_limit_gbp || ''); }} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>Limit</button>
                <button onClick={() => { setPwdModal(emp); setNewPassword(''); setPwdConfirm(''); setPwdError(''); setPwdSuccess(false); }} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: font.body }}>
                  🔑 Pwd
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee detail modal */}
      {selected && (
        <Modal title={selected.full_name} onClose={() => setSelected(null)} width={620}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Email',        value: selected.email },
              { label: 'Department',   value: selected.department || '—' },
              { label: 'Job Title',    value: selected.job_title || '—' },
              { label: 'Location',     value: selected.location || '—' },
              { label: 'Salary Band',  value: selected.salary_band || '—' },
              { label: 'Spend Limit',  value: selected.spend_limit_gbp ? `£${Number(selected.spend_limit_gbp).toLocaleString()}` : 'No limit' },
              { label: 'Sabba Points', value: `${selected.sabba_points || 0} pts` },
              { label: 'Member Since', value: new Date(selected.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) },
            ].map((item, i) => (
              <div key={i} style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: colors.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: colors.dark }}>{item.value}</p>
              </div>
            ))}
          </div>
          {selected.bookings?.length > 0 && (
            <>
              <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 12 }}>Booking History</p>
              {selected.bookings.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F7F5F2', borderRadius: 10, marginBottom: 8 }}>
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
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button small onClick={() => { setEditModal(selected); setEditForm({ full_name: selected.full_name||'', department: selected.department||'', job_title: selected.job_title||'', location: selected.location||'', salary_band: selected.salary_band||'', spend_limit_gbp: selected.spend_limit_gbp||'', employment_category: selected.employment_category||'', assignment_status: selected.assignment_status||'Active', leave_type: selected.leave_type||'Both', gl_location: selected.gl_location||'', employee_number: selected.employee_number||'' }); setSelected(null); }}>✏️ Edit profile</Button>
            <Button small onClick={() => { setSelected(null); setPwdModal(selected); setNewPassword(''); setPwdConfirm(''); setPwdError(''); setPwdSuccess(false); }}>🔑 Reset password</Button>
            <Button small variant="secondary" onClick={() => { setSelected(null); setLimitModal(selected); setLimitVal(selected.spend_limit_gbp || ''); }}>Set spend limit</Button>
          </div>
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

      {/* Password reset modal */}
      {pwdModal && (
        <Modal title={`Reset password — ${pwdModal.full_name}`} onClose={() => setPwdModal(null)} width={420}>
          {pwdSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>Password reset successfully</p>
              <p style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>The employee can now log in with their new password.</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20, fontWeight: 500, lineHeight: 1.6 }}>
                Set a new password for <strong style={{ color: colors.dark }}>{pwdModal.full_name}</strong>. They will need to use this to log in. Advise them to change it on next login.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <Input label="New password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters"/>
                  {newPassword.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[0,1,2,3].map(i => {
                          const score = newPassword.length < 8 ? 0 : newPassword.length < 10 ? 1 : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 3 : 2;
                          const barColors = ['#ef4444','#f59e0b','#3b82f6',colors.green];
                          return <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? barColors[score-1] : '#eee', transition: 'background 0.2s' }}/>;
                        })}
                      </div>
                      <p style={{ fontSize: 11, color: colors.faint }}>
                        {newPassword.length < 8 ? 'Too short — need at least 8 characters' : newPassword.length < 10 ? 'Weak — add more characters' : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? '✓ Strong password' : 'Fair — add uppercase letters and numbers'}
                      </p>
                    </div>
                  )}
                </div>
                <Input label="Confirm password" type="password" value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)} placeholder="Re-enter password"/>
                {pwdConfirm.length > 0 && newPassword !== pwdConfirm && <p style={{ fontSize: 12, color: colors.red, fontWeight: 600 }}>Passwords don't match</p>}
                {pwdError && <p style={{ fontSize: 13, color: colors.red, fontWeight: 600 }}>{pwdError}</p>}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <Button variant="secondary" onClick={() => setPwdModal(null)}>Cancel</Button>
                <Button onClick={resetPassword} disabled={pwdSaving || !newPassword || !pwdConfirm}>{pwdSaving ? 'Resetting…' : 'Reset password'}</Button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Edit profile modal */}
      {editModal && (
        <Modal title={`Edit profile — ${editModal.full_name}`} onClose={() => setEditModal(null)} width={560}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { key: 'full_name',            label: 'Full name',            placeholder: 'James Thornton' },
              { key: 'employee_number',       label: 'Employee number',      placeholder: 'EMP001' },
              { key: 'department',            label: 'Department',           placeholder: 'Finance' },
              { key: 'job_title',             label: 'Job title',            placeholder: 'Senior Analyst' },
              { key: 'location',              label: 'Location',             placeholder: 'London' },
              { key: 'gl_location',           label: 'GL location code',     placeholder: 'GL-LON-001' },
              { key: 'salary_band',           label: 'Salary band',          placeholder: 'Band 3' },
              { key: 'spend_limit_gbp',       label: 'Spend limit (£)',      placeholder: '5000', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input type={f.type || 'text'} value={editForm[f.key] || ''} onChange={e => setEditForm(ef => ({ ...ef, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '9px 13px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none' }}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
            {[
              { key: 'employment_category', label: 'Employment type', options: ['Permanent','Contract','Fixed Term','Intern'] },
              { key: 'assignment_status',   label: 'Status',          options: ['Active','On Leave','Suspended','Inactive'] },
              { key: 'leave_type',          label: 'Leave access',    options: ['Both','Annual Leave','Sabbatical'] },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <select value={editForm[f.key] || ''} onChange={e => setEditForm(ef => ({ ...ef, [f.key]: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '9px 13px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', background: '#fff' }}>
                  <option value="">Select…</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          {editSaved && <p style={{ fontSize: 13, color: colors.green, fontWeight: 700, marginTop: 14 }}>✓ Profile saved!</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setEditModal(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={editSaving}>{editSaving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

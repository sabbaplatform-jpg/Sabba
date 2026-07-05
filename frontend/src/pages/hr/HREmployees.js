import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { Avatar, Spinner, EmptyState, Badge, Button, Input, Modal, TableHeader } from '../../components/UI';
import { colors, font } from '../../lib/styles';

// ── CSV helpers ───────────────────────────────────────────────
const CSV_HEADERS = ['employee_number','first_name','last_name','email','department','job_title','gl_location','location','salary_band','spend_limit_gbp','employment_category','assignment_status','leave_type'];

function downloadTemplate() {
  const example = [
    ['EMP001','James','Thornton','james.thornton@company.com','Finance','Senior Analyst','GL-LON-001','London','Band 3','5000','Permanent','Active','Both'],
    ['EMP002','Sarah','Chen','sarah.chen@company.com','Technology','Software Engineer','GL-LON-001','London','Band 3','5000','Permanent','Active','Annual Leave'],
  ];
  const csv = [CSV_HEADERS, ...example].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'sabba_employee_import_template.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], error: 'File appears to be empty' };
  const parseRow = line => {
    const cells = []; let cur = ''; let inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cells.push(cur.trim()); return cells;
  };
  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g,'_'));
  if (!headers.includes('email')) return { rows: [], error: 'CSV must have an "email" column' };
  if (!headers.includes('first_name') && !headers.includes('full_name')) return { rows: [], error: 'CSV must have a "first_name" column' };
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseRow(line); const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { rows, error: null };
}

// ── Import Modal ──────────────────────────────────────────────
function ImportModal({ onClose, onImported }) {
  const fileRef = useRef(null);
  const [stage,       setStage]       = useState('upload');
  const [parsed,      setParsed]      = useState([]);
  const [parseError,  setParseError]  = useState('');
  const [fileName,    setFileName]    = useState('');
  const [results,     setResults]     = useState(null);

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setParseError('Please upload a .csv file'); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const { rows, error } = parseCSV(ev.target.result);
      if (error) { setParseError(error); return; }
      if (rows.length === 0) { setParseError('No employee rows found'); return; }
      if (rows.length > 500) { setParseError('Maximum 500 employees per upload'); return; }
      setParseError(''); setParsed(rows); setStage('preview');
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    setStage('importing');
    try {
      const { data } = await api.post('/employees/import', { employees: parsed });
      setResults(data); setStage('done'); onImported();
    } catch (err) {
      setParseError(err.response?.data?.error || 'Import failed'); setStage('preview');
    }
  };

  return (
    <Modal title="Import employees" onClose={onClose} width={640}>
      {stage === 'upload' && (
        <div>
          <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20, lineHeight: 1.6 }}>
            Upload a CSV file with your employee list. All imported employees will receive the temporary password <strong style={{ color: colors.dark }}>Welcome2Sabba!</strong>
          </p>
          <div style={{ background: colors.orangeLight, border: `1px solid rgba(212,98,42,0.2)`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>Start with our template</p>
              <p style={{ fontSize: 12.5, color: colors.muted }}>Download, fill in your employees, then upload below.</p>
            </div>
            <Button small variant="ghost" onClick={downloadTemplate}>⬇ Download template</Button>
          </div>
          <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${parseError ? colors.red : '#ddd'}`, borderRadius: 12, padding: '32px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Click to upload CSV</p>
            <p style={{ fontSize: 12.5, color: colors.muted }}>Max 500 rows · .csv files only</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }}/>
          </div>
          {parseError && <p style={{ fontSize: 13, color: colors.red, fontWeight: 600, marginTop: 10 }}>{parseError}</p>}
        </div>
      )}

      {stage === 'preview' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: colors.greenLight, borderRadius: 10 }}>
            <span>✓</span>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: colors.green }}>{parsed.length} employee{parsed.length !== 1 ? 's' : ''} ready · {fileName}</p>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #eee', borderRadius: 10, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr', background: '#F7F5F2', padding: '8px 14px' }}>
              {['Name','Email','Department','Job Title'].map(h => <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase' }}>{h}</span>)}
            </div>
            {parsed.map((emp, i) => {
              const name = emp.full_name || `${emp.first_name||''} ${emp.last_name||''}`.trim();
              const err  = !emp.email || !name;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr', padding: '9px 14px', borderTop: '1px solid #f5f5f5', background: err ? colors.redLight : 'transparent' }}>
                  <span style={{ fontSize: 13, color: err ? colors.red : colors.dark, fontWeight: 500 }}>{name || <em>Missing</em>}</span>
                  <span style={{ fontSize: 12.5, color: err ? colors.red : colors.muted }}>{emp.email || <em>Missing</em>}</span>
                  <span style={{ fontSize: 12.5, color: colors.muted }}>{emp.department || '—'}</span>
                  <span style={{ fontSize: 12.5, color: colors.muted }}>{emp.job_title || '—'}</span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 20 }}>Employees with existing accounts will be skipped. Temporary password: <strong style={{ color: colors.dark }}>Welcome2Sabba!</strong></p>
          {parseError && <p style={{ fontSize: 13, color: colors.red, fontWeight: 600, marginBottom: 12 }}>{parseError}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <Button variant="secondary" onClick={() => { setStage('upload'); setParsed([]); setParseError(''); }}>← Back</Button>
            <Button onClick={doImport}>Import {parsed.length} employee{parsed.length !== 1 ? 's' : ''} →</Button>
          </div>
        </div>
      )}

      {stage === 'importing' && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ width: 40, height: 40, border: `3px solid #eee`, borderTop: `3px solid ${colors.orange}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>Importing employees…</p>
        </div>
      )}

      {stage === 'done' && results && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>Import complete</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Created', value: results.created, color: colors.green,  bg: colors.greenLight },
              { label: 'Skipped', value: results.skipped, color: '#b45309',      bg: '#fef3c7' },
              { label: 'Errors',  value: results.errors?.length || 0, color: results.errors?.length ? colors.red : colors.muted, bg: results.errors?.length ? colors.redLight : '#F7F5F2' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: s.color, fontWeight: 700, marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
          {results.errors?.length > 0 && (
            <div style={{ background: colors.redLight, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: colors.red, marginBottom: 6 }}>Rows not imported:</p>
              {results.errors.slice(0,5).map((e, i) => <p key={i} style={{ fontSize: 12, color: colors.red }}>· {e.email} — {e.reason}</p>)}
              {results.errors.length > 5 && <p style={{ fontSize: 12, color: colors.red }}>…and {results.errors.length-5} more</p>}
            </div>
          )}
          <p style={{ fontSize: 12.5, color: colors.muted, marginBottom: 20 }}>New employees log in with temporary password: <strong style={{ color: colors.dark }}>Welcome2Sabba!</strong></p>
          <Button onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>Done</Button>
        </div>
      )}
    </Modal>
  );
}

export default function HREmployees() {
  const [searchParams]               = useSearchParams();
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [voucherModal, setVoucherModal] = useState(null);
  const [voucherPts,   setVoucherPts]   = useState('');
  const [voucherNote,  setVoucherNote]  = useState('');
  const [voucherSaving, setVoucherSaving] = useState(false);
  const [voucherSuccess, setVoucherSuccess] = useState('');
  const [voucherError,   setVoucherError]   = useState('');
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

      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={() => fetchEmployees(search)}/>}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>HR Admin</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Employees</h1>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button small variant="secondary" onClick={() => setShowImport(true)}>⬆ Import CSV</Button>
              <Button small onClick={() => setShowImport(true)}>+ Add employees</Button>
            </div>
          </div>
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
            <Button small onClick={() => { setVoucherModal(selected); setSelected(null); setVoucherPts(''); setVoucherNote(''); setVoucherSuccess(''); setVoucherError(''); }}>🎁 Award voucher</Button>
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

      {/* Voucher award modal */}
      {voucherModal && (
        <Modal title={`Award Voucher — ${voucherModal.full_name}`} onClose={() => setVoucherModal(null)} width={480}>
          <div style={{ padding: '4px 0 16px' }}>
            <p style={{ fontSize: 13.5, color: colors.muted, marginBottom: 20, lineHeight: 1.6 }}>
              Award Sabba Points as a voucher. They will be added to the employee's balance and redeemable on any adventure booking. Points are funded by the employer — not deducted from any individual.
            </p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Points to award</label>
              <input type="number" value={voucherPts} onChange={e => setVoucherPts(e.target.value)}
                min="1" placeholder="e.g. 500 (= £5 value)"
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '9px 12px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', boxSizing: 'border-box' }}/>
              {voucherPts && <p style={{ fontSize: 11.5, color: colors.muted, marginTop: 4 }}>= £{(Number(voucherPts)/100).toFixed(2)} redemption value</p>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Reason (optional)</label>
              <input value={voucherNote} onChange={e => setVoucherNote(e.target.value)}
                placeholder="e.g. Employee of the month, 5-year anniversary…"
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '9px 12px', fontSize: 13.5, color: colors.dark, fontFamily: font.body, outline: 'none', boxSizing: 'border-box' }}/>
            </div>
            {voucherError   && <p style={{ fontSize: 13, color: colors.red, fontWeight: 600, marginBottom: 8 }}>{voucherError}</p>}
            {voucherSuccess && <p style={{ fontSize: 13, color: '#10B981', fontWeight: 700, marginBottom: 8 }}>{voucherSuccess}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setVoucherModal(null)}>Cancel</Button>
              <Button disabled={voucherSaving || !voucherPts} onClick={async () => {
                setVoucherSaving(true); setVoucherError(''); setVoucherSuccess('');
                try {
                  const { data } = await api.post('/allowance/award-voucher', {
                    employee_id: voucherModal.id,
                    points: Number(voucherPts),
                    reason: voucherNote.trim() || undefined,
                  });
                  setVoucherSuccess(`${voucherPts} points awarded to ${voucherModal.full_name}! 🎉`);
                  setVoucherPts(''); setVoucherNote('');
                  setTimeout(() => setVoucherModal(null), 2000);
                } catch (err) {
                  setVoucherError(err.response?.data?.error || 'Failed to award voucher');
                } finally { setVoucherSaving(false); }
              }}>
                {voucherSaving ? 'Awarding…' : '🎁 Award voucher'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

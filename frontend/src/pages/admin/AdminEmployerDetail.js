import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Avatar, Spinner, EmptyState, Button, Modal, Badge, TableHeader } from '../../components/UI';
import { colors, font } from '../../lib/styles';

// ── CSV helpers (same as HREmployees) ────────────────────────
const CSV_HEADERS = ['employee_number','first_name','last_name','email','department','job_title','gl_location','location','salary_band','spend_limit_gbp','employment_category','assignment_status','leave_type'];

function downloadTemplate() {
  const ex = [['EMP001','James','Thornton','james@company.com','Finance','Analyst','GL-LON','London','Band 3','5000','Permanent','Active','Both']];
  const csv = [CSV_HEADERS, ...ex].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download = 'sabba_employee_template.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows:[], error:'File appears empty' };
  const parse = l => { const c=[]; let cur='',inQ=false;
    for(const ch of l){if(ch==='"')inQ=!inQ;else if(ch===','&&!inQ){c.push(cur.trim());cur='';}else cur+=ch;}
    c.push(cur.trim()); return c; };
  const hdrs = parse(lines[0]).map(h=>h.toLowerCase().replace(/\s+/g,'_'));
  if(!hdrs.includes('email')) return {rows:[],error:'CSV must have an email column'};
  const rows = lines.slice(1).filter(l=>l.trim()).map(l=>{
    const v=parse(l),o={};hdrs.forEach((h,i)=>{o[h]=v[i]||'';});return o;
  });
  return { rows, error:null };
}

// ── Import Modal ──────────────────────────────────────────────
function ImportModal({ companyId, onClose, onImported }) {
  const fileRef = useRef(null);
  const [stage,      setStage]      = useState('upload');
  const [parsed,     setParsed]     = useState([]);
  const [parseError, setParseError] = useState('');
  const [fileName,   setFileName]   = useState('');
  const [results,    setResults]    = useState(null);

  const handleFile = e => {
    const file = e.target.files[0]; if(!file) return;
    if(!file.name.endsWith('.csv')){ setParseError('Please upload a .csv file'); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const { rows, error } = parseCSV(ev.target.result);
      if(error){ setParseError(error); return; }
      if(!rows.length){ setParseError('No employee rows found'); return; }
      setParseError(''); setParsed(rows); setStage('preview');
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    setStage('importing');
    try {
      const { data } = await api.post('/admin/companies/'+companyId+'/employees/import', { employees: parsed });
      setResults(data); setStage('done'); onImported();
    } catch(err){ setParseError(err.response?.data?.error||'Import failed'); setStage('preview'); }
  };

  return (
    <Modal title="Import employees" onClose={onClose} width={620}>
      {stage==='upload' && (
        <div>
          <p style={{fontSize:13.5,color:colors.muted,marginBottom:20,lineHeight:1.6}}>Upload a CSV to add employees to this employer account. Default password: <strong style={{color:colors.dark}}>Welcome2Sabba!</strong></p>
          <div style={{background:colors.orangeLight,border:`1px solid rgba(212,98,42,0.2)`,borderRadius:12,padding:'14px 18px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><p style={{fontSize:13.5,fontWeight:700,color:colors.dark,marginBottom:3}}>Download template</p><p style={{fontSize:12.5,color:colors.muted}}>Fill in your employees then upload below.</p></div>
            <Button small variant="ghost" onClick={downloadTemplate}>⬇ Template</Button>
          </div>
          <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${parseError?colors.red:'#ddd'}`,borderRadius:12,padding:'32px',textAlign:'center',cursor:'pointer'}}>
            <p style={{fontSize:14,fontWeight:700,color:colors.dark,marginBottom:4}}>Click to upload CSV</p>
            <p style={{fontSize:12.5,color:colors.muted}}>Max 500 rows · .csv only</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{display:'none'}}/>
          </div>
          {parseError && <p style={{fontSize:13,color:colors.red,fontWeight:600,marginTop:10}}>{parseError}</p>}
        </div>
      )}
      {stage==='preview' && (
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,padding:'10px 14px',background:colors.greenLight,borderRadius:10}}>
            <p style={{fontSize:13.5,fontWeight:700,color:colors.green}}>{parsed.length} employee{parsed.length!==1?'s':''} ready · {fileName}</p>
          </div>
          <div style={{maxHeight:240,overflowY:'auto',border:'1px solid #eee',borderRadius:10,marginBottom:16}}>
            <div style={{display:'grid',gridTemplateColumns:'1.5fr 2fr 1fr 1fr',background:'#F7F5F2',padding:'8px 14px'}}>
              {['Name','Email','Department','Job Title'].map(h=><span key={h} style={{fontSize:10.5,fontWeight:700,color:colors.faint,textTransform:'uppercase'}}>{h}</span>)}
            </div>
            {parsed.map((emp,i)=>{
              const name=emp.full_name||`${emp.first_name||''} ${emp.last_name||''}`.trim();
              const err=!emp.email||!name;
              return(<div key={i} style={{display:'grid',gridTemplateColumns:'1.5fr 2fr 1fr 1fr',padding:'9px 14px',borderTop:'1px solid #f5f5f5',background:err?colors.redLight:'transparent'}}>
                <span style={{fontSize:13,color:err?colors.red:colors.dark}}>{name||'Missing'}</span>
                <span style={{fontSize:12.5,color:err?colors.red:colors.muted}}>{emp.email||'Missing'}</span>
                <span style={{fontSize:12.5,color:colors.muted}}>{emp.department||'—'}</span>
                <span style={{fontSize:12.5,color:colors.muted}}>{emp.job_title||'—'}</span>
              </div>);
            })}
          </div>
          {parseError && <p style={{fontSize:13,color:colors.red,fontWeight:600,marginBottom:12}}>{parseError}</p>}
          <div style={{display:'flex',gap:10,justifyContent:'space-between'}}>
            <Button variant="secondary" onClick={()=>{setStage('upload');setParsed([]);setParseError('');}}>← Back</Button>
            <Button onClick={doImport}>Import {parsed.length} employee{parsed.length!==1?'s':''} →</Button>
          </div>
        </div>
      )}
      {stage==='importing' && (
        <div style={{textAlign:'center',padding:'32px 0'}}>
          <Spinner/>
          <p style={{fontSize:15,fontWeight:700,color:colors.dark,marginTop:16}}>Importing employees…</p>
        </div>
      )}
      {stage==='done' && results && (
        <div>
          <div style={{textAlign:'center',marginBottom:24}}><div style={{fontSize:48,marginBottom:12}}>🎉</div><p style={{fontSize:18,fontWeight:700,color:colors.dark}}>Import complete</p></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {[{label:'Created',value:results.created,color:colors.green,bg:colors.greenLight},{label:'Skipped',value:results.skipped,color:'#b45309',bg:'#fef3c7'},{label:'Errors',value:results.errors?.length||0,color:results.errors?.length?colors.red:colors.muted,bg:results.errors?.length?colors.redLight:'#F7F5F2'}].map((s,i)=>(
              <div key={i} style={{background:s.bg,borderRadius:10,padding:14,textAlign:'center'}}>
                <p style={{fontSize:32,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</p>
                <p style={{fontSize:12,color:s.color,fontWeight:700,marginTop:4}}>{s.label}</p>
              </div>
            ))}
          </div>
          {results.errors?.length>0&&(<div style={{background:colors.redLight,borderRadius:10,padding:'12px 16px',marginBottom:16}}>{results.errors.slice(0,5).map((e,i)=><p key={i} style={{fontSize:12,color:colors.red}}>· {e.email} — {e.reason}</p>)}</div>)}
          <Button onClick={onClose} style={{width:'100%',justifyContent:'center'}}>Done</Button>
        </div>
      )}
    </Modal>
  );
}

// ── Edit Employee Modal ───────────────────────────────────────
function EditEmployeeModal({ employee: emp, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: emp.full_name||'', first_name: emp.first_name||'', last_name: emp.last_name||'',
    department: emp.department||'', job_title: emp.job_title||'', location: emp.location||'',
    salary_band: emp.salary_band||'', spend_limit_gbp: emp.spend_limit_gbp||'',
    employment_category: emp.employment_category||'', assignment_status: emp.assignment_status||'Active',
    leave_type: emp.leave_type||'Both', gl_location: emp.gl_location||'', employee_number: emp.employee_number||'',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/employees/${emp.id}`, form);
      setSaved(true);
      setTimeout(()=>{ onSaved(); onClose(); },1200);
    } catch(err){ alert(err.response?.data?.error||'Failed to save'); }
    finally { setSaving(false); }
  };

  const F = ({k,label,placeholder,type='text',wide=false})=>(
    <div style={{gridColumn:wide?'1 / -1':undefined}}>
      <label style={{fontSize:11,fontWeight:700,color:colors.faint,textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>{label}</label>
      <input type={type} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={placeholder}
        style={{width:'100%',border:'1.5px solid #eee',borderRadius:10,padding:'9px 13px',fontSize:13.5,color:colors.dark,fontFamily:font.body,outline:'none'}}/>
    </div>
  );
  const S = ({k,label,opts})=>(
    <div>
      <label style={{fontSize:11,fontWeight:700,color:colors.faint,textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>{label}</label>
      <select value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
        style={{width:'100%',border:'1.5px solid #eee',borderRadius:10,padding:'9px 13px',fontSize:13.5,color:colors.dark,fontFamily:font.body,outline:'none',background:'#fff'}}>
        {opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <Modal title={`Edit — ${emp.full_name}`} onClose={onClose} width={580}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <F k="first_name" label="First name" placeholder="James"/>
        <F k="last_name"  label="Last name"  placeholder="Thornton"/>
        <F k="employee_number" label="Employee number" placeholder="EMP001"/>
        <F k="department" label="Department" placeholder="Finance"/>
        <F k="job_title"  label="Job title"  placeholder="Senior Analyst"/>
        <F k="location"   label="Location"   placeholder="London"/>
        <F k="gl_location" label="GL location" placeholder="GL-LON-001"/>
        <F k="salary_band" label="Salary band" placeholder="Band 3"/>
        <F k="spend_limit_gbp" label="Yearly allowance (£)" placeholder="5000" type="number"/>
        <S k="employment_category" label="Employment type" opts={['Permanent','Contract','Fixed Term','Intern']}/>
        <S k="assignment_status" label="Status" opts={['Active','On Leave','Suspended','Inactive']}/>
        <S k="leave_type" label="Leave access" opts={['Both','Annual Leave','Sabbatical']}/>
      </div>
      {saved && <p style={{fontSize:13,color:colors.green,fontWeight:700,marginBottom:12}}>✓ Saved successfully</p>}
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving?'Saving…':'Save changes'}</Button>
      </div>
    </Modal>
  );
}

// ── Main employer detail page ─────────────────────────────────
export function AdminEmployerDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [company,  setCompany]  = useState(null);
  const [employees,setEmployees]= useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('overview');
  const [search,   setSearch]   = useState('');
  const [showImport,setShowImport]=useState(false);
  const [editEmp,  setEditEmp]  = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [co, emps, bkgs] = await Promise.all([
        api.get('/admin/companies').then(r => r.data.find(c=>c.id===id)),
        api.get(`/admin/companies/${id}/employees`),
        api.get(`/admin/companies/${id}/bookings`),
      ]);
      setCompany(co || null);
      setEmployees(emps.data || []);
      setBookings(bkgs.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateCompany = async (fields) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/admin/companies/${id}`, fields);
      setCompany(c => ({ ...c, ...fields }));
    } catch {}
    finally { setUpdatingStatus(false); }
  };

  const filteredEmps = employees.filter(e => !search ||
    e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const PLAN_FEES = { starter:15000, growth:27000, enterprise:66000, global:100000 };
  const PLAN_COLORS = { starter:colors.muted, growth:colors.blue, enterprise:colors.orange, global:'#7B3FA0' };
  const STATUS_COLORS = { active:colors.green, suspended:colors.red, trial:colors.orange, churned:colors.faint };

  const totalGmv  = bookings.filter(b=>['approved','confirmed','vendor_confirmed'].includes(b.status)).reduce((s,b)=>s+Number(b.total_amount||0),0);
  const pending   = bookings.filter(b=>b.status==='pending').length;
  const confirmed = bookings.filter(b=>b.status==='confirmed').length;

  if (loading) return (
    <div style={{fontFamily:font.body,background:'#F7F5F2',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Spinner/>
    </div>
  );

  if (!company) return (
    <div style={{fontFamily:font.body,background:'#F7F5F2',minHeight:'100vh',padding:40}}>
      <EmptyState emoji="🏢" title="Employer not found" subtitle="This company doesn't exist or you don't have access"/>
    </div>
  );

  return (
    <div style={{fontFamily:font.body,background:'#F7F5F2',minHeight:'100vh',paddingBottom:80}}>
      {showImport && <ImportModal companyId={id} onClose={()=>setShowImport(false)} onImported={fetchAll}/>}
      {editEmp    && <EditEmployeeModal employee={editEmp} onClose={()=>setEditEmp(null)} onSaved={fetchAll}/>}

      {/* Header */}
      <div style={{background:'#1C1916',padding:'24px 36px 0'}}>
        <button onClick={()=>navigate('/admin/employers')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:font.body,fontSize:13,marginBottom:12,padding:0,display:'flex',alignItems:'center',gap:6}}>
          ← Back to employers
        </button>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <h1 style={{fontFamily:font.display,fontSize:34,color:'#fff',fontWeight:700,fontStyle:'italic',marginBottom:6}}>{company.name}</h1>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:12,fontWeight:700,color:PLAN_COLORS[company.plan]||colors.muted,background:'rgba(255,255,255,0.08)',borderRadius:6,padding:'3px 10px',textTransform:'capitalize'}}>{company.plan||'starter'}</span>
              <span style={{fontSize:12,fontWeight:700,color:STATUS_COLORS[company.status]||colors.green,background:'rgba(255,255,255,0.08)',borderRadius:6,padding:'3px 10px',textTransform:'capitalize'}}>{company.status||'active'}</span>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>ID: {id?.slice(0,8)}…</span>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <select value={company.plan||'starter'} onChange={e=>updateCompany({plan:e.target.value})}
              style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:8,padding:'8px 12px',color:'#fff',fontFamily:font.body,fontSize:13,cursor:'pointer'}}>
              {['starter','growth','enterprise','global'].map(p=><option key={p} value={p} style={{color:colors.dark,background:'#fff'}}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
            {(company.status==='active'||!company.status)
              ? <button onClick={()=>updateCompany({status:'suspended'})} disabled={updatingStatus} style={{background:'rgba(192,57,43,0.2)',border:'1px solid rgba(192,57,43,0.3)',borderRadius:8,padding:'8px 16px',color:'#e74c3c',fontFamily:font.body,fontSize:13,fontWeight:700,cursor:'pointer'}}>Suspend</button>
              : <button onClick={()=>updateCompany({status:'active'})}    disabled={updatingStatus} style={{background:'rgba(29,158,117,0.2)',border:'1px solid rgba(29,158,117,0.3)',borderRadius:8,padding:'8px 16px',color:colors.green,fontFamily:font.body,fontSize:13,fontWeight:700,cursor:'pointer'}}>Activate</button>
            }
          </div>
        </div>

        {/* Stat strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          {[
            {label:'Employees',   value:employees.length},
            {label:'HR Admins',   value:company.hr_count||0},
            {label:'Total Bookings', value:bookings.length,  accent:true},
            {label:'Confirmed',   value:confirmed,            accent:true},
            {label:'Total GMV',   value:`£${Math.round(totalGmv/1000)}K`, accent:true},
          ].map((s,i)=>(
            <div key={i} style={{padding:'16px 20px',borderRight:i<4?'1px solid rgba(255,255,255,0.07)':'none'}}>
              <p style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{s.label}</p>
              <p style={{fontFamily:font.display,fontSize:28,fontWeight:700,color:s.accent?'#f5a066':'#fff',lineHeight:1}}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:0}}>
          {['overview','employees','bookings'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:'none',border:'none',borderBottom:`3px solid ${tab===t?colors.orange:'transparent'}`,padding:'14px 20px',color:tab===t?'#fff':'rgba(255,255,255,0.4)',fontSize:13.5,fontWeight:tab===t?700:500,cursor:'pointer',fontFamily:font.body,textTransform:'capitalize',transition:'all 0.15s'}}>
              {t}{t==='employees'?` (${employees.length})`:t==='bookings'?` (${bookings.length})`:''}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'28px 36px'}}>

        {/* ── OVERVIEW TAB ── */}
        {tab==='overview' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            {/* Company info */}
            <div className="card" style={{padding:'22px 24px'}}>
              <p style={{fontSize:14,fontWeight:700,color:colors.dark,marginBottom:16}}>Company details</p>
              {[
                {label:'Company name', value:company.name},
                {label:'Company ID',   value:company.id},
                {label:'Plan',         value:(company.plan||'starter').charAt(0).toUpperCase()+(company.plan||'starter').slice(1)},
                {label:'Annual fee',   value:`£${Math.round((PLAN_FEES[company.plan||'starter']||15000)/1000)}K/yr`},
                {label:'Status',       value:(company.status||'active').charAt(0).toUpperCase()+(company.status||'active').slice(1)},
                {label:'Created',      value:company.created_at?new Date(company.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'—'},
                {label:'Renews',       value:company.plan_renews_at?new Date(company.plan_renews_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'—'},
                {label:'Last booking', value:company.last_booking_at?new Date(company.last_booking_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'No bookings yet'},
              ].map((row,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',paddingBottom:i<7?10:0,marginBottom:i<7?10:0,borderBottom:i<7?'1px solid #f5f5f5':'none'}}>
                  <span style={{fontSize:13,color:colors.muted}}>{row.label}</span>
                  <span style={{fontSize:13,fontWeight:600,color:colors.dark,maxWidth:'55%',textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.value||'—'}</span>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="card" style={{padding:'22px 24px'}}>
                <p style={{fontSize:14,fontWeight:700,color:colors.dark,marginBottom:16}}>Quick actions</p>
                {[
                  {label:'View employees',        sub:'Manage this employer\'s team',      action:()=>setTab('employees'), icon:'👥'},
                  {label:'Import employees',       sub:'Upload CSV to their account',       action:()=>setShowImport(true), icon:'⬆'},
                  {label:'View bookings',          sub:'All adventure bookings',             action:()=>setTab('bookings'),  icon:'📋'},
                  {label:'Change plan',            sub:'Upgrade or downgrade subscription', action:null,                     icon:'💳'},
                ].map((a,i)=>(
                  <div key={i} onClick={a.action||undefined} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'#F7F5F2',borderRadius:10,marginBottom:i<3?8:0,cursor:a.action?'pointer':'default',transition:'background 0.15s'}}
                    onMouseEnter={e=>{if(a.action)e.currentTarget.style.background='#EEE9E4';}}
                    onMouseLeave={e=>{if(a.action)e.currentTarget.style.background='#F7F5F2';}}>
                    <span style={{fontSize:20,flexShrink:0}}>{a.icon}</span>
                    <div>
                      <p style={{fontSize:13.5,fontWeight:700,color:colors.dark,marginBottom:2}}>{a.label}</p>
                      <p style={{fontSize:12,color:colors.muted}}>{a.sub}</p>
                    </div>
                    {a.action && <span style={{marginLeft:'auto',color:colors.muted}}>→</span>}
                  </div>
                ))}
              </div>

              {/* Booking breakdown */}
              <div className="card" style={{padding:'22px 24px'}}>
                <p style={{fontSize:14,fontWeight:700,color:colors.dark,marginBottom:14}}>Booking breakdown</p>
                {[
                  {label:'Pending',          count:pending,                                                    color:colors.amber},
                  {label:'Approved',         count:bookings.filter(b=>b.status==='approved').length,          color:colors.blue},
                  {label:'Confirmed',        count:confirmed,                                                  color:colors.green},
                  {label:'Cancelled',        count:bookings.filter(b=>b.status==='cancelled').length,         color:colors.red},
                ].map((row,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:i<3?10:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:row.color}}/>
                      <span style={{fontSize:13,color:colors.mid}}>{row.label}</span>
                    </div>
                    <span style={{fontSize:13.5,fontWeight:700,color:colors.dark}}>{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EMPLOYEES TAB ── */}
        {tab==='employees' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:8,background:'#fff',border:'1px solid #eee',borderRadius:10,padding:'8px 14px',flex:1,maxWidth:360}}>
                <svg width="14" height="14" fill="none" stroke={colors.faint} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees…"
                  style={{border:'none',background:'transparent',outline:'none',fontSize:13.5,color:colors.dark,width:'100%',fontFamily:font.body}}/>
              </div>
              <div style={{display:'flex',gap:10}}>
                <Button small variant="secondary" onClick={()=>setShowImport(true)}>⬆ Import CSV</Button>
              </div>
            </div>
            <div className="table-wrap">
              <TableHeader cols={['Employee','Email','Department','Job Title','Allowance','Status','Actions']} template="1.8fr 2fr 1.2fr 1.2fr 0.9fr 0.9fr 1.2fr"/>
              {filteredEmps.length===0 ? (
                <EmptyState emoji="👥" title="No employees" subtitle="Import employees via CSV or add individually"/>
              ) : filteredEmps.map((emp,i)=>(
                <div key={emp.id} className="row-hover" style={{display:'grid',gridTemplateColumns:'1.8fr 2fr 1.2fr 1.2fr 0.9fr 0.9fr 1.2fr',padding:'11px 24px',alignItems:'center',borderBottom:i<filteredEmps.length-1?'1px solid #f5f5f5':'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <Avatar initials={emp.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}/>
                    <p style={{fontSize:13.5,fontWeight:600,color:colors.dark}}>{emp.full_name}</p>
                  </div>
                  <span style={{fontSize:12.5,color:colors.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.email}</span>
                  <span style={{fontSize:12.5,color:colors.mid}}>{emp.department||'—'}</span>
                  <span style={{fontSize:12.5,color:colors.mid}}>{emp.job_title||'—'}</span>
                  <span style={{fontSize:13,fontWeight:600,color:colors.dark}}>£{Number(emp.spend_limit_gbp||5000).toLocaleString()}</span>
                  <span style={{fontSize:11.5,fontWeight:700,color:emp.assignment_status==='Active'?colors.green:colors.muted,background:emp.assignment_status==='Active'?colors.greenLight:'#F7F5F2',borderRadius:6,padding:'2px 8px',display:'inline-block'}}>{emp.assignment_status||'Active'}</span>
                  <button onClick={()=>setEditEmp(emp)} style={{background:'#F7F5F2',color:colors.mid,border:'1px solid #eee',borderRadius:6,padding:'5px 10px',fontSize:11.5,fontWeight:700,cursor:'pointer',fontFamily:font.body}}>
                    ✏ Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {tab==='bookings' && (
          <div>
            <div style={{marginBottom:16,display:'flex',gap:10,flexWrap:'wrap'}}>
              {[['All',bookings.length,colors.dark],['Pending',pending,colors.amber],['Confirmed',confirmed,colors.green],['GMV',`£${Math.round(totalGmv/1000)}K`,colors.orange]].map(([l,v,c],i)=>(
                <div key={i} style={{background:'#fff',border:'1px solid #eee',borderRadius:10,padding:'10px 16px',textAlign:'center',minWidth:100}}>
                  <p style={{fontSize:11,color:colors.faint,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{l}</p>
                  <p style={{fontSize:18,fontWeight:700,color:c}}>{v}</p>
                </div>
              ))}
            </div>
            <div className="table-wrap">
              <TableHeader cols={['Employee','Package','Vendor','Departure','Payment','Total','Status']} template="1.6fr 1.4fr 1.2fr 1fr 0.8fr 0.9fr 1fr"/>
              {bookings.length===0 ? (
                <EmptyState emoji="📋" title="No bookings yet" subtitle="Bookings from this employer's employees will appear here"/>
              ) : bookings.map((b,i)=>(
                <div key={b.id} className="row-hover" style={{display:'grid',gridTemplateColumns:'1.6fr 1.4fr 1.2fr 1fr 0.8fr 0.9fr 1fr',padding:'11px 24px',alignItems:'center',borderBottom:i<bookings.length-1?'1px solid #f5f5f5':'none'}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:colors.dark}}>{b.employee_name}</p>
                    <p style={{fontSize:11,color:colors.faint}}>{b.employee_email}</p>
                  </div>
                  <span style={{fontSize:12.5,color:colors.mid}}>{b.emoji} {b.package_title}</span>
                  <span style={{fontSize:12.5,color:colors.mid}}>{b.vendor_name}</span>
                  <span style={{fontSize:12.5,color:colors.mid}}>{b.departure_date?new Date(b.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}):'—'}</span>
                  <span style={{fontSize:11.5,fontWeight:700,color:(b.payment_method||'payroll')==='card'?colors.blue:colors.orange,background:(b.payment_method||'payroll')==='card'?colors.blueLight:colors.orangeLight,borderRadius:6,padding:'2px 7px',display:'inline-block'}}>{(b.payment_method||'payroll')==='card'?'Card':'Payroll'}</span>
                  <span style={{fontSize:13,fontWeight:700,color:colors.dark}}>£{Number(b.total_amount||0).toLocaleString()}</span>
                  <Badge status={b.status}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

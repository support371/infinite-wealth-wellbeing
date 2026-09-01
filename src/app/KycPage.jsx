import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, CheckCircle2, Clock3, FileCheck2, FileUp, RefreshCcw, Search, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';
import { staffRoles } from './moduleConfig';

const emptyForm = {
  legal_name: '', date_of_birth: '', country_of_residence: '', residential_address: '',
  nationality: '', document_type: 'passport', document_country: '', document_last_four: '', certification_accepted: false
};
const reviewActions = [
  ['under_review', 'Start review'], ['approved', 'Approve KYC'],
  ['resubmission_required', 'Request resubmission'], ['rejected', 'Reject KYC']
];
const finalStatuses = new Set(['approved', 'rejected']);

const labelStatus = (status) => (status || 'not_started').replaceAll('_', ' ');
const statusHelp = {
  draft: 'Complete every field and upload the required identity evidence.',
  submitted: 'Your information is locked while an authorized IWW reviewer checks it.',
  under_review: 'An authorized IWW reviewer is actively reviewing this case.',
  approved: 'Identity verification is approved for this organization.',
  resubmission_required: 'Update the requested information and submit the case again.',
  rejected: 'This case is closed. Contact an IWW administrator for the next step.'
};

export default function KycPage() {
  const auth = useAuth();
  const isStaff = staffRoles.includes(auth.role);
  const [view, setView] = useState(isStaff ? 'management' : 'mine');
  return <div className="kyc-hub">{isStaff && <nav className="workspace-tabs kyc-view-tabs" aria-label="KYC views"><button className={view === 'mine' ? 'active' : ''} onClick={()=>setView('mine')}>My KYC</button><button className={view === 'management' ? 'active' : ''} onClick={()=>setView('management')}>KYC management</button></nav>}{view === 'management' && isStaff ? <KycManagement auth={auth}/> : <KycCompletion auth={auth}/>}</div>;
}

function KycCompletion({ auth }) {
  const [kycCase, setKycCase] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [state, setState] = useState({ loading: true, saving: false, error: '', notice: '' });

  const editable = !kycCase || ['draft', 'resubmission_required'].includes(kycCase.status);
  const complete = useMemo(() => Object.entries(form).every(([key, value]) => key === 'certification_accepted' ? value : String(value).trim()), [form]);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '', notice: '' }));
    const client = requireSupabase();
    const { data, error } = await client.from('kyc_cases').select('*').eq('organization_id', auth.organization.id).eq('subject_user_id', auth.user.id).maybeSingle();
    if (error) return setState({ loading: false, saving: false, error: error.message, notice: '' });
    let docs = [];
    if (data) {
      const result = await client.from('kyc_documents').select('*').eq('case_id', data.id).order('created_at');
      if (result.error) return setState({ loading: false, saving: false, error: result.error.message, notice: '' });
      docs = result.data || [];
      setForm({ ...emptyForm, ...Object.fromEntries(Object.keys(emptyForm).map((key) => [key, data[key] ?? emptyForm[key]])) });
    }
    setKycCase(data || null); setDocuments(docs); setState({ loading: false, saving: false, error: '', notice: '' });
  }, [auth.organization.id, auth.user.id]);

  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event?.preventDefault(); setState((current) => ({ ...current, saving: true, error: '', notice: '' }));
    const payload = { ...form, legal_name: form.legal_name.trim(), residential_address: form.residential_address.trim(), document_last_four: form.document_last_four.trim().toUpperCase(), organization_id: auth.organization.id, subject_user_id: auth.user.id, status: kycCase?.status === 'resubmission_required' ? 'draft' : 'draft', reviewed_at: null, reviewed_by: null, reviewer_message: null };
    const query = kycCase
      ? requireSupabase().from('kyc_cases').update(payload).eq('id', kycCase.id).select().single()
      : requireSupabase().from('kyc_cases').insert(payload).select().single();
    const { data, error } = await query;
    if (error) setState({ loading: false, saving: false, error: error.message, notice: '' });
    else { setKycCase(data); setState({ loading: false, saving: false, error: '', notice: 'KYC progress saved securely.' }); }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !kycCase) return;
    setState((current) => ({ ...current, saving: true, error: '', notice: '' }));
    try {
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) throw new Error('Use a JPG, PNG or PDF file.');
      if (file.size > 10485760) throw new Error('The maximum file size is 10 MB.');
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${auth.organization.id}/${auth.user.id}/${kycCase.id}/${crypto.randomUUID()}-${safeName}`;
      const client = requireSupabase();
      const storage = await client.storage.from('iww-kyc-documents').upload(path, file, { upsert: false, contentType: file.type });
      if (storage.error) throw storage.error;
      const record = await client.from('kyc_documents').insert({ organization_id: auth.organization.id, case_id: kycCase.id, subject_user_id: auth.user.id, document_kind: 'identity_front', storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size }).select().single();
      if (record.error) { await client.storage.from('iww-kyc-documents').remove([path]); throw record.error; }
      setDocuments((current) => [...current, record.data]);
      setState({ loading: false, saving: false, error: '', notice: 'Identity evidence uploaded securely.' });
    } catch (error) { setState({ loading: false, saving: false, error: error.message, notice: '' }); }
    event.target.value = '';
  };

  const submit = async () => {
    if (!kycCase || !complete || !documents.length) return setState((current) => ({ ...current, error: 'Complete the form, accept the certification and upload identity evidence before submitting.' }));
    setState((current) => ({ ...current, saving: true, error: '', notice: '' }));
    const { data, error } = await requireSupabase().from('kyc_cases').update({ status: 'submitted', submitted_at: new Date().toISOString(), certification_accepted: true }).eq('id', kycCase.id).select().single();
    if (error) setState({ loading: false, saving: false, error: error.message, notice: '' });
    else { setKycCase(data); setState({ loading: false, saving: false, error: '', notice: 'KYC submitted for authorized review.' }); }
  };

  if (state.loading) return <div className="app-state app-loading"><span className="spinner"/>Loading identity verification…</div>;
  const status = kycCase?.status || 'not_started';
  return <section className="workspace-page kyc-page">
    <header className="workspace-heading"><div><span className="workspace-eyebrow">SECURE IDENTITY VERIFICATION</span><h1>Complete KYC</h1><p>Confirm your identity for this IWW organization before regulated or identity-sensitive services are activated.</p></div><span className={`status-pill kyc-${status}`}>{labelStatus(status)}</span></header>
    <div className="kyc-progress" aria-label="KYC progress"><Progress active label="Identity"/><Progress active={Boolean(kycCase)} label="Evidence"/><Progress active={['submitted','under_review','approved','resubmission_required','rejected'].includes(status)} label="Review"/><Progress active={status === 'approved'} label="Approved"/></div>
    <div className={`kyc-status-card kyc-${status}`}><ShieldCheck/><div><strong>{labelStatus(status)}</strong><span>{statusHelp[status] || 'Start the identity form below.'}</span>{kycCase?.reviewer_message && <small>Reviewer message: {kycCase.reviewer_message}</small>}</div></div>
    {state.error && <div className="form-alert error"><AlertTriangle size={16}/>{state.error}</div>}
    {state.notice && <div className="form-alert success"><CheckCircle2 size={16}/>{state.notice}</div>}
    <form className="kyc-form" onSubmit={save}>
      <div className="kyc-section-head"><div><span>STEP 1</span><h2>Identity details</h2></div><UserCheck/></div>
      <div className="entity-form-grid">
        <Field label="Legal name"><input required disabled={!editable} value={form.legal_name} onChange={(e)=>setForm({...form,legal_name:e.target.value})}/></Field>
        <Field label="Date of birth"><input required type="date" disabled={!editable} value={form.date_of_birth} onChange={(e)=>setForm({...form,date_of_birth:e.target.value})}/></Field>
        <Field label="Country of residence"><input required disabled={!editable} value={form.country_of_residence} onChange={(e)=>setForm({...form,country_of_residence:e.target.value})}/></Field>
        <Field label="Nationality"><input required disabled={!editable} value={form.nationality} onChange={(e)=>setForm({...form,nationality:e.target.value})}/></Field>
        <Field label="Residential address" wide><textarea required disabled={!editable} value={form.residential_address} onChange={(e)=>setForm({...form,residential_address:e.target.value})}/></Field>
        <Field label="Identity document"><select disabled={!editable} value={form.document_type} onChange={(e)=>setForm({...form,document_type:e.target.value})}><option value="passport">Passport</option><option value="drivers_license">Driver's license</option><option value="national_id">National identity card</option><option value="residence_permit">Residence permit</option></select></Field>
        <Field label="Document issuing country"><input required disabled={!editable} value={form.document_country} onChange={(e)=>setForm({...form,document_country:e.target.value})}/></Field>
        <Field label="Last four document characters"><input required minLength={4} maxLength={4} pattern="[A-Za-z0-9]{4}" disabled={!editable} value={form.document_last_four} onChange={(e)=>setForm({...form,document_last_four:e.target.value})}/></Field>
      </div>
      {editable && <><label className="kyc-certification"><input type="checkbox" checked={form.certification_accepted} onChange={(e)=>setForm({...form,certification_accepted:e.target.checked})}/><span>I certify that this information is accurate and belongs to me. I authorize IWW to use it only for identity verification, access governance and required compliance records.</span></label><button className="app-button secondary" disabled={state.saving}>{state.saving ? 'Saving…' : kycCase ? 'Save progress' : 'Create secure KYC case'}</button></>}
    </form>
    <section className="kyc-evidence"><div className="kyc-section-head"><div><span>STEP 2</span><h2>Identity evidence</h2></div><FileCheck2/></div><p>Upload a clear identity document in JPG, PNG or PDF format. Files remain private and tenant-scoped.</p><div className="kyc-document-list">{documents.map((document)=><div key={document.id}><FileCheck2/><div><strong>{document.file_name}</strong><small>{document.document_kind.replaceAll('_',' ')} · {(document.size_bytes/1024/1024).toFixed(2)} MB</small></div><CheckCircle2/></div>)}{!documents.length && <div className="kyc-document-empty"><FileUp/><span>No identity evidence uploaded yet.</span></div>}</div>{editable && kycCase && <label className="app-button secondary kyc-upload"><FileUp size={16}/> Upload identity evidence<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={upload}/></label>}{editable && !kycCase && <small>Save the identity form before uploading evidence.</small>}</section>
    {editable && <section className="kyc-submit"><div><span>STEP 3</span><h2>Submit for review</h2><p>Submission locks the case until an authorized owner, administrator or operations manager reviews it.</p></div><button className="app-button primary" type="button" disabled={state.saving || !complete || !documents.length} onClick={submit}>Submit KYC <BadgeCheck size={16}/></button></section>}
  </section>;
}

function KycManagement({ auth }) {
  const [cases, setCases] = useState([]); const [filter, setFilter] = useState('all'); const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null); const [message, setMessage] = useState('');
  const [state, setState] = useState({ loading: true, saving: false, error: '', notice: '' });
  const load = useCallback(async () => {
    setState((current)=>({...current,loading:true,error:''}));
    const { data, error } = await requireSupabase().from('kyc_cases').select('*,profiles!kyc_cases_subject_user_id_fkey(full_name,display_name)').eq('organization_id', auth.organization.id).order('submitted_at', { ascending: false, nullsFirst: false });
    setCases(data || []); setState({ loading:false,saving:false,error:error?.message||'',notice:'' });
  }, [auth.organization.id]);
  useEffect(()=>{load();},[load]);
  const visible = cases.filter((item)=>(filter==='all'||item.status===filter)&&`${item.legal_name} ${item.profiles?.full_name||''}`.toLowerCase().includes(query.toLowerCase()));
  const updateStatus = async (status) => {
    if (!selected) return;
    if (selected.subject_user_id === auth.user.id) return setState((current)=>({...current,error:'Your own KYC case must be reviewed by another authorized staff member.',notice:''}));
    setState((current)=>({...current,saving:true,error:'',notice:''}));
    const payload = { status, reviewer_message: message.trim() || null };
    if (['approved','rejected','resubmission_required'].includes(status)) Object.assign(payload,{reviewed_at:new Date().toISOString(),reviewed_by:auth.user.id});
    else Object.assign(payload,{reviewed_at:null,reviewed_by:null});
    const { data,error }=await requireSupabase().from('kyc_cases').update(payload).eq('id',selected.id).select('*,profiles!kyc_cases_subject_user_id_fkey(full_name,display_name)').single();
    if(error)setState({loading:false,saving:false,error:error.message,notice:''});
    else{setCases((items)=>items.map((item)=>item.id===data.id?data:item));setSelected(data);setState({loading:false,saving:false,error:'',notice:`KYC marked ${labelStatus(status)}.`});}
  };
  const counts = Object.fromEntries(['submitted','under_review','approved','resubmission_required'].map(status=>[status,cases.filter(item=>item.status===status).length]));
  return <section className="workspace-page kyc-page"><header className="workspace-heading"><div><span className="workspace-eyebrow">OWNER & OPERATIONS</span><h1>KYC management</h1><p>Review tenant-bound identity cases, record decisions and keep every status change auditable.</p></div><button className="app-button secondary" onClick={load}><RefreshCcw size={16}/> Refresh queue</button></header>
    <div className="directory-metrics kyc-metrics"><Metric icon={Clock3} label="Awaiting review" value={counts.submitted||0}/><Metric icon={Search} label="In review" value={counts.under_review||0}/><Metric icon={BadgeCheck} label="Approved" value={counts.approved||0}/><Metric icon={RefreshCcw} label="Resubmission" value={counts.resubmission_required||0}/></div>
    {state.error&&<div className="form-alert error"><AlertTriangle size={16}/>{state.error}</div>}{state.notice&&<div className="form-alert success"><CheckCircle2 size={16}/>{state.notice}</div>}
    <div className="directory-toolbar"><label><Search/><input placeholder="Search KYC cases" value={query} onChange={(e)=>setQuery(e.target.value)}/></label><select value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="all">All statuses</option>{['draft','submitted','under_review','approved','resubmission_required','rejected'].map(status=><option key={status} value={status}>{labelStatus(status)}</option>)}</select></div>
    {state.loading?<div className="app-state app-loading"><span className="spinner"/>Loading KYC queue…</div>:<div className="kyc-queue">{visible.map(item=><button key={item.id} onClick={()=>{setSelected(item);setMessage(item.reviewer_message||'');}}><span className="directory-avatar">{item.legal_name.slice(0,1).toUpperCase()}</span><div><strong>{item.legal_name}</strong><small>{item.document_type.replaceAll('_',' ')} · submitted {item.submitted_at?new Date(item.submitted_at).toLocaleDateString():'not yet'}</small></div><span className={`status-pill kyc-${item.status}`}>{labelStatus(item.status)}</span></button>)}{!visible.length&&<div className="empty-state compact"><ShieldCheck/><h2>No matching KYC cases</h2><p>The queue will update when members save or submit identity verification.</p></div>}</div>}
    {selected&&<div className="modal-layer"><button className="drawer-scrim" aria-label="Close KYC review" onClick={()=>setSelected(null)}/><aside className="kyc-review"><header><div><span>KYC REVIEW</span><h2>{selected.legal_name}</h2><p>{selected.profiles?.display_name||selected.profiles?.full_name}</p></div><button aria-label="Close" onClick={()=>setSelected(null)}><XCircle/></button></header><dl><Row label="Status" value={labelStatus(selected.status)}/><Row label="Date of birth" value={selected.date_of_birth}/><Row label="Residence" value={selected.country_of_residence}/><Row label="Nationality" value={selected.nationality}/><Row label="Document" value={`${selected.document_type.replaceAll('_',' ')} •••• ${selected.document_last_four}`}/><Row label="Submitted" value={selected.submitted_at?new Date(selected.submitted_at).toLocaleString():'Not submitted'}/></dl>{selected.subject_user_id === auth.user.id ? <div className="form-alert error"><ShieldCheck size={16}/>Your own KYC case must be reviewed by another authorized staff member.</div> : <><label>Message visible to the member<textarea value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Explain the decision or any requested correction."/></label><div className="kyc-review-actions">{reviewActions.filter(([status])=>status!==selected.status&&!finalStatuses.has(selected.status)).map(([status,label])=><button key={status} className={`app-button ${status==='approved'?'primary':'secondary'}`} disabled={state.saving} onClick={()=>updateStatus(status)}>{label}</button>)}</div></>}</aside></div>}
  </section>;
}

function Progress({ active, label }) { return <div className={active?'active':''}><span>{active?<CheckCircle2/>:null}</span><strong>{label}</strong></div>; }
function Field({ label, wide, children }) { return <label className={wide?'wide':''}>{label}{children}</label>; }
function Metric({ icon:Icon,label,value }) { return <div><Icon/><span>{label}</span><strong>{value}</strong></div>; }
function Row({label,value}) { return <div><dt>{label}</dt><dd>{value||'—'}</dd></div>; }

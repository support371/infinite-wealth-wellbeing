import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, BarChart3, Bitcoin, BookOpenCheck, CheckCircle2, Clock3, KeyRound, RefreshCcw, Search, ShieldCheck, WalletCards, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';
import { staffRoles } from './moduleConfig';
import { workspacePath } from './workspaceRoutes';

const cryptoServiceUrl = import.meta.env.VITE_CRYPTO_SERVICE_URL || 'https://crypto-signal-bot-indol.vercel.app';
const serviceOptions = [
  { value: 'digital_asset_education', title: 'Digital asset education', detail: 'Learn wallets, custody, networks and transaction safety.', icon: BookOpenCheck },
  { value: 'market_intelligence', title: 'Market intelligence', detail: 'Review governed research, market context and monitored signals.', icon: BarChart3 },
  { value: 'portfolio_readiness', title: 'Portfolio readiness', detail: 'Define objectives, time horizon and risk boundaries before activation.', icon: ShieldCheck },
  { value: 'exchange_connection', title: 'Exchange connection', detail: 'Request guided, read-only exchange connection and account checks.', icon: WalletCards },
  { value: 'signal_service', title: 'Crypto signal service', detail: 'Access the separate governed Crypto Signal Bot after approval.', icon: Bitcoin }
];
const emptyForm = { service_type: 'digital_asset_education', experience_level: 'new', preferred_support: 'advisor_session', objective: '', risk_acknowledged: false };
const terminalStatuses = new Set(['approved', 'declined']);
const label = (value) => (value || 'not_started').replaceAll('_', ' ');

export default function CryptoServicesPage() {
  const auth = useAuth();
  const isStaff = staffRoles.includes(auth.role);
  const [view, setView] = useState('access');
  return <div className="crypto-hub">
    {isStaff && <nav className="workspace-tabs crypto-view-tabs" aria-label="Crypto Services views"><button className={view === 'access' ? 'active' : ''} onClick={()=>setView('access')}>My access</button><button className={view === 'management' ? 'active' : ''} onClick={()=>setView('management')}>Request management</button></nav>}
    {view === 'management' && isStaff ? <CryptoManagement auth={auth}/> : <CryptoAccess auth={auth}/>} 
  </div>;
}

function CryptoAccess({ auth }) {
  const [request, setRequest] = useState(null);
  const [kycStatus, setKycStatus] = useState('not_started');
  const [form, setForm] = useState(emptyForm);
  const [state, setState] = useState({ loading: true, saving: false, error: '', notice: '' });
  const editable = !request || ['draft', 'resubmission_required'].includes(request.status);
  const canSubmit = useMemo(() => form.objective.trim().length >= 20 && form.risk_acknowledged, [form]);

  const load = useCallback(async () => {
    setState((current)=>({...current,loading:true,error:'',notice:''}));
    const client = requireSupabase();
    const [requestResult, kycResult] = await Promise.all([
      client.from('crypto_service_requests').select('*').eq('organization_id',auth.organization.id).eq('requester_id',auth.user.id).maybeSingle(),
      client.from('kyc_cases').select('status').eq('organization_id',auth.organization.id).eq('subject_user_id',auth.user.id).maybeSingle()
    ]);
    const error = requestResult.error || kycResult.error;
    if (error) return setState({loading:false,saving:false,error:error.message,notice:''});
    setRequest(requestResult.data || null);
    setKycStatus(kycResult.data?.status || 'not_started');
    if (requestResult.data) setForm(Object.fromEntries(Object.keys(emptyForm).map((key)=>[key,requestResult.data[key] ?? emptyForm[key]])));
    setState({loading:false,saving:false,error:'',notice:''});
  },[auth.organization.id,auth.user.id]);
  useEffect(()=>{load();},[load]);

  const save = async (submit = false) => {
    if (submit && !canSubmit) return setState((current)=>({...current,error:'Describe your objective and accept the risk acknowledgement before submitting.',notice:''}));
    setState((current)=>({...current,saving:true,error:'',notice:''}));
    const payload = {
      ...form,
      objective: form.objective.trim(),
      organization_id: auth.organization.id,
      requester_id: auth.user.id,
      status: submit ? 'submitted' : 'draft',
      submitted_at: submit ? new Date().toISOString() : null,
      reviewed_at: null,
      reviewed_by: null,
      reviewer_message: null
    };
    const query = request
      ? requireSupabase().from('crypto_service_requests').update(payload).eq('id',request.id).select().single()
      : requireSupabase().from('crypto_service_requests').insert(payload).select().single();
    const { data,error } = await query;
    if (error) setState({loading:false,saving:false,error:error.message,notice:''});
    else { setRequest(data); setState({loading:false,saving:false,error:'',notice:submit?'Crypto Services request submitted for review.':'Crypto Services request saved.'}); }
  };

  if (state.loading) return <div className="app-state app-loading"><span className="spinner"/>Loading Crypto Services…</div>;
  const status = request?.status || 'not_started';
  const active = status === 'approved' && kycStatus === 'approved';
  return <section className="workspace-page crypto-page">
    <header className="workspace-heading"><div><span className="workspace-eyebrow">DIGITAL ASSET SERVICES</span><h1>Crypto Services</h1><p>Education, market intelligence, readiness and governed access in one protected workspace.</p></div><span className={`status-pill crypto-${status}`}>{label(status)}</span></header>
    <section className="crypto-access-banner"><div className="crypto-access-icon"><Bitcoin/></div><div><span>ACCESS STATUS</span><h2>{active ? 'Crypto Services are active' : status === 'approved' ? 'KYC approval is required' : 'Complete the access request'}</h2><p>{active ? 'Your approved workspace can open the managed Crypto Signal Service.' : 'IWW keeps onboarding, KYC and approval here. The execution service remains separately authenticated and governed.'}</p></div>{active ? <a className="app-button primary" href={cryptoServiceUrl} target="_blank" rel="noreferrer">Open crypto service <ArrowUpRight size={16}/></a> : <Link className="app-button secondary" to={workspacePath(auth.organization,'verification')}>Review KYC</Link>}</section>
    <div className="crypto-security-note"><KeyRound/><div><strong>Never submit wallet recovery phrases, private keys or exchange secrets.</strong><span>Connection credentials belong only in the approved provider’s protected authorization flow.</span></div></div>
    <section className="crypto-service-grid" aria-label="Available Crypto Services">{serviceOptions.map(({value,title,detail,icon:Icon})=><button type="button" key={value} className={form.service_type===value?'selected':''} disabled={!editable} onClick={()=>setForm({...form,service_type:value})}><Icon/><span><strong>{title}</strong><small>{detail}</small></span>{form.service_type===value&&<CheckCircle2/>}</button>)}</section>
    {state.error&&<div className="form-alert error"><AlertTriangle size={16}/>{state.error}</div>}{state.notice&&<div className="form-alert success"><CheckCircle2 size={16}/>{state.notice}</div>}
    <section className="crypto-request-card"><div className="kyc-section-head"><div><span>GOVERNED ACCESS</span><h2>Service request</h2></div><ShieldCheck/></div>
      <div className="entity-form-grid">
        <label>Experience level<select disabled={!editable} value={form.experience_level} onChange={(e)=>setForm({...form,experience_level:e.target.value})}><option value="new">New to crypto</option><option value="developing">Developing experience</option><option value="experienced">Experienced</option></select></label>
        <label>Preferred support<select disabled={!editable} value={form.preferred_support} onChange={(e)=>setForm({...form,preferred_support:e.target.value})}><option value="self_guided">Self-guided</option><option value="advisor_session">Advisor session</option><option value="managed_setup">Managed setup</option></select></label>
        <label className="wide">What do you want to accomplish?<textarea disabled={!editable} minLength={20} maxLength={2000} value={form.objective} onChange={(e)=>setForm({...form,objective:e.target.value})} placeholder="Describe the service you need, your goal and the support you expect."/></label>
      </div>
      {editable&&<><label className="crypto-acknowledgement"><input type="checkbox" checked={form.risk_acknowledged} onChange={(e)=>setForm({...form,risk_acknowledged:e.target.checked})}/><span>I understand that digital assets can lose value and that submitting this request does not authorize autonomous transactions or guarantee returns.</span></label><div className="crypto-request-actions"><button className="app-button secondary" disabled={state.saving||form.objective.trim().length<20} onClick={()=>save(false)}>Save request</button><button className="app-button primary" disabled={state.saving||!canSubmit} onClick={()=>save(true)}>Submit for review</button></div></>}
      {!editable&&<div className="crypto-review-state"><Clock3/><div><strong>{label(status)}</strong><span>{request?.reviewer_message || (active ? 'Your approved access is ready.' : 'An authorized IWW staff member will review this request and KYC status.')}</span></div></div>}
    </section>
  </section>;
}

function CryptoManagement({ auth }) {
  const [requests,setRequests] = useState([]); const [selected,setSelected] = useState(null); const [query,setQuery] = useState(''); const [filter,setFilter] = useState('all'); const [message,setMessage] = useState('');
  const [state,setState] = useState({loading:true,saving:false,error:'',notice:''});
  const load = useCallback(async()=>{
    setState((current)=>({...current,loading:true,error:'',notice:''}));
    const client=requireSupabase();
    const {data,error}=await client.from('crypto_service_requests').select('*,profiles!crypto_service_requests_requester_id_fkey(full_name,display_name)').eq('organization_id',auth.organization.id).order('submitted_at',{ascending:false,nullsFirst:false});
    if(error){setRequests([]);setState({loading:false,saving:false,error:error.message,notice:''});return;}
    const requesterIds=[...new Set((data||[]).map((item)=>item.requester_id))];
    let kycByUser=new Map();
    if(requesterIds.length){
      const kycResult=await client.from('kyc_cases').select('subject_user_id,status').eq('organization_id',auth.organization.id).in('subject_user_id',requesterIds);
      if(kycResult.error){setRequests([]);setState({loading:false,saving:false,error:kycResult.error.message,notice:''});return;}
      kycByUser=new Map((kycResult.data||[]).map((item)=>[item.subject_user_id,item.status]));
    }
    setRequests((data||[]).map((item)=>({...item,kyc_status:kycByUser.get(item.requester_id)||'not_started'}))); setState({loading:false,saving:false,error:'',notice:''});
  },[auth.organization.id]);
  useEffect(()=>{load();},[load]);
  const visible=requests.filter((item)=>(filter==='all'||item.status===filter)&&`${item.profiles?.display_name||''} ${item.profiles?.full_name||''} ${item.service_type}`.toLowerCase().includes(query.toLowerCase()));
  const updateStatus=async(status)=>{
    if(!selected)return;
    if(selected.requester_id===auth.user.id)return setState((current)=>({...current,error:'Your own Crypto Services request must be reviewed by another authorized staff member.',notice:''}));
    setState((current)=>({...current,saving:true,error:'',notice:''}));
    const payload={status,reviewer_message:message.trim()||null};
    if(['approved','resubmission_required','declined'].includes(status))Object.assign(payload,{reviewed_at:new Date().toISOString(),reviewed_by:auth.user.id});
    else Object.assign(payload,{reviewed_at:null,reviewed_by:null});
    const {data,error}=await requireSupabase().from('crypto_service_requests').update(payload).eq('id',selected.id).select('*,profiles!crypto_service_requests_requester_id_fkey(full_name,display_name)').single();
    if(error)setState({loading:false,saving:false,error:error.message,notice:''});
    else{const updated={...data,kyc_status:selected.kyc_status};setRequests((items)=>items.map((item)=>item.id===data.id?updated:item));setSelected(updated);setState({loading:false,saving:false,error:'',notice:`Request marked ${label(status)}.`});}
  };
  const counts=Object.fromEntries(['submitted','under_review','approved','resubmission_required'].map(status=>[status,requests.filter(item=>item.status===status).length]));
  return <section className="workspace-page crypto-page"><header className="workspace-heading"><div><span className="workspace-eyebrow">OWNER & OPERATIONS</span><h1>Crypto Services management</h1><p>Review service requests, confirm KYC readiness and activate only authorized client access.</p></div><button className="app-button secondary" onClick={load}><RefreshCcw size={16}/> Refresh queue</button></header>
    <div className="directory-metrics kyc-metrics"><Metric icon={Clock3} label="Awaiting review" value={counts.submitted||0}/><Metric icon={Search} label="In review" value={counts.under_review||0}/><Metric icon={CheckCircle2} label="Approved" value={counts.approved||0}/><Metric icon={RefreshCcw} label="Resubmission" value={counts.resubmission_required||0}/></div>
    {state.error&&<div className="form-alert error"><AlertTriangle size={16}/>{state.error}</div>}{state.notice&&<div className="form-alert success"><CheckCircle2 size={16}/>{state.notice}</div>}
    <div className="directory-toolbar"><label><Search/><input placeholder="Search Crypto Services requests" value={query} onChange={(e)=>setQuery(e.target.value)}/></label><select value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="all">All statuses</option>{['draft','submitted','under_review','approved','resubmission_required','declined'].map(status=><option key={status} value={status}>{label(status)}</option>)}</select></div>
    {state.loading?<div className="app-state app-loading"><span className="spinner"/>Loading Crypto Services queue…</div>:<div className="kyc-queue crypto-queue">{visible.map(item=><button key={item.id} onClick={()=>{setSelected(item);setMessage(item.reviewer_message||'');}}><span className="directory-avatar"><Bitcoin/></span><div><strong>{item.profiles?.display_name||item.profiles?.full_name||'IWW member'}</strong><small>{label(item.service_type)} · {item.experience_level}</small></div><span className={`status-pill crypto-${item.status}`}>{label(item.status)}</span></button>)}{!visible.length&&<div className="empty-state compact"><Bitcoin/><h2>No matching Crypto Services requests</h2><p>Submitted member requests will appear here for authorized review.</p></div>}</div>}
    {selected&&<div className="modal-layer"><button className="drawer-scrim" aria-label="Close crypto request review" onClick={()=>setSelected(null)}/><aside className="kyc-review"><header><div><span>CRYPTO SERVICES REVIEW</span><h2>{selected.profiles?.display_name||selected.profiles?.full_name||'IWW member'}</h2><p>{label(selected.service_type)}</p></div><button aria-label="Close" onClick={()=>setSelected(null)}><X/></button></header><dl><Row name="Status" value={label(selected.status)}/><Row name="KYC" value={label(selected.kyc_status)}/><Row name="Experience" value={label(selected.experience_level)}/><Row name="Support" value={label(selected.preferred_support)}/><Row name="Submitted" value={selected.submitted_at?new Date(selected.submitted_at).toLocaleString():'Not submitted'}/></dl><div className="crypto-objective"><strong>Client objective</strong><p>{selected.objective}</p></div>{selected.kyc_status!=='approved'&&<div className="form-alert error"><ShieldCheck size={16}/>KYC must be approved before Crypto Services access can be approved.</div>}{selected.requester_id===auth.user.id?<div className="form-alert error"><ShieldCheck size={16}/>Your own request must be reviewed by another authorized staff member.</div>:<><label>Message visible to the member<textarea value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Explain the decision or required next step."/></label><div className="kyc-review-actions">{selected.status==='submitted'&&<button className="app-button secondary" disabled={state.saving} onClick={()=>updateStatus('under_review')}>Start review</button>}{!terminalStatuses.has(selected.status)&&['submitted','under_review'].includes(selected.status)&&<><button className="app-button primary" disabled={state.saving||selected.kyc_status!=='approved'} onClick={()=>updateStatus('approved')}>Approve access</button><button className="app-button secondary" disabled={state.saving} onClick={()=>updateStatus('resubmission_required')}>Request changes</button><button className="app-button secondary" disabled={state.saving} onClick={()=>updateStatus('declined')}>Decline</button></>}</div></>}</aside></div>}
  </section>;
}

function Metric({icon:Icon,label:metricLabel,value}) { return <div><Icon/><span>{metricLabel}</span><strong>{value}</strong></div>; }
function Row({name,value}) { return <div><dt>{name}</dt><dd>{value||'—'}</dd></div>; }

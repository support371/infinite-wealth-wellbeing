import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Plug, RefreshCcw, Search } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import { requireSupabase } from '../lib/supabase';

function AppMark({ app }) {
  const [failed,setFailed]=useState(false);
  return <span className="integration-mark">{!failed&&app.logo_url?<img src={app.logo_url} alt="" loading="lazy" onError={()=>setFailed(true)}/>:app.display_name.slice(0,2).toUpperCase()}</span>;
}

export default function IntegrationMarketplacePage() {
  const auth=useAuth();
  const [catalog,setCatalog]=useState([]);const [connections,setConnections]=useState([]);const [query,setQuery]=useState('');const [category,setCategory]=useState('all');const [state,setState]=useState({loading:true,error:'',notice:''});
  const load=useCallback(async()=>{setState(current=>({...current,loading:true,error:''}));const client=requireSupabase();const [{data:apps,error:appsError},{data:connected,error:connectionsError}]=await Promise.all([client.from('integration_catalog').select('*').eq('status','active').order('display_name'),client.from('integration_connections').select('*').eq('organization_id',auth.organization.id)]);const error=appsError||connectionsError;if(error)setState({loading:false,error:error.message,notice:''});else{setCatalog(apps||[]);setConnections(connected||[]);setState(current=>({...current,loading:false,error:''}));}},[auth.organization.id]);
  useEffect(()=>{load();},[load]);
  const categories=useMemo(()=>['all',...new Set(catalog.map(app=>app.category))],[catalog]);
  const visible=useMemo(()=>catalog.filter(app=>(category==='all'||app.category===category)&&(`${app.display_name} ${app.description||''}`.toLowerCase().includes(query.toLowerCase()))),[catalog,category,query]);
  const connectionFor=(key)=>connections.find(item=>item.provider===key);
  const request=async(app)=>{setState(current=>({...current,error:'',notice:''}));try{await apiRequest(`/integrations/${app.provider_key}/request`,auth.organization.id,{method:'POST'});setState(current=>({...current,notice:`${app.display_name} enablement requested.`}));await load();}catch(error){setState(current=>({...current,error:error.message}));}};
  return <section className="workspace-page"><header className="workspace-heading"><div><span className="workspace-eyebrow">ORGANIZATION INTEGRATIONS</span><h1>App marketplace</h1><p>Discover more than 300 applications. Connections are organization-authorized, server-side and independently revocable.</p></div></header><div className="integration-toolbar"><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search applications"/></label><select value={category} onChange={event=>setCategory(event.target.value)}>{categories.map(item=><option key={item} value={item}>{item==='all'?'All categories':item}</option>)}</select><strong>{visible.length} apps</strong></div>{state.notice&&<div className="form-alert success"><Check/>{state.notice}</div>}{state.error&&<div className="form-alert error"><AlertTriangle/>{state.error}<button onClick={load}><RefreshCcw/></button></div>}{state.loading?<div className="app-state app-loading"><span className="spinner"/>Loading integration catalog…</div>:<div className="integration-grid">{visible.map(app=>{const connection=connectionFor(app.provider_key);const active=connection&&connection.status!=='revoked';return <article key={app.id} className="integration-card"><div><AppMark app={app}/><span className={`status-pill ${connection?.status||'catalog'}`}>{connection?.status||app.availability}</span></div><h2>{app.display_name}</h2><p>{app.description||`${app.display_name} integration for authorized IWW organization workflows.`}</p><small>{app.category} · {app.auth_strategy.replaceAll('_',' ')}</small><button disabled={Boolean(active)} onClick={()=>request(app)}><Plug/>{active?connection.status==='connected'?'Connected':'Enablement requested':connection?.status==='revoked'?'Request again':app.availability==='native'?'Connect':'Request enablement'}</button></article>})}</div>}</section>;
}

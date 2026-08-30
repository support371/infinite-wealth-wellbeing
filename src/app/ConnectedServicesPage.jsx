import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Plug, RefreshCcw, ShieldCheck, Unplug } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import { requireSupabase } from '../lib/supabase';
import { canAccessModule, modules } from './moduleConfig';

const gemIntegrationDirectory = import.meta.env.VITE_GEM_INTEGRATION_URL || 'https://support371-gem-enterprise.vercel.app/app/command-center/integrations';

export default function ConnectedServicesPage() {
  const auth = useAuth();
  const allowed = canAccessModule(modules.integrations, auth.role);
  const [state, setState] = useState({ loading: true, error: '', notice: '', connections: [] });
  const load = useCallback(async () => {
    if (!allowed) return;
    setState((current) => ({ ...current, loading: true, error: '' }));
    const { data, error } = await requireSupabase()
      .from('integration_connections')
      .select('id,provider,status,created_at,updated_at')
      .eq('organization_id', auth.organization.id)
      .order('updated_at', { ascending: false });
    setState((current) => ({ ...current, loading: false, error: error?.message || '', connections: data || [] }));
  }, [allowed, auth.organization.id]);

  useEffect(() => { load(); }, [load]);

  const revoke = async (connection) => {
    setState((current) => ({ ...current, error: '', notice: '' }));
    try {
      await apiRequest(`/integrations/${connection.provider}/revoke`, auth.organization.id, { method: 'POST' });
      setState((current) => ({ ...current, notice: `${connection.provider.replaceAll('_',' ')} revoked.` }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    }
  };

  if (!allowed) return <div className="app-state denied"><AlertTriangle/><h2>Permission denied</h2><p>Your IWW role does not grant access to organization connections.</p></div>;

  return <section className="workspace-page">
    <header className="workspace-heading"><div><span className="workspace-eyebrow">WORKSPACE CONNECTIONS</span><h1>Connected services</h1><p>IWW shows only the services authorized for this organization. Discovery, ownership and activation remain in the central GEM Workspace OS integration directory.</p></div><a className="app-button secondary" href={gemIntegrationDirectory} target="_blank" rel="noreferrer">Open GEM integrations <ArrowUpRight size={16}/></a></header>
    <div className="service-boundary-note"><ShieldCheck/><div><strong>One integration estate</strong><span>Marketing, sales, development, production, teams, administration and product integrations are managed centrally and surfaced here only when relevant.</span></div></div>
    {state.notice && <div className="form-alert success"><CheckCircle2/>{state.notice}</div>}
    {state.error && <div className="form-alert error"><AlertTriangle/>{state.error}<button onClick={load}><RefreshCcw/></button></div>}
    {state.loading ? <div className="app-state app-loading"><span className="spinner"/>Loading connected services…</div> : !state.error && state.connections.length === 0 ? <div className="empty-state"><div><Plug/></div><h2>No services connected yet</h2><p>Your GEM workspace administrator can activate approved services for this organization from the central integration directory.</p><a className="app-button primary" href={gemIntegrationDirectory} target="_blank" rel="noreferrer">Review available services</a></div> : !state.error && <div className="connected-service-grid">{state.connections.map((connection)=><article key={connection.id}><div><span className="integration-mark">{connection.provider.slice(0,2).toUpperCase()}</span><span className={`status-pill ${connection.status}`}>{connection.status}</span></div><h2>{connection.provider.replaceAll('_',' ')}</h2><p>Organization-authorized connection managed through GEM Workspace OS.</p><small>Updated {new Date(connection.updated_at || connection.created_at).toLocaleDateString()}</small><span className="connected-verification"><CheckCircle2/> Scoped to {auth.organization.name}</span>{connection.status !== 'revoked' && <button className="connection-revoke" onClick={() => revoke(connection)}><Unplug/> Revoke connection</button>}</article>)}</div>}
  </section>;
}

import { ArrowRight, Building2, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { workspaceBase } from './workspaceRoutes';

export default function WorkspaceSelectorPage() {
  const auth = useAuth();
  const gemWorkspaceUrl=import.meta.env.VITE_GEM_WORKSPACE_URL||'https://support371-gem-enterprise.vercel.app/app/workspace';
  return <main className="workspace-selector-page"><header><div className="selector-brand"><span>IW</span><div><strong>Infinite World</strong><small>GEM-managed product workspace</small></div></div><div className="selector-header-actions"><a href={gemWorkspaceUrl}>GEM Workspace OS <ExternalLink/></a><button onClick={auth.signOut}>Sign out</button></div></header><section><div className="selector-heading"><span>YOUR IWW ORGANIZATIONS</span><h1>Continue into a managed workspace</h1><p>IWW is one product workspace inside the wider GEM operating environment. Select an authorized organization; your role and tenant scope are evaluated again when it opens.</p></div><div className="workspace-card-grid">{auth.memberships.map((membership)=><Link key={membership.id} to={workspaceBase(membership.organizations)} className="workspace-card"><div><Building2/><span>{membership.role.replaceAll('_',' ')}</span></div><h2>{membership.organizations.name}</h2><p>GEM Workspace OS · IWW · {membership.organizations.slug}</p><strong>Open IWW workspace <ArrowRight/></strong></Link>)}</div>{auth.platformStaff && <Link className="platform-entry" to="/platform"><ShieldCheck/><div><strong>IWW platform administration</strong><span>Service operations, organization oversight and governance</span></div><ArrowRight/></Link>}</section></main>;
}

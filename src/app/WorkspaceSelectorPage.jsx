import { ArrowRight, Building2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { workspaceBase } from './workspaceRoutes';

export default function WorkspaceSelectorPage() {
  const auth = useAuth();
  return <main className="workspace-selector-page"><header><div className="selector-brand"><span>IW</span><div><strong>Infinite World</strong><small>of Well-Being</small></div></div><button onClick={auth.signOut}>Sign out</button></header><section><div className="selector-heading"><span>AUTHORIZED WORKSPACES</span><h1>Choose where you are working</h1><p>Each organization is an independent IWW tenant. Your role and data access are evaluated again inside the selected workspace.</p></div><div className="workspace-card-grid">{auth.memberships.map((membership)=><Link key={membership.id} to={workspaceBase(membership.organizations)} className="workspace-card"><div><Building2/><span>{membership.role.replaceAll('_',' ')}</span></div><h2>{membership.organizations.name}</h2><p>iww.app/{membership.organizations.slug}</p><strong>Open workspace <ArrowRight/></strong></Link>)}</div>{auth.platformStaff && <Link className="platform-entry" to="/platform"><ShieldCheck/><div><strong>IWW platform administration</strong><span>Organizations, service operations, catalog and governance</span></div><ArrowRight/></Link>}</section></main>;
}

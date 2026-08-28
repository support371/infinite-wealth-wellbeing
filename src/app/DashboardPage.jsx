import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, CheckCircle2, HeartPulse, ListTodo, RefreshCcw, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';
import { staffRoles } from './moduleConfig';
import { workspacePath } from './workspaceRoutes';

const memberCards = [
  { table: 'goals', label: 'Active goals', icon: TrendingUp, path: 'wellbeing', filter: ['status','active'] },
  { table: 'habits', label: 'Habits', icon: HeartPulse, path: 'wellbeing', filter: ['status','active'] },
  { table: 'appointments', label: 'Appointments', icon: CalendarDays, path: 'appointments' },
  { table: 'tasks', label: 'Open tasks', icon: ListTodo, path: 'tasks', filter: ['status','open'] }
];
const staffCards = [
  { table: 'memberships', label: 'Active members', icon: Users, path: 'team', filter: ['status','active'] },
  { table: 'programme_enrolments', label: 'Enrolments', icon: TrendingUp, path: 'programmes' },
  { table: 'appointments', label: 'Appointments', icon: CalendarDays, path: 'appointments' },
  { table: 'workflow_approvals', label: 'Pending approvals', icon: CheckCircle2, path: 'governance', filter: ['status','pending'] }
];
const gemWorkspaceUrl = import.meta.env.VITE_GEM_WORKSPACE_URL || 'https://support371-gem-enterprise.vercel.app/app/workspace';

export default function DashboardPage() {
  const auth = useAuth();
  const [state, setState] = useState({ loading: true, error: '', counts: [], intake: null, connectionCount: 0 });
  const cards = staffRoles.includes(auth.role) ? staffCards : memberCards;
  const showOwnerReadiness = staffRoles.includes(auth.role);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const client = requireSupabase();
      const [counts, intakeResult, connectionResult] = await Promise.all([
        Promise.all(cards.map(async (card) => {
          let query = client.from(card.table).select('id', { count: 'exact', head: true }).eq('organization_id', auth.organization.id);
          if (card.filter) query = query.eq(card.filter[0], card.filter[1]);
          const { count, error } = await query;
          if (error) throw error;
          return { ...card, count: count || 0 };
        })),
        showOwnerReadiness
          ? client.from('organization_service_intakes').select('engagement_type,project_name,management_mode,status,updated_at').eq('organization_id', auth.organization.id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        showOwnerReadiness
          ? client.from('integration_connections').select('id', { count: 'exact', head: true }).eq('organization_id', auth.organization.id).eq('status', 'connected')
          : Promise.resolve({ count: 0, error: null })
      ]);
      if (intakeResult.error) throw intakeResult.error;
      if (connectionResult.error) throw connectionResult.error;
      setState({ loading: false, error: '', counts, intake: intakeResult.data, connectionCount: connectionResult.count || 0 });
    } catch (error) { setState((current) => ({ ...current, loading: false, error: error.message, counts: [] })); }
  }, [auth.organization.id, cards, showOwnerReadiness]);

  useEffect(() => { load(); }, [load]);

  return <section className="workspace-page dashboard-page"><header className="workspace-heading"><div><span className="workspace-eyebrow">{auth.organization.name} · {auth.role.replaceAll('_',' ')}</span><h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {auth.profile.display_name || auth.profile.full_name}</h1><p>Your secure view of wealth, wellbeing and the work that moves both forward.</p></div></header>
    {state.error && <div className="form-alert error">{state.error}<button onClick={load}><RefreshCcw size={15}/></button></div>}
    <div className="metric-grid">{state.loading ? Array.from({length:4},(_,i)=><div className="metric-card skeleton" key={i}/>) : state.counts.map(({label,count,icon:Icon,path})=><Link className="metric-card" to={workspacePath(auth.organization,path)} key={label}><div className="metric-icon"><Icon/></div><span>{label}</span><strong>{count}</strong><ArrowUpRight className="metric-arrow"/></Link>)}</div>
    <div className="dashboard-grid"><div className="dashboard-panel"><div className="panel-heading"><div><span>FOCUS</span><h2>Your next best steps</h2></div></div><div className="action-list"><Link to={workspacePath(auth.organization,'wellbeing')}><HeartPulse/><div><strong>Update wellbeing progress</strong><span>Record a check-in, goal or habit.</span></div><ArrowUpRight/></Link><Link to={workspacePath(auth.organization,'wealth')}><TrendingUp/><div><strong>Review your wealth plan</strong><span>Keep user-entered targets and balances current.</span></div><ArrowUpRight/></Link><Link to={workspacePath(auth.organization,'appointments')}><CalendarDays/><div><strong>Coordinate an appointment</strong><span>Request or review an upcoming session.</span></div><ArrowUpRight/></Link></div></div>
      <aside className="dashboard-panel calm-panel"><span>PRIVATE BY DESIGN</span><h2>Your role defines this view</h2><p>Supabase Row Level Security limits every query to your active IWW organization, role and explicit member scope.</p><Link to={workspacePath(auth.organization,'settings')}>Review privacy preferences <ArrowUpRight size={15}/></Link></aside></div>
    {showOwnerReadiness && <section className="owner-readiness"><div className="owner-readiness-head"><div><span>OWNER READINESS</span><h2>Managed workspace status</h2><p>Your IWW product workspace stays technically independent while GEM Workspace OS coordinates the wider client engagement, team and approved services.</p></div><span className={`status-pill ${state.intake?.status || 'active'}`}>{state.intake?.status || 'existing workspace'}</span></div><div className="owner-readiness-grid"><div className="owner-readiness-item"><span>Engagement</span><strong>{state.intake?.engagement_type?.replaceAll('_',' ') || 'Existing organization'}</strong><small>{state.intake?.project_name || 'Current IWW tenant retained and protected.'}</small></div><div className="owner-readiness-item"><span>Management</span><strong>{state.intake?.management_mode?.replaceAll('_',' ') || 'GEM-supported'}</strong><small>Owner, admin and operations permissions remain server-authoritative.</small></div><div className="owner-readiness-item"><span>Connected services</span><strong>{state.connectionCount} active</strong><small>Approved centrally and exposed here only for this organization.</small></div></div><div className="owner-readiness-actions"><a className="app-button primary" href={gemWorkspaceUrl}>Open GEM Workspace OS <ArrowUpRight size={15}/></a><Link className="app-button secondary" to={workspacePath(auth.organization,'team')}><Users size={15}/> Manage team</Link><Link className="app-button secondary" to={workspacePath(auth.organization,'governance')}><ShieldCheck size={15}/> Review governance</Link></div></section>}
  </section>;
}

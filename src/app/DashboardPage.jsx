import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, CheckCircle2, HeartPulse, ListTodo, RefreshCcw, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';
import { staffRoles } from './moduleConfig';

const memberCards = [
  { table: 'goals', label: 'Active goals', icon: TrendingUp, link: '/app/wellbeing', filter: ['status','active'] },
  { table: 'habits', label: 'Habits', icon: HeartPulse, link: '/app/wellbeing', filter: ['status','active'] },
  { table: 'appointments', label: 'Appointments', icon: CalendarDays, link: '/app/appointments' },
  { table: 'tasks', label: 'Open tasks', icon: ListTodo, link: '/app/tasks', filter: ['status','open'] }
];
const staffCards = [
  { table: 'memberships', label: 'Active members', icon: Users, link: '/app/team', filter: ['status','active'] },
  { table: 'programme_enrolments', label: 'Enrolments', icon: TrendingUp, link: '/app/programmes' },
  { table: 'appointments', label: 'Appointments', icon: CalendarDays, link: '/app/appointments' },
  { table: 'workflow_approvals', label: 'Pending approvals', icon: CheckCircle2, link: '/app/governance', filter: ['status','pending'] }
];

export default function DashboardPage() {
  const auth = useAuth();
  const [state, setState] = useState({ loading: true, error: '', counts: [] });
  const cards = staffRoles.includes(auth.role) ? staffCards : memberCards;

  const load = useCallback(async () => {
    setState({ loading: true, error: '', counts: [] });
    try {
      const client = requireSupabase();
      const counts = await Promise.all(cards.map(async (card) => {
        let query = client.from(card.table).select('id', { count: 'exact', head: true }).eq('organization_id', auth.organization.id);
        if (card.filter) query = query.eq(card.filter[0], card.filter[1]);
        const { count, error } = await query;
        if (error) throw error;
        return { ...card, count: count || 0 };
      }));
      setState({ loading: false, error: '', counts });
    } catch (error) { setState({ loading: false, error: error.message, counts: [] }); }
  }, [auth.organization.id, cards]);

  useEffect(() => { load(); }, [load]);

  return <section className="workspace-page dashboard-page"><header className="workspace-heading"><div><span className="workspace-eyebrow">{auth.organization.name} · {auth.role.replaceAll('_',' ')}</span><h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {auth.profile.display_name || auth.profile.full_name}</h1><p>Your secure view of wealth, wellbeing and the work that moves both forward.</p></div></header>
    {state.error && <div className="form-alert error">{state.error}<button onClick={load}><RefreshCcw size={15}/></button></div>}
    <div className="metric-grid">{state.loading ? Array.from({length:4},(_,i)=><div className="metric-card skeleton" key={i}/>) : state.counts.map(({label,count,icon:Icon,link})=><Link className="metric-card" to={link} key={label}><div className="metric-icon"><Icon/></div><span>{label}</span><strong>{count}</strong><ArrowUpRight className="metric-arrow"/></Link>)}</div>
    <div className="dashboard-grid"><div className="dashboard-panel"><div className="panel-heading"><div><span>FOCUS</span><h2>Your next best steps</h2></div></div><div className="action-list"><Link to="/app/wellbeing"><HeartPulse/><div><strong>Update wellbeing progress</strong><span>Record a check-in, goal or habit.</span></div><ArrowUpRight/></Link><Link to="/app/wealth"><TrendingUp/><div><strong>Review your wealth plan</strong><span>Keep user-entered targets and balances current.</span></div><ArrowUpRight/></Link><Link to="/app/appointments"><CalendarDays/><div><strong>Coordinate an appointment</strong><span>Request or review an upcoming session.</span></div><ArrowUpRight/></Link></div></div>
      <aside className="dashboard-panel calm-panel"><span>PRIVATE BY DESIGN</span><h2>Your role defines this view</h2><p>Supabase Row Level Security limits every query to your active IWW organization, role and explicit member scope.</p><Link to="/app/settings">Review privacy preferences <ArrowUpRight size={15}/></Link></aside></div>
  </section>;
}

import { useEffect, useState } from 'react';
import { Bell, BookOpen, Building2, CalendarDays, ChevronDown, CircleDollarSign, ClipboardCheck, FileText, HeartPulse, LayoutDashboard, LogOut, Menu, MessageSquare, Search, Settings, ShieldCheck, Sparkles, TrendingUp, Users, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';
import { canAccessModule, modules } from './moduleConfig';

const nav = [
  { label:'Overview', to:'/app', icon:LayoutDashboard, end:true },
  { label:'Wellbeing', to:'/app/wellbeing', icon:HeartPulse, module:'wellbeing' },
  { label:'Wealth planning', to:'/app/wealth', icon:TrendingUp, module:'wealth' },
  { label:'Programmes', to:'/app/programmes', icon:BookOpen, module:'programmes' },
  { label:'Appointments', to:'/app/appointments', icon:CalendarDays, module:'appointments' },
  { label:'Messages', to:'/app/messages', icon:MessageSquare },
  { label:'Documents', to:'/app/documents', icon:FileText, module:'documents' },
  { label:'Tasks', to:'/app/tasks', icon:ClipboardCheck, module:'tasks' },
  { label:'Resources', to:'/app/resources', icon:BookOpen, module:'resources' },
  { label:'Community', to:'/app/community', icon:Users, module:'community' },
  { label:'Team', to:'/app/team', icon:Users, module:'team', section:'Operations' },
  { label:'Governance', to:'/app/governance', icon:ShieldCheck, module:'governance' },
  { label:'Reports', to:'/app/reports', icon:ClipboardCheck, module:'reports' },
  { label:'Billing', to:'/app/billing', icon:CircleDollarSign, module:'billing' },
  { label:'Integrations', to:'/app/integrations', icon:Building2, module:'integrations' },
  { label:'IWW Assistant', to:'/app/assistant', icon:Sparkles, section:'Support' },
  { label:'Preferences', to:'/app/settings', icon:Settings }
];

export default function AppShell() {
  const auth = useAuth(); const location=useLocation();
  const [mobileOpen,setMobileOpen]=useState(false); const [profileOpen,setProfileOpen]=useState(false); const [searchOpen,setSearchOpen]=useState(false);
  const [notifications,setNotifications]=useState([]);
  const visibleNav=nav.filter(item=>!item.module||canAccessModule(modules[item.module],auth.role));
  useEffect(()=>{setMobileOpen(false);setProfileOpen(false);},[location.pathname]);
  useEffect(()=>{const onKey=(event)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setSearchOpen(true);}if(event.key==='Escape')setSearchOpen(false);};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[]);
  useEffect(()=>{let cancelled=false;(async()=>{try{const {data}=await requireSupabase().from('notifications').select('id,title,read_at').eq('organization_id',auth.organization.id).eq('user_id',auth.user.id).is('read_at',null).limit(5);if(!cancelled)setNotifications(data||[]);}catch{if(!cancelled)setNotifications([]);}})();return()=>{cancelled=true};},[auth.organization.id,auth.user.id]);

  return <div className="app-shell"><aside className={`app-sidebar ${mobileOpen?'open':''}`}><div className="sidebar-brand"><Link to="/app"><span>IW</span><div><strong>Infinite World</strong><small>of Well-Being</small></div></Link><button onClick={()=>setMobileOpen(false)} aria-label="Close navigation"><X/></button></div><div className="organization-switcher"><span>WORKSPACE</span><select aria-label="Active organization" value={auth.organization.id} onChange={(e)=>auth.selectOrganization(e.target.value)}>{auth.memberships.map(m=><option key={m.organization_id} value={m.organization_id}>{m.organizations.name}</option>)}</select><small>{auth.role.replaceAll('_',' ')}</small></div><nav className="sidebar-nav">{visibleNav.map((item,index)=><div key={item.to}>{item.section && (index===0||visibleNav[index-1]?.section!==item.section)&&<span className="nav-section">{item.section}</span>}<NavLink end={item.end} to={item.to} className={({isActive})=>isActive?'active':''}><item.icon/><span>{item.label}</span></NavLink></div>)}</nav><div className="sidebar-bottom"><Link to="/" target="_blank">View public site</Link><button onClick={auth.signOut}><LogOut/>Sign out</button></div></aside><button className={`sidebar-scrim ${mobileOpen?'open':''}`} aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/><div className="app-main"><header className="app-header"><button className="mobile-nav-button" onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu/></button><button className="command-search" onClick={()=>setSearchOpen(true)}><Search/><span>Search workspace</span><kbd>⌘ K</kbd></button><div className="header-actions"><button className="notification-button" aria-label={`${notifications.length} unread notifications`}><Bell/><span>{notifications.length}</span></button><div className="profile-menu"><button onClick={()=>setProfileOpen(!profileOpen)}><span>{(auth.profile.display_name||auth.profile.full_name||'I').slice(0,1).toUpperCase()}</span><div><strong>{auth.profile.display_name||auth.profile.full_name}</strong><small>{auth.role.replaceAll('_',' ')}</small></div><ChevronDown/></button>{profileOpen&&<div className="profile-popover"><Link to="/app/settings"><Settings/>Preferences</Link><button onClick={auth.signOut}><LogOut/>Sign out</button></div>}</div></div></header><main className="app-content"><Outlet/></main></div>{searchOpen&&<CommandPalette items={visibleNav} close={()=>setSearchOpen(false)}/>}</div>;
}

function CommandPalette({items,close}) {
  const [query,setQuery]=useState(''); const filtered=items.filter(i=>i.label.toLowerCase().includes(query.toLowerCase()));
  return <div className="command-overlay" role="dialog" aria-modal="true" aria-label="Search workspace" onMouseDown={(e)=>{if(e.target===e.currentTarget)close();}}><div className="command-dialog"><div><Search/><input autoFocus value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search modules…"/><button onClick={close}>ESC</button></div><nav>{filtered.map(item=><Link key={item.to} to={item.to} onClick={close}><item.icon/><span>{item.label}</span></Link>)}{!filtered.length&&<p>No matching workspace module.</p>}</nav></div></div>;
}

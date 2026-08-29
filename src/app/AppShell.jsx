import { useEffect, useState } from 'react';
import { Bell, BookOpen, Building2, CalendarDays, ChevronDown, CircleDollarSign, ClipboardCheck, ExternalLink, FileText, HeartPulse, LayoutDashboard, LogOut, Menu, MessageSquare, Plug, Search, Settings, ShieldCheck, Sparkles, TrendingUp, Users, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';
import { canAccessModule, modules } from './moduleConfig';
import { workspaceBase, workspacePath } from './workspaceRoutes';

const nav = [
  { label:'Overview', path:'', icon:LayoutDashboard, end:true, section:'Workspace' },
  { label:'Wellbeing', path:'wellbeing', icon:HeartPulse, module:'wellbeing', section:'Plans' },
  { label:'Wealth planning', path:'wealth', icon:TrendingUp, module:'wealth', section:'Plans' },
  { label:'Programmes', path:'programmes', icon:BookOpen, module:'programmes', section:'Plans' },
  { label:'Appointments', path:'appointments', icon:CalendarDays, module:'appointments', section:'Collaboration' },
  { label:'Messages', path:'messages', icon:MessageSquare, section:'Collaboration' },
  { label:'Documents', path:'documents', icon:FileText, module:'documents', section:'Collaboration' },
  { label:'Tasks', path:'tasks', icon:ClipboardCheck, module:'tasks', section:'Collaboration' },
  { label:'Resources', path:'resources', icon:BookOpen, module:'resources', section:'Community' },
  { label:'Community', path:'community', icon:Users, module:'community', section:'Community' },
  { label:'Members & team', path:'team', icon:Users, module:'team', section:'Organization' },
  { label:'Governance', path:'governance', icon:ShieldCheck, module:'governance', section:'Organization' },
  { label:'Reports', path:'reports', icon:ClipboardCheck, module:'reports', section:'Organization' },
  { label:'Billing', path:'billing', icon:CircleDollarSign, module:'billing', section:'Organization' },
  { label:'Connected services', path:'integrations', icon:Plug, module:'integrations', section:'Organization' },
  { label:'IWW Assistant', path:'assistant', icon:Sparkles, section:'Support' },
  { label:'Preferences', path:'settings', icon:Settings, section:'Support' }
];

const gemWorkspaceUrl = import.meta.env.VITE_GEM_WORKSPACE_URL || 'https://support371-gem-enterprise.vercel.app/app/workspace';

export default function AppShell() {
  const auth = useAuth(); const location=useLocation();
  const [mobileOpen,setMobileOpen]=useState(false); const [profileOpen,setProfileOpen]=useState(false); const [searchOpen,setSearchOpen]=useState(false);
  const [notifications,setNotifications]=useState([]);
  const visibleNav=nav.filter(item=>!item.module||canAccessModule(modules[item.module],auth.role)).map(item=>({...item,to:workspacePath(auth.organization,item.path)}));
  useEffect(()=>{setMobileOpen(false);setProfileOpen(false);},[location.pathname]);
  useEffect(()=>{const onKey=(event)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setSearchOpen(true);}if(event.key==='Escape')setSearchOpen(false);};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[]);
  useEffect(()=>{let cancelled=false;(async()=>{try{const {data}=await requireSupabase().from('notifications').select('id,title,read_at').eq('organization_id',auth.organization.id).eq('user_id',auth.user.id).is('read_at',null).limit(5);if(!cancelled)setNotifications(data||[]);}catch{if(!cancelled)setNotifications([]);}})();return()=>{cancelled=true};},[auth.organization.id,auth.user.id]);

  return <div className="app-shell"><aside className={`app-sidebar ${mobileOpen?'open':''}`}><div className="sidebar-brand"><Link to={workspaceBase(auth.organization)}><span>IW</span><div><strong>Infinite World</strong><small>of Well-Being</small></div></Link><button onClick={()=>setMobileOpen(false)} aria-label="Close navigation"><X/></button></div><a className="gem-workspace-return" href={gemWorkspaceUrl}><Building2/><div><strong>GEM Workspace OS</strong><small>Managed product workspace</small></div><ExternalLink/></a><div className="organization-switcher"><span>ACTIVE ORGANIZATION</span><select aria-label="Active organization" value={auth.organization.id} onChange={(e)=>{const membership=auth.memberships.find(item=>item.organization_id===e.target.value);if(membership)window.location.assign(workspaceBase(membership.organizations));}}>{auth.memberships.map(m=><option key={m.organization_id} value={m.organization_id}>{m.organizations.name}</option>)}</select><small>{auth.role.replaceAll('_',' ')}</small></div><nav className="sidebar-nav">{visibleNav.map((item,index)=><div key={item.to}>{item.section && (index===0||visibleNav[index-1]?.section!==item.section)&&<span className="nav-section">{item.section}</span>}<NavLink end={item.end} to={item.to} className={({isActive})=>isActive?'active':''}><item.icon/><span>{item.label}</span></NavLink></div>)}</nav><div className="sidebar-bottom"><Link to="/workspaces">Switch organization</Link><button onClick={auth.signOut}><LogOut/>Sign out</button></div></aside><button className={`sidebar-scrim ${mobileOpen?'open':''}`} aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/><div className="app-main"><header className="app-header"><button className="mobile-nav-button" onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu/></button><div className="managed-product-label"><span>IWW</span><div><strong>Managed product workspace</strong><small>{auth.organization.name}</small></div></div><button className="command-search" onClick={()=>setSearchOpen(true)}><Search/><span>Search workspace</span><kbd>⌘ K</kbd></button><div className="header-actions"><button className="notification-button" aria-label={`${notifications.length} unread notifications`}><Bell/><span>{notifications.length}</span></button><div className="profile-menu"><button onClick={()=>setProfileOpen(!profileOpen)}><span>{(auth.profile.display_name||auth.profile.full_name||'I').slice(0,1).toUpperCase()}</span><div><strong>{auth.profile.display_name||auth.profile.full_name}</strong><small>{auth.role.replaceAll('_',' ')}</small></div><ChevronDown/></button>{profileOpen&&<div className="profile-popover"><Link to={workspacePath(auth.organization,'settings')}><Settings/>Preferences</Link><button onClick={auth.signOut}><LogOut/>Sign out</button></div>}</div></div></header><main className="app-content"><Outlet/></main></div>{searchOpen&&<CommandPalette items={visibleNav} close={()=>setSearchOpen(false)}/>}</div>;
}

function CommandPalette({items,close}) {
  const [query,setQuery]=useState(''); const filtered=items.filter(i=>i.label.toLowerCase().includes(query.toLowerCase()));
  return <div className="command-overlay" role="dialog" aria-modal="true" aria-label="Search workspace" onMouseDown={(e)=>{if(e.target===e.currentTarget)close();}}><div className="command-dialog"><div><Search/><input autoFocus value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search modules…"/><button onClick={close}>ESC</button></div><nav>{filtered.map(item=><Link key={item.to} to={item.to} onClick={close}><item.icon/><span>{item.label}</span></Link>)}{!filtered.length&&<p>No matching workspace module.</p>}</nav></div></div>;
}

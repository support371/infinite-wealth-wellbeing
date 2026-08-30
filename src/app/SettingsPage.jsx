import { useEffect, useState } from 'react';
import { Check, Save } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';
import { applyTheme } from '../lib/theme';

export default function SettingsPage() {
  const auth = useAuth();
  const [form,setForm]=useState({theme:'system',locale:'en-US',email:true,push:true,sms:false});
  const [message,setMessage]=useState(''); const [error,setError]=useState(''); const [saving,setSaving]=useState(false);
  useEffect(()=>{(async()=>{const {data,error:queryError}=await requireSupabase().from('user_preferences').select('*').eq('organization_id',auth.organization.id).eq('user_id',auth.user.id).maybeSingle();if(queryError)setError(queryError.message);if(data){setForm({theme:data.theme,locale:data.locale,...data.communication});applyTheme(data.theme);}})();},[auth.organization.id,auth.user.id]);
  const save=async(e)=>{e.preventDefault();setSaving(true);setError('');const {error:saveError}=await requireSupabase().from('user_preferences').upsert({organization_id:auth.organization.id,user_id:auth.user.id,theme:form.theme,locale:form.locale,communication:{email:form.email,push:form.push,sms:form.sms}},{onConflict:'organization_id,user_id'});if(saveError)setError(saveError.message);else setMessage('Preferences saved.');setSaving(false);};
  return <section className="workspace-page"><header className="workspace-heading"><div><span className="workspace-eyebrow">ACCOUNT</span><h1>Preferences & privacy</h1><p>Control your IWW experience and communication choices.</p></div></header><form className="settings-card" onSubmit={save}><h2>Experience</h2><div className="settings-grid"><label>Theme<select value={form.theme} onChange={(e)=>{const theme=e.target.value;setForm({...form,theme});applyTheme(theme);}}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Locale<input value={form.locale} onChange={(e)=>setForm({...form,locale:e.target.value})}/></label></div><h2>Communications</h2>{['email','push','sms'].map(channel=><label className="toggle-row" key={channel}><span><strong>{channel.toUpperCase()}</strong><small>Receive {channel} notifications when enabled.</small></span><input type="checkbox" checked={form[channel]} onChange={(e)=>setForm({...form,[channel]:e.target.checked})}/></label>)}{error&&<div className="form-alert error">{error}</div>}{message&&<div className="form-alert success"><Check size={16}/>{message}</div>}<button className="app-button primary" disabled={saving}><Save size={16}/>{saving?'Saving…':'Save preferences'}</button></form></section>;
}

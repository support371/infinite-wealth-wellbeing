import { useState } from 'react';
import { ArrowRight, Building2, UserRound } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function OnboardingPage() {
  const auth = useAuth();
  const [step, setStep] = useState(auth.profile?.onboarding_completed ? 2 : 1);
  const [profile, setProfile] = useState({ fullName: auth.profile?.full_name || auth.user?.user_metadata?.full_name || '', displayName: auth.profile?.display_name || '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const [organization, setOrganization] = useState({ name: '', slug: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (auth.loading) return <div className="app-state app-loading"><span className="spinner"/>Preparing onboarding…</div>;
  if (!auth.user) return <Navigate to="/auth/sign-in" replace/>;
  if (auth.profile?.onboarding_completed && auth.activeMembership) return <Navigate to="/workspaces" replace/>;

  const saveProfile = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await auth.completeProfile(profile); setStep(2); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const saveOrganization = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await auth.createOrganization(organization); } catch (e) { setError(e.message); setBusy(false); }
  };

  return <main className="onboarding-page"><div className="onboarding-card">
    <div className="onboarding-progress"><span className={step >= 1 ? 'active' : ''}>1</span><i/><span className={step >= 2 ? 'active' : ''}>2</span></div>
    {step === 1 ? <form onSubmit={saveProfile}><UserRound size={34}/><h1>Set up your IWW profile</h1><p>This identity belongs only to Infinite World of Well-Being.</p><label>Full name<input required value={profile.fullName} onChange={(e)=>setProfile({...profile,fullName:e.target.value})}/></label><label>Display name<input value={profile.displayName} onChange={(e)=>setProfile({...profile,displayName:e.target.value})}/></label><label>Timezone<input required value={profile.timezone} onChange={(e)=>setProfile({...profile,timezone:e.target.value})}/></label>{error && <div className="form-alert error">{error}</div>}<button className="app-button primary" disabled={busy}>Continue <ArrowRight size={16}/></button></form>
    : <form onSubmit={saveOrganization}><Building2 size={34}/><h1>Create your IWW organization</h1><p>This creates a standalone tenant with you as its owner.</p><label>Organization name<input required minLength={2} value={organization.name} onChange={(e)=>setOrganization({...organization,name:e.target.value,slug:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')})}/></label><label>Workspace address<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={organization.slug} onChange={(e)=>setOrganization({...organization,slug:e.target.value})}/><small>iww.app/{organization.slug || 'your-organization'}</small></label>{error && <div className="form-alert error">{error}</div>}<button className="app-button primary" disabled={busy}>Create workspace <ArrowRight size={16}/></button></form>}
  </div></main>;
}

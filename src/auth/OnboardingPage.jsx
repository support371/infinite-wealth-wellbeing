import { useEffect, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, UserRound, Users } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function OnboardingPage() {
  const auth = useAuth();
  const [step, setStep] = useState(auth.profile?.onboarding_completed ? 2 : 1);
  const [profile, setProfile] = useState({ fullName: auth.profile?.full_name || auth.user?.user_metadata?.full_name || '', displayName: auth.profile?.display_name || '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const [organization, setOrganization] = useState({ name: '', slug: '', engagementType: 'existing_project', projectName: '', projectSummary: '', managementMode: 'gem_managed' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const getPendingInvitations = auth.getPendingInvitations;

  useEffect(() => {
    let active = true;
    if (!auth.user || step !== 2) return undefined;
    getPendingInvitations().then((rows) => { if (active) setInvitations(rows); }).catch((reason) => { if (active && reason.code !== 'PGRST202') setError(reason.message); });
    return () => { active = false; };
  }, [auth.user, getPendingInvitations, step]);

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
  const acceptInvitation = async (invitationId) => {
    setBusy(true); setError('');
    try { await auth.acceptInvitation(invitationId); } catch (e) { setError(e.message); setBusy(false); }
  };

  return <main className="onboarding-page"><div className="onboarding-card">
    <div className="onboarding-progress"><span className={step >= 1 ? 'active' : ''}>1</span><i/><span className={step >= 2 ? 'active' : ''}>2</span></div>
    {step === 1 ? <form onSubmit={saveProfile}><UserRound size={34}/><h1>Set up your IWW profile</h1><p>This identity belongs only to Infinite World of Well-Being.</p><label>Full name<input required value={profile.fullName} onChange={(e)=>setProfile({...profile,fullName:e.target.value})}/></label><label>Display name<input value={profile.displayName} onChange={(e)=>setProfile({...profile,displayName:e.target.value})}/></label><label>Timezone<input required value={profile.timezone} onChange={(e)=>setProfile({...profile,timezone:e.target.value})}/></label>{error && <div className="form-alert error">{error}</div>}<button className="app-button primary" disabled={busy}>Continue <ArrowRight size={16}/></button></form>
    : <>{invitations.length > 0 && <section className="pending-invitations"><Users/><div><strong>You have {invitations.length} organization invitation{invitations.length === 1 ? '' : 's'}</strong><span>Accept an invitation or create a separate organization below.</span></div>{invitations.map((invitation) => <button key={invitation.invitation_id} disabled={busy} onClick={() => acceptInvitation(invitation.invitation_id)}><div><strong>{invitation.organization_name}</strong><small>{invitation.invited_role.replaceAll('_',' ')} · expires {new Date(invitation.expires_at).toLocaleDateString()}</small></div><CheckCircle2/></button>)}</section>}<form onSubmit={saveOrganization}><Building2 size={34}/><h1>Register your managed organization</h1><p>Create the IWW workspace and tell GEM what you are bringing for management.</p><label>Organization name<input required minLength={2} value={organization.name} onChange={(e)=>setOrganization({...organization,name:e.target.value,slug:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')})}/></label><label>Workspace address<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={organization.slug} onChange={(e)=>setOrganization({...organization,slug:e.target.value})}/><small>Workspace OS / {organization.slug || 'your-organization'} / IWW</small></label><label>What are you bringing?<select value={organization.engagementType} onChange={(e)=>setOrganization({...organization,engagementType:e.target.value})}><option value="existing_project">An existing project</option><option value="new_project">A project GEM should create with me</option><option value="organization_management">An organization for GEM to manage</option></select></label><label>Project or service name<input required minLength={2} value={organization.projectName} onChange={(e)=>setOrganization({...organization,projectName:e.target.value})}/></label><label>Brief<textarea required minLength={10} maxLength={3000} value={organization.projectSummary} onChange={(e)=>setOrganization({...organization,projectSummary:e.target.value})} placeholder="Describe the project, organization and the outcome you want GEM to manage."/></label><label>Management approach<select value={organization.managementMode} onChange={(e)=>setOrganization({...organization,managementMode:e.target.value})}><option value="gem_managed">GEM-managed</option><option value="collaborative">Managed together</option><option value="self_managed">Owner-managed with GEM support</option></select></label>{error && <div className="form-alert error">{error}</div>}<button className="app-button primary" disabled={busy}>{busy?'Creating managed workspace…':'Create managed workspace'} <ArrowRight size={16}/></button></form></>}
  </div></main>;
}

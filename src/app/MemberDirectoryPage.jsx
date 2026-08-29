import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Clock3, RefreshCcw, Search, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';
import { careRoles, staffRoles } from './moduleConfig';

const inviteRoles = ['admin','operations_manager','advisor','practitioner','member','family_delegate'];

export default function MemberDirectoryPage() {
  const auth = useAuth();
  const allowed = careRoles.includes(auth.role);
  const canInvite = ['owner','admin'].includes(auth.role);
  const canReviewConsent = ['owner','admin'].includes(auth.role);
  const [state, setState] = useState({ loading: true, error: '', members: [], invitations: [] });
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ email: '', role: 'member' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!allowed) return;
    setState((current) => ({ ...current, loading: true, error: '' }));
    const client = requireSupabase();
    const [membershipsResult, profilesResult, consentsResult, assignmentsResult, invitationsResult] = await Promise.all([
      client.from('memberships').select('id,user_id,role,status,joined_at').eq('organization_id', auth.organization.id).eq('status', 'active').order('created_at'),
      client.from('profiles').select('id,full_name,display_name,avatar_url,timezone,onboarding_completed').limit(250),
      canReviewConsent ? client.from('consents').select('user_id,consent_type,version,granted,captured_at,revoked_at').eq('organization_id', auth.organization.id).order('captured_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
      staffRoles.includes(auth.role) ? client.from('care_assignments').select('member_id,assigned_user_id,assignment_type,status').eq('organization_id', auth.organization.id).eq('status', 'active') : Promise.resolve({ data: [], error: null }),
      canInvite ? client.from('invitations').select('id,email,role,status,expires_at,created_at').eq('organization_id', auth.organization.id).eq('status', 'pending').order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null })
    ]);
    const error = membershipsResult.error || profilesResult.error || consentsResult.error || assignmentsResult.error || invitationsResult.error;
    if (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
      return;
    }
    const profiles = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]));
    const consents = consentsResult.data || [];
    const assignments = assignmentsResult.data || [];
    const members = (membershipsResult.data || []).map((membership) => ({
      ...membership,
      profile: profiles.get(membership.user_id) || null,
      consents: consents.filter((item) => item.user_id === membership.user_id),
      assignments: assignments.filter((item) => item.member_id === membership.user_id).map((item) => ({ ...item, professional: profiles.get(item.assigned_user_id) || null }))
    }));
    setState({ loading: false, error: '', members, invitations: invitationsResult.data || [] });
  }, [allowed, auth.organization.id, auth.role, canInvite, canReviewConsent]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => state.members.filter((member) => {
    const name = member.profile?.display_name || member.profile?.full_name || 'IWW member';
    return (roleFilter === 'all' || member.role === roleFilter) && `${name} ${member.role}`.toLowerCase().includes(query.toLowerCase());
  }), [query, roleFilter, state.members]);
  const selected = state.members.find((member) => member.user_id === selectedId) || null;

  const submitInvite = async (event) => {
    event.preventDefault();
    setSaving(true); setNotice('');
    const client = requireSupabase();
    const { error } = await client.from('invitations').insert({
      organization_id: auth.organization.id,
      email: invite.email.trim().toLowerCase(),
      role: invite.role,
      token_hash: crypto.randomUUID().replaceAll('-', ''),
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      invited_by: auth.user.id
    });
    if (error) setNotice(error.message);
    else {
      setInvite({ email: '', role: 'member' });
      setShowInvite(false);
      setNotice('Invitation created. The recipient can register with this email and accept it during onboarding.');
      await load();
    }
    setSaving(false);
  };

  if (!allowed) return <div className="app-state denied"><AlertTriangle/><h2>Permission denied</h2><p>Your role does not grant access to the member directory.</p></div>;

  return <section className="workspace-page member-directory-page">
    <header className="workspace-heading"><div><span className="workspace-eyebrow">ROLE-SAFE DIRECTORY</span><h1>Members and care team</h1><p>Organization identities, roles, consent visibility and assigned support relationships in one controlled workspace.</p></div>{canInvite && <button className="app-button primary" onClick={() => setShowInvite(true)}><UserPlus size={16}/> Invite person</button>}</header>
    {notice && <div className={`form-alert ${notice.includes('created') ? 'success' : 'error'}`}>{notice.includes('created') ? <CheckCircle2/> : <AlertTriangle/>}{notice}</div>}
    {state.error && <div className="form-alert error"><AlertTriangle/>{state.error}<button onClick={load}><RefreshCcw/></button></div>}
    <div className="directory-metrics"><div><Users/><span>Active people</span><strong>{state.members.length}</strong></div><div><ShieldCheck/><span>Members</span><strong>{state.members.filter((item) => item.role === 'member').length}</strong></div><div><Clock3/><span>Pending invitations</span><strong>{state.invitations.length}</strong></div></div>
    <div className="directory-toolbar"><label><Search/><span className="sr-only">Search directory</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or role…"/></label><select aria-label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">All roles</option>{['owner','admin','operations_manager','advisor','practitioner','member','family_delegate'].map((role) => <option key={role} value={role}>{role.replaceAll('_',' ')}</option>)}</select></div>
    {state.loading ? <div className="app-state app-loading"><span className="spinner"/>Loading authorized people…</div> : filtered.length === 0 ? <div className="empty-state"><div><Users/></div><h2>No matching people</h2><p>Change the search or role filter, or invite the first person into this organization.</p></div> : <div className="directory-list">{filtered.map((member) => { const name = member.profile?.display_name || member.profile?.full_name || 'IWW member'; return <button key={member.id} onClick={() => setSelectedId(member.user_id)}><span className="directory-avatar">{name.slice(0,1).toUpperCase()}</span><div><strong>{name}</strong><small>{member.profile?.timezone || 'Timezone not set'} · Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'pending'}</small></div><span className={`status-pill ${member.status}`}>{member.role.replaceAll('_',' ')}</span><ChevronRight/></button>; })}</div>}
    {selected && <div className="directory-drawer" role="dialog" aria-modal="true" aria-label="Member details"><button className="drawer-scrim" aria-label="Close member details" onClick={() => setSelectedId(null)}/><aside><header><div><span className="directory-avatar">{(selected.profile?.display_name || selected.profile?.full_name || 'I').slice(0,1).toUpperCase()}</span><div><strong>{selected.profile?.display_name || selected.profile?.full_name || 'IWW member'}</strong><small>{selected.role.replaceAll('_',' ')}</small></div></div><button aria-label="Close" onClick={() => setSelectedId(null)}><X/></button></header><section><span className="drawer-label">ACCOUNT</span><dl><div><dt>Onboarding</dt><dd>{selected.profile?.onboarding_completed ? 'Completed' : 'Incomplete'}</dd></div><div><dt>Timezone</dt><dd>{selected.profile?.timezone || 'Not supplied'}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div></dl></section><section><span className="drawer-label">ASSIGNED SUPPORT</span>{selected.assignments.length ? selected.assignments.map((assignment) => <div className="assignment-row" key={`${assignment.assigned_user_id}-${assignment.assignment_type}`}><ShieldCheck/><div><strong>{assignment.professional?.display_name || assignment.professional?.full_name || 'Assigned professional'}</strong><small>{assignment.assignment_type}</small></div></div>) : <p className="drawer-empty">No active care assignment is visible for this person.</p>}</section><section><span className="drawer-label">CONSENT RECORDS</span>{canReviewConsent ? selected.consents.length ? selected.consents.map((consent) => <div className="consent-row" key={`${consent.consent_type}-${consent.captured_at}`}><span className={`status-pill ${consent.granted && !consent.revoked_at ? 'active' : 'revoked'}`}>{consent.granted && !consent.revoked_at ? 'granted' : 'not active'}</span><div><strong>{consent.consent_type.replaceAll('_',' ')}</strong><small>Version {consent.version} · {new Date(consent.captured_at).toLocaleDateString()}</small></div></div>) : <p className="drawer-empty">No consent record has been captured.</p> : <p className="drawer-empty">Consent details are restricted to owners and administrators.</p>}</section></aside></div>}
    {showInvite && <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Invite person"><button className="drawer-scrim" aria-label="Close invitation" onClick={() => setShowInvite(false)}/><form className="modal-card" onSubmit={submitInvite}><header><div><span>ORGANIZATION ACCESS</span><h2>Invite a person</h2></div><button type="button" aria-label="Close" onClick={() => setShowInvite(false)}><X/></button></header><p>The invitation is bound to this email and organization. The recipient accepts it after creating their IWW account with the same email.</p><label>Email address<input required type="email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })}/></label><label>Role<select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value })}>{inviteRoles.map((role) => <option key={role} value={role}>{role.replaceAll('_',' ')}</option>)}</select></label><div className="entity-form-actions"><button type="button" className="app-button secondary" onClick={() => setShowInvite(false)}>Cancel</button><button className="app-button primary" disabled={saving}>{saving ? 'Creating…' : 'Create invitation'}</button></div></form></div>}
  </section>;
}

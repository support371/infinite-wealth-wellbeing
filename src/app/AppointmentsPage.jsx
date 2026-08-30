import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, MapPin, Plus, RefreshCcw, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';
import { staffRoles } from './moduleConfig';

const professionalRoles = ['owner','admin','operations_manager','advisor','practitioner'];
const blankForm = { appointmentType: 'Planning review', memberId: '', hostId: '', startsAt: '', duration: '60', locationType: 'video', reminder: '24' };
const blankAvailability = { weekday: '1', startsAt: '09:00', endsAt: '17:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export function transitionOptions(appointment, auth) {
  if (staffRoles.includes(auth.role)) {
    if (appointment.status === 'requested') return ['confirmed','cancelled'];
    if (appointment.status === 'confirmed') return ['completed','cancelled','no_show'];
  }
  if (appointment.host_id === auth.user.id) {
    if (appointment.status === 'requested') return ['confirmed','cancelled'];
    if (appointment.status === 'confirmed') return ['completed','cancelled','no_show'];
  }
  if (appointment.member_id === auth.user.id && ['requested','confirmed'].includes(appointment.status)) return ['cancelled'];
  return [];
}

function AppointmentCard({ appointment, auth, participantsById, onTransition }) {
  const member = participantsById.get(appointment.member_id);
  const host = participantsById.get(appointment.host_id);
  const actions = transitionOptions(appointment, auth);
  return <article className="appointment-card"><div className="appointment-date"><strong>{new Date(appointment.starts_at).toLocaleDateString(undefined, { day: '2-digit' })}</strong><span>{new Date(appointment.starts_at).toLocaleDateString(undefined, { month: 'short' })}</span></div><div className="appointment-details"><div><span className={`status-pill ${appointment.status}`}>{appointment.status.replaceAll('_',' ')}</span><small>{appointment.location_type}</small></div><h2>{appointment.appointment_type}</h2><p><Clock3/> {new Date(appointment.starts_at).toLocaleString()}–{new Date(appointment.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><p><UserRound/> {member?.display_name || 'Authorized member'} with {host?.display_name || 'Assigned professional'}</p><p><MapPin/> {appointment.location_reference || `${appointment.location_type} details provided after confirmation`}</p>{actions.length > 0 && <div className="appointment-actions">{actions.map((status) => <button key={status} className={status === 'confirmed' || status === 'completed' ? 'primary-action' : ''} onClick={() => onTransition(appointment, status)}>{status.replaceAll('_',' ')}</button>)}</div>}</div></article>;
}

export default function AppointmentsPage() {
  const auth = useAuth();
  const [state, setState] = useState({ loading: true, error: '', appointments: [], participants: [], availability: [], calendarConnected: false });
  const [showForm, setShowForm] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [availabilityForm, setAvailabilityForm] = useState(blankAvailability);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    const client = requireSupabase();
    const [appointmentsResult, participantsResult, connectionsResult, availabilityResult] = await Promise.all([
      client.from('appointments').select('id,member_id,host_id,appointment_type,starts_at,ends_at,timezone,status,location_type,location_reference,reminder_settings,created_at,updated_at').eq('organization_id', auth.organization.id).order('starts_at', { ascending: true }).limit(200),
      client.rpc('workspace_participants', { p_organization_id: auth.organization.id }),
      staffRoles.includes(auth.role) ? client.from('integration_connections').select('provider,status').eq('organization_id', auth.organization.id).in('provider', ['google_calendar','microsoft_calendar']).eq('status', 'connected') : Promise.resolve({ data: [], error: null }),
      client.from('availability_rules').select('id,host_id,weekday,starts_at,ends_at,timezone,is_active').eq('organization_id', auth.organization.id).eq('is_active', true).order('weekday').order('starts_at')
    ]);
    const error = appointmentsResult.error || participantsResult.error || connectionsResult.error || availabilityResult.error;
    if (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
      return;
    }
    const participants = participantsResult.data || [];
    const members = participants.filter((person) => person.role === 'member');
    const hosts = participants.filter((person) => professionalRoles.includes(person.role));
    setForm((current) => ({
      ...current,
      memberId: current.memberId || (auth.role === 'member' ? auth.user.id : members[0]?.user_id || ''),
      hostId: current.hostId || hosts.find((person) => person.user_id !== auth.user.id)?.user_id || hosts[0]?.user_id || ''
    }));
    setState({ loading: false, error: '', appointments: appointmentsResult.data || [], participants, availability: availabilityResult.data || [], calendarConnected: (connectionsResult.data || []).length > 0 });
  }, [auth.organization.id, auth.role, auth.user.id]);

  useEffect(() => { load(); }, [load]);

  const participantsById = useMemo(() => new Map(state.participants.map((person) => [person.user_id, person])), [state.participants]);
  const memberOptions = state.participants.filter((person) => person.role === 'member');
  const hostOptions = state.participants.filter((person) => professionalRoles.includes(person.role));
  const selectedAvailability = state.availability.filter((rule) => rule.host_id === form.hostId);
  const ownAvailability = state.availability.filter((rule) => rule.host_id === auth.user.id);
  const upcoming = state.appointments.filter((appointment) => new Date(appointment.ends_at) >= new Date() && !['completed','cancelled','no_show'].includes(appointment.status));
  const upcomingIds = new Set(upcoming.map((appointment) => appointment.id));
  const history = state.appointments.filter((appointment) => !upcomingIds.has(appointment.id));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setNotice('');
    const startsAt = new Date(form.startsAt);
    if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
      setNotice('Choose a valid future appointment time.');
      setSaving(false);
      return;
    }
    const endsAt = new Date(startsAt.getTime() + Number(form.duration) * 60000);
    const { error } = await requireSupabase().from('appointments').insert({
      organization_id: auth.organization.id,
      member_id: auth.role === 'member' ? auth.user.id : form.memberId,
      host_id: form.hostId,
      appointment_type: form.appointmentType.trim(),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: 'requested',
      location_type: form.locationType,
      reminder_settings: { hours_before: Number(form.reminder), channel: 'in_app' },
      created_by: auth.user.id
    });
    if (error) setNotice(error.message);
    else {
      setNotice('Appointment request saved securely.');
      setShowForm(false);
      setForm((current) => ({ ...blankForm, memberId: current.memberId, hostId: current.hostId }));
      await load();
    }
    setSaving(false);
  };

  const saveAvailability = async (event) => {
    event.preventDefault();
    setSaving(true); setNotice('');
    const { error } = await requireSupabase().from('availability_rules').insert({
      organization_id: auth.organization.id,
      host_id: auth.user.id,
      weekday: Number(availabilityForm.weekday),
      starts_at: availabilityForm.startsAt,
      ends_at: availabilityForm.endsAt,
      timezone: availabilityForm.timezone,
      created_by: auth.user.id
    });
    if (error) setNotice(error.message);
    else { setNotice('Availability saved.'); setShowAvailability(false); await load(); }
    setSaving(false);
  };

  const removeAvailability = async (ruleId) => {
    setNotice('');
    const { error } = await requireSupabase().from('availability_rules').delete().eq('id', ruleId).eq('organization_id', auth.organization.id);
    if (error) setNotice(error.message);
    else { setNotice('Availability removed.'); await load(); }
  };

  const transition = async (appointment, status) => {
    setNotice('');
    const { error } = await requireSupabase().from('appointments').update({ status }).eq('id', appointment.id).eq('organization_id', auth.organization.id);
    if (error) setNotice(error.message);
    else { setNotice(`Appointment marked ${status.replaceAll('_',' ')}.`); await load(); }
  };

  return <section className="workspace-page appointments-page">
    <header className="workspace-heading"><div><span className="workspace-eyebrow">SECURE SCHEDULING</span><h1>Appointments</h1><p>Request, confirm and track advisor or practitioner sessions with organization-validated participants.</p></div><div className="appointment-heading-actions">{professionalRoles.includes(auth.role) && <button className="app-button secondary" onClick={() => setShowAvailability(true)}><Clock3 size={16}/> Set availability</button>}<button className="app-button primary" onClick={() => setShowForm(true)} disabled={!memberOptions.length || !hostOptions.length}><Plus size={16}/> Request appointment</button></div></header>
    <div className="calendar-boundary"><CalendarDays/><div><strong>{state.calendarConnected ? 'Organization calendar connected' : 'IWW calendar is active'}</strong><span>{state.calendarConnected ? 'An approved calendar connection is available. External event synchronization remains consent-controlled.' : 'Appointments are stored in IWW. External calendars stay disconnected until an administrator authorizes one in GEM Workspace OS.'}</span></div><ShieldCheck/></div>
    {notice && <div className={`form-alert ${notice.includes('saved') || notice.includes('marked') || notice.includes('removed') ? 'success' : 'error'}`}>{notice.includes('saved') || notice.includes('marked') || notice.includes('removed') ? <CheckCircle2/> : <AlertTriangle/>}{notice}</div>}
    {state.error && <div className="form-alert error"><AlertTriangle/>{state.error}<button onClick={load}><RefreshCcw/></button></div>}
    {state.loading ? <div className="app-state app-loading"><span className="spinner"/>Loading appointments…</div> : <><div className="appointment-section-head"><div><span>UPCOMING</span><h2>Scheduled work</h2></div><strong>{upcoming.length}</strong></div>{upcoming.length ? <div className="appointment-list">{upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} auth={auth} participantsById={participantsById} onTransition={transition}/>)}</div> : <div className="empty-state compact"><div><CalendarDays/></div><h2>No upcoming appointments</h2><p>Request a session when you are ready to coordinate the next review or coaching conversation.</p></div>}{history.length > 0 && <><div className="appointment-section-head history"><div><span>HISTORY</span><h2>Previous and closed</h2></div><strong>{history.length}</strong></div><div className="appointment-list history-list">{history.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} auth={auth} participantsById={participantsById} onTransition={transition}/>)}</div></>}</>}
    {showForm && <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Request appointment"><button className="drawer-scrim" aria-label="Close appointment form" onClick={() => setShowForm(false)}/><form className="modal-card appointment-form" onSubmit={submit}><header><div><span>NEW REQUEST</span><h2>Request an appointment</h2></div><button type="button" aria-label="Close" onClick={() => setShowForm(false)}><X/></button></header><label>Appointment type<input required minLength={2} value={form.appointmentType} onChange={(event) => setForm({ ...form, appointmentType: event.target.value })}/></label>{auth.role !== 'member' && <label>Member<select required value={form.memberId} onChange={(event) => setForm({ ...form, memberId: event.target.value })}>{memberOptions.map((person) => <option key={person.user_id} value={person.user_id}>{person.display_name} · {person.role.replaceAll('_',' ')}</option>)}</select></label>}<label>Host<select required value={form.hostId} onChange={(event) => setForm({ ...form, hostId: event.target.value })}>{hostOptions.map((person) => <option key={person.user_id} value={person.user_id}>{person.display_name} · {person.role.replaceAll('_',' ')}</option>)}</select></label>{selectedAvailability.length > 0 && <div className="availability-preview"><Clock3/><div><strong>Available times</strong><span>{selectedAvailability.map((rule) => `${weekdays[rule.weekday]} ${rule.starts_at.slice(0,5)}–${rule.ends_at.slice(0,5)}`).join(' · ')}</span></div></div>}<div className="modal-form-grid"><label>Starts<input required type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })}/></label><label>Duration<select value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></label><label>Location<select value={form.locationType} onChange={(event) => setForm({ ...form, locationType: event.target.value })}><option value="video">Video</option><option value="phone">Phone</option><option value="in_person">In person</option></select></label><label>Reminder<select value={form.reminder} onChange={(event) => setForm({ ...form, reminder: event.target.value })}><option value="1">1 hour before</option><option value="24">24 hours before</option><option value="48">48 hours before</option></select></label></div><p className="form-security-note"><ShieldCheck/> Availability, schedule conflicts, participant membership and status transitions are validated by the database.</p><div className="entity-form-actions"><button type="button" className="app-button secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="app-button primary" disabled={saving}>{saving ? 'Saving…' : 'Save request'}</button></div></form></div>}
    {showAvailability && <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Manage availability"><button className="drawer-scrim" aria-label="Close availability form" onClick={() => setShowAvailability(false)}/><form className="modal-card appointment-form" onSubmit={saveAvailability}><header><div><span>SCHEDULING RULES</span><h2>My availability</h2></div><button type="button" aria-label="Close" onClick={() => setShowAvailability(false)}><X/></button></header><p>Bookings must fit inside these windows. Times are evaluated in the selected timezone.</p><div className="availability-rule-list">{ownAvailability.map((rule) => <div key={rule.id}><span>{weekdays[rule.weekday]}</span><strong>{rule.starts_at.slice(0,5)}–{rule.ends_at.slice(0,5)}</strong><small>{rule.timezone}</small><button type="button" aria-label={`Remove ${weekdays[rule.weekday]} availability`} onClick={() => removeAvailability(rule.id)}><Trash2/></button></div>)}{!ownAvailability.length && <span className="drawer-empty">No availability rules yet. Until one is added, conflict protection still applies but bookings are not limited to a weekly window.</span>}</div><div className="modal-form-grid"><label>Day<select value={availabilityForm.weekday} onChange={(event) => setAvailabilityForm({ ...availabilityForm, weekday: event.target.value })}>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><label>Timezone<input required value={availabilityForm.timezone} onChange={(event) => setAvailabilityForm({ ...availabilityForm, timezone: event.target.value })}/></label><label>Starts<input required type="time" value={availabilityForm.startsAt} onChange={(event) => setAvailabilityForm({ ...availabilityForm, startsAt: event.target.value })}/></label><label>Ends<input required type="time" value={availabilityForm.endsAt} onChange={(event) => setAvailabilityForm({ ...availabilityForm, endsAt: event.target.value })}/></label></div><div className="entity-form-actions"><button type="button" className="app-button secondary" onClick={() => setShowAvailability(false)}>Close</button><button className="app-button primary" disabled={saving}>{saving ? 'Saving…' : 'Add availability'}</button></div></form></div>}
  </section>;
}

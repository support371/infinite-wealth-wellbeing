import { requireSupabase } from '../lib/supabase.js';

function normalizePayload(payload) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => {
    if (value === '') return [key, null];
    if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value) && /(amount|value|balance|count|target|rate|progress)/i.test(key)) {
      return [key, Number(value)];
    }
    return [key, value];
  }));
}

export async function listPersonalRecords(table, { organizationId, userId, orderBy = 'created_at' }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from(table)
    .select('*')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .order(orderBy, { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listOrganizationRecords(table, organizationId, { orderBy = 'created_at', limit = 100 } = {}) {
  const client = requireSupabase();
  const { data, error } = await client
    .from(table)
    .select('*')
    .eq('organization_id', organizationId)
    .order(orderBy, { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createPersonalRecord(table, payload, { organizationId, userId }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from(table)
    .insert({ ...normalizePayload(payload), organization_id: organizationId, user_id: userId, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createOrganizationRecord(table, payload, { organizationId, userId }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from(table)
    .insert({ ...normalizePayload(payload), organization_id: organizationId, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecord(table, id, patch, organizationId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from(table)
    .update(normalizePayload(patch))
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeRecord(table, id, organizationId) {
  const client = requireSupabase();
  const { error } = await client.from(table).delete().eq('id', id).eq('organization_id', organizationId);
  if (error) throw error;
}

async function count(table, organizationId, extra = null) {
  let query = requireSupabase().from(table).select('id', { count: 'exact', head: true }).eq('organization_id', organizationId);
  if (extra) query = extra(query);
  const { count: result, error } = await query;
  if (error) throw error;
  return result || 0;
}

export async function getDashboardSnapshot({ organizationId, userId }) {
  const client = requireSupabase();
  const [goals, habits, appointments, tasks, notifications, recentAppointments] = await Promise.all([
    count('goals', organizationId, (q)=>q.eq('user_id', userId).neq('status', 'completed')),
    count('habits', organizationId, (q)=>q.eq('user_id', userId).eq('active', true)),
    count('appointments', organizationId, (q)=>q.eq('user_id', userId).gte('starts_at', new Date().toISOString()).neq('status', 'cancelled')),
    count('tasks', organizationId, (q)=>q.neq('status', 'completed')),
    client.from('notifications').select('*').eq('organization_id', organizationId).eq('user_id', userId).order('created_at', { ascending:false }).limit(6),
    client.from('appointments').select('*').eq('organization_id', organizationId).eq('user_id', userId).gte('starts_at', new Date().toISOString()).neq('status','cancelled').order('starts_at').limit(4),
  ]);
  if (notifications.error) throw notifications.error;
  if (recentAppointments.error) throw recentAppointments.error;
  return {
    counts: { goals, habits, appointments, tasks },
    notifications: notifications.data || [],
    appointments: recentAppointments.data || [],
  };
}

export async function getWealthWorkspace({ organizationId, userId }) {
  const [plans, goals, assets, liabilities, cashflowTargets, reviews, adviserTasks] = await Promise.all([
    listPersonalRecords('wealth_plans', { organizationId, userId }),
    listPersonalRecords('wealth_goals', { organizationId, userId }),
    listPersonalRecords('assets', { organizationId, userId }),
    listPersonalRecords('liabilities', { organizationId, userId }),
    listPersonalRecords('cashflow_targets', { organizationId, userId }),
    listPersonalRecords('wealth_reviews', { organizationId, userId }),
    listPersonalRecords('adviser_tasks', { organizationId, userId }),
  ]);
  return { plans, goals, assets, liabilities, cashflowTargets, reviews, adviserTasks };
}

export async function getWellbeingWorkspace({ organizationId, userId }) {
  const [plans, checkins, goals, habits, enrolments, sessions, assessments] = await Promise.all([
    listPersonalRecords('wellbeing_plans', { organizationId, userId }),
    listPersonalRecords('wellbeing_checkins', { organizationId, userId }),
    listPersonalRecords('goals', { organizationId, userId }),
    listPersonalRecords('habits', { organizationId, userId }),
    listPersonalRecords('programme_enrolments', { organizationId, userId }),
    listPersonalRecords('coaching_sessions', { organizationId, userId }),
    listPersonalRecords('assessments', { organizationId, userId }),
  ]);
  return { plans, checkins, goals, habits, enrolments, sessions, assessments };
}

export async function getTeam(organizationId) {
  const { data, error } = await requireSupabase()
    .from('memberships')
    .select('id,user_id,role,status,created_at,profiles:user_id(full_name,avatar_url,timezone)')
    .eq('organization_id', organizationId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function issueInvitation({ organizationId, email, role, userId }) {
  const { data, error } = await requireSupabase().rpc('issue_iww_invitation', {
    p_organization_id: organizationId,
    p_email: email.trim().toLowerCase(),
    p_role: role,
  });
  if (error) throw error;
  return data;
}

export async function getInbox(organizationId) {
  const { data, error } = await requireSupabase().rpc('iww_inbox', { p_organization_id: organizationId });
  if (error) throw error;
  return data || [];
}

export async function getConversationMessages({ organizationId, conversationId }) {
  const { data, error } = await requireSupabase()
    .from('messages')
    .select('id,conversation_id,sender_user_id,body,created_at,edited_at')
    .eq('organization_id', organizationId)
    .eq('conversation_id', conversationId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function sendMessage({ organizationId, conversationId, userId, body }) {
  const { data, error } = await requireSupabase().from('messages').insert({
    organization_id: organizationId,
    conversation_id: conversationId,
    sender_user_id: userId,
    body: body.trim(),
  }).select().single();
  if (error) throw error;
  return data;
}

export async function createConversation({ organizationId, title, participantUserIds }) {
  const { data, error } = await requireSupabase().rpc('create_iww_conversation', {
    p_organization_id: organizationId,
    p_title: title,
    p_participant_user_ids: participantUserIds,
  });
  if (error) throw error;
  return data;
}

export async function getDelegatedMembers(organizationId) {
  const { data, error } = await requireSupabase().rpc('iww_delegated_members', { p_organization_id: organizationId });
  if (error) throw error;
  return data || [];
}

export async function getGovernance(organizationId) {
  const client = requireSupabase();
  const [consents, policies, approvals, audit, integrations] = await Promise.all([
    listOrganizationRecords('consents', organizationId, { limit:50 }),
    listOrganizationRecords('policy_acknowledgements', organizationId, { limit:50 }),
    listOrganizationRecords('workflow_approvals', organizationId, { limit:50 }),
    client.from('audit_events').select('*').eq('organization_id', organizationId).order('created_at', {ascending:false}).limit(100),
    listOrganizationRecords('integration_connections', organizationId, { limit:50 }),
  ]);
  if (audit.error) throw audit.error;
  return { consents, policies, approvals, audit: audit.data || [], integrations };
}

export async function getBilling(organizationId) {
  const client = requireSupabase();
  const [subscriptions, billing] = await Promise.all([
    client.from('subscriptions').select('*').eq('organization_id', organizationId).order('created_at', {ascending:false}),
    client.from('billing_records').select('*').eq('organization_id', organizationId).order('created_at', {ascending:false}).limit(50),
  ]);
  if (subscriptions.error) throw subscriptions.error;
  if (billing.error) throw billing.error;
  return { subscriptions: subscriptions.data || [], billing: billing.data || [] };
}

export async function getResources(organizationId) {
  const { data, error } = await requireSupabase().from('resources').select('*').eq('organization_id', organizationId).eq('published', true).order('created_at', {ascending:false});
  if (error) throw error;
  return data || [];
}

export async function getProgrammes(organizationId) {
  const { data, error } = await requireSupabase().from('programmes').select('*').eq('organization_id', organizationId).neq('status','archived').order('created_at', {ascending:false});
  if (error) throw error;
  return data || [];
}

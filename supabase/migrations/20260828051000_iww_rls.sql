-- IWW tenant isolation and role authorization.
-- Every browser-accessible application table is RLS protected.

create or replace function public.iww_can_access_wealth_member(p_organization_id uuid, p_subject_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid()=p_subject_user_id
    or exists(select 1 from public.memberships m where m.organization_id=p_organization_id and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin','operations_manager'))
    or exists(select 1 from public.member_assignments a where a.organization_id=p_organization_id and a.staff_user_id=auth.uid() and a.member_user_id=p_subject_user_id and a.active and a.assignment_type in ('advisor','operations'));
$$;

create or replace function public.iww_can_access_wellbeing_member(p_organization_id uuid, p_subject_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid()=p_subject_user_id
    or exists(select 1 from public.memberships m where m.organization_id=p_organization_id and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin','operations_manager'))
    or exists(select 1 from public.member_assignments a where a.organization_id=p_organization_id and a.staff_user_id=auth.uid() and a.member_user_id=p_subject_user_id and a.active and a.assignment_type in ('practitioner','operations'));
$$;

create or replace function public.iww_family_scope(p_organization_id uuid, p_subject_user_id uuid, p_scope text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.family_delegations d
    where d.organization_id=p_organization_id and d.member_user_id=p_subject_user_id and d.delegate_user_id=auth.uid()
      and d.active and (d.expires_at is null or d.expires_at>now())
      and case p_scope when 'goals' then d.allow_goals when 'appointments' then d.allow_appointments when 'documents' then d.allow_documents when 'messages' then d.allow_messages else false end
  );
$$;

-- Enable RLS everywhere that the IWW application exposes through PostgREST.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','organizations','memberships','invitations','user_preferences','activity_events','audit_events','consents','policy_acknowledgements','notifications',
    'integration_connections','workflow_approvals','reports','report_runs','member_assignments','family_delegations',
    'wellbeing_plans','wellbeing_checkins','goals','habits','habit_logs','programmes','programme_enrolments','coaching_sessions','appointments','assessments',
    'wealth_plans','wealth_goals','assets','liabilities','cashflow_targets','financial_documents','adviser_tasks','wealth_reviews',
    'documents','document_access','conversations','conversation_participants','messages','tasks','task_assignments','resources','community_posts','comments',
    'subscriptions','billing_records','data_requests'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('alter table public.%I force row level security',t);
  end loop;
end $$;

-- Profiles ------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (
  user_id=auth.uid() or exists(
    select 1 from public.memberships target
    where target.user_id=profiles.user_id and target.status='active'
      and (
        public.iww_has_role(target.organization_id,array['owner','admin','operations_manager'])
        or exists(select 1 from public.member_assignments a where a.organization_id=target.organization_id and a.staff_user_id=auth.uid() and a.member_user_id=profiles.user_id and a.active)
        or exists(select 1 from public.family_delegations d where d.organization_id=target.organization_id and d.delegate_user_id=auth.uid() and d.member_user_id=profiles.user_id and d.active and (d.expires_at is null or d.expires_at>now()))
      )
  )
);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Organizations and membership ---------------------------------------------
drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations for select to authenticated using(public.iww_is_member(id));
drop policy if exists organizations_update_admin on public.organizations;
create policy organizations_update_admin on public.organizations for update to authenticated using(public.iww_has_role(id,array['owner','admin'])) with check(public.iww_has_role(id,array['owner','admin']));

drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships for select to authenticated using(user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin']));
drop policy if exists memberships_manage_admin on public.memberships;
create policy memberships_manage_admin on public.memberships for all to authenticated using(public.iww_has_role(organization_id,array['owner','admin'])) with check(public.iww_has_role(organization_id,array['owner','admin']));

drop policy if exists invitations_admin on public.invitations;
create policy invitations_admin on public.invitations for select to authenticated using(public.iww_has_role(organization_id,array['owner','admin']));
-- Invitation writes happen only through SECURITY DEFINER RPCs or trusted server code.

-- Personal preferences/notifications ---------------------------------------
drop policy if exists user_preferences_self on public.user_preferences;
create policy user_preferences_self on public.user_preferences for all to authenticated using(user_id=auth.uid() and public.iww_is_member(organization_id)) with check(user_id=auth.uid() and public.iww_is_member(organization_id));
drop policy if exists notifications_self on public.notifications;
create policy notifications_self on public.notifications for select to authenticated using(user_id=auth.uid() and public.iww_is_member(organization_id));
drop policy if exists notifications_update_self on public.notifications;
create policy notifications_update_self on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Governance evidence -------------------------------------------------------
drop policy if exists activity_select on public.activity_events;
create policy activity_select on public.activity_events for select to authenticated using(user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin','operations_manager']));
drop policy if exists audit_admin_read on public.audit_events;
create policy audit_admin_read on public.audit_events for select to authenticated using(public.iww_has_role(organization_id,array['owner','admin']));
-- No authenticated insert/update/delete policy on audit_events: historical audit is append-only through trusted functions/server code.

drop policy if exists consents_select on public.consents;
create policy consents_select on public.consents for select to authenticated using(user_id=auth.uid() or public.iww_can_manage_member(organization_id,user_id));
drop policy if exists consents_self_insert on public.consents;
create policy consents_self_insert on public.consents for insert to authenticated with check(user_id=auth.uid() and created_by=auth.uid() and public.iww_is_member(organization_id));
drop policy if exists consents_self_update on public.consents;
create policy consents_self_update on public.consents for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

drop policy if exists policy_ack_select on public.policy_acknowledgements;
create policy policy_ack_select on public.policy_acknowledgements for select to authenticated using(user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin']));
drop policy if exists policy_ack_insert_self on public.policy_acknowledgements;
create policy policy_ack_insert_self on public.policy_acknowledgements for insert to authenticated with check(user_id=auth.uid() and public.iww_is_member(organization_id));

drop policy if exists integration_admin on public.integration_connections;
create policy integration_admin on public.integration_connections for select to authenticated using(public.iww_has_role(organization_id,array['owner','admin']));
-- Browser writes to integration_connections are intentionally absent; verified server operations use the service role.

drop policy if exists approvals_staff_select on public.workflow_approvals;
create policy approvals_staff_select on public.workflow_approvals for select to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager','advisor','practitioner']) or requested_by=auth.uid());
drop policy if exists approvals_staff_insert on public.workflow_approvals;
create policy approvals_staff_insert on public.workflow_approvals for insert to authenticated with check(requested_by=auth.uid() and public.iww_has_role(organization_id,array['owner','admin','operations_manager','advisor','practitioner']));
drop policy if exists approvals_admin_update on public.workflow_approvals;
create policy approvals_admin_update on public.workflow_approvals for update to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager'])) with check(public.iww_has_role(organization_id,array['owner','admin','operations_manager']));

drop policy if exists reports_staff on public.reports;
create policy reports_staff on public.reports for select to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager','advisor','practitioner']));
drop policy if exists reports_manage on public.reports;
create policy reports_manage on public.reports for all to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager'])) with check(public.iww_has_role(organization_id,array['owner','admin','operations_manager']));
drop policy if exists report_runs_staff on public.report_runs;
create policy report_runs_staff on public.report_runs for select to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager','advisor','practitioner']));
drop policy if exists report_runs_create on public.report_runs;
create policy report_runs_create on public.report_runs for insert to authenticated with check(requested_by=auth.uid() and public.iww_has_role(organization_id,array['owner','admin','operations_manager','advisor','practitioner']));

-- Assignment/delegation -----------------------------------------------------
drop policy if exists assignments_select on public.member_assignments;
create policy assignments_select on public.member_assignments for select to authenticated using(staff_user_id=auth.uid() or member_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin']));
drop policy if exists assignments_admin on public.member_assignments;
create policy assignments_admin on public.member_assignments for all to authenticated using(public.iww_has_role(organization_id,array['owner','admin'])) with check(public.iww_has_role(organization_id,array['owner','admin']));

drop policy if exists delegations_select on public.family_delegations;
create policy delegations_select on public.family_delegations for select to authenticated using(member_user_id=auth.uid() or delegate_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin']));
drop policy if exists delegations_owner_manage on public.family_delegations;
create policy delegations_owner_manage on public.family_delegations for all to authenticated using(member_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin'])) with check(member_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin']));

-- Wellbeing sensitive records ----------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['wellbeing_plans','wellbeing_checkins','habits','habit_logs','programme_enrolments','coaching_sessions','assessments'] loop
    execute format('drop policy if exists %I on public.%I','iww_wellbeing_select',t);
    execute format('create policy iww_wellbeing_select on public.%I for select to authenticated using(public.iww_can_access_wellbeing_member(organization_id,user_id))',t);
    execute format('drop policy if exists %I on public.%I','iww_wellbeing_insert',t);
    execute format('create policy iww_wellbeing_insert on public.%I for insert to authenticated with check(public.iww_can_access_wellbeing_member(organization_id,user_id) and (created_by=auth.uid() or public.iww_has_role(organization_id,array[''owner'',''admin'',''operations_manager''])))',t);
    execute format('drop policy if exists %I on public.%I','iww_wellbeing_update',t);
    execute format('create policy iww_wellbeing_update on public.%I for update to authenticated using(public.iww_can_access_wellbeing_member(organization_id,user_id)) with check(public.iww_can_access_wellbeing_member(organization_id,user_id))',t);
  end loop;
end $$;

-- Goals may be explicitly delegated, but delegates are read-only.
drop policy if exists goals_select on public.goals;
create policy goals_select on public.goals for select to authenticated using(public.iww_can_access_wellbeing_member(organization_id,user_id) or public.iww_family_scope(organization_id,user_id,'goals'));
drop policy if exists goals_insert on public.goals;
create policy goals_insert on public.goals for insert to authenticated with check(public.iww_can_access_wellbeing_member(organization_id,user_id) and created_by=auth.uid());
drop policy if exists goals_update on public.goals;
create policy goals_update on public.goals for update to authenticated using(public.iww_can_access_wellbeing_member(organization_id,user_id)) with check(public.iww_can_access_wellbeing_member(organization_id,user_id));

-- Appointments may be explicitly delegated; delegates cannot create/change them.
drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments for select to authenticated using(public.iww_can_access_wellbeing_member(organization_id,user_id) or public.iww_family_scope(organization_id,user_id,'appointments'));
drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments for insert to authenticated with check(public.iww_can_access_wellbeing_member(organization_id,user_id) and created_by=auth.uid());
drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments for update to authenticated using(public.iww_can_access_wellbeing_member(organization_id,user_id)) with check(public.iww_can_access_wellbeing_member(organization_id,user_id));

-- Programmes are organization content, enrolment remains member-scoped.
drop policy if exists programmes_member_read on public.programmes;
create policy programmes_member_read on public.programmes for select to authenticated using(public.iww_is_member(organization_id) and status in ('published','active','completed'));
drop policy if exists programmes_manage on public.programmes;
create policy programmes_manage on public.programmes for all to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager'])) with check(public.iww_has_role(organization_id,array['owner','admin','operations_manager']));

-- Wealth records: never exposed merely because a user is a family delegate.
do $$
declare t text;
begin
  foreach t in array array['wealth_plans','wealth_goals','assets','liabilities','cashflow_targets','financial_documents','adviser_tasks','wealth_reviews'] loop
    execute format('drop policy if exists %I on public.%I','iww_wealth_select',t);
    execute format('create policy iww_wealth_select on public.%I for select to authenticated using(public.iww_can_access_wealth_member(organization_id,user_id))',t);
    execute format('drop policy if exists %I on public.%I','iww_wealth_insert',t);
    execute format('create policy iww_wealth_insert on public.%I for insert to authenticated with check(public.iww_can_access_wealth_member(organization_id,user_id) and (created_by=auth.uid() or public.iww_has_role(organization_id,array[''owner'',''admin'',''operations_manager''])))',t);
    execute format('drop policy if exists %I on public.%I','iww_wealth_update',t);
    execute format('create policy iww_wealth_update on public.%I for update to authenticated using(public.iww_can_access_wealth_member(organization_id,user_id)) with check(public.iww_can_access_wealth_member(organization_id,user_id))',t);
  end loop;
end $$;

-- Document records require ownership, explicit permission, or organization administration.
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated using(
  user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin'])
  or exists(select 1 from public.document_access da where da.document_id=documents.id and da.user_id=auth.uid())
  or public.iww_family_scope(organization_id,user_id,'documents')
);
drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents for insert to authenticated with check(user_id=auth.uid() and created_by=auth.uid() and public.iww_is_member(organization_id));
drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents for update to authenticated using(user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin']) or exists(select 1 from public.document_access da where da.document_id=documents.id and da.user_id=auth.uid() and da.permission='manage')) with check(public.iww_is_member(organization_id));
drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete to authenticated using(user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin']));

drop policy if exists document_access_select on public.document_access;
create policy document_access_select on public.document_access for select to authenticated using(user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin']) or exists(select 1 from public.documents d where d.id=document_id and d.user_id=auth.uid()));
drop policy if exists document_access_manage on public.document_access;
create policy document_access_manage on public.document_access for all to authenticated using(public.iww_has_role(organization_id,array['owner','admin']) or exists(select 1 from public.documents d where d.id=document_id and d.user_id=auth.uid())) with check(public.iww_has_role(organization_id,array['owner','admin']) or exists(select 1 from public.documents d where d.id=document_id and d.user_id=auth.uid()));

-- Conversations/messages: participant membership is the only visibility grant.
drop policy if exists conversations_participant on public.conversations;
create policy conversations_participant on public.conversations for select to authenticated using(public.iww_is_conversation_participant(id));
drop policy if exists participants_self_conversation on public.conversation_participants;
create policy participants_self_conversation on public.conversation_participants for select to authenticated using(public.iww_is_conversation_participant(conversation_id));
drop policy if exists messages_participant_select on public.messages;
create policy messages_participant_select on public.messages for select to authenticated using(public.iww_is_conversation_participant(conversation_id));
drop policy if exists messages_participant_insert on public.messages;
create policy messages_participant_insert on public.messages for insert to authenticated with check(sender_user_id=auth.uid() and public.iww_is_conversation_participant(conversation_id));
drop policy if exists messages_sender_update on public.messages;
create policy messages_sender_update on public.messages for update to authenticated using(sender_user_id=auth.uid() and public.iww_is_conversation_participant(conversation_id)) with check(sender_user_id=auth.uid());

-- Tasks ---------------------------------------------------------------------
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using(
  public.iww_has_role(organization_id,array['owner','admin','operations_manager']) or created_by=auth.uid()
  or exists(select 1 from public.task_assignments ta where ta.task_id=tasks.id and ta.user_id=auth.uid())
);
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated with check(public.iww_has_role(organization_id,array['owner','admin','operations_manager','advisor','practitioner']) and created_by=auth.uid());
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager']) or created_by=auth.uid() or exists(select 1 from public.task_assignments ta where ta.task_id=tasks.id and ta.user_id=auth.uid())) with check(public.iww_is_member(organization_id));
drop policy if exists task_assignments_select on public.task_assignments;
create policy task_assignments_select on public.task_assignments for select to authenticated using(user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin','operations_manager']) or assigned_by=auth.uid());
drop policy if exists task_assignments_manage on public.task_assignments;
create policy task_assignments_manage on public.task_assignments for all to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager']) or assigned_by=auth.uid()) with check(public.iww_has_role(organization_id,array['owner','admin','operations_manager']) or assigned_by=auth.uid());

-- Resource/community --------------------------------------------------------
drop policy if exists resources_member on public.resources;
create policy resources_member on public.resources for select to authenticated using(public.iww_is_member(organization_id) and published and (audience_roles is null or exists(select 1 from public.memberships m where m.organization_id=resources.organization_id and m.user_id=auth.uid() and m.status='active' and m.role=any(resources.audience_roles))));
drop policy if exists resources_manage on public.resources;
create policy resources_manage on public.resources for all to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager'])) with check(public.iww_has_role(organization_id,array['owner','admin','operations_manager']));

drop policy if exists community_posts_read on public.community_posts;
create policy community_posts_read on public.community_posts for select to authenticated using(public.iww_is_member(organization_id) and (status='published' or author_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin'])));
drop policy if exists community_posts_create on public.community_posts;
create policy community_posts_create on public.community_posts for insert to authenticated with check(author_user_id=auth.uid() and public.iww_is_member(organization_id));
drop policy if exists community_posts_update on public.community_posts;
create policy community_posts_update on public.community_posts for update to authenticated using(author_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin'])) with check(public.iww_is_member(organization_id));
drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select to authenticated using(public.iww_is_member(organization_id) and (status='published' or author_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin'])));
drop policy if exists comments_create on public.comments;
create policy comments_create on public.comments for insert to authenticated with check(author_user_id=auth.uid() and public.iww_is_member(organization_id));
drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update to authenticated using(author_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin'])) with check(public.iww_is_member(organization_id));

-- Billing references are read-only in the browser. Provider writes are server-side.
drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions for select to authenticated using(public.iww_has_role(organization_id,array['owner','admin']) or user_id=auth.uid());
drop policy if exists billing_records_read on public.billing_records;
create policy billing_records_read on public.billing_records for select to authenticated using(public.iww_has_role(organization_id,array['owner','admin']) or user_id=auth.uid());

-- Data/privacy requests ------------------------------------------------------
drop policy if exists data_requests_read on public.data_requests;
create policy data_requests_read on public.data_requests for select to authenticated using(user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin']));
drop policy if exists data_requests_create on public.data_requests;
create policy data_requests_create on public.data_requests for insert to authenticated with check(user_id=auth.uid() and public.iww_is_member(organization_id));
drop policy if exists data_requests_admin_update on public.data_requests;
create policy data_requests_admin_update on public.data_requests for update to authenticated using(public.iww_has_role(organization_id,array['owner','admin'])) with check(public.iww_has_role(organization_id,array['owner','admin']));

-- Default privileges: authenticated can reach tables only through RLS; anon gets no application-table privileges.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','organizations','memberships','invitations','user_preferences','activity_events','audit_events','consents','policy_acknowledgements','notifications',
    'integration_connections','workflow_approvals','reports','report_runs','member_assignments','family_delegations','wellbeing_plans','wellbeing_checkins','goals','habits','habit_logs','programmes','programme_enrolments','coaching_sessions','appointments','assessments','wealth_plans','wealth_goals','assets','liabilities','cashflow_targets','financial_documents','adviser_tasks','wealth_reviews','documents','document_access','conversations','conversation_participants','messages','tasks','task_assignments','resources','community_posts','comments','subscriptions','billing_records','data_requests'
  ] loop
    execute format('revoke all on public.%I from anon',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  end loop;
end $$;

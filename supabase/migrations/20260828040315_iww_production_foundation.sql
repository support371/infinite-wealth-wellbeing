-- Infinite World of Well-Being (IWW) standalone SaaS foundation.
-- Project target: fepfnzrpftxpxlgyujev. This schema has no GEM dependencies.

create extension if not exists pgcrypto;
create schema if not exists extensions;
create extension if not exists citext with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.app_role as enum (
  'owner', 'admin', 'operations_manager', 'advisor',
  'practitioner', 'member', 'family_delegate'
);
create type public.record_status as enum ('draft', 'active', 'completed', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  display_name text,
  avatar_url text,
  phone text,
  timezone text not null default 'America/New_York',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'active' check (status in ('active','suspended','closed')),
  brand_settings jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'member',
  status text not null default 'active' check (status in ('invited','active','suspended','revoked')),
  joined_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index memberships_user_org_idx on public.memberships(user_id, organization_id) where status = 'active';
create index memberships_org_role_idx on public.memberships(organization_id, role) where status = 'active';

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email extensions.citext not null,
  role public.app_role not null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invitations_org_email_idx on public.invitations(organization_id, email);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light','dark','system')),
  locale text not null default 'en-US',
  communication jsonb not null default '{"email":true,"push":true,"sms":false}'::jsonb,
  privacy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.care_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  assigned_user_id uuid not null references auth.users(id) on delete cascade,
  assignment_type text not null check (assignment_type in ('advisor','practitioner')),
  status text not null default 'active' check (status in ('active','ended')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, member_id, assigned_user_id, assignment_type)
);

create table public.family_delegations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  delegate_user_id uuid not null references auth.users(id) on delete cascade,
  scopes text[] not null default '{}',
  status text not null default 'active' check (status in ('active','revoked','expired')),
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (member_id <> delegate_user_id)
);

-- Server-authoritative authorization helpers live outside exposed schemas.
create or replace function private.current_org_role(target_org uuid)
returns public.app_role
language sql stable security definer
set search_path = ''
as $$
  select m.role from public.memberships m
  where m.organization_id = target_org
    and m.user_id = (select auth.uid())
    and m.status = 'active'
  limit 1
$$;

create or replace function private.is_org_member(target_org uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.memberships m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
$$;

create or replace function private.has_org_role(target_org uuid, allowed public.app_role[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(private.current_org_role(target_org) = any(allowed), false)
$$;

create or replace function private.can_access_member(target_org uuid, target_member uuid, requested_scope text default null)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    (select auth.uid()) = target_member
    or private.has_org_role(target_org, array['owner','admin','operations_manager']::public.app_role[])
    or exists (
      select 1 from public.care_assignments a
      where a.organization_id = target_org and a.member_id = target_member
        and a.assigned_user_id = (select auth.uid()) and a.status = 'active'
    )
    or exists (
      select 1 from public.family_delegations d
      where d.organization_id = target_org and d.member_id = target_member
        and d.delegate_user_id = (select auth.uid()) and d.status = 'active'
        and (d.expires_at is null or d.expires_at > now())
        and (requested_scope is null or requested_scope = any(d.scopes))
    )
  )
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- Core governance and commercial records.
create table public.activity_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id), event_type text not null, entity_type text, entity_id uuid,
  summary text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id), action text not null, target_type text not null, target_id uuid,
  reason text, request_id text, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.consents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id), consent_type text not null, version text not null,
  granted boolean not null, captured_by uuid references auth.users(id), evidence jsonb not null default '{}',
  captured_at timestamptz not null default now(), revoked_at timestamptz
);
create table public.policy_acknowledgements (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id), policy_key text not null, policy_version text not null,
  acknowledged_at timestamptz not null default now(), evidence jsonb not null default '{}',
  unique(organization_id, user_id, policy_key, policy_version)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id), title text not null, body text not null, category text not null default 'general',
  link text, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.integration_connections (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check(provider in ('stripe','google_calendar','microsoft_calendar','hubspot','email','ai')),
  status text not null default 'disconnected' check(status in ('disconnected','pending','connected','error','revoked')),
  connected_by uuid references auth.users(id), external_account_reference text, scopes text[] not null default '{}',
  configuration jsonb not null default '{}', connected_at timestamptz, revoked_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id, provider)
);
create table public.workflow_approvals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_type text not null, entity_type text not null, entity_id uuid not null, requested_by uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id), status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  decision_reason text, decided_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, report_type text not null, definition jsonb not null default '{}', status public.record_status not null default 'active',
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.report_runs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade, status text not null default 'queued' check(status in ('queued','running','completed','failed')),
  result_reference text, error_message text, requested_by uuid not null references auth.users(id), started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Member-scoped wellbeing records.
create table public.wellbeing_plans (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), title text not null, overview text, focus_areas text[] not null default '{}',
  status public.record_status not null default 'draft', starts_on date, review_on date, created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.wellbeing_checkins (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), wellbeing_plan_id uuid references public.wellbeing_plans(id) on delete set null,
  mood_score smallint check(mood_score between 1 and 10), energy_score smallint check(energy_score between 1 and 10), reflection text,
  private_to_member boolean not null default false, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.goals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), domain text not null check(domain in ('wellbeing','life','community')),
  title text not null, description text, target_value numeric, current_value numeric not null default 0, unit text,
  target_date date, status public.record_status not null default 'active', created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.habits (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), title text not null, cadence text not null default 'daily', target_count integer not null default 1 check(target_count > 0),
  status public.record_status not null default 'active', created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), habit_id uuid not null references public.habits(id) on delete cascade,
  occurred_on date not null default current_date, value numeric not null default 1, note text, created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), unique(habit_id, occurred_on, created_by)
);
create table public.programmes (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, description text, programme_type text not null default 'wellbeing', status public.record_status not null default 'draft',
  starts_on date, ends_on date, capacity integer check(capacity is null or capacity > 0), milestones jsonb not null default '[]',
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.programme_enrolments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete cascade, member_id uuid not null references auth.users(id),
  status text not null default 'enrolled' check(status in ('waitlisted','enrolled','active','completed','withdrawn')),
  progress_percent numeric not null default 0 check(progress_percent between 0 and 100), enrolled_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id), updated_at timestamptz not null default now(), unique(programme_id, member_id)
);
create table public.coaching_sessions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), practitioner_id uuid not null references auth.users(id), wellbeing_plan_id uuid references public.wellbeing_plans(id),
  scheduled_at timestamptz not null, duration_minutes integer not null default 60 check(duration_minutes between 15 and 240),
  status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled','no_show')),
  member_summary text, private_practitioner_notes text, created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), host_id uuid not null references auth.users(id), appointment_type text not null,
  starts_at timestamptz not null, ends_at timestamptz not null, timezone text not null default 'America/New_York',
  status text not null default 'requested' check(status in ('requested','confirmed','completed','cancelled','no_show')),
  location_type text not null default 'video', location_reference text, reminder_settings jsonb not null default '{}',
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(ends_at > starts_at)
);
create table public.assessments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), assessment_type text not null, responses jsonb not null default '{}', score_summary jsonb not null default '{}',
  status public.record_status not null default 'completed', created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Member-scoped wealth planning records. These are planning/education records only.
create table public.wealth_plans (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), title text not null, summary text, planning_horizon text,
  status public.record_status not null default 'draft', review_on date, created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.wealth_goals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), wealth_plan_id uuid references public.wealth_plans(id) on delete cascade,
  title text not null, target_amount numeric(18,2), current_amount numeric(18,2) not null default 0, currency text not null default 'USD',
  target_date date, status public.record_status not null default 'active', created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.assets (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), name text not null, asset_type text not null, estimated_value numeric(18,2) not null default 0,
  currency text not null default 'USD', valuation_date date not null default current_date, notes text, created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.liabilities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), name text not null, liability_type text not null, outstanding_balance numeric(18,2) not null default 0,
  interest_rate numeric(7,4), minimum_payment numeric(18,2), currency text not null default 'USD', notes text,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.cashflow_targets (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), name text not null, category text not null, period text not null default 'monthly',
  target_amount numeric(18,2) not null, actual_amount numeric(18,2), currency text not null default 'USD', starts_on date, ends_on date,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.financial_documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), title text not null, document_type text not null, storage_path text not null,
  sensitivity text not null default 'private' check(sensitivity in ('private','advisor','organization')),
  uploaded_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.adviser_tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), adviser_id uuid references auth.users(id), title text not null, description text,
  status text not null default 'open' check(status in ('open','in_progress','blocked','completed','cancelled')), due_at timestamptz,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.wealth_reviews (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references auth.users(id), wealth_plan_id uuid references public.wealth_plans(id) on delete set null,
  adviser_id uuid references auth.users(id), review_date date not null, summary text, next_steps text, next_review_on date,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Collaboration and operations.
create table public.documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references auth.users(id), title text not null, category text not null, storage_path text not null,
  mime_type text, size_bytes bigint check(size_bytes is null or size_bytes >= 0), sensitivity text not null default 'private',
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.document_access_permissions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade, grantee_user_id uuid not null references auth.users(id),
  permission text not null check(permission in ('view','comment','edit')), granted_by uuid not null references auth.users(id),
  expires_at timestamptz, created_at timestamptz not null default now(), unique(document_id, grantee_user_id)
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  subject text, conversation_type text not null default 'direct' check(conversation_type in ('direct','care_team','support','group')),
  participant_ids uuid[] not null, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(cardinality(participant_ids) >= 2)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade, sender_id uuid not null references auth.users(id),
  body text not null check(char_length(body) between 1 and 10000), attachment_document_id uuid references public.documents(id),
  edited_at timestamptz, deleted_at timestamptz, created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid references auth.users(id), title text not null, description text, priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
  status text not null default 'open' check(status in ('open','in_progress','blocked','completed','cancelled')), due_at timestamptz,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.task_assignments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade, assignee_id uuid not null references auth.users(id),
  assigned_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(task_id, assignee_id)
);
create table public.resource_library_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, summary text, resource_type text not null, domain text not null check(domain in ('wealth','wellbeing','community','operations')),
  content_url text, content_body text, audience_roles public.app_role[] not null default array['member']::public.app_role[],
  status public.record_status not null default 'draft', created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.community_posts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid not null references auth.users(id), title text not null, body text not null, status text not null default 'published' check(status in ('draft','published','hidden','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.comments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade, author_id uuid not null references auth.users(id),
  body text not null, status text not null default 'published' check(status in ('published','hidden','deleted')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.billing_subscription_references (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid references auth.users(id), provider text not null default 'stripe', external_customer_reference text,
  external_subscription_reference text, plan_key text, status text not null default 'inactive', current_period_ends_at timestamptz,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Common timestamp maintenance.
create or replace function private.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
revoke all on function private.set_updated_at() from public, anon;
grant execute on function private.set_updated_at() to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','organizations','memberships','invitations','user_preferences','care_assignments','family_delegations',
    'integration_connections','workflow_approvals','reports','wellbeing_plans','wellbeing_checkins','goals','habits','programmes',
    'programme_enrolments','coaching_sessions','appointments','assessments','wealth_plans','wealth_goals','assets','liabilities',
    'cashflow_targets','financial_documents','adviser_tasks','wealth_reviews','documents','conversations','tasks','resource_library_items',
    'community_posts','comments','billing_subscription_references'
  ] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function private.set_updated_at()', t, t);
  end loop;
end $$;

-- Enable RLS everywhere exposed.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- Profile and organization identity policies.
create policy profiles_select on public.profiles for select to authenticated using (
  id = (select auth.uid()) or exists (
    select 1 from public.memberships mine join public.memberships theirs on mine.organization_id = theirs.organization_id
    where mine.user_id = (select auth.uid()) and mine.status = 'active' and theirs.user_id = profiles.id and theirs.status = 'active'
      and mine.role in ('owner','admin','operations_manager','advisor','practitioner')
  )
);
create policy profiles_insert on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy organizations_select on public.organizations for select to authenticated using (private.is_org_member(id));
create policy organizations_insert on public.organizations for insert to authenticated with check (created_by = (select auth.uid()));
create policy organizations_update on public.organizations for update to authenticated using (
  private.has_org_role(id, array['owner','admin']::public.app_role[])
) with check (private.has_org_role(id, array['owner','admin']::public.app_role[]));

create policy memberships_select on public.memberships for select to authenticated using (
  user_id = (select auth.uid()) or private.has_org_role(organization_id, array['owner','admin','operations_manager','advisor','practitioner']::public.app_role[])
);
create policy memberships_insert on public.memberships for insert to authenticated with check (
  (user_id = (select auth.uid()) and role = 'owner' and created_by = (select auth.uid()))
  or private.has_org_role(organization_id, array['owner','admin']::public.app_role[])
);
create policy memberships_update on public.memberships for update to authenticated using (
  private.has_org_role(organization_id, array['owner','admin']::public.app_role[])
) with check (private.has_org_role(organization_id, array['owner','admin']::public.app_role[]));
create policy memberships_delete on public.memberships for delete to authenticated using (
  private.has_org_role(organization_id, array['owner']::public.app_role[])
);

-- Admin/governance tables.
do $$
declare t text;
begin
  foreach t in array array['invitations','care_assignments','family_delegations','integration_connections','workflow_approvals','reports','report_runs'] loop
    execute format('create policy %I on public.%I for select to authenticated using (private.has_org_role(organization_id, array[''owner'',''admin'',''operations_manager'']::public.app_role[]))', t||'_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (private.has_org_role(organization_id, array[''owner'',''admin'',''operations_manager'']::public.app_role[]))', t||'_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (private.has_org_role(organization_id, array[''owner'',''admin'',''operations_manager'']::public.app_role[])) with check (private.has_org_role(organization_id, array[''owner'',''admin'',''operations_manager'']::public.app_role[]))', t||'_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (private.has_org_role(organization_id, array[''owner'',''admin'']::public.app_role[]))', t||'_delete', t);
  end loop;
end $$;

-- Preferences, notifications and consent are self-accessible; administrators have audit visibility.
create policy preferences_all on public.user_preferences for all to authenticated using (
  user_id = (select auth.uid())
) with check (user_id = (select auth.uid()) and private.is_org_member(organization_id));
create policy notifications_select on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy consents_select on public.consents for select to authenticated using (
  user_id = (select auth.uid()) or private.has_org_role(organization_id, array['owner','admin']::public.app_role[])
);
create policy consents_insert on public.consents for insert to authenticated with check (user_id = (select auth.uid()) and private.is_org_member(organization_id));
create policy policy_ack_select on public.policy_acknowledgements for select to authenticated using (
  user_id = (select auth.uid()) or private.has_org_role(organization_id, array['owner','admin']::public.app_role[])
);
create policy policy_ack_insert on public.policy_acknowledgements for insert to authenticated with check (user_id = (select auth.uid()) and private.is_org_member(organization_id));
create policy activity_select on public.activity_events for select to authenticated using (
  private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[]) or actor_id = (select auth.uid())
);
create policy activity_insert on public.activity_events for insert to authenticated with check (actor_id = (select auth.uid()) and private.is_org_member(organization_id));
create policy audit_select on public.audit_events for select to authenticated using (
  private.has_org_role(organization_id, array['owner','admin']::public.app_role[]) or actor_id = (select auth.uid())
);
create policy audit_insert on public.audit_events for insert to authenticated with check (actor_id = (select auth.uid()) and private.is_org_member(organization_id));
-- No UPDATE or DELETE policies exist for activity_events or audit_events: history is append-only.

-- Member domain tables use self, assigned-care-team, operational admin, or explicit delegation access.
do $$
declare t text;
begin
  foreach t in array array[
    'wellbeing_plans','wellbeing_checkins','goals','habits','habit_logs','programme_enrolments','coaching_sessions','appointments','assessments',
    'wealth_plans','wealth_goals','assets','liabilities','cashflow_targets','adviser_tasks','wealth_reviews'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (private.can_access_member(organization_id, member_id, %L))', t||'_select', t, t);
    execute format('create policy %I on public.%I for insert to authenticated with check (private.can_access_member(organization_id, member_id, %L) and created_by = (select auth.uid()))', t||'_insert', t, t);
    execute format('create policy %I on public.%I for update to authenticated using (private.can_access_member(organization_id, member_id, %L)) with check (private.can_access_member(organization_id, member_id, %L))', t||'_update', t, t, t);
    execute format('create policy %I on public.%I for delete to authenticated using (member_id = (select auth.uid()) or private.has_org_role(organization_id, array[''owner'',''admin'']::public.app_role[]))', t||'_delete', t);
  end loop;
end $$;

create policy financial_documents_select on public.financial_documents for select to authenticated using (
  private.can_access_member(organization_id, member_id, 'financial_documents')
);
create policy financial_documents_insert on public.financial_documents for insert to authenticated with check (
  private.can_access_member(organization_id, member_id, 'financial_documents') and uploaded_by = (select auth.uid())
);
create policy financial_documents_update on public.financial_documents for update to authenticated using (
  private.can_access_member(organization_id, member_id, 'financial_documents')
) with check (
  private.can_access_member(organization_id, member_id, 'financial_documents')
);
create policy financial_documents_delete on public.financial_documents for delete to authenticated using (
  member_id = (select auth.uid()) or private.has_org_role(organization_id, array['owner','admin']::public.app_role[])
);

create policy programmes_select on public.programmes for select to authenticated using (private.is_org_member(organization_id));
create policy programmes_write on public.programmes for all to authenticated using (
  private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
) with check (private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[]));
create policy resources_select on public.resource_library_items for select to authenticated using (
  private.is_org_member(organization_id) and private.current_org_role(organization_id) = any(audience_roles)
);
create policy resources_write on public.resource_library_items for all to authenticated using (
  private.has_org_role(organization_id, array['owner','admin','operations_manager','advisor','practitioner']::public.app_role[])
) with check (private.has_org_role(organization_id, array['owner','admin','operations_manager','advisor','practitioner']::public.app_role[]));

-- Document access is explicit; administrators do not bypass private-document visibility.
create policy documents_select on public.documents for select to authenticated using (
  owner_id = (select auth.uid()) or exists (
    select 1 from public.document_access_permissions p where p.document_id = documents.id
      and p.grantee_user_id = (select auth.uid()) and (p.expires_at is null or p.expires_at > now())
  ) or (sensitivity = 'organization' and private.has_org_role(organization_id, array['owner','admin']::public.app_role[]))
);
create policy documents_insert on public.documents for insert to authenticated with check (owner_id = (select auth.uid()) and created_by = (select auth.uid()) and private.is_org_member(organization_id));
create policy documents_update on public.documents for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy documents_delete on public.documents for delete to authenticated using (owner_id = (select auth.uid()));
create policy document_access_select on public.document_access_permissions for select to authenticated using (
  grantee_user_id = (select auth.uid()) or exists(select 1 from public.documents d where d.id = document_id and d.owner_id = (select auth.uid()))
);
create policy document_access_write on public.document_access_permissions for all to authenticated using (
  exists(select 1 from public.documents d where d.id = document_id and d.owner_id = (select auth.uid()))
) with check (exists(select 1 from public.documents d where d.id = document_id and d.owner_id = (select auth.uid())));

create policy conversations_select on public.conversations for select to authenticated using ((select auth.uid()) = any(participant_ids));
create policy conversations_insert on public.conversations for insert to authenticated with check (
  created_by = (select auth.uid()) and (select auth.uid()) = any(participant_ids) and private.is_org_member(organization_id)
);
create policy conversations_update on public.conversations for update to authenticated using (created_by = (select auth.uid())) with check ((select auth.uid()) = any(participant_ids));
create policy messages_select on public.messages for select to authenticated using (
  exists(select 1 from public.conversations c where c.id = conversation_id and (select auth.uid()) = any(c.participant_ids))
);
create policy messages_insert on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and exists(select 1 from public.conversations c where c.id = conversation_id and (select auth.uid()) = any(c.participant_ids))
);
create policy messages_update on public.messages for update to authenticated using (sender_id = (select auth.uid())) with check (sender_id = (select auth.uid()));

create policy tasks_select on public.tasks for select to authenticated using (
  created_by = (select auth.uid()) or (member_id is not null and private.can_access_member(organization_id, member_id, 'tasks'))
  or exists(select 1 from public.task_assignments a where a.task_id = tasks.id and a.assignee_id = (select auth.uid()))
);
create policy tasks_write on public.tasks for all to authenticated using (
  created_by = (select auth.uid()) or private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
) with check (private.is_org_member(organization_id));
create policy task_assignments_select on public.task_assignments for select to authenticated using (
  assignee_id = (select auth.uid()) or exists(select 1 from public.tasks t where t.id = task_id and t.created_by = (select auth.uid()))
);
create policy task_assignments_write on public.task_assignments for all to authenticated using (
  exists(select 1 from public.tasks t where t.id = task_id and (t.created_by = (select auth.uid()) or private.has_org_role(t.organization_id, array['owner','admin','operations_manager']::public.app_role[])))
) with check (private.is_org_member(organization_id));

create policy community_posts_select on public.community_posts for select to authenticated using (private.is_org_member(organization_id) and status <> 'hidden');
create policy community_posts_write on public.community_posts for all to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()) and private.is_org_member(organization_id));
create policy comments_select on public.comments for select to authenticated using (private.is_org_member(organization_id) and status <> 'hidden');
create policy comments_write on public.comments for all to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()) and private.is_org_member(organization_id));

create policy billing_select on public.billing_subscription_references for select to authenticated using (
  member_id = (select auth.uid()) or private.has_org_role(organization_id, array['owner','admin']::public.app_role[])
);
-- Billing reference mutations are intentionally server-only (no authenticated write policy).

-- Explicit Data API grants (required for new Supabase projects created with auto-exposure disabled).
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke truncate, references, trigger on all tables in schema public from authenticated, anon;
revoke all on all tables in schema public from anon;

-- New users receive an IWW profile only. Organization creation remains an explicit onboarding action.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

-- Private document storage. Paths are organization_id/user_id/file-name.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'iww-private-documents', 'iww-private-documents', false, 26214400,
  array['application/pdf','image/jpeg','image/png','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy iww_storage_select on storage.objects for select to authenticated using (
  bucket_id = 'iww-private-documents'
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  and private.is_org_member(((storage.foldername(name))[1])::uuid)
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or exists (
      select 1 from public.documents d
      where d.organization_id = ((storage.foldername(name))[1])::uuid and d.storage_path = name
        and (
          d.owner_id = (select auth.uid())
          or exists (
            select 1 from public.document_access_permissions p
            where p.document_id = d.id and p.grantee_user_id = (select auth.uid())
              and (p.expires_at is null or p.expires_at > now())
          )
        )
    )
  )
);
create policy iww_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'iww-private-documents'
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  and private.is_org_member(((storage.foldername(name))[1])::uuid)
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
create policy iww_storage_update on storage.objects for update to authenticated using (
  bucket_id = 'iww-private-documents' and (storage.foldername(name))[2] = (select auth.uid())::text
) with check (
  bucket_id = 'iww-private-documents' and (storage.foldername(name))[2] = (select auth.uid())::text
);
create policy iww_storage_delete on storage.objects for delete to authenticated using (
  bucket_id = 'iww-private-documents' and (storage.foldername(name))[2] = (select auth.uid())::text
);

-- Database-level immutable audit capture for governed changes.
create or replace function private.capture_governed_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  org_id uuid := (row_data ->> 'organization_id')::uuid;
  row_id uuid := (row_data ->> 'id')::uuid;
begin
  if (select auth.uid()) is not null then
    insert into public.audit_events(organization_id, actor_id, action, target_type, target_id, metadata)
    values (org_id, (select auth.uid()), lower(tg_table_name || '.' || tg_op), tg_table_name, row_id,
      jsonb_build_object('operation', tg_op, 'occurred_at', now()));
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
revoke all on function private.capture_governed_change() from public, anon;
grant execute on function private.capture_governed_change() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['memberships','consents','policy_acknowledgements','integration_connections','workflow_approvals','document_access_permissions','family_delegations','billing_subscription_references'] loop
    execute format('create trigger audit_%I_change after insert or update or delete on public.%I for each row execute function private.capture_governed_change()', t, t);
  end loop;
end $$;

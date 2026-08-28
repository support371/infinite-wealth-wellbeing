-- Infinite World of Well-Being standalone SaaS core.
-- Project target: fepfnzrpftxpxlgyujev. Do not apply this migration to GEM.

create extension if not exists pgcrypto;

create or replace function public.iww_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  slug text not null unique,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null check (role in ('owner','admin','operations_manager','advisor','practitioner','member','family_delegate')),
  status text not null default 'active' check (status in ('invited','active','suspended','revoked')),
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index if not exists memberships_user_status_idx on public.memberships(user_id,status);
create index if not exists memberships_org_role_status_idx on public.memberships(organization_id,role,status);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','operations_manager','advisor','practitioner','member','family_delegate')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now()
);
create index if not exists invitations_org_email_idx on public.invitations(organization_id,lower(email),created_at desc);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  email_updates boolean not null default true,
  appointment_reminders boolean not null default true,
  programme_updates boolean not null default true,
  community_updates boolean not null default false,
  preferred_contact text not null default 'email' check (preferred_contact in ('email','in_app','none')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,user_id)
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete set null,
  event_type text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_events_org_user_created_idx on public.activity_events(organization_id,user_id,created_at desc);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.profiles(user_id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_org_created_idx on public.audit_events(organization_id,created_at desc);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  consent_type text not null,
  version text not null,
  status text not null check (status in ('granted','withdrawn')),
  granted_at timestamptz,
  withdrawn_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists consents_org_user_idx on public.consents(organization_id,user_id,created_at desc);

create table if not exists public.policy_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  policy_key text not null,
  policy_version text not null,
  acknowledged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id,user_id,policy_key,policy_version)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(organization_id,user_id,created_at desc);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('stripe','hubspot','google_calendar','email','other')),
  status text not null default 'not_connected' check (status in ('not_connected','pending_authorization','configured','connected','error','revoked')),
  external_account_id text,
  connection_metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,provider)
);

create table if not exists public.workflow_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_type text not null,
  target_type text not null,
  target_id uuid,
  requested_by uuid references public.profiles(user_id),
  reviewed_by uuid references public.profiles(user_id),
  status text not null default 'pending' check (status in ('pending','approved','returned','rejected','cancelled')),
  reason text,
  decision_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  report_type text not null,
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  requested_by uuid references public.profiles(user_id),
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  output_reference text,
  error_summary text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.member_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_user_id uuid not null references public.profiles(user_id) on delete cascade,
  member_user_id uuid not null references public.profiles(user_id) on delete cascade,
  assignment_type text not null check (assignment_type in ('advisor','practitioner','operations')),
  active boolean not null default true,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,staff_user_id,member_user_id,assignment_type)
);

create table if not exists public.family_delegations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  member_user_id uuid not null references public.profiles(user_id) on delete cascade,
  delegate_user_id uuid not null references public.profiles(user_id) on delete cascade,
  scope_summary text not null default 'Limited delegated access',
  allow_goals boolean not null default true,
  allow_appointments boolean not null default true,
  allow_documents boolean not null default false,
  allow_messages boolean not null default false,
  active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,member_user_id,delegate_user_id)
);

-- Wellbeing domain -----------------------------------------------------------
create table if not exists public.wellbeing_plans (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, title text not null, summary text, status text not null default 'active' check(status in ('draft','active','paused','completed')),
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.wellbeing_checkins (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, mood_score integer check(mood_score between 1 and 10), energy_score integer check(energy_score between 1 and 10), reflection text,
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, title text not null, category text not null default 'other', target_date date, status text not null default 'active' check(status in ('active','paused','completed')),
  progress numeric(5,2) not null default 0 check(progress between 0 and 100), created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, name text not null, frequency text not null default 'daily' check(frequency in ('daily','weekly','custom')), target_count integer not null default 1 check(target_count > 0), active boolean not null default true,
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, habit_id uuid not null references public.habits(id) on delete cascade, logged_on date not null default current_date, count integer not null default 1 check(count >= 0), note text,
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), unique(habit_id,logged_on,user_id)
);
create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, description text, category text, status text not null default 'draft' check(status in ('draft','published','active','completed','archived')), starts_at timestamptz, ends_at timestamptz,
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.programme_enrolments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, programme_id uuid not null references public.programmes(id) on delete cascade, status text not null default 'enrolled' check(status in ('requested','enrolled','paused','completed','withdrawn')), enrolled_at timestamptz, progress numeric(5,2) not null default 0 check(progress between 0 and 100),
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(programme_id,user_id)
);
create table if not exists public.coaching_sessions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, practitioner_user_id uuid references public.profiles(user_id) on delete set null, title text not null default 'Coaching session', session_at timestamptz, member_summary text, practitioner_notes text, status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, practitioner_user_id uuid references public.profiles(user_id) on delete set null, title text not null, appointment_type text not null, starts_at timestamptz not null, ends_at timestamptz, status text not null default 'requested' check(status in ('requested','confirmed','completed','cancelled')), location_text text, external_calendar_reference text,
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists appointments_org_user_start_idx on public.appointments(organization_id,user_id,starts_at);
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, assessment_type text not null, title text not null, responses jsonb not null default '{}'::jsonb, member_summary text, status text not null default 'completed',
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Wealth domain --------------------------------------------------------------
create table if not exists public.wealth_plans (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, title text not null, summary text, status text not null default 'active' check(status in ('draft','active','review','completed')),
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.wealth_goals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, title text not null, target_amount numeric(18,2), current_amount numeric(18,2), currency text not null default 'USD', target_date date, status text not null default 'active' check(status in ('active','paused','completed')),
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, name text not null, asset_type text not null, estimated_value numeric(18,2), currency text not null default 'USD', note text,
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.liabilities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, name text not null, liability_type text not null, balance numeric(18,2), currency text not null default 'USD', interest_rate numeric(7,4), note text,
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cashflow_targets (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, name text not null, period text not null default 'monthly', target_income numeric(18,2), target_saving numeric(18,2), target_spending numeric(18,2), currency text not null default 'USD',
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.financial_documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, title text not null, document_type text, storage_path text not null, mime_type text, size_bytes bigint,
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.adviser_tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, advisor_user_id uuid references public.profiles(user_id) on delete set null, title text not null, description text, due_at timestamptz, status text not null default 'open' check(status in ('open','in_progress','completed','cancelled')),
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.wealth_reviews (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, advisor_user_id uuid references public.profiles(user_id) on delete set null, reviewed_at timestamptz not null default now(), summary text, next_steps text, status text not null default 'recorded',
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Collaboration --------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, title text not null, document_type text, storage_path text not null, mime_type text, size_bytes bigint, sensitivity text not null default 'private' check(sensitivity in ('private','shared','organization')),
  created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.document_access (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade, user_id uuid not null references public.profiles(user_id) on delete cascade, permission text not null default 'view' check(permission in ('view','comment','manage')), granted_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), unique(document_id,user_id)
);
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text, created_by uuid not null references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade, user_id uuid not null references public.profiles(user_id) on delete cascade, joined_at timestamptz not null default now(), left_at timestamptz, unique(conversation_id,user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade, sender_user_id uuid not null references public.profiles(user_id) on delete cascade, body text not null check(char_length(trim(body)) between 1 and 10000), edited_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, description text, due_at timestamptz, status text not null default 'open' check(status in ('open','in_progress','blocked','completed')), created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.task_assignments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade, user_id uuid not null references public.profiles(user_id) on delete cascade, assigned_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), unique(task_id,user_id)
);
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, summary text, description text, resource_type text not null default 'article', url text, audience_roles text[] not null default array['member']::text[], published boolean not null default false, created_by uuid references public.profiles(user_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  author_user_id uuid not null references public.profiles(user_id) on delete cascade, title text, body text not null, status text not null default 'published' check(status in ('draft','published','hidden','removed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade, author_user_id uuid not null references public.profiles(user_id) on delete cascade, body text not null, status text not null default 'published' check(status in ('published','hidden','removed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Commercial and privacy workflows -----------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete set null, provider text not null default 'stripe', provider_customer_id text, provider_subscription_id text, plan_name text, status text not null default 'inactive', current_period_end timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider,provider_subscription_id)
);
create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete set null, subscription_id uuid references public.subscriptions(id) on delete set null, provider text not null default 'stripe', provider_record_id text, record_type text not null, description text, amount numeric(18,2), currency text not null default 'USD', status text, occurred_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.data_requests (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade, request_type text not null check(request_type in ('access','export','correction','deletion','restriction','other')), status text not null default 'received' check(status in ('received','in_review','approved','completed','declined')), request_note text, resolution_note text, reviewed_by uuid references public.profiles(user_id), reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Updated-at triggers for mutable tables.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','organizations','memberships','user_preferences','consents','integration_connections','workflow_approvals','reports','member_assignments','family_delegations',
    'wellbeing_plans','wellbeing_checkins','goals','habits','programmes','programme_enrolments','coaching_sessions','appointments','assessments',
    'wealth_plans','wealth_goals','assets','liabilities','cashflow_targets','financial_documents','adviser_tasks','wealth_reviews',
    'documents','conversations','tasks','resources','community_posts','comments','subscriptions','data_requests'
  ] loop
    execute format('drop trigger if exists iww_touch_updated_at on public.%I', t);
    execute format('create trigger iww_touch_updated_at before update on public.%I for each row execute function public.iww_set_updated_at()', t);
  end loop;
end $$;

-- Create a private profile row for every IWW Auth user. This contains no GEM identity data.
create or replace function public.iww_handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(user_id,full_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data->>'full_name','')),''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists iww_on_auth_user_created on auth.users;
create trigger iww_on_auth_user_created after insert on auth.users for each row execute function public.iww_handle_new_auth_user();

-- Membership helpers execute with owner privileges to avoid RLS recursion.
create or replace function public.iww_is_member(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.memberships m where m.organization_id=p_organization_id and m.user_id=auth.uid() and m.status='active');
$$;

create or replace function public.iww_has_role(p_organization_id uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.memberships m where m.organization_id=p_organization_id and m.user_id=auth.uid() and m.status='active' and m.role=any(p_roles));
$$;

create or replace function public.iww_can_access_member(p_organization_id uuid, p_subject_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    auth.uid() = p_subject_user_id
    or exists(select 1 from public.memberships m where m.organization_id=p_organization_id and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin','operations_manager'))
    or exists(select 1 from public.member_assignments a where a.organization_id=p_organization_id and a.staff_user_id=auth.uid() and a.member_user_id=p_subject_user_id and a.active)
    or exists(select 1 from public.family_delegations d where d.organization_id=p_organization_id and d.delegate_user_id=auth.uid() and d.member_user_id=p_subject_user_id and d.active and (d.expires_at is null or d.expires_at>now()));
$$;

create or replace function public.iww_can_manage_member(p_organization_id uuid, p_subject_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    auth.uid() = p_subject_user_id
    or exists(select 1 from public.memberships m where m.organization_id=p_organization_id and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin','operations_manager'))
    or exists(select 1 from public.member_assignments a where a.organization_id=p_organization_id and a.staff_user_id=auth.uid() and a.member_user_id=p_subject_user_id and a.active and a.assignment_type in ('advisor','practitioner','operations'));
$$;

create or replace function public.iww_is_conversation_participant(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.conversation_participants cp where cp.conversation_id=p_conversation_id and cp.user_id=auth.uid() and cp.left_at is null);
$$;

-- Organization creation is explicit, authenticated, and creates one owner membership.
create or replace function public.create_iww_organization(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_org uuid; v_slug text;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if char_length(trim(coalesce(p_name,''))) < 2 then raise exception 'invalid_organization_name'; end if;
  insert into public.profiles(user_id) values(v_user) on conflict(user_id) do nothing;
  v_slug := trim(both '-' from regexp_replace(lower(trim(p_name)),'[^a-z0-9]+','-','g')) || '-' || left(replace(gen_random_uuid()::text,'-',''),8);
  insert into public.organizations(name,slug,created_by) values(trim(p_name),v_slug,v_user) returning id into v_org;
  insert into public.memberships(organization_id,user_id,role,status,created_by) values(v_org,v_user,'owner','active',v_user);
  insert into public.audit_events(organization_id,actor_user_id,action,target_type,target_id,metadata) values(v_org,v_user,'organization.created','organization',v_org,jsonb_build_object('source','self_onboarding'));
  update public.profiles set onboarding_completed=true where user_id=v_user;
  return v_org;
end;
$$;

-- Invitation token is returned once; only its SHA-256 digest is stored.
create or replace function public.issue_iww_invitation(p_organization_id uuid, p_email text, p_role text)
returns text language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_token text; v_hash text; v_id uuid;
begin
  if not public.iww_has_role(p_organization_id,array['owner','admin']) then raise exception 'role_not_authorized'; end if;
  if p_role not in ('admin','operations_manager','advisor','practitioner','member','family_delegate') then raise exception 'invalid_role'; end if;
  if position('@' in coalesce(p_email,'')) < 2 then raise exception 'invalid_email'; end if;
  v_token := encode(gen_random_bytes(32),'hex');
  v_hash := encode(digest(v_token,'sha256'),'hex');
  insert into public.invitations(organization_id,email,role,token_hash,expires_at,created_by) values(p_organization_id,lower(trim(p_email)),p_role,v_hash,now()+interval '7 days',v_actor) returning id into v_id;
  insert into public.audit_events(organization_id,actor_user_id,action,target_type,target_id,metadata) values(p_organization_id,v_actor,'invitation.issued','invitation',v_id,jsonb_build_object('role',p_role));
  return v_token;
end;
$$;

create or replace function public.accept_iww_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_email text := lower(coalesce(auth.jwt()->>'email','')); v_hash text; v_inv public.invitations%rowtype;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  v_hash := encode(digest(trim(coalesce(p_token,'')),'sha256'),'hex');
  select * into v_inv from public.invitations where token_hash=v_hash and accepted_at is null and revoked_at is null and expires_at>now() for update;
  if not found then raise exception 'invitation_invalid_or_expired'; end if;
  if lower(v_inv.email) <> v_email then raise exception 'invitation_email_mismatch'; end if;
  insert into public.profiles(user_id) values(v_user) on conflict(user_id) do nothing;
  insert into public.memberships(organization_id,user_id,role,status,created_by) values(v_inv.organization_id,v_user,v_inv.role,'active',v_inv.created_by)
  on conflict(organization_id,user_id) do update set role=excluded.role,status='active',updated_at=now();
  update public.invitations set accepted_at=now() where id=v_inv.id;
  update public.profiles set onboarding_completed=true where user_id=v_user;
  insert into public.audit_events(organization_id,actor_user_id,action,target_type,target_id,metadata) values(v_inv.organization_id,v_user,'invitation.accepted','invitation',v_inv.id,jsonb_build_object('role',v_inv.role));
  return v_inv.organization_id;
end;
$$;

create or replace function public.create_iww_conversation(p_organization_id uuid, p_title text, p_participant_user_ids uuid[])
returns uuid language plpgsql security definer set search_path = public as $$
declare v_conversation uuid; v_requested_count int; v_valid_count int;
begin
  if not public.iww_is_member(p_organization_id) then raise exception 'organization_access_denied'; end if;
  select count(distinct x) into v_requested_count from unnest(array_append(coalesce(p_participant_user_ids,array[]::uuid[]),auth.uid())) x;
  select count(*) into v_valid_count from public.memberships where organization_id=p_organization_id and status='active' and user_id=any(array_append(coalesce(p_participant_user_ids,array[]::uuid[]),auth.uid()));
  if v_requested_count <> v_valid_count then raise exception 'invalid_conversation_participant'; end if;
  insert into public.conversations(organization_id,title,created_by) values(p_organization_id,nullif(trim(p_title),''),auth.uid()) returning id into v_conversation;
  insert into public.conversation_participants(organization_id,conversation_id,user_id)
  select p_organization_id,v_conversation,user_id from public.memberships where organization_id=p_organization_id and status='active' and user_id=any(array_append(coalesce(p_participant_user_ids,array[]::uuid[]),auth.uid())) on conflict do nothing;
  insert into public.audit_events(organization_id,actor_user_id,action,target_type,target_id) values(p_organization_id,auth.uid(),'conversation.created','conversation',v_conversation);
  return v_conversation;
end;
$$;

create or replace function public.iww_inbox(p_organization_id uuid)
returns table(conversation_id uuid,title text,last_message text,last_message_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id,c.title,
    (select m.body from public.messages m where m.conversation_id=c.id order by m.created_at desc limit 1),
    (select m.created_at from public.messages m where m.conversation_id=c.id order by m.created_at desc limit 1)
  from public.conversations c
  join public.conversation_participants cp on cp.conversation_id=c.id and cp.user_id=auth.uid() and cp.left_at is null
  where c.organization_id=p_organization_id and public.iww_is_member(p_organization_id)
  order by coalesce((select max(m.created_at) from public.messages m where m.conversation_id=c.id),c.created_at) desc;
$$;

create or replace function public.iww_delegated_members(p_organization_id uuid)
returns table(member_user_id uuid,full_name text,scope_summary text)
language sql stable security definer set search_path = public as $$
  select d.member_user_id,p.full_name,d.scope_summary
  from public.family_delegations d join public.profiles p on p.user_id=d.member_user_id
  where d.organization_id=p_organization_id and d.delegate_user_id=auth.uid() and d.active and (d.expires_at is null or d.expires_at>now())
    and public.iww_has_role(p_organization_id,array['family_delegate']);
$$;

revoke all on function public.create_iww_organization(text) from public;
revoke all on function public.issue_iww_invitation(uuid,text,text) from public;
revoke all on function public.accept_iww_invitation(text) from public;
revoke all on function public.create_iww_conversation(uuid,text,uuid[]) from public;
revoke all on function public.iww_inbox(uuid) from public;
revoke all on function public.iww_delegated_members(uuid) from public;
grant execute on function public.create_iww_organization(text) to authenticated;
grant execute on function public.issue_iww_invitation(uuid,text,text) to authenticated;
grant execute on function public.accept_iww_invitation(text) to authenticated;
grant execute on function public.create_iww_conversation(uuid,text,uuid[]) to authenticated;
grant execute on function public.iww_inbox(uuid) to authenticated;
grant execute on function public.iww_delegated_members(uuid) to authenticated;

-- Infinite Wealth & Well-being production core schema.
-- DO NOT apply this migration to an existing GEM/GemAssist project.
-- Apply only to a dedicated or explicitly approved IWW Supabase/Postgres project.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists iww_private;
revoke all on schema iww_private from public, anon, authenticated;
grant usage on schema iww_private to authenticated;

create type public.iww_submission_status as enum (
  'received',
  'triaged',
  'in_review',
  'approved',
  'rejected',
  'closed',
  'spam'
);

create type public.iww_membership_status as enum (
  'pending',
  'active',
  'paused',
  'cancelled',
  'expired'
);

create type public.iww_user_role as enum (
  'member',
  'reviewer',
  'admin'
);

create table public.iww_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.iww_user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.iww_user_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, role)
);

create table public.iww_inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 1 and 100),
  message text not null check (char_length(message) between 10 and 4000),
  status public.iww_submission_status not null default 'received',
  assigned_to uuid references auth.users(id) on delete set null,
  source text not null default 'web',
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.iww_membership_applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254),
  requested_tier text not null check (requested_tier in ('Explorer', 'Member', 'Guardian')),
  primary_interest text not null check (
    primary_interest in (
      'Wealth & Financial Education',
      'Holistic Well-being Information',
      'Spiritual Well-being & Ministry',
      'Community & Connection',
      'All of the Above'
    )
  ),
  introduction text not null default '' check (char_length(introduction) <= 3000),
  status public.iww_submission_status not null default 'received',
  assigned_to uuid references auth.users(id) on delete set null,
  source text not null default 'web',
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.iww_consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  submission_kind text not null check (submission_kind in ('inquiry', 'membership_application')),
  submission_id uuid not null,
  submission_reference text not null,
  subject_email text not null check (char_length(subject_email) between 3 and 254),
  consent_type text not null check (consent_type in ('submission_processing', 'contact_permission', 'application_processing')),
  granted boolean not null,
  statement_version text not null,
  source text not null default 'web',
  created_at timestamptz not null default now()
);

create table public.iww_submission_status_events (
  id bigint generated always as identity primary key,
  submission_kind text not null check (submission_kind in ('inquiry', 'membership_application')),
  submission_id uuid not null,
  from_status public.iww_submission_status,
  to_status public.iww_submission_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  reason text check (reason is null or char_length(reason) <= 1000),
  created_at timestamptz not null default now()
);

create table public.iww_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_application_id uuid references public.iww_membership_applications(id) on delete set null,
  tier text not null check (tier in ('Explorer', 'Member', 'Guardian')),
  status public.iww_membership_status not null default 'pending',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or started_at is null or ended_at >= started_at)
);

create table public.iww_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  submission_kind text not null check (submission_kind in ('inquiry', 'membership_application')),
  submission_id uuid not null,
  channel text not null check (channel in ('webhook', 'email')),
  provider text,
  provider_message_id text,
  attempt smallint not null default 1 check (attempt > 0),
  status text not null check (status in ('queued', 'sent', 'delivered', 'failed')),
  error_code text,
  created_at timestamptz not null default now()
);

create table public.iww_idempotency_records (
  idempotency_key text primary key check (char_length(idempotency_key) between 8 and 200),
  scope text not null check (scope in ('inquiry', 'membership_application')),
  request_hash text not null,
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (expires_at > created_at)
);

create table public.iww_audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  entity_kind text not null check (char_length(entity_kind) between 1 and 80),
  entity_id text,
  request_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index iww_inquiries_user_id_idx on public.iww_inquiries(user_id);
create index iww_inquiries_status_created_idx on public.iww_inquiries(status, created_at desc);
create index iww_inquiries_assigned_to_idx on public.iww_inquiries(assigned_to) where assigned_to is not null;
create index iww_membership_applications_user_id_idx on public.iww_membership_applications(user_id);
create index iww_membership_applications_status_created_idx on public.iww_membership_applications(status, created_at desc);
create index iww_membership_applications_assigned_to_idx on public.iww_membership_applications(assigned_to) where assigned_to is not null;
create index iww_consent_records_user_id_idx on public.iww_consent_records(user_id) where user_id is not null;
create index iww_consent_records_submission_idx on public.iww_consent_records(submission_kind, submission_id);
create index iww_status_events_submission_idx on public.iww_submission_status_events(submission_kind, submission_id, created_at);
create index iww_memberships_user_id_idx on public.iww_memberships(user_id);
create unique index iww_memberships_one_current_tier_idx
  on public.iww_memberships(user_id)
  where status in ('pending', 'active', 'paused');
create index iww_notification_submission_idx on public.iww_notification_deliveries(submission_kind, submission_id, created_at);
create index iww_idempotency_expiry_idx on public.iww_idempotency_records(expires_at);
create index iww_audit_entity_idx on public.iww_audit_events(entity_kind, entity_id, created_at desc);
create index iww_user_roles_active_idx on public.iww_user_roles(user_id, role) where revoked_at is null;

create or replace function iww_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger iww_profiles_set_updated_at
before update on public.iww_profiles
for each row execute function iww_private.set_updated_at();

create trigger iww_inquiries_set_updated_at
before update on public.iww_inquiries
for each row execute function iww_private.set_updated_at();

create trigger iww_membership_applications_set_updated_at
before update on public.iww_membership_applications
for each row execute function iww_private.set_updated_at();

create trigger iww_memberships_set_updated_at
before update on public.iww_memberships
for each row execute function iww_private.set_updated_at();

create or replace function iww_private.has_staff_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.iww_user_roles
    where user_id = (select auth.uid())
      and role in ('reviewer'::public.iww_user_role, 'admin'::public.iww_user_role)
      and revoked_at is null
  );
$$;

create or replace function iww_private.has_admin_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.iww_user_roles
    where user_id = (select auth.uid())
      and role = 'admin'::public.iww_user_role
      and revoked_at is null
  );
$$;

grant execute on function iww_private.has_staff_role() to authenticated;
grant execute on function iww_private.has_admin_role() to authenticated;

alter table public.iww_profiles enable row level security;
alter table public.iww_user_roles enable row level security;
alter table public.iww_inquiries enable row level security;
alter table public.iww_membership_applications enable row level security;
alter table public.iww_consent_records enable row level security;
alter table public.iww_submission_status_events enable row level security;
alter table public.iww_memberships enable row level security;
alter table public.iww_notification_deliveries enable row level security;
alter table public.iww_idempotency_records enable row level security;
alter table public.iww_audit_events enable row level security;

revoke all on public.iww_profiles from anon;
revoke all on public.iww_user_roles from anon;
revoke all on public.iww_inquiries from anon;
revoke all on public.iww_membership_applications from anon;
revoke all on public.iww_consent_records from anon;
revoke all on public.iww_submission_status_events from anon;
revoke all on public.iww_memberships from anon;
revoke all on public.iww_notification_deliveries from anon;
revoke all on public.iww_idempotency_records from anon;
revoke all on public.iww_audit_events from anon;

revoke all on public.iww_user_roles from authenticated;
revoke all on public.iww_submission_status_events from authenticated;
revoke all on public.iww_notification_deliveries from authenticated;
revoke all on public.iww_idempotency_records from authenticated;
revoke all on public.iww_audit_events from authenticated;

grant select, insert, update on public.iww_profiles to authenticated;
grant select on public.iww_inquiries to authenticated;
grant select on public.iww_membership_applications to authenticated;
grant select on public.iww_consent_records to authenticated;
grant select on public.iww_memberships to authenticated;

grant all on public.iww_profiles to service_role;
grant all on public.iww_user_roles to service_role;
grant all on public.iww_inquiries to service_role;
grant all on public.iww_membership_applications to service_role;
grant all on public.iww_consent_records to service_role;
grant all on public.iww_submission_status_events to service_role;
grant all on public.iww_memberships to service_role;
grant all on public.iww_notification_deliveries to service_role;
grant all on public.iww_idempotency_records to service_role;
grant all on public.iww_audit_events to service_role;

grant usage, select on all sequences in schema public to service_role;

create policy "profiles_select_own_or_staff"
on public.iww_profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (select iww_private.has_staff_role())
  )
);

create policy "profiles_insert_own"
on public.iww_profiles
for insert
to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "profiles_update_own_or_staff"
on public.iww_profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (select iww_private.has_staff_role())
  )
)
with check (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (select iww_private.has_staff_role())
  )
);

create policy "inquiries_select_own_or_staff"
on public.iww_inquiries
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (select iww_private.has_staff_role())
  )
);

create policy "membership_applications_select_own_or_staff"
on public.iww_membership_applications
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (select iww_private.has_staff_role())
  )
);

create policy "consent_records_select_own_or_staff"
on public.iww_consent_records
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (select iww_private.has_staff_role())
  )
);

create policy "memberships_select_own_or_staff"
on public.iww_memberships
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (select iww_private.has_staff_role())
  )
);

-- Staff mutation of submissions, roles, status events, notification deliveries,
-- idempotency records, and audit events is intentionally reserved for the
-- server/service role in v1. This prevents browser clients from granting roles,
-- rewriting intake history, or fabricating audit evidence.

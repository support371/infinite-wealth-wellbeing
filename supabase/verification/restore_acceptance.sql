-- IWW post-restore acceptance checks.
-- READ ONLY: this file must not mutate the restored database.
-- Run after restoring a dedicated IWW Supabase/Postgres environment.

-- 1) Required tables must exist and retain row-level security.
with required_tables(table_name) as (
  values
    ('iww_profiles'),
    ('iww_user_roles'),
    ('iww_inquiries'),
    ('iww_membership_applications'),
    ('iww_consent_records'),
    ('iww_submission_status_events'),
    ('iww_memberships'),
    ('iww_notification_deliveries'),
    ('iww_notification_outbox'),
    ('iww_email_outbox'),
    ('iww_idempotency_records'),
    ('iww_audit_events')
)
select
  r.table_name,
  c.oid is not null as table_exists,
  coalesce(c.relrowsecurity, false) as rls_enabled
from required_tables r
left join pg_class c
  on c.oid = to_regclass(format('public.%I', r.table_name))
order by r.table_name;

-- 2) Anonymous users must have no direct privileges on IWW tables.
select
  table_name,
  privilege_type
from information_schema.role_table_grants
where grantee = 'anon'
  and table_schema = 'public'
  and table_name like 'iww\_%' escape '\'
order by table_name, privilege_type;

-- Expected result: zero rows.

-- 3) Critical server-only RPCs must exist after restore.
with required_functions(signature) as (
  values
    ('public.iww_accept_inquiry(text,text,text,text,text,text,text,text,jsonb,text)'),
    ('public.iww_accept_membership_application(text,text,text,text,text,text,text,text,text,jsonb,text)'),
    ('public.iww_transition_submission(text,uuid,iww_submission_status,uuid,text,text)'),
    ('public.iww_bootstrap_admin(uuid)'),
    ('public.iww_set_staff_role(uuid,uuid,iww_user_role,boolean)'),
    ('public.iww_claim_notification_batch(integer)'),
    ('public.iww_finish_notification_attempt(uuid,boolean,text)'),
    ('public.iww_claim_email_batch(integer)'),
    ('public.iww_finish_email_attempt(uuid,boolean,text)'),
    ('public.iww_operational_snapshot()')
)
select
  signature,
  to_regprocedure(signature) is not null as function_exists
from required_functions
order by signature;

-- 4) Critical intake/outbox triggers must exist and remain enabled.
with required_triggers(trigger_name) as (
  values
    ('iww_inquiries_enqueue_notification'),
    ('iww_membership_applications_enqueue_notification'),
    ('iww_delivery_completes_outbox'),
    ('iww_inquiries_enqueue_confirmation_email'),
    ('iww_membership_applications_enqueue_confirmation_email'),
    ('iww_email_delivery_completes_outbox'),
    ('iww_inquiries_intake_throttle'),
    ('iww_membership_applications_intake_throttle')
)
select
  r.trigger_name,
  t.oid is not null as trigger_exists,
  coalesce(t.tgenabled <> 'D', false) as trigger_enabled
from required_triggers r
left join pg_trigger t
  on t.tgname = r.trigger_name
order by r.trigger_name;

-- 5) Detect stuck staff-notification work older than the worker lock timeout.
select
  id,
  submission_kind,
  submission_id,
  status,
  attempt_count,
  locked_at,
  last_error
from public.iww_notification_outbox
where status = 'processing'
  and locked_at < now() - interval '10 minutes'
order by locked_at asc;

-- 6) Detect stuck transactional-email work older than the worker lock timeout.
select
  id,
  submission_kind,
  submission_id,
  template_key,
  status,
  attempt_count,
  locked_at,
  last_error
from public.iww_email_outbox
where status = 'processing'
  and locked_at < now() - interval '10 minutes'
order by locked_at asc;

-- 7) Operational snapshot should remain callable and contain aggregate health only.
select public.iww_operational_snapshot() as operational_snapshot;

-- 8) Evidence tables should remain queryable. Counts are informational only.
select 'inquiries' as evidence_type, count(*)::bigint as row_count from public.iww_inquiries
union all
select 'membership_applications', count(*)::bigint from public.iww_membership_applications
union all
select 'consent_records', count(*)::bigint from public.iww_consent_records
union all
select 'status_events', count(*)::bigint from public.iww_submission_status_events
union all
select 'notification_deliveries', count(*)::bigint from public.iww_notification_deliveries
union all
select 'audit_events', count(*)::bigint from public.iww_audit_events
order by evidence_type;

-- Non-PII operational snapshot for protected readiness/incident monitoring.
-- Server/service-role only. Returns aggregate counts/timestamps, never submission content or email addresses.

create or replace function public.iww_operational_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'notificationOutbox', jsonb_build_object(
      'queued', (select count(*) from public.iww_notification_outbox where status = 'queued'),
      'processing', (select count(*) from public.iww_notification_outbox where status = 'processing'),
      'deadLetter', (select count(*) from public.iww_notification_outbox where status = 'dead_letter'),
      'stuckProcessing', (
        select count(*)
          from public.iww_notification_outbox
         where status = 'processing'
           and locked_at < now() - interval '10 minutes'
      ),
      'oldestQueuedAt', (
        select min(created_at)
          from public.iww_notification_outbox
         where status = 'queued'
      )
    ),
    'emailOutbox', jsonb_build_object(
      'queued', (select count(*) from public.iww_email_outbox where status = 'queued'),
      'processing', (select count(*) from public.iww_email_outbox where status = 'processing'),
      'deadLetter', (select count(*) from public.iww_email_outbox where status = 'dead_letter'),
      'stuckProcessing', (
        select count(*)
          from public.iww_email_outbox
         where status = 'processing'
           and locked_at < now() - interval '10 minutes'
      ),
      'oldestQueuedAt', (
        select min(created_at)
          from public.iww_email_outbox
         where status = 'queued'
      )
    ),
    'reviewQueue', jsonb_build_object(
      'inquiriesOpen', (
        select count(*)
          from public.iww_inquiries
         where status in ('received', 'triaged', 'in_review')
      ),
      'membershipApplicationsOpen', (
        select count(*)
          from public.iww_membership_applications
         where status in ('received', 'triaged', 'in_review')
      )
    ),
    'deliveryFailures24h', (
      select count(*)
        from public.iww_notification_deliveries
       where status = 'failed'
         and created_at >= now() - interval '24 hours'
    ),
    'capturedAt', now()
  );
$$;

revoke all on function public.iww_operational_snapshot() from public, anon, authenticated;
grant execute on function public.iww_operational_snapshot() to service_role;

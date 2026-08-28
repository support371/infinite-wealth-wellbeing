-- Live operational integrity guard for privileged staff MFA.
-- Replaces the aggregate snapshot RPC while preserving its signature.
-- Any active reviewer/admin without a verified Auth MFA factor causes the
-- protected readiness snapshot to fail closed.

create or replace function public.iww_operational_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
      from public.iww_user_roles r
     where r.role in ('reviewer'::public.iww_user_role, 'admin'::public.iww_user_role)
       and r.revoked_at is null
       and not exists (
         select 1
           from auth.mfa_factors f
          where f.user_id = r.user_id
            and f.status = 'verified'
       )
  ) then
    raise exception 'privileged_role_without_verified_mfa';
  end if;

  return jsonb_build_object(
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
    'privilegedMfaIntegrity', true,
    'capturedAt', now()
  );
end;
$$;

revoke all on function public.iww_operational_snapshot() from public, anon, authenticated;
grant execute on function public.iww_operational_snapshot() to service_role;

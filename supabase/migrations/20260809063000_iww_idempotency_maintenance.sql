-- Bounded maintenance for expired idempotency claims.
-- This deletes only rows whose explicit expires_at has passed.
-- It intentionally does not delete submissions, consent, audit, or notification history.

create or replace function public.iww_purge_expired_idempotency(
  p_limit integer default 1000
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_deleted integer := 0;
begin
  v_limit := greatest(1, least(coalesce(p_limit, 1000), 10000));

  with expired as (
    select idempotency_key
      from public.iww_idempotency_records
     where expires_at < now()
     order by expires_at asc
     limit v_limit
     for update skip locked
  )
  delete from public.iww_idempotency_records target
   using expired
   where target.idempotency_key = expired.idempotency_key;

  get diagnostics v_deleted = row_count;

  insert into public.iww_audit_events (
    action,
    entity_kind,
    details
  ) values (
    'maintenance.idempotency_purged',
    'maintenance',
    jsonb_build_object('deleted', v_deleted, 'limit', v_limit)
  );

  return v_deleted;
end;
$$;

revoke all on function public.iww_purge_expired_idempotency(integer) from public, anon, authenticated;
grant execute on function public.iww_purge_expired_idempotency(integer) to service_role;

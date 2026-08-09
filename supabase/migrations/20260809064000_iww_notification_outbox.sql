-- Durable notification outbox.
-- Accepted submissions enqueue staff notification work transactionally.
-- Immediate API delivery may satisfy the outbox; a protected worker can retry anything left queued.

create type public.iww_outbox_status as enum (
  'queued',
  'processing',
  'delivered',
  'dead_letter'
);

create table public.iww_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  submission_kind text not null check (submission_kind in ('inquiry', 'membership_application')),
  submission_id uuid not null,
  event_type text not null check (event_type in ('staff.inquiry.received', 'staff.membership_application.received')),
  status public.iww_outbox_status not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  delivered_at timestamptz,
  last_error text check (last_error is null or char_length(last_error) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_kind, submission_id, event_type)
);

create index iww_outbox_claim_idx
  on public.iww_notification_outbox(status, available_at, created_at)
  where status in ('queued', 'processing');

create trigger iww_notification_outbox_set_updated_at
before update on public.iww_notification_outbox
for each row execute function iww_private.set_updated_at();

alter table public.iww_notification_outbox enable row level security;
revoke all on public.iww_notification_outbox from anon, authenticated;
grant all on public.iww_notification_outbox to service_role;

create or replace function iww_private.enqueue_submission_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'iww_inquiries' then
    insert into public.iww_notification_outbox (submission_kind, submission_id, event_type)
    values ('inquiry', new.id, 'staff.inquiry.received')
    on conflict (submission_kind, submission_id, event_type) do nothing;
  elsif tg_table_name = 'iww_membership_applications' then
    insert into public.iww_notification_outbox (submission_kind, submission_id, event_type)
    values ('membership_application', new.id, 'staff.membership_application.received')
    on conflict (submission_kind, submission_id, event_type) do nothing;
  end if;
  return new;
end;
$$;

create trigger iww_inquiries_enqueue_notification
after insert on public.iww_inquiries
for each row execute function iww_private.enqueue_submission_notification();

create trigger iww_membership_applications_enqueue_notification
after insert on public.iww_membership_applications
for each row execute function iww_private.enqueue_submission_notification();

create or replace function iww_private.complete_outbox_from_delivery()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.channel = 'webhook' and new.status in ('sent', 'delivered') then
    update public.iww_notification_outbox
       set status = 'delivered',
           delivered_at = coalesce(delivered_at, now()),
           locked_at = null,
           last_error = null
     where submission_kind = new.submission_kind
       and submission_id = new.submission_id
       and status <> 'delivered';
  end if;
  return new;
end;
$$;

create trigger iww_delivery_completes_outbox
after insert on public.iww_notification_deliveries
for each row execute function iww_private.complete_outbox_from_delivery();

create or replace function public.iww_claim_notification_batch(
  p_limit integer default 25
)
returns table (
  outbox_id uuid,
  submission_kind text,
  submission_id uuid,
  event_type text,
  attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
begin
  v_limit := greatest(1, least(coalesce(p_limit, 25), 100));

  return query
  with candidates as (
    select q.id
      from public.iww_notification_outbox q
     where (
       q.status = 'queued'
       or (q.status = 'processing' and q.locked_at < now() - interval '10 minutes')
     )
       and q.available_at <= now()
     order by q.available_at asc, q.created_at asc
     limit v_limit
     for update skip locked
  ), claimed as (
    update public.iww_notification_outbox q
       set status = 'processing',
           locked_at = now(),
           attempt_count = q.attempt_count + 1
      from candidates c
     where q.id = c.id
    returning q.id, q.submission_kind, q.submission_id, q.event_type, q.attempt_count
  )
  select c.id, c.submission_kind, c.submission_id, c.event_type, c.attempt_count
    from claimed c;
end;
$$;

create or replace function public.iww_finish_notification_attempt(
  p_outbox_id uuid,
  p_delivered boolean,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt integer;
  v_status public.iww_outbox_status;
  v_next_available timestamptz;
begin
  select attempt_count
    into v_attempt
    from public.iww_notification_outbox
   where id = p_outbox_id
   for update;

  if not found then
    raise exception 'outbox_item_not_found';
  end if;

  if p_delivered then
    update public.iww_notification_outbox
       set status = 'delivered',
           delivered_at = coalesce(delivered_at, now()),
           locked_at = null,
           last_error = null
     where id = p_outbox_id;
    v_status := 'delivered';
    v_next_available := null;
  elsif v_attempt >= 8 then
    update public.iww_notification_outbox
       set status = 'dead_letter',
           locked_at = null,
           last_error = left(coalesce(p_error, 'delivery_failed'), 300)
     where id = p_outbox_id;
    v_status := 'dead_letter';
    v_next_available := null;
  else
    v_next_available := now() + make_interval(mins => least(360, power(2, greatest(0, v_attempt - 1))::integer * 5));
    update public.iww_notification_outbox
       set status = 'queued',
           locked_at = null,
           available_at = v_next_available,
           last_error = left(coalesce(p_error, 'delivery_failed'), 300)
     where id = p_outbox_id;
    v_status := 'queued';
  end if;

  insert into public.iww_audit_events (
    action,
    entity_kind,
    entity_id,
    details
  ) values (
    case when p_delivered then 'notification.outbox_delivered' else 'notification.outbox_retry' end,
    'notification_outbox',
    p_outbox_id::text,
    jsonb_build_object(
      'status', v_status,
      'attempt', v_attempt,
      'nextAvailableAt', v_next_available,
      'error', nullif(left(coalesce(p_error, ''), 300), '')
    )
  );

  return jsonb_build_object(
    'status', v_status,
    'attempt', v_attempt,
    'nextAvailableAt', v_next_available
  );
end;
$$;

revoke all on function public.iww_claim_notification_batch(integer) from public, anon, authenticated;
revoke all on function public.iww_finish_notification_attempt(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.iww_claim_notification_batch(integer) to service_role;
grant execute on function public.iww_finish_notification_attempt(uuid, boolean, text) to service_role;

-- Provider-neutral transactional email outbox.
-- This migration deliberately stores template identifiers, not rendered/legal copy.
-- Delivery remains disabled until a verified sender domain, provider, and approved templates exist.

create table public.iww_email_outbox (
  id uuid primary key default gen_random_uuid(),
  submission_kind text not null check (submission_kind in ('inquiry', 'membership_application')),
  submission_id uuid not null,
  template_key text not null check (template_key in ('inquiry_received_v1', 'membership_application_received_v1')),
  recipient_email text not null check (char_length(recipient_email) between 3 and 254),
  status public.iww_outbox_status not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  last_error text check (last_error is null or char_length(last_error) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_kind, submission_id, template_key)
);

create index iww_email_outbox_claim_idx
  on public.iww_email_outbox(status, available_at, created_at)
  where status in ('queued', 'processing');

create trigger iww_email_outbox_set_updated_at
before update on public.iww_email_outbox
for each row execute function iww_private.set_updated_at();

alter table public.iww_email_outbox enable row level security;
revoke all on public.iww_email_outbox from public, anon, authenticated;
grant all on public.iww_email_outbox to service_role;

create or replace function iww_private.enqueue_submission_confirmation_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'iww_inquiries' then
    insert into public.iww_email_outbox (
      submission_kind,
      submission_id,
      template_key,
      recipient_email
    ) values (
      'inquiry',
      new.id,
      'inquiry_received_v1',
      lower(new.email)
    )
    on conflict (submission_kind, submission_id, template_key) do nothing;
  elsif tg_table_name = 'iww_membership_applications' then
    insert into public.iww_email_outbox (
      submission_kind,
      submission_id,
      template_key,
      recipient_email
    ) values (
      'membership_application',
      new.id,
      'membership_application_received_v1',
      lower(new.email)
    )
    on conflict (submission_kind, submission_id, template_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger iww_inquiries_enqueue_confirmation_email
after insert on public.iww_inquiries
for each row execute function iww_private.enqueue_submission_confirmation_email();

create trigger iww_membership_applications_enqueue_confirmation_email
after insert on public.iww_membership_applications
for each row execute function iww_private.enqueue_submission_confirmation_email();

create or replace function iww_private.complete_email_outbox_from_delivery()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.channel = 'email' and new.status in ('sent', 'delivered') then
    update public.iww_email_outbox
       set status = 'delivered',
           sent_at = coalesce(sent_at, now()),
           locked_at = null,
           last_error = null
     where submission_kind = new.submission_kind
       and submission_id = new.submission_id
       and status <> 'delivered';
  end if;
  return new;
end;
$$;

create trigger iww_email_delivery_completes_outbox
after insert on public.iww_notification_deliveries
for each row execute function iww_private.complete_email_outbox_from_delivery();

create or replace function public.iww_claim_email_batch(
  p_limit integer default 25
)
returns table (
  outbox_id uuid,
  submission_kind text,
  submission_id uuid,
  template_key text,
  recipient_email text,
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
      from public.iww_email_outbox q
     where (
       q.status = 'queued'
       or (q.status = 'processing' and q.locked_at < now() - interval '10 minutes')
     )
       and q.available_at <= now()
     order by q.available_at asc, q.created_at asc
     limit v_limit
     for update skip locked
  ), claimed as (
    update public.iww_email_outbox q
       set status = 'processing',
           locked_at = now(),
           attempt_count = q.attempt_count + 1
      from candidates c
     where q.id = c.id
    returning q.id, q.submission_kind, q.submission_id, q.template_key, q.recipient_email, q.attempt_count
  )
  select c.id, c.submission_kind, c.submission_id, c.template_key, c.recipient_email, c.attempt_count
    from claimed c;
end;
$$;

create or replace function public.iww_finish_email_attempt(
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
  v_submission_kind text;
  v_submission_id uuid;
  v_status public.iww_outbox_status;
  v_next_available timestamptz;
  v_delivery_evidence boolean := false;
  v_effective_delivered boolean := false;
begin
  select attempt_count, submission_kind, submission_id
    into v_attempt, v_submission_kind, v_submission_id
    from public.iww_email_outbox
   where id = p_outbox_id
   for update;

  if not found then
    raise exception 'email_outbox_item_not_found';
  end if;

  if p_delivered then
    select exists (
      select 1
        from public.iww_notification_deliveries d
       where d.submission_kind = v_submission_kind
         and d.submission_id = v_submission_id
         and d.channel = 'email'
         and d.status in ('sent', 'delivered')
    ) into v_delivery_evidence;
  end if;

  v_effective_delivered := p_delivered and v_delivery_evidence;

  if v_effective_delivered then
    update public.iww_email_outbox
       set status = 'delivered',
           sent_at = coalesce(sent_at, now()),
           locked_at = null,
           last_error = null
     where id = p_outbox_id;
    v_status := 'delivered';
    v_next_available := null;
  elsif v_attempt >= 8 then
    update public.iww_email_outbox
       set status = 'dead_letter',
           locked_at = null,
           last_error = left(
             coalesce(
               nullif(p_error, ''),
               case when p_delivered and not v_delivery_evidence then 'email_delivery_evidence_missing' else 'email_delivery_failed' end
             ),
             300
           )
     where id = p_outbox_id;
    v_status := 'dead_letter';
    v_next_available := null;
  else
    v_next_available := now() + make_interval(mins => least(360, power(2, greatest(0, v_attempt - 1))::integer * 5));
    update public.iww_email_outbox
       set status = 'queued',
           locked_at = null,
           available_at = v_next_available,
           last_error = left(
             coalesce(
               nullif(p_error, ''),
               case when p_delivered and not v_delivery_evidence then 'email_delivery_evidence_missing' else 'email_delivery_failed' end
             ),
             300
           )
     where id = p_outbox_id;
    v_status := 'queued';
  end if;

  insert into public.iww_audit_events (
    action,
    entity_kind,
    entity_id,
    details
  ) values (
    case when v_effective_delivered then 'email.outbox_delivered' else 'email.outbox_retry' end,
    'email_outbox',
    p_outbox_id::text,
    jsonb_build_object(
      'status', v_status,
      'attempt', v_attempt,
      'requestedDelivered', p_delivered,
      'deliveryEvidence', v_delivery_evidence,
      'nextAvailableAt', v_next_available,
      'error', case
        when v_effective_delivered then null
        when p_delivered and not v_delivery_evidence then 'email_delivery_evidence_missing'
        else nullif(left(coalesce(p_error, ''), 300), '')
      end
    )
  );

  return jsonb_build_object(
    'status', v_status,
    'attempt', v_attempt,
    'deliveryEvidence', v_delivery_evidence,
    'nextAvailableAt', v_next_available
  );
end;
$$;

revoke all on function public.iww_claim_email_batch(integer) from public, anon, authenticated;
revoke all on function public.iww_finish_email_attempt(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.iww_claim_email_batch(integer) to service_role;
grant execute on function public.iww_finish_email_attempt(uuid, boolean, text) to service_role;

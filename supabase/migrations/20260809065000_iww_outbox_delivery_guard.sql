-- Strengthen outbox completion: delivered state requires durable delivery evidence.

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
  v_submission_kind text;
  v_submission_id uuid;
  v_status public.iww_outbox_status;
  v_next_available timestamptz;
  v_delivery_evidence boolean := false;
  v_effective_delivered boolean := false;
begin
  select attempt_count, submission_kind, submission_id
    into v_attempt, v_submission_kind, v_submission_id
    from public.iww_notification_outbox
   where id = p_outbox_id
   for update;

  if not found then
    raise exception 'outbox_item_not_found';
  end if;

  if p_delivered then
    select exists (
      select 1
        from public.iww_notification_deliveries d
       where d.submission_kind = v_submission_kind
         and d.submission_id = v_submission_id
         and d.channel = 'webhook'
         and d.status in ('sent', 'delivered')
    ) into v_delivery_evidence;
  end if;

  v_effective_delivered := p_delivered and v_delivery_evidence;

  if v_effective_delivered then
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
           last_error = left(
             coalesce(
               nullif(p_error, ''),
               case when p_delivered and not v_delivery_evidence then 'delivery_evidence_missing' else 'delivery_failed' end
             ),
             300
           )
     where id = p_outbox_id;
    v_status := 'dead_letter';
    v_next_available := null;
  else
    v_next_available := now() + make_interval(mins => least(360, power(2, greatest(0, v_attempt - 1))::integer * 5));
    update public.iww_notification_outbox
       set status = 'queued',
           locked_at = null,
           available_at = v_next_available,
           last_error = left(
             coalesce(
               nullif(p_error, ''),
               case when p_delivered and not v_delivery_evidence then 'delivery_evidence_missing' else 'delivery_failed' end
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
    case when v_effective_delivered then 'notification.outbox_delivered' else 'notification.outbox_retry' end,
    'notification_outbox',
    p_outbox_id::text,
    jsonb_build_object(
      'status', v_status,
      'attempt', v_attempt,
      'requestedDelivered', p_delivered,
      'deliveryEvidence', v_delivery_evidence,
      'nextAvailableAt', v_next_available,
      'error', case
        when v_effective_delivered then null
        when p_delivered and not v_delivery_evidence then 'delivery_evidence_missing'
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

revoke all on function public.iww_finish_notification_attempt(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.iww_finish_notification_attempt(uuid, boolean, text) to service_role;

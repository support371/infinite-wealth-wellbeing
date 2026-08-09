-- Terminal review decisions require a durable rationale.
-- Replaces the existing transition RPC while preserving its signature and state machine.

create or replace function public.iww_transition_submission(
  p_submission_kind text,
  p_submission_id uuid,
  p_to_status public.iww_submission_status,
  p_actor_user_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from_status public.iww_submission_status;
  v_allowed boolean := false;
  v_reference text;
  v_reason text;
begin
  if not exists (
    select 1
      from public.iww_user_roles
     where user_id = p_actor_user_id
       and role in ('reviewer'::public.iww_user_role, 'admin'::public.iww_user_role)
       and revoked_at is null
  ) then
    raise exception 'actor_not_staff';
  end if;

  if p_submission_kind = 'inquiry' then
    select status, reference
      into v_from_status, v_reference
      from public.iww_inquiries
     where id = p_submission_id
     for update;
  elsif p_submission_kind = 'membership_application' then
    select status, reference
      into v_from_status, v_reference
      from public.iww_membership_applications
     where id = p_submission_id
     for update;
  else
    raise exception 'invalid_submission_kind';
  end if;

  if not found then raise exception 'submission_not_found'; end if;

  if v_from_status = p_to_status then
    return jsonb_build_object(
      'status', p_to_status,
      'reference', v_reference,
      'submissionId', p_submission_id,
      'unchanged', true
    );
  end if;

  v_allowed := case
    when v_from_status = 'received' and p_to_status in ('triaged', 'spam', 'closed') then true
    when v_from_status = 'triaged' and p_to_status in ('in_review', 'spam', 'closed') then true
    when v_from_status = 'in_review' and p_to_status in ('approved', 'rejected', 'closed') then true
    when v_from_status = 'approved' and p_to_status = 'closed' then true
    when v_from_status = 'rejected' and p_to_status = 'closed' then true
    when v_from_status = 'spam' and p_to_status = 'closed' then true
    else false
  end;

  if not v_allowed then raise exception 'invalid_status_transition'; end if;

  v_reason := nullif(trim(coalesce(p_reason, '')), '');
  if v_reason is not null and char_length(v_reason) > 1000 then
    raise exception 'status_reason_too_long';
  end if;
  if p_to_status in ('approved', 'rejected', 'spam', 'closed') and v_reason is null then
    raise exception 'status_reason_required';
  end if;

  if p_submission_kind = 'inquiry' then
    update public.iww_inquiries
       set status = p_to_status,
           assigned_to = coalesce(assigned_to, p_actor_user_id)
     where id = p_submission_id;
  else
    update public.iww_membership_applications
       set status = p_to_status,
           assigned_to = coalesce(assigned_to, p_actor_user_id)
     where id = p_submission_id;
  end if;

  insert into public.iww_submission_status_events (
    submission_kind, submission_id, from_status, to_status, changed_by, reason
  ) values (
    p_submission_kind, p_submission_id, v_from_status, p_to_status, p_actor_user_id, v_reason
  );

  insert into public.iww_audit_events (
    actor_user_id, action, entity_kind, entity_id, details
  ) values (
    p_actor_user_id,
    'submission.status_changed',
    p_submission_kind,
    p_submission_id::text,
    jsonb_build_object(
      'reference', v_reference,
      'fromStatus', v_from_status,
      'toStatus', p_to_status,
      'reason', v_reason
    )
  );

  return jsonb_build_object(
    'status', p_to_status,
    'reference', v_reference,
    'submissionId', p_submission_id,
    'unchanged', false
  );
end;
$$;

revoke all on function public.iww_transition_submission(text, uuid, public.iww_submission_status, uuid, text) from public, anon, authenticated;
grant execute on function public.iww_transition_submission(text, uuid, public.iww_submission_status, uuid, text) to service_role;

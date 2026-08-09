-- Atomic intake functions for the dedicated IWW database.
-- These functions are intentionally callable only by service_role through the server API.

create or replace function public.iww_accept_inquiry(
  p_idempotency_key text,
  p_request_hash text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_request_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_consent_statement_version text default 'web-v1'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.iww_idempotency_records%rowtype;
  v_submission_id uuid;
  v_reference text;
  v_response jsonb;
  v_claimed_rows integer := 0;
begin
  if char_length(p_idempotency_key) < 8 or char_length(p_idempotency_key) > 200 then
    raise exception 'invalid_idempotency_key';
  end if;

  insert into public.iww_idempotency_records (
    idempotency_key,
    scope,
    request_hash,
    expires_at
  ) values (
    p_idempotency_key,
    'inquiry',
    p_request_hash,
    now() + interval '24 hours'
  )
  on conflict (idempotency_key) do nothing;

  get diagnostics v_claimed_rows = row_count;

  if v_claimed_rows = 0 then
    select *
      into v_existing
      from public.iww_idempotency_records
     where idempotency_key = p_idempotency_key;

    if v_existing.scope <> 'inquiry' or v_existing.request_hash <> p_request_hash then
      raise exception 'idempotency_key_reused';
    end if;

    if v_existing.response_body is null then
      raise exception 'idempotency_in_progress';
    end if;

    return v_existing.response_body;
  end if;

  v_reference := 'IWW-INQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.iww_inquiries (
    reference,
    first_name,
    last_name,
    email,
    subject,
    message,
    source,
    request_id,
    metadata,
    consented_at
  ) values (
    v_reference,
    p_first_name,
    p_last_name,
    lower(p_email),
    p_subject,
    p_message,
    'web',
    p_request_id,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  returning id into v_submission_id;

  insert into public.iww_consent_records (
    submission_kind,
    submission_id,
    submission_reference,
    subject_email,
    consent_type,
    granted,
    statement_version,
    source
  ) values
    ('inquiry', v_submission_id, v_reference, lower(p_email), 'submission_processing', true, p_consent_statement_version, 'web'),
    ('inquiry', v_submission_id, v_reference, lower(p_email), 'contact_permission', true, p_consent_statement_version, 'web');

  insert into public.iww_submission_status_events (
    submission_kind,
    submission_id,
    from_status,
    to_status,
    reason
  ) values (
    'inquiry',
    v_submission_id,
    null,
    'received',
    'Accepted by public intake API'
  );

  insert into public.iww_audit_events (
    action,
    entity_kind,
    entity_id,
    request_id,
    details
  ) values (
    'inquiry.accepted',
    'inquiry',
    v_submission_id::text,
    p_request_id,
    jsonb_build_object('reference', v_reference, 'source', 'web')
  );

  v_response := jsonb_build_object(
    'status', 'accepted',
    'reference', v_reference,
    'submissionId', v_submission_id
  );

  update public.iww_idempotency_records
     set response_status = 202,
         response_body = v_response
   where idempotency_key = p_idempotency_key;

  return v_response;
end;
$$;

create or replace function public.iww_accept_membership_application(
  p_idempotency_key text,
  p_request_hash text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_requested_tier text,
  p_primary_interest text,
  p_introduction text default '',
  p_request_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_consent_statement_version text default 'web-v1'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.iww_idempotency_records%rowtype;
  v_submission_id uuid;
  v_reference text;
  v_response jsonb;
  v_claimed_rows integer := 0;
begin
  if char_length(p_idempotency_key) < 8 or char_length(p_idempotency_key) > 200 then
    raise exception 'invalid_idempotency_key';
  end if;

  insert into public.iww_idempotency_records (
    idempotency_key,
    scope,
    request_hash,
    expires_at
  ) values (
    p_idempotency_key,
    'membership_application',
    p_request_hash,
    now() + interval '24 hours'
  )
  on conflict (idempotency_key) do nothing;

  get diagnostics v_claimed_rows = row_count;

  if v_claimed_rows = 0 then
    select *
      into v_existing
      from public.iww_idempotency_records
     where idempotency_key = p_idempotency_key;

    if v_existing.scope <> 'membership_application' or v_existing.request_hash <> p_request_hash then
      raise exception 'idempotency_key_reused';
    end if;

    if v_existing.response_body is null then
      raise exception 'idempotency_in_progress';
    end if;

    return v_existing.response_body;
  end if;

  v_reference := 'IWW-MEM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.iww_membership_applications (
    reference,
    first_name,
    last_name,
    email,
    requested_tier,
    primary_interest,
    introduction,
    source,
    request_id,
    metadata,
    consented_at
  ) values (
    v_reference,
    p_first_name,
    p_last_name,
    lower(p_email),
    p_requested_tier,
    p_primary_interest,
    coalesce(p_introduction, ''),
    'web',
    p_request_id,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  returning id into v_submission_id;

  insert into public.iww_consent_records (
    submission_kind,
    submission_id,
    submission_reference,
    subject_email,
    consent_type,
    granted,
    statement_version,
    source
  ) values
    ('membership_application', v_submission_id, v_reference, lower(p_email), 'application_processing', true, p_consent_statement_version, 'web'),
    ('membership_application', v_submission_id, v_reference, lower(p_email), 'contact_permission', true, p_consent_statement_version, 'web');

  insert into public.iww_submission_status_events (
    submission_kind,
    submission_id,
    from_status,
    to_status,
    reason
  ) values (
    'membership_application',
    v_submission_id,
    null,
    'received',
    'Accepted by public intake API'
  );

  insert into public.iww_audit_events (
    action,
    entity_kind,
    entity_id,
    request_id,
    details
  ) values (
    'membership_application.accepted',
    'membership_application',
    v_submission_id::text,
    p_request_id,
    jsonb_build_object('reference', v_reference, 'source', 'web', 'requestedTier', p_requested_tier)
  );

  v_response := jsonb_build_object(
    'status', 'accepted',
    'reference', v_reference,
    'submissionId', v_submission_id
  );

  update public.iww_idempotency_records
     set response_status = 202,
         response_body = v_response
   where idempotency_key = p_idempotency_key;

  return v_response;
end;
$$;

revoke all on function public.iww_accept_inquiry(text, text, text, text, text, text, text, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.iww_accept_membership_application(text, text, text, text, text, text, text, text, text, jsonb, text) from public, anon, authenticated;

grant execute on function public.iww_accept_inquiry(text, text, text, text, text, text, text, text, jsonb, text) to service_role;
grant execute on function public.iww_accept_membership_application(text, text, text, text, text, text, text, text, text, jsonb, text) to service_role;

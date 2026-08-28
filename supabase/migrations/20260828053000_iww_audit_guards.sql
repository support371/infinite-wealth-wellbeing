-- Append-only audit evidence and database-level sensitive-change recording.

create or replace function public.iww_reject_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_events_are_append_only';
end;
$$;

drop trigger if exists iww_audit_no_update on public.audit_events;
create trigger iww_audit_no_update before update on public.audit_events for each row execute function public.iww_reject_audit_mutation();
drop trigger if exists iww_audit_no_delete on public.audit_events;
create trigger iww_audit_no_delete before delete on public.audit_events for each row execute function public.iww_reject_audit_mutation();

create or replace function public.iww_audit_sensitive_change()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_org uuid;
  v_id uuid;
  v_action text;
  v_metadata jsonb;
begin
  v_org := coalesce(new.organization_id,old.organization_id);
  v_id := coalesce(new.id,old.id);
  v_action := lower(tg_table_name) || '.' || lower(tg_op);
  v_metadata := jsonb_build_object('source','database_trigger');
  if tg_op='UPDATE' then
    v_metadata := v_metadata || jsonb_build_object('changed_at',now());
  end if;
  insert into public.audit_events(organization_id,actor_user_id,action,target_type,target_id,metadata)
  values(v_org,auth.uid(),v_action,tg_table_name,v_id,v_metadata);
  return case when tg_op='DELETE' then old else new end;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'memberships','family_delegations','member_assignments','document_access','consents','workflow_approvals','data_requests'
  ] loop
    execute format('drop trigger if exists iww_sensitive_audit on public.%I',t);
    execute format('create trigger iww_sensitive_audit after insert or update or delete on public.%I for each row execute function public.iww_audit_sensitive_change()',t);
  end loop;
end $$;

-- Prevent clients from manually manufacturing historical activity evidence.
revoke insert,update,delete on public.audit_events from authenticated;
revoke insert,update,delete on public.activity_events from authenticated;

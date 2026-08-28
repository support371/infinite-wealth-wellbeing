-- Controlled staff-role lifecycle.
-- Bootstrap is service-role only and can run only while no active admin exists.
-- Subsequent reviewer/admin grants and revocations require an active admin actor.

create or replace function public.iww_bootstrap_admin(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'auth_user_not_found';
  end if;

  if exists (
    select 1
      from public.iww_user_roles
     where role = 'admin'::public.iww_user_role
       and revoked_at is null
  ) then
    raise exception 'admin_already_bootstrapped';
  end if;

  insert into public.iww_user_roles (user_id, role, granted_by, granted_at, revoked_at)
  values (p_user_id, 'admin', null, now(), null)
  on conflict (user_id, role) do update
    set granted_by = null,
        granted_at = now(),
        revoked_at = null;

  insert into public.iww_audit_events (
    actor_user_id,
    action,
    entity_kind,
    entity_id,
    details
  ) values (
    p_user_id,
    'staff.admin_bootstrapped',
    'user_role',
    p_user_id::text,
    jsonb_build_object('role', 'admin')
  );

  return jsonb_build_object('userId', p_user_id, 'role', 'admin', 'active', true);
end;
$$;

create or replace function public.iww_set_staff_role(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_role public.iww_user_role,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active_admins integer;
begin
  if p_role not in ('reviewer'::public.iww_user_role, 'admin'::public.iww_user_role) then
    raise exception 'invalid_staff_role';
  end if;

  if not exists (
    select 1
      from public.iww_user_roles
     where user_id = p_actor_user_id
       and role = 'admin'::public.iww_user_role
       and revoked_at is null
  ) then
    raise exception 'admin_role_required';
  end if;

  if not exists (select 1 from auth.users where id = p_target_user_id) then
    raise exception 'auth_user_not_found';
  end if;

  if p_role = 'admin'::public.iww_user_role and not p_active then
    select count(*)::integer
      into v_active_admins
      from public.iww_user_roles
     where role = 'admin'::public.iww_user_role
       and revoked_at is null
       and user_id <> p_target_user_id;

    if v_active_admins = 0 then
      raise exception 'last_admin_required';
    end if;
  end if;

  if p_active then
    insert into public.iww_user_roles (user_id, role, granted_by, granted_at, revoked_at)
    values (p_target_user_id, p_role, p_actor_user_id, now(), null)
    on conflict (user_id, role) do update
      set granted_by = p_actor_user_id,
          granted_at = now(),
          revoked_at = null;
  else
    update public.iww_user_roles
       set revoked_at = now()
     where user_id = p_target_user_id
       and role = p_role
       and revoked_at is null;
  end if;

  insert into public.iww_audit_events (
    actor_user_id,
    action,
    entity_kind,
    entity_id,
    details
  ) values (
    p_actor_user_id,
    case when p_active then 'staff.role_granted' else 'staff.role_revoked' end,
    'user_role',
    p_target_user_id::text,
    jsonb_build_object('role', p_role, 'active', p_active)
  );

  return jsonb_build_object(
    'userId', p_target_user_id,
    'role', p_role,
    'active', p_active
  );
end;
$$;

revoke all on function public.iww_bootstrap_admin(uuid) from public, anon, authenticated;
revoke all on function public.iww_set_staff_role(uuid, uuid, public.iww_user_role, boolean) from public, anon, authenticated;
grant execute on function public.iww_bootstrap_admin(uuid) to service_role;
grant execute on function public.iww_set_staff_role(uuid, uuid, public.iww_user_role, boolean) to service_role;

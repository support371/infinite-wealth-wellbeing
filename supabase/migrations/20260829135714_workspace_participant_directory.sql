-- Expose only the minimal participant directory required for scheduling and
-- enforce organization membership and role-safe appointment transitions.

create or replace function private.workspace_participants(target_org uuid)
returns table (
  user_id uuid,
  display_name text,
  role public.app_role
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.app_role := private.current_org_role(target_org);
begin
  if actor_id is null or actor_role is null then
    raise exception 'Active organization membership is required' using errcode = '42501';
  end if;

  return query
  select
    m.user_id,
    coalesce(nullif(p.display_name, ''), nullif(p.full_name, ''), 'IWW member') as display_name,
    m.role
  from public.memberships m
  left join public.profiles p on p.id = m.user_id
  where m.organization_id = target_org
    and m.status = 'active'
    and (
      actor_role in ('owner','admin','operations_manager')
      or m.user_id = actor_id
      or m.role in ('owner','admin','operations_manager','advisor','practitioner')
      or (
        actor_role in ('advisor','practitioner')
        and exists (
          select 1 from public.care_assignments a
          where a.organization_id = target_org
            and a.assigned_user_id = actor_id
            and a.member_id = m.user_id
            and a.status = 'active'
        )
      )
      or (
        actor_role = 'family_delegate'
        and exists (
          select 1 from public.family_delegations d
          where d.organization_id = target_org
            and d.delegate_user_id = actor_id
            and d.member_id = m.user_id
            and d.status = 'active'
            and (d.expires_at is null or d.expires_at > now())
            and 'appointments' = any(d.scopes)
        )
      )
    )
  order by m.role, 2;
end;
$$;

revoke all on function private.workspace_participants(uuid) from public, anon;
grant execute on function private.workspace_participants(uuid) to authenticated;

create or replace function public.workspace_participants(p_organization_id uuid)
returns table (
  user_id uuid,
  display_name text,
  role public.app_role
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.workspace_participants(p_organization_id);
$$;

revoke all on function public.workspace_participants(uuid) from public, anon;
grant execute on function public.workspace_participants(uuid) to authenticated;

create or replace function private.validate_appointment_participants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.app_role := private.current_org_role(new.organization_id);
begin
  if actor_id is null or actor_role is null then
    raise exception 'Active organization membership is required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.memberships m
    where m.organization_id = new.organization_id
      and m.user_id = new.member_id
      and m.status = 'active'
      and m.role = 'member'
  ) then
    raise exception 'Appointment member must belong to the active organization' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.memberships m
    where m.organization_id = new.organization_id
      and m.user_id = new.host_id
      and m.status = 'active'
      and m.role in ('owner','admin','operations_manager','advisor','practitioner')
  ) then
    raise exception 'Appointment host must be an active organization professional' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and actor_role not in ('owner','admin','operations_manager') then
    if new.organization_id is distinct from old.organization_id
       or new.member_id is distinct from old.member_id
       or new.host_id is distinct from old.host_id then
      raise exception 'Only organization operators can reassign an appointment' using errcode = '42501';
    end if;

    if new.status is distinct from old.status then
      if actor_id = old.host_id and new.status in ('confirmed','completed','cancelled','no_show') then
        null;
      elsif actor_id = old.member_id and new.status = 'cancelled' then
        null;
      else
        raise exception 'This role cannot perform the requested appointment transition' using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_appointment_participants() from public, anon;
grant execute on function private.validate_appointment_participants() to authenticated;

create trigger validate_appointment_participants
before insert or update on public.appointments
for each row execute function private.validate_appointment_participants();

create trigger audit_appointments_change
after insert or update or delete on public.appointments
for each row execute function private.capture_governed_change();

comment on function public.workspace_participants(uuid) is
  'Returns the minimal role-safe participant directory used for IWW scheduling.';

create or replace function private.pending_my_invitations()
returns table (
  invitation_id uuid,
  organization_id uuid,
  organization_name text,
  organization_slug text,
  invited_role public.app_role,
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_email text := lower(auth.jwt() ->> 'email');
begin
  if actor_id is null or actor_email is null then
    raise exception 'Authenticated email is required' using errcode = '42501';
  end if;

  return query
  select i.id, o.id, o.name, o.slug, i.role, i.expires_at
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where lower(i.email::text) = actor_email
    and i.status = 'pending'
    and i.expires_at > now()
    and o.status = 'active'
  order by i.created_at desc;
end;
$$;

revoke all on function private.pending_my_invitations() from public, anon;
grant execute on function private.pending_my_invitations() to authenticated;

create or replace function public.pending_my_invitations()
returns table (
  invitation_id uuid,
  organization_id uuid,
  organization_name text,
  organization_slug text,
  invited_role public.app_role,
  expires_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.pending_my_invitations();
$$;

revoke all on function public.pending_my_invitations() from public, anon;
grant execute on function public.pending_my_invitations() to authenticated;

create or replace function private.accept_my_invitation(p_invitation_id uuid)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_email text := lower(auth.jwt() ->> 'email');
  selected_invitation public.invitations;
  selected_organization public.organizations;
begin
  if actor_id is null or actor_email is null then
    raise exception 'Authenticated email is required' using errcode = '42501';
  end if;

  select * into selected_invitation
  from public.invitations i
  where i.id = p_invitation_id
    and lower(i.email::text) = actor_email
    and i.status = 'pending'
    and i.expires_at > now()
  for update;

  if selected_invitation.id is null then
    raise exception 'Invitation is unavailable or expired' using errcode = '22023';
  end if;

  insert into public.memberships (
    organization_id, user_id, role, status, joined_at, created_by
  ) values (
    selected_invitation.organization_id, actor_id, selected_invitation.role,
    'active', now(), selected_invitation.invited_by
  )
  on conflict (organization_id, user_id) do update
    set role = excluded.role, status = 'active', joined_at = now(), updated_at = now();

  update public.invitations
  set status = 'accepted', accepted_by = actor_id, updated_at = now()
  where id = selected_invitation.id;

  select * into selected_organization
  from public.organizations o
  where o.id = selected_invitation.organization_id and o.status = 'active';

  return selected_organization;
end;
$$;

revoke all on function private.accept_my_invitation(uuid) from public, anon;
grant execute on function private.accept_my_invitation(uuid) to authenticated;

create or replace function public.accept_my_invitation(p_invitation_id uuid)
returns public.organizations
language sql
security invoker
set search_path = ''
as $$
  select private.accept_my_invitation(p_invitation_id);
$$;

revoke all on function public.accept_my_invitation(uuid) from public, anon;
grant execute on function public.accept_my_invitation(uuid) to authenticated;

-- Atomically bootstrap an IWW organization and its first owner membership.
-- The public RPC remains security invoker; the privileged implementation is
-- isolated from the API schema and binds every write to the authenticated user.

create or replace function private.create_organization_with_owner(
  p_name text,
  p_slug text
)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  organization_name text := btrim(p_name);
  organization_slug text := lower(btrim(p_slug));
  created_organization public.organizations;
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  if char_length(organization_name) not between 2 and 120 then
    raise exception 'Organization name must be between 2 and 120 characters'
      using errcode = '22023';
  end if;

  if char_length(organization_slug) not between 2 and 63
     or organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Workspace address must be 2 to 63 lowercase letters, numbers, or hyphen-separated words'
      using errcode = '22023';
  end if;

  insert into public.organizations (name, slug, created_by)
  values (organization_name, organization_slug, actor_id)
  returning * into created_organization;

  insert into public.memberships (
    organization_id,
    user_id,
    role,
    status,
    joined_at,
    created_by
  )
  values (
    created_organization.id,
    actor_id,
    'owner'::public.app_role,
    'active',
    now(),
    actor_id
  );

  return created_organization;
end;
$$;

revoke all on function private.create_organization_with_owner(text, text) from public, anon;
grant execute on function private.create_organization_with_owner(text, text) to authenticated;

create or replace function public.create_organization_with_owner(
  p_name text,
  p_slug text
)
returns public.organizations
language sql
security invoker
set search_path = ''
as $$
  select private.create_organization_with_owner(p_name, p_slug);
$$;

revoke all on function public.create_organization_with_owner(text, text) from public, anon;
grant execute on function public.create_organization_with_owner(text, text) to authenticated;

comment on function public.create_organization_with_owner(text, text) is
  'Creates an IWW organization and its authenticated owner membership atomically.';

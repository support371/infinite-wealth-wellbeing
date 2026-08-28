-- Capture the owner/client's request for a GEM-managed IWW organization at
-- creation time. The organization, owner membership, and intake are atomic.

create table public.organization_service_intakes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  submitted_by uuid not null references auth.users(id),
  engagement_type text not null check (engagement_type in ('existing_project','new_project','organization_management')),
  project_name text not null check (char_length(project_name) between 2 and 160),
  project_summary text not null check (char_length(project_summary) between 10 and 3000),
  management_mode text not null check (management_mode in ('gem_managed','collaborative','self_managed')),
  status text not null default 'submitted' check (status in ('submitted','under_review','accepted','active','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_service_intakes_status_idx
  on public.organization_service_intakes(status, created_at desc);

alter table public.organization_service_intakes enable row level security;
alter table public.organization_service_intakes force row level security;

create policy organization_service_intakes_select
  on public.organization_service_intakes for select to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[]));

create policy organization_service_intakes_update
  on public.organization_service_intakes for update to authenticated
  using (private.has_org_role(organization_id, array['owner','admin']::public.app_role[]))
  with check (private.has_org_role(organization_id, array['owner','admin']::public.app_role[]));

create trigger set_organization_service_intakes_updated_at
before update on public.organization_service_intakes
for each row execute function private.set_updated_at();

create trigger audit_organization_service_intakes_change
after insert or update or delete on public.organization_service_intakes
for each row execute function private.capture_governed_change();

create or replace function private.create_managed_organization_with_owner(
  p_name text,
  p_slug text,
  p_engagement_type text,
  p_project_name text,
  p_project_summary text,
  p_management_mode text
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
  project_name text := btrim(p_project_name);
  project_summary text := btrim(p_project_summary);
  created_organization public.organizations;
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if char_length(organization_name) not between 2 and 120 then
    raise exception 'Organization name must be between 2 and 120 characters' using errcode = '22023';
  end if;
  if char_length(organization_slug) not between 2 and 63
     or organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Workspace address must be 2 to 63 lowercase letters, numbers, or hyphen-separated words' using errcode = '22023';
  end if;
  if p_engagement_type not in ('existing_project','new_project','organization_management') then
    raise exception 'Invalid engagement type' using errcode = '22023';
  end if;
  if char_length(project_name) not between 2 and 160 then
    raise exception 'Project name must be between 2 and 160 characters' using errcode = '22023';
  end if;
  if char_length(project_summary) not between 10 and 3000 then
    raise exception 'Project summary must be between 10 and 3000 characters' using errcode = '22023';
  end if;
  if p_management_mode not in ('gem_managed','collaborative','self_managed') then
    raise exception 'Invalid management mode' using errcode = '22023';
  end if;

  insert into public.organizations (name, slug, created_by, brand_settings)
  values (organization_name, organization_slug, actor_id, jsonb_build_object(
    'managed_service', 'infinite_wealth_wellbeing',
    'workspace_origin', 'gem_workspace_os'
  ))
  returning * into created_organization;

  insert into public.memberships (organization_id, user_id, role, status, joined_at, created_by)
  values (created_organization.id, actor_id, 'owner'::public.app_role, 'active', now(), actor_id);

  insert into public.organization_service_intakes (
    organization_id, submitted_by, engagement_type, project_name, project_summary, management_mode
  ) values (
    created_organization.id, actor_id, p_engagement_type, project_name, project_summary, p_management_mode
  );

  return created_organization;
end;
$$;

revoke all on function private.create_managed_organization_with_owner(text,text,text,text,text,text) from public, anon;
grant execute on function private.create_managed_organization_with_owner(text,text,text,text,text,text) to authenticated;

create or replace function public.create_managed_organization_with_owner(
  p_name text,
  p_slug text,
  p_engagement_type text,
  p_project_name text,
  p_project_summary text,
  p_management_mode text
)
returns public.organizations
language sql
security invoker
set search_path = ''
as $$
  select private.create_managed_organization_with_owner(
    p_name, p_slug, p_engagement_type, p_project_name, p_project_summary, p_management_mode
  );
$$;

revoke all on function public.create_managed_organization_with_owner(text,text,text,text,text,text) from public, anon;
grant execute on function public.create_managed_organization_with_owner(text,text,text,text,text,text) to authenticated;

grant select, update on public.organization_service_intakes to authenticated;
revoke insert, delete on public.organization_service_intakes from authenticated, anon;

comment on table public.organization_service_intakes is
  'Owner-submitted GEM management request associated with one IWW organization.';

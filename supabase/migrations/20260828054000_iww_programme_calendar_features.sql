-- Functional depth for programmes and appointment availability.

create table if not exists public.programme_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete cascade,
  title text not null,
  description text,
  sequence_no integer not null default 1 check(sequence_no > 0),
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(programme_id,sequence_no)
);

create table if not exists public.enrolment_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrolment_id uuid not null references public.programme_enrolments(id) on delete cascade,
  milestone_id uuid not null references public.programme_milestones(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null default 'not_started' check(status in ('not_started','in_progress','completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(enrolment_id,milestone_id)
);

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_user_id uuid not null references public.profiles(user_id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'available' check(status in ('available','held','unavailable')),
  source text not null default 'iww' check(source in ('iww','google_calendar','manual')),
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(ends_at>starts_at)
);
create index if not exists availability_blocks_org_staff_start_idx on public.availability_blocks(organization_id,staff_user_id,starts_at);

alter table public.programme_milestones enable row level security;
alter table public.programme_milestones force row level security;
alter table public.enrolment_milestones enable row level security;
alter table public.enrolment_milestones force row level security;
alter table public.availability_blocks enable row level security;
alter table public.availability_blocks force row level security;

create trigger iww_touch_updated_at before update on public.programme_milestones for each row execute function public.iww_set_updated_at();
create trigger iww_touch_updated_at before update on public.enrolment_milestones for each row execute function public.iww_set_updated_at();
create trigger iww_touch_updated_at before update on public.availability_blocks for each row execute function public.iww_set_updated_at();

create policy programme_milestones_member_read on public.programme_milestones for select to authenticated using(
  public.iww_is_member(organization_id) and exists(select 1 from public.programmes p where p.id=programme_id and p.status in ('published','active','completed'))
);
create policy programme_milestones_manage on public.programme_milestones for all to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager'])) with check(public.iww_has_role(organization_id,array['owner','admin','operations_manager']));

create policy enrolment_milestones_read on public.enrolment_milestones for select to authenticated using(user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin','operations_manager']) or exists(select 1 from public.member_assignments a where a.organization_id=enrolment_milestones.organization_id and a.staff_user_id=auth.uid() and a.member_user_id=enrolment_milestones.user_id and a.active));
create policy enrolment_milestones_member_update on public.enrolment_milestones for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy enrolment_milestones_staff_manage on public.enrolment_milestones for all to authenticated using(public.iww_has_role(organization_id,array['owner','admin','operations_manager'])) with check(public.iww_has_role(organization_id,array['owner','admin','operations_manager']));

create policy availability_member_read on public.availability_blocks for select to authenticated using(public.iww_is_member(organization_id) and status='available');
create policy availability_staff_read on public.availability_blocks for select to authenticated using(staff_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin','operations_manager']));
create policy availability_staff_manage on public.availability_blocks for all to authenticated using(staff_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin','operations_manager'])) with check(staff_user_id=auth.uid() or public.iww_has_role(organization_id,array['owner','admin','operations_manager']));

revoke all on public.programme_milestones,public.enrolment_milestones,public.availability_blocks from anon;
grant select,insert,update,delete on public.programme_milestones,public.enrolment_milestones,public.availability_blocks to authenticated;

-- Complete IWW scheduling with organization-scoped availability and a durable
-- reminder queue. Delivery workers may later claim due reminders with a
-- server-side credential; browser clients cannot insert or delete queue rows.

alter table public.integration_catalog add column if not exists logo_url text;
update public.integration_catalog
set logo_url = 'https://cdn.simpleicons.org/' || provider_key
where logo_url is null;

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  timezone text not null default 'America/New_York',
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (organization_id, host_id, weekday, starts_at, ends_at)
);

create table public.appointment_reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app','email','sms','push')),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  attempts smallint not null default 0 check (attempts between 0 and 10),
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, recipient_id, channel, scheduled_for)
);

create index availability_rules_org_host_idx
  on public.availability_rules (organization_id, host_id, weekday)
  where is_active;
create index appointment_reminders_due_idx
  on public.appointment_reminders (scheduled_for, id)
  where status = 'pending';
create index appointment_reminders_org_recipient_idx
  on public.appointment_reminders (organization_id, recipient_id, scheduled_for desc);
create index appointments_org_host_schedule_idx
  on public.appointments (organization_id, host_id, starts_at, ends_at)
  where status in ('requested','confirmed');

alter table public.availability_rules enable row level security;
alter table public.availability_rules force row level security;
alter table public.appointment_reminders enable row level security;
alter table public.appointment_reminders force row level security;

create policy availability_rules_select on public.availability_rules
for select to authenticated using (private.is_org_member(organization_id));
create policy availability_rules_insert on public.availability_rules
for insert to authenticated with check (
  created_by = (select auth.uid())
  and (
    host_id = (select auth.uid())
    or private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
  )
);
create policy availability_rules_update on public.availability_rules
for update to authenticated using (
  host_id = (select auth.uid())
  or private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
) with check (
  host_id = (select auth.uid())
  or private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
);
create policy availability_rules_delete on public.availability_rules
for delete to authenticated using (
  host_id = (select auth.uid())
  or private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
);

create policy appointment_reminders_select on public.appointment_reminders
for select to authenticated using (
  recipient_id = (select auth.uid())
  or exists (
    select 1 from public.appointments a
    where a.id = appointment_id
      and a.organization_id = organization_id
      and private.can_access_member(a.organization_id, a.member_id, 'appointments')
  )
);
create policy appointment_reminders_update on public.appointment_reminders
for update to authenticated using (
  private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
) with check (
  private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
);

create trigger set_availability_rules_updated_at
before update on public.availability_rules
for each row execute function private.set_updated_at();
create trigger set_appointment_reminders_updated_at
before update on public.appointment_reminders
for each row execute function private.set_updated_at();

create or replace function private.validate_availability_rule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.memberships m
    where m.organization_id = new.organization_id
      and m.user_id = new.host_id
      and m.status = 'active'
      and m.role in ('owner','admin','operations_manager','advisor','practitioner')
  ) then
    raise exception 'Availability host must be an active organization professional' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_availability_rule() from public, anon;
grant execute on function private.validate_availability_rule() to authenticated;
create trigger validate_availability_rule
before insert or update on public.availability_rules
for each row execute function private.validate_availability_rule();

create or replace function private.validate_appointment_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status not in ('requested','confirmed') then
    return new;
  end if;

  if exists (
    select 1 from public.availability_rules ar
    where ar.organization_id = new.organization_id
      and ar.host_id = new.host_id
      and ar.is_active
  ) and not exists (
    select 1 from public.availability_rules ar
    where ar.organization_id = new.organization_id
      and ar.host_id = new.host_id
      and ar.is_active
      and ar.weekday = extract(dow from new.starts_at at time zone ar.timezone)::smallint
      and (new.starts_at at time zone ar.timezone)::time >= ar.starts_at
      and (new.ends_at at time zone ar.timezone)::date = (new.starts_at at time zone ar.timezone)::date
      and (new.ends_at at time zone ar.timezone)::time <= ar.ends_at
  ) then
    raise exception 'Requested time is outside the host availability' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.organization_id = new.organization_id
      and a.host_id = new.host_id
      and a.id <> new.id
      and a.status in ('requested','confirmed')
      and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(new.starts_at, new.ends_at, '[)')
  ) then
    raise exception 'Requested time overlaps an existing appointment' using errcode = '23P01';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_appointment_schedule() from public, anon;
grant execute on function private.validate_appointment_schedule() to authenticated;
create trigger validate_appointment_schedule
before insert or update of organization_id, host_id, starts_at, ends_at, status on public.appointments
for each row execute function private.validate_appointment_schedule();

create or replace function private.sync_appointment_reminders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hours_before numeric := greatest(0.25, least(168, coalesce((new.reminder_settings ->> 'hours_before')::numeric, 24)));
  selected_channel text := coalesce(nullif(new.reminder_settings ->> 'channel', ''), 'in_app');
  reminder_time timestamptz := new.starts_at - make_interval(secs => (hours_before * 3600)::double precision);
begin
  update public.appointment_reminders
  set status = 'cancelled', updated_at = now()
  where appointment_id = new.id and status in ('pending','processing');

  if new.status in ('requested','confirmed') and new.starts_at > now() then
    insert into public.appointment_reminders (
      organization_id, appointment_id, recipient_id, channel, scheduled_for
    ) values
      (new.organization_id, new.id, new.member_id, selected_channel, reminder_time),
      (new.organization_id, new.id, new.host_id, selected_channel, reminder_time)
    on conflict (appointment_id, recipient_id, channel, scheduled_for)
    do update set status = 'pending', attempts = 0, delivered_at = null, last_error = null, updated_at = now();
  end if;
  return new;
end;
$$;

revoke all on function private.sync_appointment_reminders() from public, anon;
grant execute on function private.sync_appointment_reminders() to authenticated;
create trigger sync_appointment_reminders
after insert or update of starts_at, ends_at, member_id, host_id, status, reminder_settings on public.appointments
for each row execute function private.sync_appointment_reminders();

create trigger audit_availability_rules_change
after insert or update or delete on public.availability_rules
for each row execute function private.capture_governed_change();

comment on table public.availability_rules is
  'Organization-scoped professional availability used to validate IWW booking requests.';
comment on table public.appointment_reminders is
  'Durable delivery queue generated from appointment reminder settings; browser inserts are prohibited.';

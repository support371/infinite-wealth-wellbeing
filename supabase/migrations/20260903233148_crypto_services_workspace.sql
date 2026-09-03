-- Tenant-scoped Crypto Services intake, KYC gating and staff approval.
create table public.crypto_service_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  service_type text not null check (service_type in (
    'digital_asset_education',
    'market_intelligence',
    'portfolio_readiness',
    'exchange_connection',
    'signal_service'
  )),
  experience_level text not null check (experience_level in ('new','developing','experienced')),
  preferred_support text not null check (preferred_support in ('self_guided','advisor_session','managed_setup')),
  objective text not null check (char_length(trim(objective)) between 20 and 2000),
  risk_acknowledged boolean not null default false,
  status text not null default 'draft' check (status in (
    'draft','submitted','under_review','approved','resubmission_required','declined'
  )),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewer_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, requester_id),
  check (status = 'draft' or risk_acknowledged),
  check (status not in ('submitted','under_review','approved','resubmission_required','declined') or submitted_at is not null),
  check (status not in ('approved','resubmission_required','declined') or (reviewed_at is not null and reviewed_by is not null))
);

create index crypto_service_requests_org_status_idx
  on public.crypto_service_requests(organization_id, status, submitted_at desc);
create index crypto_service_requests_requester_idx
  on public.crypto_service_requests(requester_id);
create index crypto_service_requests_reviewer_idx
  on public.crypto_service_requests(reviewed_by) where reviewed_by is not null;

alter table public.crypto_service_requests enable row level security;
alter table public.crypto_service_requests force row level security;

create policy crypto_service_requests_select
  on public.crypto_service_requests for select to authenticated using (
    requester_id = (select auth.uid())
    or private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
  );

create policy crypto_service_requests_insert
  on public.crypto_service_requests for insert to authenticated with check (
    requester_id = (select auth.uid())
    and private.is_org_member(organization_id)
    and status = 'draft'
    and reviewed_at is null and reviewed_by is null
  );

create policy crypto_service_requests_member_update
  on public.crypto_service_requests for update to authenticated using (
    requester_id = (select auth.uid()) and status in ('draft','resubmission_required')
  ) with check (
    requester_id = (select auth.uid())
    and private.is_org_member(organization_id)
    and status in ('draft','submitted')
    and reviewed_at is null and reviewed_by is null
  );

create policy crypto_service_requests_staff_update
  on public.crypto_service_requests for update to authenticated using (
    private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
    and requester_id <> (select auth.uid())
  ) with check (
    private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
    and requester_id <> (select auth.uid())
  );

grant select, insert, update on public.crypto_service_requests to authenticated;
revoke delete on public.crypto_service_requests from authenticated, anon;

create or replace function private.enforce_crypto_service_request_transition()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  staff boolean := private.has_org_role(old.organization_id, array['owner','admin','operations_manager']::public.app_role[]);
begin
  if actor is null then raise exception 'Authentication is required'; end if;

  if old.status not in ('draft','resubmission_required') and (
    new.organization_id is distinct from old.organization_id
    or new.requester_id is distinct from old.requester_id
    or new.service_type is distinct from old.service_type
    or new.experience_level is distinct from old.experience_level
    or new.preferred_support is distinct from old.preferred_support
    or new.objective is distinct from old.objective
    or new.risk_acknowledged is distinct from old.risk_acknowledged
  ) then raise exception 'Submitted crypto service details are immutable'; end if;

  if staff and old.requester_id <> actor then
    if old.status = 'submitted' and new.status not in ('under_review','approved','resubmission_required','declined') then
      raise exception 'Invalid crypto service review transition';
    elsif old.status = 'under_review' and new.status not in ('approved','resubmission_required','declined') then
      raise exception 'Invalid crypto service review transition';
    elsif old.status in ('approved','declined') and new.status <> old.status then
      raise exception 'Final crypto service decisions cannot be changed';
    end if;
    if new.status = 'approved' and not exists (
      select 1 from public.kyc_cases k
      where k.organization_id = old.organization_id
        and k.subject_user_id = old.requester_id
        and k.status = 'approved'
    ) then raise exception 'Approved KYC is required before Crypto Services activation'; end if;
    if new.status in ('approved','resubmission_required','declined') and (new.reviewed_by <> actor or new.reviewed_at is null) then
      raise exception 'A final crypto service decision requires the authenticated reviewer';
    end if;
  elsif old.requester_id = actor then
    if new.status not in ('draft','submitted') then raise exception 'Members cannot approve crypto service access'; end if;
    if new.reviewed_by is not null or new.reviewed_at is not null then raise exception 'Members cannot set reviewer fields'; end if;
  else
    raise exception 'Crypto service request update is not authorized';
  end if;

  if new.status = 'submitted' and (not new.risk_acknowledged or new.submitted_at is null) then
    raise exception 'Submission requires risk acknowledgement and submission time';
  end if;
  new.updated_at := now();
  return new;
end $$;

revoke all on function private.enforce_crypto_service_request_transition() from public, anon;
grant execute on function private.enforce_crypto_service_request_transition() to authenticated;

create trigger enforce_crypto_service_request_transition
before update on public.crypto_service_requests
for each row execute function private.enforce_crypto_service_request_transition();

create trigger audit_crypto_service_requests_change
after insert or update or delete on public.crypto_service_requests
for each row execute function private.capture_governed_change();

comment on table public.crypto_service_requests is
  'Governed IWW Crypto Services requests. Exchange credentials, private keys and wallet recovery phrases must never be stored here.';

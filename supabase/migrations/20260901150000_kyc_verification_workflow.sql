-- Tenant-scoped KYC completion, review and management.
create type public.kyc_status as enum (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'resubmission_required',
  'rejected'
);

create table public.kyc_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_user_id uuid not null references public.profiles(id) on delete cascade,
  legal_name text not null,
  date_of_birth date not null,
  country_of_residence text not null,
  residential_address text not null,
  nationality text not null,
  document_type text not null check (document_type in ('passport','drivers_license','national_id','residence_permit')),
  document_country text not null,
  document_last_four text not null check (document_last_four ~ '^[A-Za-z0-9]{4}$'),
  status public.kyc_status not null default 'draft',
  certification_accepted boolean not null default false,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewer_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, subject_user_id),
  check (status = 'draft' or certification_accepted),
  check (status not in ('submitted','under_review','approved','resubmission_required','rejected') or submitted_at is not null),
  check (status not in ('approved','resubmission_required','rejected') or (reviewed_at is not null and reviewed_by is not null))
);

create table public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.kyc_cases(id) on delete cascade,
  subject_user_id uuid not null references public.profiles(id) on delete cascade,
  document_kind text not null check (document_kind in ('identity_front','identity_back','proof_of_address','supporting_document')),
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create index kyc_cases_org_status_idx on public.kyc_cases(organization_id, status, submitted_at desc);
create index kyc_documents_case_idx on public.kyc_documents(case_id, created_at);

alter table public.kyc_cases enable row level security;
alter table public.kyc_cases force row level security;
alter table public.kyc_documents enable row level security;
alter table public.kyc_documents force row level security;

create policy kyc_cases_select on public.kyc_cases for select to authenticated using (
  subject_user_id = (select auth.uid())
  or private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
);
create policy kyc_cases_insert on public.kyc_cases for insert to authenticated with check (
  subject_user_id = (select auth.uid())
  and private.is_org_member(organization_id)
  and status = 'draft'
  and reviewed_at is null and reviewed_by is null
);
create policy kyc_cases_subject_update on public.kyc_cases for update to authenticated using (
  subject_user_id = (select auth.uid()) and status in ('draft','resubmission_required')
) with check (
  subject_user_id = (select auth.uid())
  and private.is_org_member(organization_id)
  and status in ('draft','submitted')
  and reviewed_at is null and reviewed_by is null
);
create policy kyc_cases_staff_update on public.kyc_cases for update to authenticated using (
  private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
  and subject_user_id <> (select auth.uid())
) with check (
  private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
  and subject_user_id <> (select auth.uid())
);

create policy kyc_documents_select on public.kyc_documents for select to authenticated using (
  subject_user_id = (select auth.uid())
  or private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
);
create policy kyc_documents_insert on public.kyc_documents for insert to authenticated with check (
  subject_user_id = (select auth.uid())
  and private.is_org_member(organization_id)
  and exists (
    select 1 from public.kyc_cases c
    where c.id = case_id and c.organization_id = organization_id
      and c.subject_user_id = (select auth.uid())
      and c.status in ('draft','resubmission_required')
  )
);
create policy kyc_documents_delete on public.kyc_documents for delete to authenticated using (
  subject_user_id = (select auth.uid())
  and exists (
    select 1 from public.kyc_cases c
    where c.id = case_id and c.subject_user_id = (select auth.uid())
      and c.status in ('draft','resubmission_required')
  )
);

grant select, insert, update on public.kyc_cases to authenticated;
grant select, insert, delete on public.kyc_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('iww-kyc-documents', 'iww-kyc-documents', false, 10485760,
  array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy iww_kyc_storage_select on storage.objects for select to authenticated using (
  bucket_id = 'iww-kyc-documents' and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or private.has_org_role(((storage.foldername(name))[1])::uuid, array['owner','admin','operations_manager']::public.app_role[])
  )
);
create policy iww_kyc_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'iww-kyc-documents'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and private.is_org_member(((storage.foldername(name))[1])::uuid)
);
create policy iww_kyc_storage_delete on storage.objects for delete to authenticated using (
  bucket_id = 'iww-kyc-documents'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.kyc_cases c
    where c.id = ((storage.foldername(name))[3])::uuid
      and c.subject_user_id = (select auth.uid())
      and c.status in ('draft','resubmission_required')
  )
);

create or replace function private.enforce_kyc_case_transition()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  staff boolean := private.has_org_role(old.organization_id, array['owner','admin','operations_manager']::public.app_role[]);
begin
  if actor is null then raise exception 'Authentication is required'; end if;

  if old.status not in ('draft','resubmission_required') and (
    new.organization_id is distinct from old.organization_id
    or new.subject_user_id is distinct from old.subject_user_id
    or new.legal_name is distinct from old.legal_name
    or new.date_of_birth is distinct from old.date_of_birth
    or new.country_of_residence is distinct from old.country_of_residence
    or new.residential_address is distinct from old.residential_address
    or new.nationality is distinct from old.nationality
    or new.document_type is distinct from old.document_type
    or new.document_country is distinct from old.document_country
    or new.document_last_four is distinct from old.document_last_four
  ) then raise exception 'Submitted identity details are immutable'; end if;

  if staff and old.subject_user_id <> actor then
    if old.status = 'submitted' and new.status not in ('under_review','approved','resubmission_required','rejected') then
      raise exception 'Invalid KYC review transition';
    elsif old.status = 'under_review' and new.status not in ('approved','resubmission_required','rejected') then
      raise exception 'Invalid KYC review transition';
    elsif old.status in ('approved','rejected') and new.status <> old.status then
      raise exception 'Final KYC decisions cannot be changed';
    end if;
    if new.status in ('approved','resubmission_required','rejected') and (new.reviewed_by <> actor or new.reviewed_at is null) then
      raise exception 'A final KYC decision requires the authenticated reviewer';
    end if;
  elsif old.subject_user_id = actor then
    if new.status not in ('draft','submitted') then raise exception 'Members cannot approve or review KYC cases'; end if;
    if new.reviewed_by is not null or new.reviewed_at is not null then raise exception 'Members cannot set reviewer fields'; end if;
  else
    raise exception 'KYC case update is not authorized';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function private.enforce_kyc_case_transition() from public, anon;
grant execute on function private.enforce_kyc_case_transition() to authenticated;

create trigger enforce_kyc_case_transition
before update on public.kyc_cases
for each row execute function private.enforce_kyc_case_transition();

create trigger audit_kyc_cases_change
after insert or update or delete on public.kyc_cases
for each row execute function private.capture_governed_change();

create trigger audit_kyc_documents_change
after insert or delete on public.kyc_documents
for each row execute function private.capture_governed_change();

drop policy if exists kyc_cases_subject_update on public.kyc_cases;
drop policy if exists kyc_cases_staff_update on public.kyc_cases;

create policy kyc_cases_update on public.kyc_cases for update to authenticated using (
  (
    subject_user_id = (select auth.uid())
    and status in ('draft','resubmission_required')
  )
  or (
    private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
    and subject_user_id <> (select auth.uid())
  )
) with check (
  (
    subject_user_id = (select auth.uid())
    and private.is_org_member(organization_id)
    and status in ('draft','submitted')
    and reviewed_at is null and reviewed_by is null
  )
  or (
    private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
    and subject_user_id <> (select auth.uid())
  )
);

create index if not exists kyc_cases_subject_idx on public.kyc_cases(subject_user_id);
create index if not exists kyc_cases_reviewer_idx on public.kyc_cases(reviewed_by) where reviewed_by is not null;
create index if not exists kyc_documents_org_subject_idx on public.kyc_documents(organization_id, subject_user_id);


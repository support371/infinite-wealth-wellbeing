-- Use one selective UPDATE policy so Postgres evaluates a single authorization path.
drop policy if exists crypto_service_requests_member_update on public.crypto_service_requests;
drop policy if exists crypto_service_requests_staff_update on public.crypto_service_requests;

create policy crypto_service_requests_update
  on public.crypto_service_requests for update to authenticated using (
    (
      requester_id = (select auth.uid())
      and status in ('draft','resubmission_required')
    )
    or (
      private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
      and requester_id <> (select auth.uid())
    )
  ) with check (
    (
      requester_id = (select auth.uid())
      and private.is_org_member(organization_id)
      and status in ('draft','submitted')
      and reviewed_at is null and reviewed_by is null
    )
    or (
      private.has_org_role(organization_id, array['owner','admin','operations_manager']::public.app_role[])
      and requester_id <> (select auth.uid())
    )
  );

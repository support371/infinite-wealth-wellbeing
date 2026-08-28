-- Staff member-directory visibility: admins/operations see the organization; advisors/practitioners see assigned members only.
drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships for select to authenticated using(
  user_id=auth.uid()
  or public.iww_has_role(organization_id,array['owner','admin','operations_manager'])
  or exists(
    select 1 from public.member_assignments a
    where a.organization_id=memberships.organization_id
      and a.staff_user_id=auth.uid()
      and a.member_user_id=memberships.user_id
      and a.active
  )
);

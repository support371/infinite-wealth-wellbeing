-- Server-only current privileged-access state.
-- Every privileged API can verify both active role and current verified MFA,
-- so removing the last verified factor invalidates staff access even if an
-- already-issued aal2 token has not yet expired.

create or replace function public.iww_staff_access_state(
  p_user_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'mfaVerified', exists (
      select 1
        from auth.mfa_factors f
       where f.user_id = p_user_id
         and f.status = 'verified'
    ),
    'roles', coalesce((
      select jsonb_agg(r.role::text order by r.role::text)
        from public.iww_user_roles r
       where r.user_id = p_user_id
         and r.role in ('reviewer'::public.iww_user_role, 'admin'::public.iww_user_role)
         and r.revoked_at is null
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.iww_staff_access_state(uuid) from public, anon, authenticated;
grant execute on function public.iww_staff_access_state(uuid) to service_role;

create or replace function public.enrol_iww_programme(p_organization_id uuid, p_programme_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_enrolment uuid; v_user uuid:=auth.uid();
begin
  if v_user is null or not public.iww_is_member(p_organization_id) then raise exception 'organization_access_denied'; end if;
  if not exists(select 1 from public.programmes p where p.id=p_programme_id and p.organization_id=p_organization_id and p.status in ('published','active')) then
    raise exception 'programme_not_available';
  end if;
  insert into public.programme_enrolments(organization_id,user_id,programme_id,status,enrolled_at,created_by)
  values(p_organization_id,v_user,p_programme_id,'enrolled',now(),v_user)
  on conflict(programme_id,user_id) do update set status='enrolled',updated_at=now()
  returning id into v_enrolment;

  insert into public.enrolment_milestones(organization_id,enrolment_id,milestone_id,user_id,status)
  select p_organization_id,v_enrolment,m.id,v_user,'not_started'
  from public.programme_milestones m where m.organization_id=p_organization_id and m.programme_id=p_programme_id
  on conflict(enrolment_id,milestone_id) do nothing;

  insert into public.audit_events(organization_id,actor_user_id,action,target_type,target_id,metadata)
  values(p_organization_id,v_user,'programme.enrolled','programme_enrolment',v_enrolment,jsonb_build_object('programme_id',p_programme_id));
  return v_enrolment;
end;
$$;
revoke all on function public.enrol_iww_programme(uuid,uuid) from public;
grant execute on function public.enrol_iww_programme(uuid,uuid) to authenticated;

create policy enrolment_milestones_member_insert on public.enrolment_milestones for insert to authenticated with check(
  user_id=auth.uid() and exists(select 1 from public.programme_enrolments e where e.id=enrolment_id and e.user_id=auth.uid() and e.organization_id=enrolment_milestones.organization_id)
);

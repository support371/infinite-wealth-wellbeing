-- Database-level abuse guard for public intake.
-- This is a secondary control; edge/WAF rate limiting remains desirable for distributed abuse.
-- No IP address is collected by this migration.

create index if not exists iww_inquiries_email_created_idx
  on public.iww_inquiries (lower(email), created_at desc);

create index if not exists iww_membership_applications_email_created_idx
  on public.iww_membership_applications (lower(email), created_at desc);

create or replace function iww_private.enforce_intake_throttle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
begin
  if tg_table_name = 'iww_inquiries' then
    select count(*)::integer
      into v_recent
      from public.iww_inquiries
     where lower(email) = lower(new.email)
       and created_at >= now() - interval '15 minutes';

    if v_recent >= 5 then
      raise exception 'intake_rate_limited';
    end if;
  elsif tg_table_name = 'iww_membership_applications' then
    select count(*)::integer
      into v_recent
      from public.iww_membership_applications
     where lower(email) = lower(new.email)
       and created_at >= now() - interval '24 hours';

    if v_recent >= 3 then
      raise exception 'intake_rate_limited';
    end if;
  end if;

  return new;
end;
$$;

create trigger iww_inquiries_intake_throttle
before insert on public.iww_inquiries
for each row execute function iww_private.enforce_intake_throttle();

create trigger iww_membership_applications_intake_throttle
before insert on public.iww_membership_applications
for each row execute function iww_private.enforce_intake_throttle();

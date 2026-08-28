-- Cover the authenticated submitter foreign key used for owner intake reviews.
create index organization_service_intakes_submitted_by_idx
  on public.organization_service_intakes(submitted_by);

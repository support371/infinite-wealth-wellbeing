-- Private IWW document storage. No public bucket or cross-tenant path fallback.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'iww-documents',
  'iww-documents',
  false,
  26214400,
  array[
    'application/pdf','image/png','image/jpeg','image/webp','text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Expected object path: <organization_uuid>/<user_uuid>/<opaque-id>-<safe-name>
drop policy if exists iww_documents_storage_insert on storage.objects;
create policy iww_documents_storage_insert on storage.objects
for insert to authenticated with check (
  bucket_id='iww-documents'
  and (storage.foldername(name))[2]=auth.uid()::text
  and exists(
    select 1 from public.memberships m
    where m.organization_id::text=(storage.foldername(name))[1]
      and m.user_id=auth.uid() and m.status='active'
  )
);

drop policy if exists iww_documents_storage_select on storage.objects;
create policy iww_documents_storage_select on storage.objects
for select to authenticated using (
  bucket_id='iww-documents'
  and (
    (storage.foldername(name))[2]=auth.uid()::text
    or exists(
      select 1 from public.documents d
      where d.storage_path=storage.objects.name
        and (
          public.iww_has_role(d.organization_id,array['owner','admin'])
          or exists(select 1 from public.document_access da where da.document_id=d.id and da.user_id=auth.uid())
          or public.iww_family_scope(d.organization_id,d.user_id,'documents')
        )
    )
  )
);

drop policy if exists iww_documents_storage_update on storage.objects;
create policy iww_documents_storage_update on storage.objects
for update to authenticated using (
  bucket_id='iww-documents'
  and (
    (storage.foldername(name))[2]=auth.uid()::text
    or exists(select 1 from public.documents d where d.storage_path=storage.objects.name and public.iww_has_role(d.organization_id,array['owner','admin']))
  )
) with check(bucket_id='iww-documents');

drop policy if exists iww_documents_storage_delete on storage.objects;
create policy iww_documents_storage_delete on storage.objects
for delete to authenticated using (
  bucket_id='iww-documents'
  and (
    (storage.foldername(name))[2]=auth.uid()::text
    or exists(select 1 from public.documents d where d.storage_path=storage.objects.name and public.iww_has_role(d.organization_id,array['owner','admin']))
  )
);

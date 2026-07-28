-- =====================================================================
-- Seawise Web Platform — 003 Storage bucket untuk media klien
-- Konvensi path: {site_id}/{filename}
-- Isolasi dilakukan dengan mencocokkan folder pertama ke site_id user.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists site_media_public_read on storage.objects;
drop policy if exists site_media_owner_write on storage.objects;

create policy site_media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'site-media');

-- Folder pertama harus berupa UUID yang valid. Pengecekan regex dilakukan
-- lebih dulu supaya cast ke uuid tidak melempar error saat ada berkas dengan
-- struktur folder tak terduga — error di dalam policy akan memblokir semua
-- operasi, bukan hanya berkas yang bermasalah.
create or replace function public.storage_site_id(object_name text)
returns uuid
language sql
immutable
as $$
  select case
    when (storage.foldername(object_name))[1] ~*
         '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then ((storage.foldername(object_name))[1])::uuid
    else null
  end;
$$;

create policy site_media_owner_write on storage.objects
  for all to authenticated
  using (
    bucket_id = 'site-media'
    and public.storage_site_id(name) is not null
    and public.has_site_access(public.storage_site_id(name))
  )
  with check (
    bucket_id = 'site-media'
    and public.storage_site_id(name) is not null
    and public.has_site_access(public.storage_site_id(name))
  );

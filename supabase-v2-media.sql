-- AYDEMIR V2 MEDIA + AUTOSAVE DATABASE PATCH

alter table public.listings
add column if not exists listing_video_url text;

alter table public.listings
add column if not exists listing_video_storage_path text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'listing-media',
  'listing-media',
  true,
  157286400,
  array[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v'
  ]
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists
  "public listing media read"
on storage.objects;

create policy
  "public listing media read"
on storage.objects
for select
to public
using (
  bucket_id = 'listing-media'
);

drop policy if exists
  "authenticated listing media upload"
on storage.objects;

create policy
  "authenticated listing media upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-media'
);

drop policy if exists
  "authenticated listing media update"
on storage.objects;

create policy
  "authenticated listing media update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-media'
)
with check (
  bucket_id = 'listing-media'
);

drop policy if exists
  "authenticated listing media delete"
on storage.objects;

create policy
  "authenticated listing media delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-media'
);

notify pgrst, 'reload schema';

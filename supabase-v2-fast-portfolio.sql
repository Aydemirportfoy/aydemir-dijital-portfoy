-- AYDEMIR V2 FAST PORTFOLIO + PRIVATE DETAILS DATABASE PATCH

alter table public.listings
add column if not exists listing_video_url text;

alter table public.listings
add column if not exists listing_video_storage_path text;

create table if not exists public.listing_private_details (
  listing_id uuid primary key
    references public.listings(id)
    on delete cascade,
  seller_name text,
  seller_phone text,
  available_credit_amount numeric,
  maps_url text,
  location_note text,
  created_at timestamptz not null
    default now(),
  updated_at timestamptz not null
    default now()
);

alter table public.listing_private_details
add column if not exists seller_name text;

alter table public.listing_private_details
add column if not exists seller_phone text;

alter table public.listing_private_details
add column if not exists available_credit_amount numeric;

alter table public.listing_private_details
add column if not exists maps_url text;

alter table public.listing_private_details
add column if not exists location_note text;

alter table public.listing_private_details
add column if not exists created_at timestamptz
default now();

alter table public.listing_private_details
add column if not exists updated_at timestamptz
default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
  listing_private_details_set_updated_at
on public.listing_private_details;

create trigger
  listing_private_details_set_updated_at
before update
on public.listing_private_details
for each row
execute function public.set_updated_at();

alter table public.listing_private_details
enable row level security;

drop policy if exists
  "authenticated private details select"
on public.listing_private_details;

create policy
  "authenticated private details select"
on public.listing_private_details
for select
to authenticated
using (true);

drop policy if exists
  "authenticated private details insert"
on public.listing_private_details;

create policy
  "authenticated private details insert"
on public.listing_private_details
for insert
to authenticated
with check (true);

drop policy if exists
  "authenticated private details update"
on public.listing_private_details;

create policy
  "authenticated private details update"
on public.listing_private_details
for update
to authenticated
using (true)
with check (true);

drop policy if exists
  "authenticated private details delete"
on public.listing_private_details;

create policy
  "authenticated private details delete"
on public.listing_private_details
for delete
to authenticated
using (true);

revoke all
on public.listing_private_details
from anon;

grant select, insert, update, delete
on public.listing_private_details
to authenticated;

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
  47185920,
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

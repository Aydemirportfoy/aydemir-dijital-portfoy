create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  project_name text,
  title text not null,
  city text not null default 'Antalya',
  district text not null default 'Kepez',
  neighborhood text not null,
  room_count text,
  area_m2 numeric,
  gross_area_m2 numeric,
  floor text,
  facade text,
  kitchen_type text,
  price numeric,
  short_description text,
  description text,
  features text[] not null default '{}',
  credit_available boolean not null default false,
  exchange_available boolean not null default false,
  commission_free boolean not null default true,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'reserved', 'sold')),
  cover_image_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings add column if not exists project_name text;
alter table public.listings add column if not exists city text default 'Antalya';
alter table public.listings add column if not exists district text default 'Kepez';
alter table public.listings add column if not exists neighborhood text;
alter table public.listings add column if not exists room_count text;
alter table public.listings add column if not exists area_m2 numeric;
alter table public.listings add column if not exists gross_area_m2 numeric;
alter table public.listings add column if not exists floor text;
alter table public.listings add column if not exists facade text;
alter table public.listings add column if not exists kitchen_type text;
alter table public.listings add column if not exists price numeric;
alter table public.listings add column if not exists short_description text;
alter table public.listings add column if not exists description text;
alter table public.listings add column if not exists features text[] default '{}';
alter table public.listings add column if not exists credit_available boolean default false;
alter table public.listings add column if not exists exchange_available boolean default false;
alter table public.listings add column if not exists commission_free boolean default true;
alter table public.listings add column if not exists cover_image_url text;
alter table public.listings add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.listings add column if not exists created_at timestamptz default now();
alter table public.listings add column if not exists updated_at timestamptz default now();

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  storage_path text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.listing_images add column if not exists storage_path text;
alter table public.listing_images add column if not exists position integer default 0;
alter table public.listing_images add column if not exists created_at timestamptz default now();

create index if not exists listing_images_listing_position_idx
  on public.listing_images(listing_id, position);

create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  customer_name text not null,
  title text,
  note text,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.presentations add column if not exists title text;
alter table public.presentations add column if not exists note text;
alter table public.presentations add column if not exists status text default 'active';
alter table public.presentations add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.presentations add column if not exists created_at timestamptz default now();
alter table public.presentations add column if not exists updated_at timestamptz default now();

create table if not exists public.presentation_listings (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (presentation_id, listing_id)
);

alter table public.presentation_listings add column if not exists position integer default 0;
alter table public.presentation_listings add column if not exists created_at timestamptz default now();

create index if not exists presentation_listings_position_idx
  on public.presentation_listings(presentation_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

drop trigger if exists presentations_set_updated_at on public.presentations;
create trigger presentations_set_updated_at
before update on public.presentations
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.presentations enable row level security;
alter table public.presentation_listings enable row level security;

drop policy if exists "public active listings" on public.listings;
create policy "public active listings"
on public.listings for select to anon
using (status = 'active');

drop policy if exists "authenticated listings select" on public.listings;
create policy "authenticated listings select"
on public.listings for select to authenticated using (true);

drop policy if exists "authenticated listings insert" on public.listings;
create policy "authenticated listings insert"
on public.listings for insert to authenticated with check (true);

drop policy if exists "authenticated listings update" on public.listings;
create policy "authenticated listings update"
on public.listings for update to authenticated using (true) with check (true);

drop policy if exists "authenticated listings delete" on public.listings;
create policy "authenticated listings delete"
on public.listings for delete to authenticated using (true);

drop policy if exists "public active listing images" on public.listing_images;
create policy "public active listing images"
on public.listing_images for select to anon
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_images.listing_id
      and listings.status = 'active'
  )
);

drop policy if exists "authenticated listing images select" on public.listing_images;
create policy "authenticated listing images select"
on public.listing_images for select to authenticated using (true);

drop policy if exists "authenticated listing images insert" on public.listing_images;
create policy "authenticated listing images insert"
on public.listing_images for insert to authenticated with check (true);

drop policy if exists "authenticated listing images update" on public.listing_images;
create policy "authenticated listing images update"
on public.listing_images for update to authenticated using (true) with check (true);

drop policy if exists "authenticated listing images delete" on public.listing_images;
create policy "authenticated listing images delete"
on public.listing_images for delete to authenticated using (true);

drop policy if exists "public active presentations" on public.presentations;
create policy "public active presentations"
on public.presentations for select to anon
using (status = 'active');

drop policy if exists "authenticated presentations select" on public.presentations;
create policy "authenticated presentations select"
on public.presentations for select to authenticated using (true);

drop policy if exists "authenticated presentations insert" on public.presentations;
create policy "authenticated presentations insert"
on public.presentations for insert to authenticated with check (true);

drop policy if exists "authenticated presentations update" on public.presentations;
create policy "authenticated presentations update"
on public.presentations for update to authenticated using (true) with check (true);

drop policy if exists "authenticated presentations delete" on public.presentations;
create policy "authenticated presentations delete"
on public.presentations for delete to authenticated using (true);

drop policy if exists "public active presentation links" on public.presentation_listings;
create policy "public active presentation links"
on public.presentation_listings for select to anon
using (
  exists (
    select 1 from public.presentations
    where presentations.id = presentation_listings.presentation_id
      and presentations.status = 'active'
  )
);

drop policy if exists "authenticated presentation links select" on public.presentation_listings;
create policy "authenticated presentation links select"
on public.presentation_listings for select to authenticated using (true);

drop policy if exists "authenticated presentation links insert" on public.presentation_listings;
create policy "authenticated presentation links insert"
on public.presentation_listings for insert to authenticated with check (true);

drop policy if exists "authenticated presentation links update" on public.presentation_listings;
create policy "authenticated presentation links update"
on public.presentation_listings for update to authenticated using (true) with check (true);

drop policy if exists "authenticated presentation links delete" on public.presentation_listings;
create policy "authenticated presentation links delete"
on public.presentation_listings for delete to authenticated using (true);

drop policy if exists "public listing image read" on storage.objects;
create policy "public listing image read"
on storage.objects for select to public
using (bucket_id = 'listing-images');

drop policy if exists "authenticated listing image upload" on storage.objects;
create policy "authenticated listing image upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'listing-images');

drop policy if exists "authenticated listing image update" on storage.objects;
create policy "authenticated listing image update"
on storage.objects for update to authenticated
using (bucket_id = 'listing-images')
with check (bucket_id = 'listing-images');

drop policy if exists "authenticated listing image delete" on storage.objects;
create policy "authenticated listing image delete"
on storage.objects for delete to authenticated
using (bucket_id = 'listing-images');

grant select on public.listings to anon;
grant select on public.listing_images to anon;
grant select on public.presentations to anon;
grant select on public.presentation_listings to anon;

grant select, insert, update, delete on public.listings to authenticated;
grant select, insert, update, delete on public.listing_images to authenticated;
grant select, insert, update, delete on public.presentations to authenticated;
grant select, insert, update, delete on public.presentation_listings to authenticated;


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



-- AYDEMIR V2 LARGE VIDEO BUCKET PATCH

update storage.buckets
set
  public = true,
  file_size_limit = 157286400,
  allowed_mime_types = array[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v'
  ]
where id = 'listing-media';

notify pgrst, 'reload schema';


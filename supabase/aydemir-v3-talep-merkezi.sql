-- AYDEMIR V3 TALEP MERKEZI
-- Bu dosyayı Supabase SQL Editor içinde bir kez çalıştırın.

create extension if not exists pgcrypto;

create table if not exists public.customer_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text,
  source_text text,
  min_budget numeric,
  max_budget numeric,
  neighborhoods text[] not null default '{}',
  room_counts text[] not null default '{}',
  min_area numeric,
  max_area numeric,
  floor_preferences text,
  kitchen_type text,
  credit_required boolean not null default false,
  exchange_required boolean not null default false,
  commission_free_only boolean not null default false,
  required_features text[] not null default '{}',
  note text,
  status text not null default 'new'
    check (
      status in (
        'new',
        'contacted',
        'viewing',
        'waiting',
        'won',
        'lost',
        'archived'
      )
    ),
  follow_up_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_requests
add column if not exists customer_name text;

alter table public.customer_requests
add column if not exists phone text;

alter table public.customer_requests
add column if not exists source_text text;

alter table public.customer_requests
add column if not exists min_budget numeric;

alter table public.customer_requests
add column if not exists max_budget numeric;

alter table public.customer_requests
add column if not exists neighborhoods text[] default '{}';

alter table public.customer_requests
add column if not exists room_counts text[] default '{}';

alter table public.customer_requests
add column if not exists min_area numeric;

alter table public.customer_requests
add column if not exists max_area numeric;

alter table public.customer_requests
add column if not exists floor_preferences text;

alter table public.customer_requests
add column if not exists kitchen_type text;

alter table public.customer_requests
add column if not exists credit_required boolean default false;

alter table public.customer_requests
add column if not exists exchange_required boolean default false;

alter table public.customer_requests
add column if not exists commission_free_only boolean default false;

alter table public.customer_requests
add column if not exists required_features text[] default '{}';

alter table public.customer_requests
add column if not exists note text;

alter table public.customer_requests
add column if not exists status text default 'new';

alter table public.customer_requests
add column if not exists follow_up_at timestamptz;

alter table public.customer_requests
add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.customer_requests
add column if not exists created_at timestamptz default now();

alter table public.customer_requests
add column if not exists updated_at timestamptz default now();

create table if not exists public.customer_request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.customer_requests(id)
    on delete cascade,
  note text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_request_presentations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.customer_requests(id)
    on delete cascade,
  presentation_id uuid not null
    references public.presentations(id)
    on delete cascade,
  created_at timestamptz not null default now(),
  unique (request_id, presentation_id)
);

create index if not exists customer_requests_status_idx
  on public.customer_requests(status);

create index if not exists customer_requests_follow_up_idx
  on public.customer_requests(follow_up_at);

create index if not exists customer_requests_created_idx
  on public.customer_requests(created_at desc);

create index if not exists customer_request_notes_request_idx
  on public.customer_request_notes(request_id, created_at desc);

create index if not exists customer_request_presentations_request_idx
  on public.customer_request_presentations(request_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customer_requests_set_updated_at
on public.customer_requests;

create trigger customer_requests_set_updated_at
before update on public.customer_requests
for each row
execute function public.set_updated_at();

alter table public.customer_requests
enable row level security;

alter table public.customer_request_notes
enable row level security;

alter table public.customer_request_presentations
enable row level security;

drop policy if exists "authenticated customer requests select"
on public.customer_requests;

create policy "authenticated customer requests select"
on public.customer_requests
for select
to authenticated
using (true);

drop policy if exists "authenticated customer requests insert"
on public.customer_requests;

create policy "authenticated customer requests insert"
on public.customer_requests
for insert
to authenticated
with check (true);

drop policy if exists "authenticated customer requests update"
on public.customer_requests;

create policy "authenticated customer requests update"
on public.customer_requests
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated customer requests delete"
on public.customer_requests;

create policy "authenticated customer requests delete"
on public.customer_requests
for delete
to authenticated
using (true);

drop policy if exists "authenticated request notes select"
on public.customer_request_notes;

create policy "authenticated request notes select"
on public.customer_request_notes
for select
to authenticated
using (true);

drop policy if exists "authenticated request notes insert"
on public.customer_request_notes;

create policy "authenticated request notes insert"
on public.customer_request_notes
for insert
to authenticated
with check (true);

drop policy if exists "authenticated request notes update"
on public.customer_request_notes;

create policy "authenticated request notes update"
on public.customer_request_notes
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated request notes delete"
on public.customer_request_notes;

create policy "authenticated request notes delete"
on public.customer_request_notes
for delete
to authenticated
using (true);

drop policy if exists "authenticated request presentations select"
on public.customer_request_presentations;

create policy "authenticated request presentations select"
on public.customer_request_presentations
for select
to authenticated
using (true);

drop policy if exists "authenticated request presentations insert"
on public.customer_request_presentations;

create policy "authenticated request presentations insert"
on public.customer_request_presentations
for insert
to authenticated
with check (true);

drop policy if exists "authenticated request presentations update"
on public.customer_request_presentations;

create policy "authenticated request presentations update"
on public.customer_request_presentations
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated request presentations delete"
on public.customer_request_presentations;

create policy "authenticated request presentations delete"
on public.customer_request_presentations
for delete
to authenticated
using (true);

revoke all on public.customer_requests from anon;
revoke all on public.customer_request_notes from anon;
revoke all on public.customer_request_presentations from anon;

grant select, insert, update, delete
on public.customer_requests
to authenticated;

grant select, insert, update, delete
on public.customer_request_notes
to authenticated;

grant select, insert, update, delete
on public.customer_request_presentations
to authenticated;

notify pgrst, 'reload schema';

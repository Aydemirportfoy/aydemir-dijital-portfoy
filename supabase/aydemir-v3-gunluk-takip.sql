-- AYDEMIR V3 GUNLUK TAKIP MERKEZI
-- Supabase SQL Editor içinde bir kez çalıştırın.

alter table public.customer_requests
add column if not exists priority text default 'normal';

alter table public.customer_requests
add column if not exists last_contact_at timestamptz;

alter table public.customer_requests
add column if not exists lost_reason text;

alter table public.customer_requests
add column if not exists status_changed_at timestamptz default now();

update public.customer_requests
set priority = 'normal'
where priority is null;

update public.customer_requests
set status_changed_at = coalesce(updated_at, created_at, now())
where status_changed_at is null;

alter table public.customer_requests
alter column priority set default 'normal';

alter table public.customer_requests
alter column priority set not null;

alter table public.customer_requests
drop constraint if exists customer_requests_priority_check;

alter table public.customer_requests
add constraint customer_requests_priority_check
check (
  priority in (
    'low',
    'normal',
    'high',
    'urgent'
  )
);

alter table public.customer_requests
drop constraint if exists customer_requests_status_check;

alter table public.customer_requests
add constraint customer_requests_status_check
check (
  status in (
    'new',
    'contacted',
    'presentation_sent',
    'viewing',
    'negotiation',
    'waiting',
    'won',
    'lost',
    'archived'
  )
);

create index if not exists customer_requests_priority_idx
on public.customer_requests(priority);

create index if not exists customer_requests_status_changed_idx
on public.customer_requests(status_changed_at desc);

create index if not exists customer_requests_last_contact_idx
on public.customer_requests(last_contact_at desc);

create or replace function public.set_customer_request_tracking_fields()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists customer_requests_tracking_fields
on public.customer_requests;

create trigger customer_requests_tracking_fields
before update on public.customer_requests
for each row
execute function public.set_customer_request_tracking_fields();

notify pgrst, 'reload schema';

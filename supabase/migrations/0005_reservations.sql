-- Park pavilion reservations (phase 4). Residents request, the board approves.
-- Safe to re-run.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'reservation_status') then
    create type public.reservation_status as enum ('pending', 'approved', 'declined', 'cancelled');
  end if;
end
$$;

create table if not exists public.reservations (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  requester_name text not null,
  event_date    date not null,
  starts_at     time not null,
  ends_at       time not null,
  purpose       text not null,
  headcount     integer,
  status        public.reservation_status not null default 'pending',
  reviewed_by   uuid references auth.users (id),
  reviewed_at   timestamptz,
  review_note   text,
  created_at    timestamptz not null default now(),

  constraint reservations_end_after_start check (ends_at > starts_at)
);

create index if not exists reservations_date_idx
  on public.reservations (event_date, starts_at);

-- Stops two approved bookings from overlapping on the same day. Enforced by
-- the database rather than the app, so a double-booking can't slip through a
-- race between two admins approving at the same moment.
create extension if not exists btree_gist;

alter table public.reservations
  drop constraint if exists reservations_no_overlap;

alter table public.reservations
  add constraint reservations_no_overlap
  exclude using gist (
    event_date with =,
    tsrange(
      ('2000-01-01'::date + starts_at)::timestamp,
      ('2000-01-01'::date + ends_at)::timestamp
    ) with &&
  )
  where (status = 'approved');

alter table public.reservations enable row level security;

drop policy if exists reservations_select_authenticated on public.reservations;
drop policy if exists reservations_insert_own on public.reservations;
drop policy if exists reservations_cancel_own on public.reservations;
drop policy if exists reservations_admin_all on public.reservations;

-- Every signed-in resident sees the calendar, including who booked and why.
create policy reservations_select_authenticated
  on public.reservations for select
  to authenticated
  using (true);

-- A resident may request a booking for themselves only, and only as pending.
create policy reservations_insert_own
  on public.reservations for insert
  to authenticated
  with check (profile_id = auth.uid() and status = 'pending');

-- A resident may cancel their own booking, but not approve it.
create policy reservations_cancel_own
  on public.reservations for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and status = 'cancelled');

create policy reservations_admin_all
  on public.reservations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

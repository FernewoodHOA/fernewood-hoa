-- Fernewood HOA resident portal — stage 2a foundation.
-- Run this in the Supabase SQL editor.
--
-- Three tables:
--   residents    — the private HOA roster, imported from the accounting export
--   applications — access requests from residents, pending admin approval
--   profiles     — one row per logged-in user, created on approval
--
-- Everything is protected by row level security. The roster is NEVER
-- readable by the public, and applications are written server-side only.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- residents: the private roster
-- ---------------------------------------------------------------------------
create table if not exists public.residents (
  id            bigint generated always as identity primary key,
  customer_id   text,
  address       text not null,
  name          text not null,
  phone_1       text,
  phone_2       text,
  email_1       text,
  email_2       text,
  phase         text,
  -- lowercased, whitespace-collapsed address used for matching applications
  address_key   text generated always as (
                  lower(regexp_replace(trim(address), '\s+', ' ', 'g'))
                ) stored,
  created_at    timestamptz not null default now()
);

create index if not exists residents_address_key_idx
  on public.residents (address_key);

-- ---------------------------------------------------------------------------
-- applications: resident requests for portal access
-- ---------------------------------------------------------------------------
-- CREATE TYPE has no IF NOT EXISTS, so guard it to keep this file re-runnable.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type public.application_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

create table if not exists public.applications (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  address        text not null,
  email          text not null,
  phone          text,
  note           text,
  status         public.application_status not null default 'pending',
  -- set by the server when the address matches a roster row
  matched_resident_id bigint references public.residents (id),
  reviewed_by    uuid references auth.users (id),
  reviewed_at    timestamptz,
  review_note    text,
  created_at     timestamptz not null default now()
);

create index if not exists applications_status_idx
  on public.applications (status, created_at desc);

-- One pending application per email keeps the queue clean and stops an
-- accidental double-submit from creating duplicate work for the board.
create unique index if not exists applications_one_pending_per_email
  on public.applications (lower(email))
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null,
  address      text,
  resident_id  bigint references public.residents (id),
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.residents    enable row level security;
alter table public.applications enable row level security;
alter table public.profiles     enable row level security;

-- Helper: is the current user an approved admin?
-- SECURITY DEFINER so it can read profiles without tripping the policies
-- that call it (a policy on profiles that queries profiles would recurse).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- CREATE POLICY has no IF NOT EXISTS either, so drop first.
drop policy if exists residents_select_authenticated on public.residents;
drop policy if exists residents_write_admin          on public.residents;
drop policy if exists applications_select_admin      on public.applications;
drop policy if exists applications_update_admin      on public.applications;
drop policy if exists profiles_select_self_or_admin  on public.profiles;
drop policy if exists profiles_update_self           on public.profiles;
drop policy if exists profiles_admin_all             on public.profiles;

-- residents: readable by any logged-in portal user; writable by admins only.
-- Anonymous visitors get nothing.
create policy residents_select_authenticated
  on public.residents for select
  to authenticated
  using (true);

create policy residents_write_admin
  on public.residents for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- applications: submitted server-side only.
--
-- There is deliberately NO insert policy for anon/authenticated. The public
-- form posts to a Next.js server action which writes with the service-role
-- key. If the browser could insert directly it could also set
-- matched_resident_id itself and forge the "matches the roster" flag that
-- the board relies on when approving.
create policy applications_select_admin
  on public.applications for select
  to authenticated
  using (public.is_admin());

create policy applications_update_admin
  on public.applications for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles: a user reads and edits their own; admins see everyone.
create policy profiles_select_self_or_admin
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_self
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_admin_all
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Stop privilege escalation. profiles_update_self lets a resident edit their
-- own row, and without this they could simply set is_admin = true on it and
-- take over the portal. Only an existing admin may change that column.
create or replace function public.guard_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    raise exception 'only an admin may change is_admin';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_is_admin on public.profiles;
create trigger profiles_guard_is_admin
  before update on public.profiles
  for each row execute function public.guard_is_admin();

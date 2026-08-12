-- Announcements (phase 2c). Board posts, signed-in residents read.
-- Safe to re-run.

create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  -- Pinned notices sort above the rest regardless of date.
  pinned       boolean not null default false,
  author_id    uuid references auth.users (id),
  author_name  text,
  -- Set when the board chose to email this one, so it can't go twice.
  emailed_at   timestamptz,
  recipients   integer,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists announcements_recent_idx
  on public.announcements (pinned desc, created_at desc);

alter table public.announcements enable row level security;

drop policy if exists announcements_select_authenticated on public.announcements;
drop policy if exists announcements_write_admin on public.announcements;

-- Any signed-in resident may read; only admins may write.
create policy announcements_select_authenticated
  on public.announcements for select
  to authenticated
  using (true);

create policy announcements_write_admin
  on public.announcements for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Contact the Board — inquiries submitted from the public website.
-- Stored here as the durable record; email delivery is best-effort on top.
-- Safe to re-run.

create table if not exists public.board_inquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text,
  message     text not null,
  -- true once the email actually went out, so a delivery failure is visible
  emailed     boolean not null default false,
  handled     boolean not null default false,
  handled_by  uuid references auth.users (id),
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists board_inquiries_open_idx
  on public.board_inquiries (handled, created_at desc);

alter table public.board_inquiries enable row level security;

-- Written server-side only (same reasoning as applications): the public form
-- posts to a server action using the service-role key. Admins read and
-- resolve them. No anon policy exists, so the browser cannot read the queue.
drop policy if exists board_inquiries_select_admin on public.board_inquiries;
drop policy if exists board_inquiries_update_admin on public.board_inquiries;

create policy board_inquiries_select_admin
  on public.board_inquiries for select
  to authenticated
  using (public.is_admin());

create policy board_inquiries_update_admin
  on public.board_inquiries for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

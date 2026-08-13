-- Board action items (issue tracker). BOARD ONLY.
--
-- This table holds homeowner names tied to delinquent dues amounts and legal
-- action. It must never be readable by residents — the only policies below
-- are admin ones, so a signed-in resident hitting the API gets nothing.
-- Safe to re-run.

create table if not exists public.board_tasks (
  id           uuid primary key default gen_random_uuid(),
  address      text not null,
  homeowner    text,
  issue        text not null,
  -- 1 needs board action, 2 waiting on homeowner, 3 waiting on vendor/attorney,
  -- 4 escalated (legal), 5 resolved. Labels live in lib/tasks.ts.
  status       smallint not null default 1,
  todo         text,
  notes        text,
  opened_at    timestamptz not null default now(),
  closed_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint board_tasks_status_range check (status between 1 and 5)
);

create index if not exists board_tasks_status_idx
  on public.board_tasks (status, opened_at desc);

-- Every status change is recorded, so the board can see when an item was
-- raised, when it escalated, and when it closed. The spreadsheet could only
-- ever show the current state.
create table if not exists public.board_task_events (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.board_tasks (id) on delete cascade,
  from_status  smallint,
  to_status    smallint not null,
  note         text,
  changed_by   uuid references auth.users (id),
  changed_by_name text,
  created_at   timestamptz not null default now()
);

create index if not exists board_task_events_task_idx
  on public.board_task_events (task_id, created_at);

alter table public.board_tasks enable row level security;
alter table public.board_task_events enable row level security;

drop policy if exists board_tasks_admin_all on public.board_tasks;
drop policy if exists board_task_events_admin_all on public.board_task_events;

-- Admins only. Deliberately no policy for residents or anon.
create policy board_tasks_admin_all
  on public.board_tasks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy board_task_events_admin_all
  on public.board_task_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

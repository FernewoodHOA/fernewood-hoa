-- Read-only board access.
--
-- For people who need to see what the board is tracking without being able to
-- act on it — the association's accountant, for instance. They can still use
-- the resident side of the portal normally, including the community board.
-- Safe to re-run.

alter table public.profiles
  add column if not exists is_viewer boolean not null default false;

-- True for anyone allowed to READ board material: admins and viewers.
-- Write policies keep using is_admin(), so a viewer can look but not touch.
create or replace function public.can_view_board()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin or p.is_viewer from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Board action items: viewers read, admins write.
drop policy if exists board_tasks_admin_all on public.board_tasks;
drop policy if exists board_tasks_select_viewer on public.board_tasks;
drop policy if exists board_tasks_write_admin on public.board_tasks;

create policy board_tasks_select_viewer
  on public.board_tasks for select to authenticated
  using (public.can_view_board());

create policy board_tasks_write_admin
  on public.board_tasks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists board_task_events_admin_all on public.board_task_events;
drop policy if exists board_task_events_select_viewer on public.board_task_events;
drop policy if exists board_task_events_write_admin on public.board_task_events;

create policy board_task_events_select_viewer
  on public.board_task_events for select to authenticated
  using (public.can_view_board());

create policy board_task_events_write_admin
  on public.board_task_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Access requests: viewers read, admins decide.
drop policy if exists applications_select_admin on public.applications;
create policy applications_select_admin
  on public.applications for select to authenticated
  using (public.can_view_board());

-- Contact messages: viewers read, admins resolve.
drop policy if exists board_inquiries_select_admin on public.board_inquiries;
create policy board_inquiries_select_admin
  on public.board_inquiries for select to authenticated
  using (public.can_view_board());

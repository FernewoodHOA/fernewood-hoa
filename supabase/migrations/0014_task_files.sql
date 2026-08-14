-- File attachments on board action items — renderings, plans, quotes, photos.
--
-- Private storage: these are board working records and often contain a named
-- homeowner's property plans, so they must not be publicly addressable the
-- way the recorded covenants are.
-- Safe to re-run.

create table if not exists public.board_task_files (
  id               uuid primary key default gen_random_uuid(),
  task_id          uuid not null references public.board_tasks (id) on delete cascade,
  path             text not null,
  file_name        text not null,
  mime_type        text,
  size_bytes       integer,
  uploaded_by      uuid references auth.users (id),
  uploaded_by_name text,
  created_at       timestamptz not null default now()
);

create index if not exists board_task_files_task_idx
  on public.board_task_files (task_id, created_at);

alter table public.board_task_files enable row level security;

drop policy if exists board_task_files_select_viewer on public.board_task_files;
drop policy if exists board_task_files_write_admin on public.board_task_files;

-- Read-only board members (the accounting office) can see attachments;
-- only full admins can add or remove them.
create policy board_task_files_select_viewer
  on public.board_task_files for select to authenticated
  using (public.can_view_board());

create policy board_task_files_write_admin
  on public.board_task_files for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-files',
  'task-files',
  false,
  15728640, -- 15 MB
  array[
    'application/pdf',
    'image/jpeg','image/png','image/webp','image/heic','image/heif'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Community board (phase 2e): resident posts and replies. Text only for now;
-- photo attachments are scoped in ROADMAP.md but deliberately not built yet.
-- Safe to re-run.

create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  author_name  text not null,
  body         text not null,
  -- Set when a board member removes a post. Kept rather than deleted so a
  -- moderation decision leaves a record.
  removed_at   timestamptz,
  removed_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

create index if not exists posts_recent_idx
  on public.posts (created_at desc);

create table if not exists public.post_replies (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts (id) on delete cascade,
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  author_name  text not null,
  body         text not null,
  removed_at   timestamptz,
  removed_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

create index if not exists post_replies_thread_idx
  on public.post_replies (post_id, created_at);

alter table public.posts enable row level security;
alter table public.post_replies enable row level security;

drop policy if exists posts_select_authenticated on public.posts;
drop policy if exists posts_insert_own on public.posts;
drop policy if exists posts_delete_own on public.posts;
drop policy if exists posts_admin_all on public.posts;
drop policy if exists replies_select_authenticated on public.post_replies;
drop policy if exists replies_insert_own on public.post_replies;
drop policy if exists replies_delete_own on public.post_replies;
drop policy if exists replies_admin_all on public.post_replies;

-- Signed-in residents read everything; the app hides removed items.
create policy posts_select_authenticated
  on public.posts for select to authenticated using (true);

create policy posts_insert_own
  on public.posts for insert to authenticated
  with check (profile_id = auth.uid());

-- Authors may delete their own post outright.
create policy posts_delete_own
  on public.posts for delete to authenticated
  using (profile_id = auth.uid());

create policy posts_admin_all
  on public.posts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy replies_select_authenticated
  on public.post_replies for select to authenticated using (true);

create policy replies_insert_own
  on public.post_replies for insert to authenticated
  with check (profile_id = auth.uid());

create policy replies_delete_own
  on public.post_replies for delete to authenticated
  using (profile_id = auth.uid());

create policy replies_admin_all
  on public.post_replies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

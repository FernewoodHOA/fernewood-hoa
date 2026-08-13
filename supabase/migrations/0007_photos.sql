-- Photo attachments for community posts and announcements.
-- Photos live in a PRIVATE storage bucket and are served through short-lived
-- signed URLs, so neighbourhood pictures are never publicly addressable.
-- Safe to re-run.

alter table public.posts
  add column if not exists photo_paths text[] not null default '{}';

alter table public.announcements
  add column if not exists photo_paths text[] not null default '{}';

-- Private bucket. Uploads and reads both go through the server using the
-- service-role key; the browser never talks to storage directly, so no
-- storage policies for anon/authenticated are needed (or wanted).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-photos',
  'post-photos',
  false,
  10485760, -- 10 MB ceiling before server-side resizing
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

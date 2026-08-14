-- Board-only document storage.
--
-- Separate from the public `documents` bucket because storage buckets are
-- public or private as a whole — a private path inside a public bucket isn't
-- a thing. Anything here is served to admins through short-lived signed URLs.
-- Safe to re-run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'board-documents',
  'board-documents',
  false,
  52428800,
  array['application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

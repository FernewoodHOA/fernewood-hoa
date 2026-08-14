-- Association documents (covenants, restrictions, zoning filings).
--
-- Public bucket, deliberately: these are recorded public documents filed at
-- the parish, so there is nothing to protect, and public URLs mean the links
-- never expire — unlike the signed URLs used for residents' photos.
--
-- Owning these files matters. Before this, the covenants page pointed at a
-- personal Google Drive belonging to someone who isn't on the board; if that
-- account changed, the page would have broken with no warning.
-- Safe to re-run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  true,
  52428800, -- 50 MB, comfortably above the largest covenant PDF (~2.9 MB)
  array['application/pdf']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

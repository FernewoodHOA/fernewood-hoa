-- Basic submission rate limiting for the public forms.
--
-- Stores a salted hash of the submitter's IP, never the address itself, so a
-- flood can be throttled without the site keeping a log of who visited from
-- where. Safe to re-run.

alter table public.applications
  add column if not exists ip_hash text;

alter table public.board_inquiries
  add column if not exists ip_hash text;

create index if not exists applications_ip_recent_idx
  on public.applications (ip_hash, created_at desc);

create index if not exists board_inquiries_ip_recent_idx
  on public.board_inquiries (ip_hash, created_at desc);

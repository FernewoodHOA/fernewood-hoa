-- Throttling for the sign-in form.
--
-- The apply and contact forms are rate limited by counting their own rows per
-- IP hash. Sign-in had no equivalent because it writes no row, so there was
-- nothing to count and nothing stopping one caller hammering the form.
--
-- Rows hold only a salted hash of the IP (see lib/rate-limit.ts) and a
-- timestamp — never an email address. Knowing that someone tried to sign in is
-- enough to throttle; knowing who is not the association's business.
--
-- Safe to re-run.

create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  ip_hash text,
  created_at timestamptz not null default now()
);

-- The lookup is always "this hash, within the last hour".
create index if not exists login_attempts_hash_time_idx
  on public.login_attempts (ip_hash, created_at desc);

-- RLS on with no policies at all: nothing reaches this table except the
-- service role, which bypasses RLS. Residents have no reason to read it.
alter table public.login_attempts enable row level security;

revoke all on public.login_attempts from anon;
revoke all on public.login_attempts from authenticated;

-- Housekeeping: only the last hour is ever consulted, so anything older is
-- dead weight. Run occasionally, or wire to a cron job later.
--   delete from public.login_attempts where created_at < now() - interval '1 day';

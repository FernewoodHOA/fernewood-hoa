-- Lets a listed resident hide their street address.
--
-- Phone and email already had their own toggles, but the address was always
-- shown to anyone in the directory. Some residents are happy to be listed by
-- name without publishing where they live.
--
-- Defaults to true so nobody's current expectation changes: the only people
-- listed today are those who opted in knowing the address was shown.
-- Safe to re-run.

alter table public.profiles
  add column if not exists show_address boolean not null default true;

-- Rebuild the directory view so it honours the new toggle.
create or replace view public.directory_entries as
  select
    p.id,
    p.full_name,
    case when p.show_address then r.address end as address,
    r.phase,
    case when p.show_phone then p.phone end as phone,
    case when p.show_email then p.email end as email
  from public.profiles p
  left join public.residents r on r.id = p.resident_id
  where p.in_directory = true;

revoke all on public.directory_entries from anon;
revoke all on public.directory_entries from authenticated;
grant select on public.directory_entries to authenticated;

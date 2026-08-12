-- Resident directory (phase 2b). Opt-in by default: a resident appears only
-- after choosing to. Safe to re-run.

alter table public.profiles
  add column if not exists phone         text,
  add column if not exists email         text,
  -- Opt-in. Nobody is listed until they say so.
  add column if not exists in_directory  boolean not null default false,
  add column if not exists show_phone    boolean not null default false,
  add column if not exists show_email    boolean not null default false;

-- The directory as residents see it.
--
-- Deliberately NOT security_invoker: the view runs with the owner's rights so
-- it can read profiles that RLS otherwise hides, and applies the per-field
-- masking itself. That way a resident cannot bypass someone's show_phone /
-- show_email choice by querying the profiles table directly — there is no
-- policy letting them read other people's rows at all.
create or replace view public.directory_entries as
  select
    p.id,
    p.full_name,
    r.address,
    r.phase,
    case when p.show_phone then p.phone end as phone,
    case when p.show_email then p.email end as email
  from public.profiles p
  left join public.residents r on r.id = p.resident_id
  where p.in_directory = true;

-- Signed-in residents only. Anonymous visitors get nothing.
revoke all on public.directory_entries from anon;
revoke all on public.directory_entries from authenticated;
grant select on public.directory_entries to authenticated;

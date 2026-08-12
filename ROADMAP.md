# Fernewood HOA Website — Roadmap

Stack: Next.js + Tailwind, deployed on Vercel, Supabase for auth/database/file
storage once the portal starts. All accounts (Vercel, Supabase, GitHub) are
new and separate from any of Jared's other projects, so the site can be
handed off cleanly.

## Accounts & Access

Record of every account tied to this site, for future board handoff. Update
this table as each account is created — do not record passwords here; this
file lives in the repo. Store actual credentials in a password manager and
hand those off separately.

| Service | Login / Email | Purpose | Status |
|---|---|---|---|
| GoDaddy | Jared's existing account | Domain registration (fernewood.org) + DNS | Existing, predates this project |
| Google Drive | Jared's existing account | Hosts the covenant/restriction PDFs linked from `/covenants` | Existing, predates this project |
| GitHub | FernewoodHOA account | Source code repository: [FernewoodHOA/fernewood-hoa](https://github.com/FernewoodHOA/fernewood-hoa) | Created |
| Vercel | jaredpolitz@gmail.com (via GitHub) | Hosting/deployment: fernewood-hoa.vercel.app | Created, live |
| Supabase | TBD | Auth + database + file storage (Phase 2+) | Not yet created |

## Phase 0 — Landing page + document access (done)
- Next.js site scaffolded (`app/`, Tailwind, TypeScript).
- Home page with Fernewood entrance-sign hero photo.
- `/covenants` page linking to the public Google Drive folder holding the
  restrictive covenants, phase documents, and zoning filings.

## Phase 1 — Go live (in progress)
- [x] Create a new GitHub account/repo (separate credentials) and push this
      project.
- [x] Create a new Vercel account, import the repo, deploy. Live at
      fernewood-hoa.vercel.app.
- [ ] Point fernewood.org's DNS (in GoDaddy) at Vercel. Keep GoDaddy only for
      domain registration.
- [ ] Cancel/downgrade the GoDaddy "Websites + Marketing" (Airo) subscription
      once the new site is confirmed live on the real domain.

## Phase 2 — Resident accounts (portal foundation)
- New Supabase project (separate account) for auth + Postgres + file storage.
- Email magic-link login for residents (no SMS cost, no passwords to manage).
- Basic resident directory / admin-added resident list.

## Phase 3 — Financials
- Admin-only upload/posting of HOA financial documents or summaries.
- Resident-only viewing behind login.

## Phase 4 — Community features
- Announcements board (board-posted, resident-visible).
- Resident-submitted concerns/issues.
- Park reservation calendar (request + approve or self-serve booking).

## Phase 5 — Admin tools & handoff
- Simple admin dashboard so a non-technical board member can manage
  residents, announcements, financials, and reservations without touching
  code.
- Handoff documentation for whoever eventually takes over maintenance.

## Backlog / not yet scoped
- Board Members page and "Fernewood Magazine" content that existed on the
  old GoDaddy InstantPage site (sunsetting Sept 1, 2026) — worth deciding
  whether to migrate before that shuts down.

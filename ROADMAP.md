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
- [x] Point fernewood.org's DNS (in GoDaddy) at Vercel. `fernewood.org` and
      `www.fernewood.org` are both live. GoDaddy now used only for domain
      registration + email/service records (unchanged).
- [x] Reviewed the leftover GoDaddy "Websites + Marketing" subscriptions.
      Nothing to cancel: both are on the **Free** tier ($0/mo), and both
      detached from fernewood.org when DNS was repointed (they now serve
      `fernewood.godaddysites.com` / `fernewood5.godaddysites.com`, each
      showing only a placeholder page). Leaving them in place — deleting
      is irreversible and saves nothing.

## Action items — time-sensitive

- **Rescue old InstantPage content before September 1, 2026.** The legacy
  GoDaddy InstantPage site (separate product from the two free Websites +
  Marketing subscriptions) still holds "Fernewood Magazine" content and
  sunsets on that date. Board Members and Covenants have already been
  rebuilt on the new site; Fernewood Magazine has not. Once InstantPage
  shuts down, anything not exported is gone.
- **Domain auto-renew is OFF.** fernewood.org is paid through
  **February 21, 2034**, but will not renew automatically. Either turn
  auto-renew on in GoDaddy, or make sure this expiry date is carried
  forward in the handoff notes so a future board doesn't lose the domain.

## Phase 2 — Resident accounts (portal foundation)
- New Supabase project (separate account) for auth + Postgres + file storage.
- Email magic-link login for residents (no SMS cost, no passwords to manage).
- Resident directory, editable by the board as residents change.

### Source data (May 2026 resident list)

Provided as an accounting-system export ("AliceCustomerList" sheet, 269
residents). **The file itself is never committed — this repo is public.**
Columns: Customer ID · property address · resident name · Telephone 1 ·
Telephone 2 · e-mail · 2nd e-mail.

Contact coverage, which constrains how residents can log in:

| Have | Count | Share |
|---|---|---|
| An e-mail address | 196 / 269 | 73% |
| A phone number | 226 / 269 | 84% |
| Neither e-mail nor phone | 39 / 269 | 15% |

Implications to settle before building auth:
- Email magic-link alone reaches only 73% of residents. Adding SMS raises
  reach to ~85% but costs money per message.
- 39 residents have no contact method on file at all, so **some manual
  board-run onboarding is unavoidable regardless of the login method.**
- Cheapest path is likely email magic-link plus a board-driven push to
  collect the missing addresses, rather than paying for SMS.

Useful bonus: 261 of 269 property addresses match a street named in the
restriction guide, so each resident's phase can be derived automatically
rather than entered by hand. The 8 unmatched rows need a manual look.

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
- "Fernewood Magazine" content that existed on the old GoDaddy InstantPage
  site (sunsetting Sept 1, 2026) — worth deciding whether to migrate before
  that shuts down.

## Content maintenance notes
- Board members are listed in `lib/board.ts` — update after each election.
- The restriction guide (street → phase) lives in `lib/restriction-guide.ts`.
- Covenant PDFs are NOT stored in this repo; they live in a public Google
  Drive folder linked from `/covenants`. To add or replace a document,
  update the Drive folder — no website change needed.

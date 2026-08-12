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
| Supabase | Fernewood HOA org (free tier) | Auth + database + file storage. Project: "Fernewood HOA Website" | Created; portal schema applied |

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
- [x] Moved the apex `A` record off Vercel's legacy IP (`76.76.21.21`) to
      the current range (`216.198.79.1`) on 2026-08-12, clearing Vercel's
      "DNS Change Recommended" warning. `www` was already on the current
      CNAME (`…vercel-dns-017.com`). Verified afterwards: apex still 308s to
      `www`, which serves 200.
- [x] Reviewed the leftover GoDaddy "Websites + Marketing" subscriptions.
      Nothing to cancel: both are on the **Free** tier ($0/mo), and both
      detached from fernewood.org when DNS was repointed (they now serve
      `fernewood.godaddysites.com` / `fernewood5.godaddysites.com`, each
      showing only a placeholder page). Leaving them in place — deleting
      is irreversible and saves nothing.

## Action items — board review needed

**18 properties have no covenant phase.** When the May 2026 roster was
imported, 251 of 269 addresses matched a phase in the restriction guide.
These 18 did not, and the gaps appear to be in the guide itself rather than
in the data — each address falls between documented ranges, or on a street
the guide never mentions:

| Addresses | Why it doesn't match |
|---|---|
| 100–107 Fernewood Drive (8 homes) | Fernewood Drive is not listed in **any** phase |
| 200, 204, 205, 206, 207 Llansfair | Guide covers 100–112 and 602–607 only |
| 204 and 217 Waterford | Guide covers 100–203, plus 202, 205–216, 219 |
| 201 Waterside | Guide covers 100–111 and 402–604 |
| 600, 601 Farmington | Guide covers 418–508 and 602–810 |

This is a records question for the board, not a software bug: those
households currently have no documented set of covenants. Worth confirming
against the recorded filings before the directory or portal shows a phase
for every resident.

## Before the portal/contact form is announced

- [ ] **Restore the full board recipient list.** `BOARD_EMAIL_TO` is
      temporarily set to `jaredpolitz@gmail.com` only, so test messages don't
      reach the other four members. Before launch it must go back to all
      five board addresses — otherwise resident inquiries silently reach one
      person. The full list is in `.env.local` history and in the board's
      records; it is deliberately not written here (public repo).
- [ ] Set every environment variable in Vercel as well. They currently exist
      only on the local machine, so the contact form and portal do not work
      on the live site yet.

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

## Phase 2 — Resident portal

New Supabase project (separate account) for auth + Postgres + file storage.
Email magic-link login. Residents apply for access; an admin approves.

Built in stages so each one is usable before the next begins:

- **2a — Foundation (signup → approve → login).** Public portal
  announcement page, resident application form, admin approval queue,
  magic-link login, welcome page. Applications are auto-checked against the
  resident roster and flagged `matched` / `unmatched`; an admin still
  approves every one.
- **2b — Resident directory.** Searchable, board-editable as residents
  change. **Residents maintain their own entry:** once approved, each
  resident can update their own contact details (phone, email, and whatever
  else the board decides to show), so the directory stays current without
  the board re-keying a spreadsheet. Worth deciding at build time: which
  fields a resident may edit vs. which stay board-controlled (address and
  phase should almost certainly be board-only, since they determine covenant
  obligations), and whether a resident can hide their details from the
  directory while still keeping portal access.
- **2c — Announcements.** Board posts, residents read.
- **2d — Financials. SHELVED (2026-08-12).** Board uploads documents,
  residents read. Pulled from the public website copy pending a board
  discussion — do not build or re-advertise this until the board decides
  what, if anything, should be published to residents.
- **2e — Community feed.** Facebook-style: residents post questions,
  photos, and concerns, with comments.

### Community feed — decide before building 2e

This is the largest piece and the only one that creates ongoing work:

- **Moderation is a standing obligation, not a feature.** Someone must be
  able to remove abusive or defamatory posts, and neighbor disputes are
  exactly the content that shows up. Needs a delete/hide control and a
  named person responsible — this conflicts most with the goal of handing
  the site to a non-technical successor.
- **Photo uploads consume storage.** Supabase's free tier includes 1 GB;
  phone photos run 2–5 MB each, so images must be resized on upload or the
  free tier is gone in a few hundred posts.
- Consider whether posts should be deletable by their author, editable,
  and whether comments need their own moderation.

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

## Phase 3 — Financials (shelved pending board discussion)
- Admin-only upload/posting of HOA financial documents or summaries.
- Resident-only viewing behind login.
- Removed from the public website 2026-08-12 at Jared's request; needs board
  agreement before it goes back on the site or gets built.

## Phase 4 — Community features
- Announcements board (board-posted, resident-visible).
- Resident-submitted concerns/issues.

### Park pavilion reservations

Fernewood has a neighborhood park with a pavilion. Today residents claim it
by posting in a Facebook group that the board doesn't actively manage, so
there is no authoritative record of who has it when, and no way to catch a
double-booking before two families show up on the same afternoon.

Build: a calendar where approved residents **request** a reservation
(birthday parties, sports practice, etc.) and a board member approves or
declines it. Requesting rather than self-serve booking matches how the
board wants to keep oversight, and mirrors the portal's existing
apply → approve pattern.

Worth settling before building:
- Whether the calendar is visible to all residents (so people can see the
  pavilion is taken before requesting) — almost certainly yes.
- Booking limits: max hours per reservation, how far ahead residents may
  book, whether one household can hold several future dates.
- Whether the board needs to block out dates for association events.
- What happens to a request nobody reviews — an auto-decline after N days,
  or does it simply sit pending.
- Cancellations: can a resident release a date they no longer need.

Reuses the approval queue and notification email built in Phase 2a.

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

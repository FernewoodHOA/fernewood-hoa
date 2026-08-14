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
| Resend | jaredpolitz@gmail.com | Email delivery for the site (fernewood.org verified via DNS at GoDaddy) | Created, live |
| Cloudflare | TBD | Turnstile spam protection on the public forms (free tier) | Needed only if spam continues; code is ready and inert without keys |

### Portal roles

Three levels, set per profile in the database — not by environment variable:

| Role | Who | Can |
|---|---|---|
| Admin (`is_admin`) | the five board members | everything |
| Read-only (`is_viewer`) | Alice Oliver, accounting office | see board tools; no changes. Posts on the community board like any resident |
| Resident | everyone else approved | resident portal only |

`ADMIN_EMAILS` grants **full** admin and is not an email list. Read-only
people must be left out of it, or they'll be silently upgraded the next time
they're approved or the bootstrap script runs.

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

## Spam protection

Real spam started arriving through the access-request form within hours of
the board notification (random names and addresses, Gmail dot-trick
addresses). Four layers, cheapest first:

1. **Honeypot** — a hidden field on both public forms. A bot fills it, a
   person can't see it. Submissions that fill it are silently discarded and
   still shown a success message, so the bot doesn't learn to adapt.
2. **Rate limiting** — 3 access requests / 5 contact messages per hour from
   one connection. The submitter's IP is stored only as a salted hash, so
   throttling doesn't turn the database into a log of who visited.
3. **Roster matching** — the board email already says whether the address
   matches the resident roster. Spam never matches. Not yet used to suppress
   notifications; see below.
4. **Cloudflare Turnstile** — free, no usage cap, and usually invisible to
   the visitor. Chosen over Google reCAPTCHA, which would track every
   resident who fills in a form.

**Turnstile is written but inert until the keys are set.** With
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` blank, the
verification passes automatically and no widget renders — so the site keeps
working if the Cloudflare account is ever closed or a key rotated.

**Still available if spam persists:** stop emailing the board for
applications whose address doesn't match the roster. They'd still be stored,
still appear in the queue with the amber "No roster match" badge, and still
count on the Board Tools tile — just no email. The trade-off is that a
genuine resident whose address doesn't match (the 8 Fernewood Drive homes,
for instance) would also go un-emailed and rely on someone checking the
queue.

## Launch sequence

Deliberately staged: board first, residents later, so wording and workflow
can be corrected before 269 households see any of it.

- [x] **Restore the full board recipient list.** `BOARD_EMAIL_TO` set to all
      five board addresses in `.env.local` and in Vercel (2026-08-13).
- [x] **`EMAIL_TEST_RECIPIENT` removed** from `.env.local`. Worth recording
      that it was **never added to Vercel**, so production email was never
      redirected — the guard only ever applied locally. Anything sent from
      the live site during testing went to the real recipients.
- [x] Board accounts created for all five members plus a read-only account
      for the accounting office.
- [ ] **Board members sign in.** Accounts exist but none have been used.
      They go to `/portal/login`, enter their address, and follow the link.
- [ ] **Test the live contact form once the board is expecting it.**
      Deferred deliberately: a test message now emails four people who
      haven't been told the portal exists. Confirm the message stores AND
      records `emailed = true`.
- [ ] **Then announce to residents.** Nothing resident-facing should be
      publicised until the board has used it and the wording is settled.

## Action items — time-sensitive

- **The legacy GoDaddy InstantPage site sunsets September 1, 2026.** It held
  Board Members, Covenants and a "Fernewood Magazine" page, all of which have
  been rebuilt or superseded on the new site. **Nothing needs rescuing:**
  Fernewood Magazine is a monthly neighbourhood publication whose files are
  held by a third party, so the InstantPage page was only displaying content
  that exists elsewhere. Letting it shut down loses nothing.
  *(Earlier drafts of this roadmap treated this as an urgent rescue. That was
  based on seeing the nav label in a screenshot without ever seeing the page
  — the deadline was never real.)*
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
  change. **Households can have more than one portal account** — spouses
  each sign in with their own email, and both profiles link to the same
  roster row (nothing in the schema prevents this; verified 2026-08-12).
  The roster itself is household-shaped, though: one name field but two
  email fields per property. So decide whether the directory lists
  households ("The Politz family, 306 Englewood") or individuals, and how
  it handles a property whose two accounts disagree about what to display. **Residents maintain their own entry:** once approved, each
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

### Photo uploads — scoped, not yet built

Decision (2026-08-12): **photos only.** No video, no general file uploads,
until the Board discusses it based on resident feedback. Video is the item
that would force a paid plan.

**Storage math.** Supabase's free tier gives 1 GB of storage and 2 GB of
monthly egress. Whether that lasts years or months depends entirely on
whether uploads are resized:

| Approach | Size each | Photos before 1 GB is full |
|---|---|---|
| Store phone photos as-is | 2–5 MB | ~250 — gone within a year |
| Resize to 1600px, JPEG q80 | 200–400 KB | ~3,300 — years of headroom |

So server-side resizing is not an optimisation, it's the thing that keeps
this free. Budget ~$25/mo for Supabase Pro only if video is later allowed.

**Must be handled when building:**

- **Strip EXIF metadata.** Phone photos embed GPS coordinates. A resident
  posting a picture taken at home would publish their exact address to every
  other resident — including anyone later approved. Non-obvious and the most
  important item here.
- **Accept HEIC.** iPhones shoot HEIC by default and browsers can't display
  it, so uploads must be converted to JPEG or iPhone users hit silent
  failures.
- Cap upload size (~10 MB before processing) and photos per post (~4).
- Keep the storage bucket **private**, serve through signed URLs. A public
  bucket means neighbourhood photos are indexable by search engines.
- Delete the stored files when a post is deleted, or storage fills with
  orphans nobody can see.

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

### Resident-submitted renovation proposals — considered, deliberately deferred

Today a homeowner emails their plans and a board member attaches them to the
action item by hand. A resident-facing upload form would remove that step.

**Not worth building yet.** These come up 1–3 times a year (2026 estimate),
so the manual step costs a board member a couple of minutes annually, while
the feature would add a submission form, a review queue, notifications, and
another place for residents to get stuck. Re-open this if the volume changes
— several a month would flip the maths.

Most of the pieces already exist if it is ever wanted: `board_task_files`
handles storage and EXIF stripping, and the apply→approve→notify pattern is
already built twice (portal access, pavilion reservations).
- "Fernewood Magazine" content that existed on the old GoDaddy InstantPage
  site (sunsetting Sept 1, 2026) — worth deciding whether to migrate before
  that shuts down.

## Documents

All association documents live in the **Fernewood Supabase project**, not on
anyone's personal cloud storage. Before August 2026 the covenants page linked
to a Google Drive folder owned by a resident who isn't on the board — and
that account was nearly out of storage, so the page could have broken without
warning.

Two buckets:

| Bucket | Visibility | Holds |
|---|---|---|
| `documents` | public | 11 phase covenants, enforcement, the revised phase list, 12 survey plats |
| `board-documents` | private | Zoning 2006 Bass Property records — board only, served via 1-hour signed links at `/admin/documents` |

About 33 MB of the free 1 GB. The plats were converted from ~100 MB of TIF
scans to ~7 MB of PDF at a resolution where every municipal number is still
legible.

**To add or replace a document:** upload the PDF to the bucket in the
Supabase dashboard, then add an entry in `lib/documents.ts`. Replacing a file
needs no code change — overwrite it with the same name and the link keeps
working.

**The phase list PDF is generated, not hand-written.** Run
`node scripts/build-phase-list-pdf.mjs` after changing
`lib/restriction-guide.ts`, then re-upload, so the document and the website
can't drift apart.

The old Google Drive folder still exists as a backup. Nothing on the site
points to it.

## Content maintenance notes
- Board members are listed in `lib/board.ts` — update after each election.
- The restriction guide (street → phase) lives in `lib/restriction-guide.ts`.
- Covenant PDFs are NOT stored in this repo; they live in a public Google
  Drive folder linked from `/covenants`. To add or replace a document,
  update the Drive folder — no website change needed.

# MyYardManager

DIY fence-planning tool: users map fence lines on a satellite view of their
property and get material estimates. Longer-term direction is a full yard
management feature set — fencing is the first vertical, not the whole product,
and a lawn-care vertical (yard boundary + area, fertilizer/pre-emergent/
herbicide product recommendations, region-and-season timing guidance) is the
planned second one — see "Lawn-care vertical — architecture groundwork
only" below for what's actually been built toward it so far (schema
only, nothing user-facing).

**Name history: "MapMyFence" → briefly "Yard Stick" → "MyYardManager,"
both renames same day (2026-08-28).** The first rename (see the dated
note under Brand below) swapped to "Yard Stick" because a second,
non-fence vertical was coming — a yard-generic name fits a multi-vertical
product where a fence-specific one didn't. That name didn't survive
contact with actual competition research: a real brainstorming pass
(many candidates — Molehill, Furlong, the "Knots" family, Yardbird,
Yardvark, Plotypus, and others — each checked against live domains and
existing products) surfaced that short, evocative words in this space are
heavily occupied (Yardbird = an existing outdoor-furniture company,
Yardvark = a direct competing lawn-care tracking app, Plotypus = an
existing board game, Knoll = a famous furniture brand) — see the second
dated Brand-section note for the full reasoning and what got explicitly
ruled out. Landed on **"MyYardManager"** — longer and plainly
descriptive on purpose, chosen specifically because it's actually
available (domain unregistered, no competing app/company found), not for
cleverness. The local directory (`/Users/johnlloyd/mapmyfence`) and the
GitHub remote (`johnslloyd/mapmyfence`) still carry the original name —
renaming either is a real, somewhat-disruptive infra action (breaks
local shell muscle memory; a GitHub rename leaves redirects but still
changes clone URLs) that wasn't part of either pass and should be its
own deliberate call, not something done incidentally while renaming
in-app strings.

## Brand: "Package" — warm light, deep green

The site's visual identity is intentional, not incidental: warm cream
background, a deep muted green primary/accent, Space Grotesk (display) +
IBM Plex Sans (body) + IBM Plex Mono (technical/measurement accents). This
supersedes an earlier dark "Precision" theme (near-black background, lime
accent) — that direction was picked first, then set aside after further
exploration pulled a muted palette from a reference product package
design. Several variations were explored on top of the package palette
(a dark combined version, organic-hills hero illustrations of varying
shapes) — all set aside; "Package-inspired (light)" — the plain version,
no organic shapes — is what actually shipped. See the design canvas
artifact from that session if it still exists for the full exploration.
All tokens (`--background`, `--primary`, etc. in `client/src/index.css`)
and the font variables are the real, live theme — not a demo. Don't
casually revert individual pieces (e.g. "just make the button green
again") without knowing this was a deliberate, reviewed choice; if it's
time for another rebrand, that's a real decision to have explicitly, the
same way this one was.

**That next rebrand decision, made explicitly (2026-08-28), part 1:
renamed "MapMyFence" → "Yard Stick," visual identity deliberately kept
unchanged.** (Superseded by "Yard Stick" → "MyYardManager" a few hours
later the same day — see the follow-up note right after this one for
why and what changed the second time. Keeping this note as-is: the
asset work it describes — the ruler icon, the favicon, the palette
decision — is still exactly what's live today, only the name string
itself moved again.) Prompted by the lawn-care vertical being planned (see the
top of this file) — a yard-generic name fits a multi-vertical product,
a fence-specific one didn't. Two options were considered for the visual
side specifically: keep the current warm-cream/deep-green "Package"
palette and just swap the name/mark, or open a full new visual-identity
exploration. User chose to keep the palette — it isn't fence-specific
to begin with (warm/earthy/green already reads as "outdoors/yard"), and
it's the deliberate, already-reviewed system described above; a fresh
visual exploration was explicitly deferred, not forgotten.

What actually changed: the nav logo (`Layout.tsx`) swapped from a
folded-map icon to a ruler icon (`lucide-react`'s `Ruler` — literally a
"yard stick," and already used elsewhere in the app for the "New Fence
Line" card header, so it wasn't a new visual element to the codebase)
in the same rounded-square/deep-green treatment. The favicon changed
the same way — `client/public/favicon.svg` (new) redraws that same
ruler icon at the exact `--primary`/`--primary-foreground` hex values
(`#1F4D31` / `#F7F2E8`, converted from the real HSL tokens, not
eyeballed) on the same rounded-square background; `client/index.html`'s
`<link rel="icon">` now points to it, and the old `favicon.png` (the
folded-map mark) was deleted rather than left as a dead, wrong-brand
asset. `client/index.html` also gained a `<title>` tag — it didn't have
one at all before this (a genuine pre-existing gap, not something this
rename introduced). Every other user-facing "MapMyFence" string was
swapped app-wide: the register/login copy, transactional email subject/
body/sender (`server/authRoutes.ts`, `server/email.ts`), the Before You
Dig disclaimer text, the Privacy Policy, and the Account page's
delete-account mailto subject. The placeholder support address also
moved from `support@mapmyfence.app` to `support@yardstick.app` — still
just a placeholder, still nothing receives mail there (see the MVP
launch-blockers note elsewhere in this file) — only the domain string
changed to stay consistent with the new name.

What deliberately did NOT change, and is still a separate decision for
later: the local directory name and the GitHub remote/repo name.
`package.json`'s `"name"` field (was already the generic leftover
`"rest-express"`, never actually branded) did get updated both times —
`"yard-stick"` then, `"my-yard-manager"` now — since package names
aren't user-facing, low-stakes either way; same for `.claude/
launch.json`'s dev server config name.

**Part 2, same day: "Yard Stick" → "MyYardManager."** "Yard Stick" was
picked fast and didn't survive a real competition check. A proper
brainstorming pass followed — many candidates tried (old land-
measurement words like Furlong/Perch/Rod, yard critters like Molehill/
Groundhog, a "Knots" family including Knothole/Knotworks, animal
blends like Plotypus, and more), each actually checked against live
domains and existing products rather than assumed available. Real
collisions turned up repeatedly: **Yardbird** is a real outdoor-
furniture company; **Yardvark** is a *direct* competing lawn-care
tracking app (same category as this app's planned lawn-care vertical,
not just an adjacent one); **Knoll** is a famous furniture brand;
**Plotypus** is an existing board game; **Knotworks** is contested by
several small crafts businesses plus the large "Knot Worldwide" wedding
brand. Landed on **MyYardManager** — deliberately long and plainly
descriptive rather than clever, chosen because it actually checked out
clean (domain unregistered, no competing app/company found), after
"clever and short" kept turning out to be exactly the territory
everyone else wants too. Known, accepted tradeoff: "yard manager" as a
phrase already means something in B2B software — warehouse/trucking
"Yard Management Systems" are an established enterprise category — so
there's real SEO noise to fight, not a name collision, just a
crowded-search-term cost that was weighed and accepted rather than
missed.

Visual identity: unchanged again, still the same call as part 1 — same
palette, same `Ruler` nav icon (still fits: "yard manager" is still a
measuring/planning tool, nothing about the icon was ever tied to the
literal words "yard stick"), same favicon. Every user-facing "Yard
Stick" string from part 1 got the same treatment "MapMyFence" did:
swapped to "MyYardManager" across `index.html`'s `<title>`, the nav
logo text, transactional email subject/body/sender, the Before You Dig
disclaimer, the Privacy Policy, and the Account page's delete-account
mailto subject — and the placeholder support address moved again,
`support@yardstick.app` → `support@myyardmanager.app`, still nothing
receiving mail there (see MVP launch-blockers).

`client/src/index.css`'s old `.dark` class block was deleted — it was
dead code (`next-themes` is a dependency but was never wired to a
`ThemeProvider`, so `.dark` was never actually applied). The `:root`
tokens ARE the dark theme now; there's no separate light/dark mode.

Also fixed while touching this: `tailwind.config.ts`'s `fontFamily` never
had a `display` entry, even though `font-display` has been used on
headings across the app since early in the project. Every `font-display`
class was silently falling back to `font-sans` the entire time — not a
new mistake, just finally caught and fixed alongside the rest of the
token work.

**Lightened, and a real latent-token bug fixed (2026-08-27).** The
palette read "muddied," so `background`/`secondary`/`muted`/`accent`/
`border` were all nudged lighter and less saturated in `index.css`, and
a new `--panel`/`--panel-foreground` pair (significantly lighter than
`--card`) was added specifically for the editor's right-hand panel
(`EditorSidebar`, `EditFenceLineCard`, `NewFenceLineCard`,
`NewProjectInstructions`, and `MapEditorComponent`'s own drawing-controls
card — every state of that panel, not just one). While in there, found
and fixed the SAME shape of bug as the `font-display` miss above, but
worse — two layers of it:

1. `tailwind.config.ts`'s `card`/`popover`/`secondary`/`muted`/`accent`/
   `primary`/`destructive` color groups each reference a `-border`
   sub-token (`--card-border`, `--primary-border`, ...) that was never
   defined in `index.css` at all. `border-card-border` resolving to
   `hsl(var(--card-border) / <alpha>)` with an empty variable is invalid
   CSS, so the browser drops it and falls back to the spec default of
   `currentColor` — confirmed live via computed styles: every `Card`
   without an explicit border override (e.g. the "Editing Line" panel)
   was rendering a harsh near-black border (matching its own text
   color), and every `bg-primary` button had a pale cream rim (matching
   its own text color) instead of a clean edge.
2. Even after adding those tokens, `primary`/`secondary`/`muted`/
   `accent`/`destructive` (unlike `card`/`popover`) referenced their
   border token as a bare `var(--x-border)` with no `hsl()` wrapper —
   so a proper `H S% L%` triplet still didn't parse there either. Fixed
   by wrapping all of them in `hsl(var(--x-border) / <alpha-value>)`
   consistently, matching how `card`/`popover` already did it.

Surface roles (`card`/`popover`/`secondary`/`muted`/`accent`) now get a
soft neutral `-border` matching `--border`; fill roles (`primary`/
`destructive`) get their own color so the border seam disappears into
the fill. `sidebar-primary`/`sidebar-accent` have the identical
bare-`var()` bug and were deliberately left alone — see "Known dead
files," `client/src/components/ui/sidebar.tsx` is unused.

**Toasts: success is green, errors are red, both from the real theme
tokens.** Previously every toast — success or error — rendered with the
same `default` variant (`bg-background`, the warm tan/cream surface
color), because no `success` variant existed at all; only `default` and
`destructive` did. Every `onSuccess`/success-titled `toast()` call
across `use-projects.ts`, `Editor.tsx`, and `Register.tsx` now passes
`variant: "success"`. `toast.tsx`'s `toastVariants` gained a `success`
entry styled `bg-primary text-primary-foreground border-primary` — the
site's own deep muted green, not a generic bright green — mirroring how
`destructive` already reused `--destructive`. While in there, also
fixed `ToastClose`'s `group-[.destructive]:` styling, which used
hardcoded Tailwind `red-300`/`red-50`/`red-400`/`red-600` utilities
instead of the theme's own `--destructive`/`--destructive-foreground`
tokens — inconsistent with the rest of this app's token-driven styling
(same shape of issue as the `-border` bug above, just not a hard
failure this time, just off-palette hardcoded color). Added matching
`group-[.success]:` treatment to both `ToastClose` and `ToastAction` for
parity. Verified live: triggered a real success toast (project created)
and a real error toast (geocoding an invalid address) side by side —
green and red respectively, both clearly legible and visibly part of
the same warm/muted palette rather than a bolted-on alert-library look.

## Lawn-care vertical — architecture groundwork only

Second product vertical, planned per the top of this file — fertilizer/
pre-emergent/herbicide/pesticide planning by yard size and season,
alongside the existing fence vertical on the same property. **Nothing
user-facing exists yet.** What was deliberately laid down now, while
touching schema for the rename anyway, because it's additive and
essentially free:

- `shared/schema.ts`: `yardBoundaries` (one per project — `.unique()`
  on `projectId`, since a property has one yard the same way it has one
  address — holding a computed `areaSqFt`) and `yardBoundaryPoints`
  (ordered lat/lng points, same shape as the existing `fenceLines` /
  `coordinates` pair). Deliberately a **separate table pair from
  `fenceLines`**, not a reused one — a yard boundary is a closed
  polygon with an area, fence lines are open polylines with a length;
  forcing them into one shape would've been the wrong abstraction.
  Created directly via the `pool` connection (`CREATE TABLE IF NOT
  EXISTS`), not `drizzle-kit push` — seed "Database migrations" below:
  this extends that escape hatch's reasoning from additive *columns* to
  a brand new, non-destructive, non-renaming *table*. A new table can
  never collide with `db:push`'s `session`-table rename ambiguity (that
  ambiguity is specifically about whether an existing table's column
  signature might match a rename candidate — a table that didn't exist
  a moment ago has no such candidate), so the same "simple, additive,
  unambiguous" justification applies even more cleanly here than it did
  for a single nullable column.
- `products.type` gained four placeholder values (`fertilizer`,
  `pre_emergent`, `herbicide`, `pesticide`) — zero migration cost since
  `type` is Drizzle's TypeScript-only `enum` option, not a native
  Postgres constraint (same fact that made adding `"fasteners"`
  free, originally).

**What this does NOT include, on purpose**: no yard-boundary drawing UI
(`MapEditorComponent.tsx` only draws open polylines today — a closed-
polygon mode is real, separate frontend work), no geodesic area
calculation (would need a real library — `@turf/area` was the
candidate discussed, not `distanceTo()`-chain math, which only measures
open-path length the way it's used for fence lines today), no lawn-care
product seed data, and — the genuinely hard part — no timing/scheduling
recommendation logic at all. That last piece needs real, sourced
research (state extension-service lawn calendars, not a plausible-
sounding hardcoded calendar) before any code, the same discipline that
governed the Mississippi-only parcel data and the Before You Dig
content — explicitly flagged as the highest-risk, do-this-last part of
this vertical when it's actually greenlit.

## Project history — read before assuming anything

This repo was built across several different tools/environments before
settling on Claude Code (Replit Agent → direct root SSH edits on the
production VPS → local Mac development). Each transition left artifacts
behind that look like real config but are dead or actively misleading. Two
concrete consequences, both still true as of writing:

- There are **two auth implementations** in this repo. Only one is real —
  see "Auth" below. Do not "complete" the other one; delete it instead.
- There were **two deployment configs** (Replit and a VPS) — resolved. The
  `.replit` file and the Replit-only dev dependencies it needed have been
  removed; the VPS is the only deployment path now. See "Deployment" below.

When you hit something that looks unfinished or duplicated, assume it's a
leftover from a prior tool, not a deliberate abstraction. Check before
building on top of it.

## Stack

- **Client**: React 18 + Vite, Wouter for routing, TanStack Query for data
  fetching, Tailwind + shadcn/radix components, react-leaflet for the map.
- **Server**: Express (single process serves API + client), TypeScript via
  `tsx` in dev, esbuild-bundled for production (`script/build.ts`).
- **DB**: Postgres, hosted on Supabase, accessed via `drizzle-orm` (schema in
  `shared/schema.ts`, migrations via `drizzle-kit`).
- **API contract**: `shared/routes.ts` defines every endpoint's path, method,
  and Zod response schema, imported by both client and server. This is the
  intended pattern for *every* route — see "API convention" below.

## Auth (real vs. dead)

**Real**: `passport` + `passport-local` + `express-session`
(`server/auth.ts`, `server/authRoutes.ts`). Passwords are hashed with
`Scrypt` imported from the `lucia` package — that's the only thing `lucia`
is used for.

~~Dead: the `lucia` session/token model implied by a `sessions` table~~ —
**removed**. The unused `@lucia-auth/adapter-drizzle` and `memorystore`
packages were uninstalled too. `lucia` itself is still a dependency, kept
only for its `Scrypt` hasher used in `server/auth.ts` / `server/authRoutes.ts`
— don't build session/token logic against it.

**Session store: resolved.** `express-session` now uses `connect-pg-simple`
(`server/index.ts`), backed by a `session` table auto-created via
`createTableIfMissing: true` on the existing `pool`. Verified by registering
a user, restarting the dev server, and confirming `GET /api/user` still
resolved with the same cookie — sessions now survive a restart/redeploy.

**Still open**: `cookie.secure` is still hardcoded `false`. Leave it that way
until TLS termination is confirmed on the VPS — flipping it early would
silently break login (browsers won't send a `secure` cookie over plain
HTTP). **This is a genuine hard launch blocker, not just a "someday"
item** — don't go live to real users over the public internet without
flipping it, and set a real `SESSION_SECRET` in the VPS environment at
the same time (see Environment below). Neither of these can be verified
or done from a local dev session — they need someone with VPS access to
confirm TLS is actually live, then make both changes there.

**Password reset: added.** There was no way to recover a locked-out
account at all before this — `server/email.ts`, `/api/forgot-password`
and `/api/reset-password` (`server/authRoutes.ts`), `ForgotPassword.tsx`
and `ResetPassword.tsx`. Reset tokens are stored as a SHA-256 hash
(`users.resetTokenHash` / `resetTokenExpiresAt`, added via the direct-
`ALTER TABLE` escape hatch documented under Database migrations) — never
the raw token, same reasoning as hashing the password itself. `/api/
forgot-password` always returns the same generic message regardless of
whether the email is registered, unlike `/api/register`'s "Email already
registered" (an accepted, lower-stakes tradeoff there) — this endpoint
is unauthenticated and specifically about account existence, so it gets
the stricter treatment. `toSafeUser` (`server/auth.ts`) now also strips
`resetTokenHash`/`resetTokenExpiresAt`, not just `hashedPassword`, before
a user record reaches the client — needed updating the moment those
columns were added or they'd have leaked into `/api/user`'s response.

`server/email.ts` calls Resend's plain HTTP API directly (a `fetch` call,
not their SDK — matches how this app already calls Nominatim/Esri/ArcGIS
directly rather than pulling in a client library per external service).
**No `RESEND_API_KEY` is set anywhere yet** — without one, `sendEmail`
logs the email's full content to the server console instead of sending
it, which keeps the whole reset flow testable end-to-end (verified live:
registered a user, requested a reset, read the link out of the console
log, reset the password, logged in with it) but means **email doesn't
actually reach anyone yet**. A real `RESEND_API_KEY` (or swapping in
whatever provider is actually chosen) needs to be set before this goes
in front of real users, or password reset silently does nothing for them
beyond a reassuring on-screen message.

**Account page: added.** `client/src/pages/Account.tsx` at `/account` —
unlike `Editor.tsx`, this enforces its own auth redirect-to-`/login`
directly in the component rather than relying on `ProtectedRoute` (which
is a no-op passthrough, see `ProtectedRoute.tsx`), since there's no
guest-meaningful version of an account page the way there deliberately
is for the editor. Two pieces: change password (`/api/account/change-
password`, requires the current password, verified via the same `Scrypt`
used for login), and delete-account — **deliberately not automated**.
`projects.userId` has no `ON DELETE` behavior defined, so a real
self-serve instant delete would need to decide what happens to a user's
existing projects/fence lines first; for a beta-sized user base, a
working "email us and we'll take care of it" (`mailto:support@
mapmyfence.app`, prefilled subject) is the honest, safe scope — a real
automated flow can follow once that's actually been thought through.
**The support address is a placeholder** — nothing currently receives
mail at `support@mapmyfence.app`; swap it for a real monitored inbox
(here and in `Privacy.tsx`) before relying on it.

**Rate limiting: added.** Every auth-sensitive route had zero rate
limiting before this — unlimited scripted account creation, unlimited
login/password-reset guessing. `express-rate-limit`, two tiers in
`authRoutes.ts`: `authLimiter` (20/15min — register, login, change-
password) and the tighter `passwordResetLimiter` (5/hour — forgot/reset-
password, since that route is also an email-bombing vector against a
real inbox, not just a credential-guessing target). Verified live: 22
rapid login attempts against the same IP correctly started returning 429
partway through.

**Session cookie `sameSite`: added.** Wasn't set at all before (`server/
index.ts`) — now `sameSite: "lax"`, a real, free CSRF-hardening step that
still allows normal top-level navigation (clicking a link to the app
from email). Verified live via a raw `curl -i` login request that the
`Set-Cookie` header actually carries `SameSite=Lax`.

**Found and fixed in passing**: `/api/register`'s Zod schema had
`projectId: z.string().optional()` — `.optional()` alone accepts
`undefined` but rejects `null`, and `Register.tsx` reads `projectId` from
`URLSearchParams.get()`, which returns `null` (not `undefined`) when
absent. Every *direct* signup — the homepage's own "Sign up" link, not
arriving via a guest project's save-prompt redirect — was failing
validation outright with "Expected string, received null." Pre-existing,
unrelated to this pass, caught live while testing the new forgot-
password work. Fixed with `.nullable().optional()`.

## Security settings — do not loosen these to silence an error

This codebase has a history of security controls being widened to make a
symptom disappear, rather than fixing the underlying config issue. Don't
repeat that pattern:

- **CSP: resolved.** `server/index.ts` defines a `CONTENT_SECURITY_POLICY`
  constant scoped to the actual external origins the app uses (Esri tiles,
  unpkg, Nominatim, Google Fonts, the dashboard hero image) — used by both
  the header and the prod-only meta-tag-stripping override, and mirrored in
  `client/index.html`'s meta tag so dev and prod match. `unsafe-inline` /
  `unsafe-eval` remain in script-src (Vite dev needs eval; no nonce infra
  exists) — tightening further needs a real nonce-based rework, not a
  drop-in edit. If you add a new external origin (a new font, a new API),
  add it to the constant rather than widening to `*`.
- The session cookie is hardcoded `secure: false`. If you're setting up TLS
  termination on the VPS (see Deployment), flip this to `true` rather than
  leaving auth cookies on plaintext HTTP.
- If a security-related change is the only way you can find to fix a bug,
  stop and say so explicitly rather than making the change — there's almost
  always a root cause underneath.

## API convention

New endpoints should follow the existing pattern, not the shortcut taken by
`/api/projects/:id/estimates`:

1. Define path/method/response Zod schema in `shared/routes.ts`.
2. Server route in `server/routes.ts` returns data matching that schema.
3. Client fetches via a hook in `client/src/hooks/use-projects.ts`
   (`fetch(...) → api.x.responses[200].parse(await res.json())`), not an
   inline `fetch` in a component.

**Estimates: fixed.** `server/estimates.ts` now queries the `products` table
(cheapest per material type) instead of a hardcoded price list, and
`client/src/hooks/use-projects.ts` has a `useEstimates()` hook following the
normal parse-against-contract convention. `products` needs seeding — see
Commands.

**Cross-retailer pricing: real, one full option per store — not a mix.**
`calculateEstimate` (`server/estimates.ts`) returns one COMPLETE,
independently-priced option per store (that store's own cheapest
post/rail/picket/concrete), not a single list cherry-picking the
cheapest item across stores — a homeowner shops at one store, not half
a fence from each. A store is only included if it prices every required
type; response shape is `{ options: [{ store, materials, totalCost },
...] }`, sorted cheapest-total-first by the server.
`client/src/pages/Editor.tsx`'s `MaterialEstimates` shows a picker (only
rendered when there's more than one option) with the cheapest store
badged "Best price," defaulting to it. Verified live (most recently
after the seed-data re-verification below): a test line came back with
two real, different totals — Lowe's $1813.85 (marked best) and Home
Depot $2043.85 — and switching the picker correctly swapped in that
store's own complete material list and links, not a blend. Which store
wins changes as the underlying prices get re-verified — don't treat
either total as a fixed expectation.

`products.store` has real Lowe's *and* Home Depot rows for all five
required wood-fence types — see "Seed data" below for how confident to
be in that data specifically.

**Fasteners: added.** The BOM was missing hardware entirely — no way to
build a real fence with just post/concrete/rail/picket. `products.type`
now includes `"fasteners"` (a box of ~300-350 exterior wood screws;
`server/estimates.ts` estimates 1 box per 3 8-ft sections, the same
rule-of-thumb spirit as "one bag of concrete per post"). Tools
(post-hole digger, etc.) were deliberately NOT added here — homeowners
rent or already own them, they're not a per-fence purchase; that belongs
in a future execution/build checklist, not the cost estimate.

**Pine vs. cedar pricing: wired up, fully species-consistent, per fence
line.** Previously the fence line `material` field (Wood: Pine / Wood:
Cedar / Vinyl / Iron) was completely decorative. Fixed in two passes:
first just the picket (species-tagging only `type: "picket"`, since
that's the visible/face material and post/rail were assumed
pressure-treated regardless — matching common real-world practice), then
widened to full consistency after explicit user direction: "Wood: Cedar"
now means cedar posts and cedar rails too, not just cedar pickets.
`products.material` (`"pine" | "cedar"`) is now meaningful for `post`,
`rail`, AND `picket`; only `concrete`/`fasteners`/`gate` stay untagged —
no species variant genuinely exists for hardware/consumables.
`calculateEstimate` (`server/estimates.ts`) takes the project's fence
lines directly (not a single summed length) and buckets them by
species (and height — see below), pricing each combination's
post/rail/picket separately, so a project can mix pine and cedar lines
and get a correct combined total, and editing a line's material
actually changes every wood line item's price, not just the picket's.

Species-agnostic legacy/unrecognized material values (`Cedar`, `wood`,
free text) and Vinyl/Iron all fall back to cedar pricing — the same
generic-wood-fence simplification this app already made project-wide,
just applied per line now instead of uniformly. This is NOT a claim
that a vinyl line "is cedar" — Vinyl/Iron remain disabled in the
material picker (`EditFenceLineCard.tsx`, "pricing coming soon") because
they need a genuinely different bill-of-materials (pre-fab panels, not
individual pickets/rails), deliberately out of scope for now — 3 real
fence lines already have `material: "vinyl"` from before this was
caught, left alone, not mine to migrate unsupervised. Material values in
the DB are still inconsistent free text (`wood_cedar` vs `Cedar` vs
`wood`, no enum constraint) — a data-quality issue, not fixed, though
narrower now that only the pine/not-pine distinction actually matters
for pricing.

**Fence line edits were silently corrupting length/cost estimates: fixed.**
`Editor.tsx`'s `handleUpdateLine` used to recompute a line's length with a
flat `sqrt(dLat^2 + dLng^2) * 111320` approximation on every save — wrong
everywhere except the equator, since a degree of longitude is shorter than
a degree of latitude by `cos(latitude)`. At this project's usual test
latitude (~39N) that inflated east-west lines by ~29%, and it fired on
*any* edit (e.g. just switching material), even with no point moved. Now
uses Leaflet's `LatLng.distanceTo()`, matching what `MapEditorComponent`
already used for the initial draw. Also: `useCreateFenceLine`,
`useUpdateFenceLine`, and `useDeleteFenceLine` (`use-projects.ts`) now all
invalidate the estimates query, not just the project query — previously
the estimate panel just showed stale numbers after any line change until
a manual refresh.

**Estimate query could briefly show stale data right after an edit: fixed.**
Reported as "the price changes but the link still points to the old
material" — the underlying data and calc were actually correct (verified:
switching a line's material always produced the right product/price in
the API response), but `MaterialEstimates` (the component that owns the
`useEstimates` query) is UNMOUNTED while the right panel shows the
drawing/editing card instead of the sidebar. `invalidateQueries`'s
default `refetchType: 'active'` only force-refetches queries with a
current observer — an invalidate that fires while `MaterialEstimates`
is unmounted just marks the query stale and waits for its NEXT mount to
lazily refetch, so the panel could remount showing the previous
(stale, cached) material's product for a moment before the background
refetch resolved. `useCreateFenceLine`/`useUpdateFenceLine`/
`useDeleteFenceLine` (`use-projects.ts`) now pass `refetchType: 'all'`
on the estimates invalidation, forcing the refetch immediately while
still unmounted so the cache is already fresh by the time the panel
remounts. Verified live checking the link with zero artificial wait
after save (previously my own testing missed this because I was
waiting ~1s between actions, long enough to mask it).

**Height (6ft vs 8ft): wired up.** Was a real gap — switching a line's
height used to produce byte-identical materials and cost, because every
picket was a 6-ft SKU and posts/rail quantities never looked at height.
Fixed alongside the full species-consistency work above, since sourcing
was the same exercise either way:
- `products.forHeight` (`6 | 8`) is now meaningful for `post` and
  `picket` — an 8-ft-tall fence needs a longer post to bury (this app
  uses the same "+2ft over nominal fence height" convention already
  implicit in the original 6ft-fence/8ft-post data: a 6ft fence uses an
  8-ft post, so an 8ft fence uses a 10-ft post) and a genuinely
  different, often thicker-profile 8-ft picket, not just a taller 6-ft
  one. `rail` is NOT height-tagged — the horizontal 2x4x8 board is the
  same length regardless of fence height; only the quantity per section
  changes (`RAILS_PER_SECTION` in `server/estimates.ts`: 3 for 6ft, 4
  for 8ft — a standard construction rule of thumb for privacy fences
  over 6ft, not independently verified against a retailer spec the way
  prices are).
- `calculateEstimate` now groups lines by **(species, height)** pairs,
  not species alone, and looks up a matching post+picket for every
  group a store must be able to price before that store is offered as
  an option at all.
- **Real, honest finding from sourcing this, not a data gap on this
  app's part**: Lowe's does not stock a 10-ft cedar 4x4 post at all
  (checked twice, two different search phrasings — only 6ft/8ft cedar
  4x4 lengths exist there); Home Depot does. Verified live: a cedar+8ft
  line correctly shows only ONE store option (Home Depot) with no
  store-picker UI at all, rather than a broken or incomplete Lowe's
  entry — the existing "only offer a store if it can fulfill
  everything" rule handles this correctly with no special-casing
  needed.
- Verified live end-to-end: pine 6ft→8ft on the same line jumped the
  Lowe's total from $1643.08 to $2361.36 (taller post $230.56→$380.16,
  8ft picket $732.48→unchanged-count-but-different-product, rail
  quantity 63→84 from the 3→4 rails-per-section rule) — matches the
  real-world expectation that an 8ft fence costs meaningfully more, not
  just a little.

**Seed data: all 21 product rows verified live, not guessed — but this
needs periodic re-checking.** `script/seed.ts` went through three rounds:
first a hardcoded price list, then Lowe's-only real products (one entry,
picket, had a placeholder `sku`/URL of literally `"1000"` and resolved to
a light switch), then Home Depot added for cross-retailer pricing but
seeded from web-search snippets because both retailers were blocking this
app's web-fetch and browser tools (403/"Access Denied") at the time —
same bot protection Shelby County TN's GIS uses against this app.

On a later pass, both sites let the browser tool through, so every
existing entry was re-checked by actually loading its product page — and
that surfaced three MORE broken links that had never been caught: Lowe's
"post" resolved to a light switch, "gate" to an area rug, "concrete" to a
cabinet hardware knob, and Home Depot's "concrete" URL 404'd outright.
The picket/rail entries from the earlier patch were themselves the right
product, just discontinued/out of stock. All nine rows are now the
result of an actual page load confirming name, live price, and in-stock
status (checked from a Memphis, TN store context, this project's usual
test region).

This does NOT mean the data stays correct indefinitely — it means
today's snapshot is real, not that retailers won't change/discontinue
these same SKUs again. Bot-blocking on both sites has been inconsistent
across sessions (sometimes 403, sometimes not) — if a future check gets
blocked again, don't silently fall back to guessing without saying so;
that's exactly the gap that let three of these five Lowe's links break
without anyone noticing.

**Default fence line name: fixed.** A newly-drawn line used to default to
`Line ${n}` (a plain counter — "Line 1", "Line 2", ...), which carried no
real information and looked like a placeholder that was never filled in.
`Editor.tsx` now has a `defaultLineName(address)` helper —
`` `New Fence at ${address}` `` when the project has an address, else
`"New Fence Line"` — used at both places a line's default name is set: the
authenticated direct-save path (`handleSaveLine`) and the guest→signup
pending-line-save effect. This was a client-only change: `shared/routes.ts`
already accepted an optional `name` on fence line update, and
`server/storage.ts`'s `updateFenceLine` already passed any field through
generically, so no contract or server change was needed.

Users can also now rename a line: `EditFenceLineCard.tsx` has a new Name
`<Input>` above the Material/Height controls, wired to `editingLine.name`.
`handleUpdateLine`'s save payload trims the value and falls back to
`defaultLineName(project.address)` if cleared to empty, so a line can never
end up with a blank name. Verified live: created a project with a
geocodable address, drew a line as a guest, signed up (exercising the
pending-line-save path), confirmed the sidebar showed "New Fence at 200 E
Capitol St, Jackson, MS 39201", opened the edit panel, renamed it to
"Backyard North Fence", saved, and confirmed the rename persisted after a
full page reload (not just local state).

**Failed-geocode dead end: fixed.** Follow-up to the finding above. A
project whose address fails to geocode (nonexistent/malformed address)
used to leave the Leaflet map in a state where clicks didn't register at
all — not even via directly dispatching the map's own registered click
handler, so it wasn't a browser-automation artifact. Root cause:
`Editor.tsx` hardcodes `initialCenter={undefined}` on every render — there
was never a real value to pass (geocoding happens client-side in
`MapEditorComponent`, not at project-creation time) — and that flowed
straight into `MapContainer`'s `center` prop. When the automatic
`initialAddress` geocode (fired from a `useEffect` on mount) failed,
nothing ever called `map.setView(...)`, so Leaflet never received a valid
initial view and its own click handling never actually finished
initializing. `MapEditorComponent.tsx` now has a `DEFAULT_CENTER`/
`DEFAULT_ZOOM` fallback (continental-US centroid, zoom 4) used whenever
`initialCenter` is absent, so the map is always interactive regardless of
whether geocoding ever succeeds; a later successful geocode still
recenters it via the existing `setView` call.

Separately, the only feedback on a failed geocode was a toast that
disappears in a few seconds, leaving no obvious next step — especially
before a fence line exists, when the address search box only lives inside
the (not-yet-visible) "New Fence Line" card. `MapEditorComponent` now
tracks a `geocodeIssue` state and renders a persistent, dismissible
banner (distinct top-center position so it doesn't collide with either
the "New Fence Line" card or `Editor.tsx`'s own floating "Create your
first fence line" instructions, both anchored top-right) naming the
address that failed, plain-language guidance, and its own
auto-focused retry search box — usable immediately, with no dependency on
first finding/clicking into drawing mode. Suppressed while the "New Fence
Line" card is showing, since that card already has its own address search
box and a second one would just be redundant. Verified live: created a
project with an unresolvable address, confirmed the map loaded fully
interactive (real satellite imagery, no longer blank/stuck) with the
banner shown alongside the toast and the INSTRUCTIONS card, dismissed the
banner, entered drawing mode, and placed two points on the map that
correctly computed a real distance — all of which was simply impossible
before this fix.

**A second, distinct geocoding failure mode: partially mitigated, not
solved.** Reported as "I typed a bad address and it still took me to an
unclickable weird random zoom-in," after the fix above had already
shipped — and reproducing it showed why: Nominatim doesn't just fail on
garbage input, it often *fuzzy-matches* it to a real, unrelated place
worldwide and returns a normal success. `1234 Fake St` resolved to a
residential block in Xi'an, China; `asdf` resolved to a village in
Germany. Since the app treats this as a successful geocode, neither the
toast nor the `geocodeIssue` banner above ever fires — the map just
silently zooms to z20 on a random wrong location with zero indication
anything went wrong. (The map itself was confirmed still clickable there
— points landed correctly — so "unclickable" was almost certainly this
disorienting teleport, not a real interactivity bug.)

Tried filtering on Nominatim's own confidence signals first — not
reliable enough to use: a real, correct address in this project's usual
test region (Jackson, MS) scored a *lower* `importance` than the bogus
China match, and `class`/`type`/`place_rank` weren't consistent between
runs either (same garbage query matched a `highway/track` in one request
and a `shop` with full address-level `place_rank` in another). Nominatim
gives no trustworthy per-result confidence score to filter bad matches
on.

What shipped instead: `handleSearch`'s fetch now passes
`countrycodes=us` — this product is entirely US-scoped already (Lowe's/
Home Depot pricing, Mississippi-only parcel lookups), so there's no
legitimate reason to ever geocode outside the US. Verified live: the
same `1234 Fake St` query that previously teleported to China now lands
in Massachusetts instead — still the wrong location, but no longer a
different continent. This is a real, meaningful narrowing of the failure
mode, **not a fix** — a US-scoped fuzzy match to the wrong place is still
possible and confirmed to still happen. A real fix needs the geocode
result surfaced to the user for confirmation before the map commits to
it (e.g. "We found: {display_name} — is this right?"), which is a bigger
UX change and was deliberately not built without asking first.

## Shopping list — the first slice of "give execution its own focused state"

PM-roadmap item 2 (per the user: after tightening plan→execution — item
1, fasteners/species/height pricing above — execution itself needs a
focused state, not just more sidebar content). This is the first piece:
a dedicated, printable shopping-list view, built deliberately on a
line-item data shape so it can be extended later without a rewrite.

**Architecture decision, made explicit before building:** the user raised
two future directions this needs to survive — (1) an eventual affiliate
program (send users to buy online, not just print a list), and (2) Pro
users reusing this same list as the basis of a customer quote (markup,
labor, travel cost added on top). Neither is built here. What IS
deliberate: `calculateEstimate` (`server/estimates.ts`) already returned
real line items (`{id, name, type, store, price, unit, url, sku,
quantity, totalCost}`) rather than a pre-summed blob — that shape is the
shared foundation both future directions sit on (a DIYer checklist is
that list rendered plain; a Pro quote would be the same list with
markup/labor/travel line items appended and different presentation).
Nothing new needed on the server or the contract for this feature — it
was already there. Affiliate-readiness is just discipline: `products.url`
stays a plain, swappable field rather than link-building logic baked
into UI, so tagged/affiliate URLs later are a data change, not a UI
rework. Actual affiliate integration and actual Pro accounts/roles/
persisted quotes are NOT built — those need a real affiliate agreement
and a real schema addition (a `quotes` table) respectively, out of scope
here.

**What shipped:** `client/src/pages/ShoppingList.tsx` at
`/editor/:id/shopping-list` (registered in `App.tsx`, same guest-access
pattern as `Editor.tsx` — `ProtectedRoute` doesn't actually gate
unauthenticated users, see `ProtectedRoute.tsx`). Reuses the exact same
`useEstimates` data as the sidebar's `MaterialEstimates`, presented as a
real checklist: grouped by material type in buying order (posts →
concrete → rail → pickets → fasteners), a store picker matching the
sidebar's (same "Best price" badge logic), and a "Print" button
(`window.print()` + Tailwind's `print:` variant — added `print:hidden`
to `Layout.tsx`'s header too, so the site nav doesn't print on any page,
not just this one). Switching stores correctly shows a separate,
independent list (verified live) — nothing selected at one store bleeds
into the other, since they're genuinely different physical shopping
trips.

**Checkboxes: redesigned before the first real use, per direct user
feedback.** Shipped first as a "mark as gathered" tracker driving a
progress bar — the user pointed out this doesn't map to how anyone
actually uses the page: you either print it (physical pen ticks, no
digital state needed) or click straight through to a product page,
neither of which involves pre-checking boxes in the app. Their own
framing: repurpose the checkbox as a **selector for a future batch
action** ("give them control here to select what gets batched"),
anticipating the same future-quote/ordering direction from the
architecture note above. Rebuilt around that: checking an item now
means "include it," with "Select all" / "Clear" plus an "Open N online"
button that opens every selected (and linked) item's product page in a
new tab — a real, immediately useful action with zero new backend,
and the natural, small, un-scoped-creep step toward an eventual real
"send as a batch order" feature. The progress bar is gone; selection
state still persists to `localStorage` per `(projectId, store)` — not a
schema addition, same class of simplification `pendingFenceLine`
already makes elsewhere: no other viewer needs to see it, and it's fine
if it goes stale after a project's materials change materially. The
printed view is unaffected either way — its checkboxes render as plain
blank boxes regardless of on-screen selection, since a paper checklist
still means "tick it off as you physically grab it," a use case that
never went away.

Also fixed while redesigning: `useSelectedItems`'s `toggle` originally
computed its next state as `{ ...selected, [id]: ... }` off the outer
render's `selected` closure rather than a functional `setState`
updater. Caught live during the same feedback pass — two checkbox
clicks dispatched back-to-back in one script (no re-render in between)
both read the same stale snapshot, so the second toggle silently
clobbered the first instead of composing with it (checking two boxes
in the same tick left only the second one checked). `toggle`,
`selectAll`, and `clear` all use the functional form now; verified live
that selecting three items in immediate succession leaves all three
selected.

**Visual redesign, also per direct user feedback**: the page originally
sat directly on the app's muted page background with only per-item
borders — felt flat/gray. Wrapped the whole list in
`bg-panel text-panel-foreground`, the same lighter-surface treatment
already established for the editor's right-hand panel (`EditorSidebar`,
`EditFenceLineCard`, etc. — see the Brand section), so this page reads
as visually consistent with the rest of the app's execution-focused
surfaces instead of introducing its own look.

**Found and fixed while building this, not asked for but a real
correctness bug**: `calculateEstimate` can legitimately return the SAME
product twice in one store's `materials` array — e.g. a project with
both a pine-6ft and a pine-8ft line needs pine rail priced for each
(species, height) group separately (rail isn't height-specific, but the
grouping loop iterates per group regardless), so the same rail product
appeared as two separate rows with different quantities. Correct for the
pricing math, wrong to show a shopper as two lines — and the sidebar's
existing `key={item.id}` on that list was a latent React key collision
whenever this happened. Added `consolidateMaterials()` in the new
`client/src/lib/estimates.ts` (also home to `STORE_LABELS` and the
material-type label/order maps, pulled out of `Editor.tsx` so both
pages share one source of truth) — merges same-product rows by id,
summing quantity and cost, before rendering anywhere. Used in both the
new shopping list and retrofitted into the sidebar's `MaterialEstimates`.

Verified live end-to-end: created a project, drew a line, saved it,
opened the shopping list from a new "View Shopping List" link in the
sidebar, confirmed grouping/prices/SKUs/order-online links matched the
sidebar's numbers exactly, checked an item (progress bar updated to "1
of 5 items checked"), reloaded the page and confirmed the check
survived, switched stores and confirmed Home Depot's own products/prices
loaded with its own independent (unchecked) progress, then switched back
to Lowe's and confirmed its checked state was still intact.

## Before You Dig & Permits — informational only, deliberately no clearance

Second and third pieces of roadmap item 2 (after the shopping list
above): utility-locate (811) and permit guidance. **Explicit user
direction on scope, not a default I chose**: treat both purely as
disclaimer/informational content pointing homeowners to the real
authorities — never assert or imply that a project IS cleared to dig or
build. This app has no way to actually know that, and getting it wrong
is a real liability the user was explicit about not wanting to take on.
Every sentence on this page describes a process or names a contact;
none of it states an outcome on the user's behalf. If this page is ever
extended, keep that same shape.

`client/src/pages/BeforeYouDig.tsx` at `/editor/:id/before-you-dig`
(same route/registration/guest-access pattern as `ShoppingList.tsx`;
linked from the sidebar next to "View Shopping List" as "Before You Dig
& Permits"). A persistent `Alert` at the top states the disclaimer
before anything else: *"This is general information, not a clearance to
build."*

- **811**: real, verified facts only — 811 is the free, nationwide
  call-before-you-dig number, legally required before digging in all 50
  states (a national number that routes to the correct state/regional
  one-call center, so no per-state research/customization was needed the
  way parcels required). Deliberately did NOT assert a specific notice
  period as universal ("a few business days" — phrased as varying by
  state, since exact required lead time does vary). Links to
  `call811.com` (verified live: redirects to `811beforeyoudig.com`, the
  real Common Ground Alliance site — confirmed by reading its actual
  page content, not assumed from the domain name, same rigor as the
  tile-layer/parcel-source lessons elsewhere in this file) and a
  `tel:811` quick-dial button.
- **Permits**: NO fabricated rules, on purpose — fence permit
  requirements (whether one's needed at all, height/setback/material
  limits) are hyper-local (city/county/HOA) and this app has no real
  data source for them, the same category of gap as Tennessee/Arkansas
  parcels. Content is limited to "contact your local building/zoning
  department, and check your HOA if you have one." The one convenience
  added is a pre-filled Google search link
  (`fence permit requirements {project.address}`) — explicitly labeled
  as "a convenience, not an answer" in the UI, never presented as
  authoritative.
- No checkboxes/"mark as done" state on this page, unlike the shopping
  list — deliberately omitted. A checked "I called 811" box could visually
  read as the app vouching that it's actually safe to dig, which is
  exactly the implied-clearance risk this page exists to avoid.

Verified live: real project address flowed correctly into the permit
search URL, `call811.com`/`tel:811` links resolved to the correct
destinations, and the disclaimer banner renders before any actionable
content on the page.

## Dashboard — collapsed into Projects for logged-in users

`Dashboard.tsx` used to render two completely different things depending
on auth state: for a logged-out visitor, the real marketing landing page
(hero, value props, steps, final CTA — genuinely distinct, kept as-is);
for a logged-in user, its own "mini Projects page" — 2 stat cards (one,
"total footage," was **hardcoded mock data**, `totalFootage = 1250`,
computed but never actually displayed anywhere — dead code left over
from an earlier version) plus the 3 most recent projects, which was just
a subset of what `/projects` already shows in full with search.

Per direct user direction ("is there really a need for a dashboard and a
projects page, they seem so similar") — there wasn't, for the logged-in
case. `Dashboard.tsx` now redirects (`<Redirect to="/projects" />`, from
`wouter`) straight to `/projects` once authenticated, instead of showing
that redundant, partly-fake summary. Removed the entire authenticated
render branch, the now-unused `StatCard` component, and the dead mock
stat along with it. A *real* stats dashboard (actual aggregate footage/
cost across all of a user's projects) is a legitimate future feature,
but needs a real aggregation query that doesn't exist yet — not worth
faking again just to have a distinct page. Verified live: registering a
new account lands on `/projects`, not a stats page.

## Privacy Policy

`client/src/pages/Privacy.tsx` at `/privacy` — added as part of the same
MVP-beta-readiness pass as the security/auth work above. Plain, honest
description of what this app ACTUALLY does, written from directly
auditing the codebase rather than generic privacy-policy boilerplate:
real data collected (email, hashed password, project/fence-line data,
the local-only `events` log), an explicit "what we don't do" section
(no third-party analytics/ads/tracking — verified by grepping the whole
client for analytics/tracking script patterns and finding none; no
marketing cookies — the only cookie this app sets at all is the
`connect.sid` session cookie), and who else sees data through the app
(Lowe's/Home Depot product links, Esri/Nominatim for maps/geocoding).
**This is a beta-stage disclosure a PM/engineer wrote from the actual
code, not a document reviewed by an attorney** — treat it as a real
starting point, not a finished legal document, before any wider public
launch. Linked from `Register.tsx` ("by signing up, you agree to...")
and the guest landing page's hero — deliberately NOT added as a global
footer in `Layout.tsx`, since `Layout` is `h-screen flex flex-col` with
`main` as `flex-1 overflow-y-auto`; a footer there would eat real
vertical space from the full-height map editor on every single page,
not just this one.

**Cookie-consent banner: deliberately not built.** Investigated first —
the only cookie this app sets is the strictly-necessary session cookie
covered above, and strictly-necessary cookies don't require opt-in
consent under GDPR/ePrivacy or CCPA. No analytics/ad/tracking scripts
exist anywhere in the codebase to require one for. If that ever changes
(a real analytics tool gets added later), revisit this — a consent
banner would become genuinely necessary at that point, not before.

## Editor panel layout — docked vs. floating

`Editor.tsx`'s right-hand panel (`RightPanel`) has two presentations,
chosen by `isPanelDocked = uiState === "SIDEBAR" || uiState === "EDITING"`.
Before a line exists (`INSTRUCTIONS`, `DRAWING`) it's a compact floating
card over the map — that's deliberate, focus belongs on the map while
there's nothing to review yet. Once there's a line to review (the line
list + material estimates, or a single line's edit detail) it docks as a
real flex sibling (`w-[480px] lg:w-[560px]`) and the map's flex-1
container actually shrinks to make room, instead of an unbounded card
floating over the map and spilling past its edge. This state — not
`EDITING` alone — is deliberately the one that gets the room, since it's
the one that grows as more is built (more lines, richer estimates).
Desktop only; mobile still uses the sidebar `Sheet`, untouched.

`MapEditorComponent.tsx` has a `ResizeObserver` on the Leaflet map's own
container that calls `invalidateSize()` on any resize — added because
Leaflet sizes its tile grid at mount time and doesn't notice a
CSS-driven resize on its own. This is what makes the dock/undock
transition (and the mobile sidebar sheet, and plain window resizes)
redraw cleanly instead of leaving stale/blank tile strips; it's
self-contained, so no explicit coordination is needed from `Editor.tsx`
when the layout changes.

Two other layout directions were explored and set aside for now: a
user-resizable split (drag the divider, remembered per device) and a
map/review mode toggle (map shrinks to a strip in review mode). The
docked approach was picked as the simplest to build and reason about;
revisit resizable specifically if a fixed width keeps needing to grow
again as more gets added to the panel.

## Map layers

`MapEditorComponent.tsx` stacks three free, no-key tile layers on the
Leaflet map, in this order: Esri satellite imagery (`TILE_NATIVE_ZOOM = 19`
is its real resolution ceiling — confirmed by fetching actual tiles; past
that Esri silently serves a placeholder image, not a 404), a transparent
Esri `Reference/World_Transportation` overlay for street name labels (not
`Reference/World_Boundaries_and_Places`, which looks like the obvious
choice by name but is only country/state/county boundaries — verified by
fetching real tiles before picking one), and `MAP_MAX_ZOOM = 22` as the
UI's actual zoom ceiling, deliberately set past the imagery's real
resolution so people can still zoom in for precise point placement — the
resulting blur past z19 is a conscious tradeoff, not a bug.

Before adding or swapping any tile source: fetch real tiles at real
coordinates and look at them before trusting a service's name or
LOD-list metadata — this file's git history has two cases (a tile
provider, a labels layer) where the obvious-sounding choice was wrong
and only fetching actual tiles caught it.

## Parcel boundaries — Mississippi only

`server/parcels.ts` (`lookupParcel(lat, lng)`) queries Mississippi's free,
public, live ArcGIS MapServer (`gis.mississippi.edu`, MARIS/MDEQ Cadastral
Framework — no key, no account) for the parcel polygon at a point, tried
against both its West and East layers since coverage isn't known ahead of
time. Wired to `GET /api/parcels/lookup?lat=&lng=`
(`api.parcels.lookup` in `shared/routes.ts`) and a "Show property line"
button in `MapEditorComponent.tsx` that looks up the current map center
and renders the boundary as a `<GeoJSON>` overlay.

**Only Mississippi is wired up.** Tennessee and Arkansas were evaluated
and explicitly not built yet:
- **Tennessee**: the free statewide comptroller dataset (vector tile
  service, not a queryable MapServer) excludes 9 self-maintained
  counties — including Nashville/Davidson, Memphis/Shelby, Knoxville/Knox,
  and Chattanooga/Hamilton, i.e. most of the state's population centers.
  Would also need a vector-tile-capable Leaflet plugin (e.g.
  `esri-leaflet-vector`), not a plain `TileLayer`.
- **Shelby County (Memphis) specifically**: checked directly, not just
  assumed — `gis.shelbycountytn.gov` is behind Cloudflare bot protection
  (confirmed: a real request gets Cloudflare's challenge page, not data),
  and `maps.memphistn.gov`'s parcel layers require an auth token. Neither
  is free/programmatic today. Real path forward is emailing Shelby
  County's ReGIS admin about API access, not something to route around.
- **Arkansas**: only a bulk-download FTP shapefile source found
  (`ftp://ftp.geostor.arkansas.gov/`) — no live query API. Using it would
  mean importing the whole state into this app's own PostGIS-enabled DB
  and maintaining that import, not a quick add.

If extending this later, Mississippi's `server/parcels.ts` shape (query a
live ArcGIS MapServer by point, normalize to GeoJSON) is the template for
any other state that turns out to have the same kind of live, free,
queryable service — check for that shape specifically before assuming a
state's "open GIS data" is usable the same way.

## Deployment

**Canonical target: the Hostinger VPS** (`srv1070754.hstgr.cloud`), run as a
single Node process serving both API and static client:

```bash
npm run build   # tsx script/build.ts — vite build + esbuild-bundles server to dist/index.cjs
npm run start   # NODE_ENV=production node dist/index.cjs
```

`server/static.ts` serves `dist/public` and falls back to `index.html` for
client-side routing. `PORT` env var controls the listen port (default 5051
in dev per `server/index.ts`; check what's actually set on the VPS for prod).

**Removed.** The `.replit` file, the three `@replit/vite-plugin-*` dev
dependencies (`vite.config.ts` used to conditionally load two of them
behind a `REPL_ID` check, and unconditionally loaded the third —
`runtime-error-modal` — in every environment), and the unused `@assets`
alias (`vite.config.ts` pointed it at an `attached_assets/` directory
that didn't exist and nothing imported from it) were all confirmed
unused outside Replit's environment and deleted. The site's favicon
was also still Replit's literal logo (the orange checkerboard icon) —
replaced with the actual brand mark (the same folded-map icon + deep
green used in the nav, `client/src/components/Layout.tsx`).

`script/build.ts`'s esbuild `allowlist` still references packages this
project doesn't use (`stripe`, `openai`, `multer`, `nanoid`, `cors`, etc.) —
leftover from whatever template generated the script. Harmless but should be
trimmed to what's actually a dependency here.

## Database migrations — expect an interactive prompt

`npm run db:push` needs a real terminal: `connect-pg-simple`'s `session`
table exists in the database but is intentionally **not** declared in
`shared/schema.ts` (Drizzle doesn't manage it). Every time you add or remove
a table, `drizzle-kit push` sees the undeclared `session` table and asks
whether your new/removed table is actually a rename of it. It never is —
always pick **"+ `<table>` create table"** (or the equivalent plain
create/drop), never a `session › ...` rename option. This can't be
automated away without either declaring `session` in the schema (then
Drizzle would try to manage a table it doesn't own) or switching session
stores — not worth it for a prompt you answer once per migration.

**Workaround for a non-interactive session (Claude Code, CI, etc.):**
`text(name, { enum: [...] })` columns (`products.type`, `.store`, the new
`.material`) are NOT native Postgres enums — Drizzle's `enum` option is
TypeScript-only, so adding a new allowed string value (e.g. `"fasteners"`
to `products.type`) needs no migration at all, just update the type and
insert rows. A genuinely new *column* still needs a real `ALTER TABLE`,
which can be run directly against `pool` (`server/db.ts`) with a
one-off script — safe for a simple additive, nullable column (see how
`products.material` was added) since it can't collide with the
`session`-table ambiguity above, which is specific to `drizzle-kit push`'s
own diffing. This is NOT a substitute for `db:push` in general — it's a
narrow escape hatch for exactly "add one nullable column, need it now,
no interactive terminal available." A destructive or renaming change
still genuinely needs a human at `db:push`.

**Extended to a brand new table (2026-08-28, `yardBoundaries` /
`yardBoundaryPoints` — see "Lawn-care vertical" above):** the same
reasoning covers a genuinely new, non-destructive table too, not just a
new column — a `CREATE TABLE IF NOT EXISTS` run directly against `pool`.
A table that didn't exist before this can't possibly be the rename
candidate `db:push`'s `session`-ambiguity prompt is asking about (that
prompt is specifically "does this new table's column signature match an
existing table I might have renamed" — there's no existing signature to
match), so it's arguably even safer than the additive-column case. Still
NOT a substitute for `db:push` for anything destructive, renaming, or
touching an *existing* table's shape.

## Usage event logging

`server/events.ts` has a `logEvent(type, {projectId, userId})` — local-only
(own `events` table, no external analytics service or API key). Fire-and-
forget: failures are caught and logged to stderr, never break the request,
so it's safe to call even before the table exists. Wired at four funnel
points: `account_created`, `project_created`, `fence_line_created`,
`estimate_viewed`. Add new event types to the `type` enum in
`shared/schema.ts` rather than passing arbitrary strings.

## Environment

- `DATABASE_URL` — Supabase Postgres connection string. **This has been
  rotated once already** after an earlier version was committed to git
  history in commit `0409042`. Never commit `.env` (it's gitignored now,
  keep it that way) — check `git status` before committing if you're ever
  touching env-related files.
- `SESSION_SECRET` — falls back to a hardcoded default (`"secret_key"`) in
  `server/index.ts` if unset. Set a real one in the VPS environment; don't
  rely on the fallback outside local dev.
- `RESEND_API_KEY` — **not set anywhere yet.** Used by `server/email.ts`
  for password-reset emails. Without it, `sendEmail` logs to the server
  console instead of sending — fine for local dev/testing (the reset flow
  is fully testable this way), but means password reset silently reaches
  no one until a real key is set. `EMAIL_FROM` (optional) overrides the
  default `MapMyFence <onboarding@resend.dev>` sender.

## Commands

```bash
npm run dev      # tsx server/index.ts, NODE_ENV=development — serves API + Vite dev middleware on one port
npm run check     # tsc typecheck, no emit
npm run db:push   # drizzle-kit push using .env's DATABASE_URL — needs a real terminal, see Migrations above
npm run db:seed   # tsx script/seed.ts — seeds the products table with real Lowe's listings
npm run build     # production build (see Deployment)
npm run start     # run production build
```

No test suite or CI currently exists. There's no `npm test` — don't assume
one and don't invent test infra unasked; flag it if it becomes a blocker.

**Pending as of the last session**: the `events` table (see Usage event
logging) exists in `shared/schema.ts` but hasn't been pushed to the database
yet — needs one `npm run db:push` run interactively.

## Known dead files

- ~~`server/db.ts.save`~~ — removed.
- `client/src/components/ui/sidebar.tsx` — a full shadcn collapsible
  app-sidebar primitive (`SidebarProvider`, `SidebarTrigger`, etc.),
  never imported anywhere. The app's real right-hand panel is the
  hand-rolled `EditorSidebar` in `Editor.tsx`. Its `--sidebar-*` tokens
  in `tailwind.config.ts` are unwired the same way `--card-border` was
  (see Brand section) — left alone since nothing renders it; wire or
  remove together if this component is ever actually adopted.

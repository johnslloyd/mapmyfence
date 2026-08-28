# MapMyFence

DIY fence-planning tool: users map fence lines on a satellite view of their
property and get material estimates. Longer-term direction is a full yard
management feature set — fencing is the first vertical, not the whole product.

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
HTTP).

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

**Pine vs. cedar pricing: wired up, per fence line.** Previously the
fence line `material` field (Wood: Pine / Wood: Cedar / Vinyl / Iron)
was completely decorative — switching a line between pine and cedar
never changed its price, because the whole project was priced as one
generic "standard wood fence" regardless of what any line said. Fixed:
`products` has a new `material` column (`"pine" | "cedar"`, only
meaningful for `type: "picket"` — post/rail/concrete/fasteners are the
same pressure-treated commodity lumber either way, so those stay
untagged/shared). `calculateEstimate` (`server/estimates.ts`) now takes
the project's fence lines directly (not a single summed length),
buckets them by species, and prices each species' pickets separately —
so a project can mix pine and cedar lines and get a correct combined
total, and editing a line's material actually changes its price.
Verified live: switching a line from cedar to pine dropped its
project's Lowe's total from $2113.48 to $1643.08 — exactly the 336
pickets × ($3.58 − $2.18) difference, nothing else moved.

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

**Height does NOT affect the estimate at all — a real gap, not fixed.**
Verified live: switching a line between 6 ft and 8 ft with material
unchanged produces byte-identical materials and total cost. Every
picket product in `products` is a 6-ft SKU, and `sharedQuantitiesFor`
never takes height into account (rail count is a flat 3 per section
regardless of height — a real 8-ft privacy fence typically needs 4).
The "4 ft" height option was removed from the picker
(`EditFenceLineCard.tsx`) since it was actively useless (not stocked at
all, not priced), but "8 ft" stays even though it's currently just as
inaccurate as 4 ft was — no 8-ft picket/rail product data has been
sourced yet, and rail-count-by-height would need a small BOM change.
Flagging this rather than silently leaving it: fixing it properly needs
real 8-ft product data (same rigor as everything else in this file) and
a height-aware quantity formula, not a quick patch.

**Seed data: all nine product rows verified live, not guessed — but this
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

# Lot Planner

DIY fence-planning tool: users map fence lines on a satellite view of their
property and get material estimates. Longer-term direction is a full yard
management feature set — fencing is the first vertical, not the whole product,
and a lawn-care vertical (yard boundary + area, fertilizer/pre-emergent/
herbicide product recommendations, region-and-season timing guidance) is the
planned second one — see "Lawn-care vertical — architecture groundwork
only" below for what's actually been built toward it so far (schema
only, nothing user-facing).

**Name history: "MapMyFence" → briefly "Yard Stick" → "MyYardManager" →
"Lot Planner"** (first two renames same day, 2026-08-28; the third
2026-09-03, alongside a full visual rebrand — see the dated Brand-section
note below for that one). The first rename (see the dated
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
cleverness. **"Lot Planner"** is the current name, chosen by the user
directly (not a research pass like the prior two) alongside a genuine
visual-identity rebrand — see the dated Brand-section note below. The
local directory (`/Users/johnlloyd/mapmyfence`) and the GitHub remote
(`johnslloyd/mapmyfence`) still carry the ORIGINAL name — renaming either
is a real, somewhat-disruptive infra action (breaks local shell muscle
memory; a GitHub rename leaves redirects but still changes clone URLs)
that has never been part of any of these three passes and should be its
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
palette, same favicon treatment (rounded-square, deep-green badge,
cream icon). Every user-facing "Yard Stick" string from part 1 got the
same treatment "MapMyFence" did: swapped to "MyYardManager" across
`index.html`'s `<title>`, the nav logo text, transactional email
subject/body/sender, the Before You Dig disclaimer, the Privacy
Policy, and the Account page's delete-account mailto subject — and the
placeholder support address moved again, `support@yardstick.app` →
`support@myyardmanager.app`, still nothing receiving mail there (see
MVP launch-blockers).

**Icon swapped again, same day: `Ruler` → `LandPlot`.** User asked to
see a handful of clean, simple mark candidates in the actual badge
treatment (rendered a real comparison — six lucide icons in the exact
rounded-square/deep-green/cream styling — rather than describing them
in the abstract) and picked `LandPlot` (a flag-on-a-divided-plot glyph
— literally "land plot," reads as parcel/triangulation rather than a
generic tool), noting they may revisit other options later. Both
`Layout.tsx`'s nav badge and `favicon.svg` updated to the same
`LandPlot` path (`lucide-react`'s exact glyph, not hand-approximated).
Homepage H1 also tightened same day, per direct wording feedback: "Plan
your yard projects like a pro, one at a time." — comma instead of an
em dash, and "one at a time" deliberately doesn't restate "project(s)"
a third time.

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

## Rebrand: "Package" → "Blueprint," MyYardManager → Lot Planner (2026-09-03)

**A genuine third theme, and a fourth product name — the first time
either has changed since the app settled on "Package" and
"MyYardManager."** Explored as five distinct visual directions first
(Blueprint, Fieldwork, Ledger, Signal, Parcel — technical/precision,
confident-outdoors, ultra-minimal, bold-editorial, and colorful-
product-led respectively), each built as a full nav+hero+card mockup
on real app copy in a design-canvas artifact (see that artifact if it
still exists), before the user picked **Blueprint** to actually ship.
Unlike the two prior name changes (each a real competition-research
pass — see "Name history" above), "Lot Planner" was simply the user's
own choice going in; this pass was about the LOOK, not the name
search.

**Blueprint's concept**: a technical, precision-drafting feel —
pale blue-gray "paper" background, a single dominant ink-navy brand
color, safety-orange reserved as a genuine but MINORITY accent,
Archivo/Public Sans/JetBrains Mono in place of Space Grotesk/IBM Plex
Sans/IBM Plex Mono, and sharper, more technical corners than the old
theme's rounder scale.

**The one real design decision this took, not just a recolor**: does
orange become the new `--primary` (matching its starring role in the
mockup's CTA button), or does navy stay `--primary`? `--primary` alone
drives 100+ call sites app-wide (`text-primary`/`bg-primary`/
`border-primary`/focus rings/badges — checked via a real grep count
before deciding, not guessed) — making it orange would have meant
either an all-orange app (loud, not what the mockup's actual balance
showed — navy-dominant with orange as a rare highlight) or manually
re-auditing 100+ individual call sites to split "should stay navy" from
"should go orange," which isn't a recolor anymore, it's a rewrite.
Resolved by keeping `--primary` = ink navy (mirrors the exact role deep
green played in the old theme, so nearly every existing call site is
already correct with zero component changes) and mapping orange onto
`--accent`/`--accent-foreground` instead — a token this app ALREADY
uses exactly where Blueprint wants a highlighted callout (the map
editor's run-length pill and gate label, `bg-accent/95 text-primary
border border-primary`; every homepage "eyebrow"/`STEP_0N` mono label,
retargeted from `text-primary` to `text-accent-foreground` specifically
for this pass in `Dashboard.tsx` and `Properties.tsx`) — so real orange
presence shows up automatically in the right places without touching
most component code at all.

**Tokens** (`client/src/index.css`): full HSL palette swap, converted
from exact hex via a hex->HSL script, not eyeballed — same discipline
"Package" was built with. `tailwind.config.ts`'s `borderRadius` scale
(hardcoded rem values, confirmed NOT wired to `--radius` — a
pre-existing gap this pass found but didn't fix, since fixing it wasn't
necessary to ship the new radii) went from 9px/6px/3px to 4px/3px/2px.

**One deliberate, scoped decorative flourish**: a `.grid-paper`
background texture (thin repeating grid lines from `--border`) on the
guest homepage's hero section only (`Dashboard.tsx`) — not app-wide.
Considered and rejected for the working screens (editor, admin,
property list) — texture behind data-dense UI is noise, not polish;
the homepage is the one page that's actually a marketing surface. The
existing hero illustration (`HeroIllustration`, the dashed-line
property diagram) needed zero code changes — it was already fully
token-driven (`hsl(var(--primary))`/`hsl(var(--accent))`), so it just
picked up the new navy/orange palette for free.

**Logo mark: `LandPlot` → `Crosshair`** (`lucide-react`), in the same
rounded-square/`bg-primary`/`text-primary-foreground` badge treatment
already established — swapped in `Layout.tsx`'s nav, `AuthLayout.tsx`'s
auth-page header, and `Properties.tsx`'s first-property-onboarding icon
(all three previously used `LandPlot`), plus `favicon.svg`, redrawn
using Crosshair's exact lucide path data at the new navy/cream hex
values — same "confirmed exact glyph, not hand-approximated" discipline
the favicon was built with originally.

**Full name sweep, same scope as the two prior renames**: `index.html`
(`<title>`), `Layout.tsx`/`AuthLayout.tsx` (nav wordmark),
`BeforeYouDig.tsx`, `AddPropertyDialog.tsx`, `Account.tsx`,
`Privacy.tsx`, `server/authRoutes.ts` (password-reset email subject/
body), `server/email.ts` (from-address display name) — every
`MyYardManager` string swapped to `Lot Planner`. Support address moved
`support@myyardmanager.app` → `support@lotplanner.app`, same placeholder
caveat as always (nothing receives mail there yet — see MVP launch
blockers). `package.json`'s `"name"` (`my-yard-manager` →
`lot-planner`) and `.claude/launch.json`'s dev-server config name
(`my-yard-manager-dev` → `lot-planner-dev`) updated too, same low-stakes
reasoning as the prior renames. Local directory and GitHub remote name
deliberately untouched — see "Name history" above.

**Found and fixed while touching `index.html`, not part of the ask**:
its Google Fonts `<link>` was loading ~25 entirely unused font families
(Architects Daughter, DM Sans, Geist, Inter, Montserrat, Playfair
Display, Poppins, Roboto, and more) — dead weight left over from
whatever template originally generated this app, on top of and
inconsistent with `index.css`'s own separate `@import` for the fonts
actually used. Trimmed to the same 3 families the theme actually needs;
`index.html`'s production build output dropped from 2.50 kB to 1.52 kB
from this alone.

Verified live across both authenticated and guest surfaces, not just
the homepage: the guest landing hero (grid-paper texture, orange
eyebrow label, the illustration's dimension badges reading correctly in
orange), the properties grid and Dossier page (satellite-image cards,
plan thumbnails), the map editor (gate label and run-length badges in
orange, confirming the `--accent` retarget reached a real data-dense
working screen), Account, and Login/Register — zero console errors in
a fresh tab, `npm run check` and `npm run build` both clean, 375px
mobile checked on both the homepage and an authenticated page with zero
horizontal overflow.

## Property / Project restructure (2026-08-28)

**"Project" used to mean two different things at once, and that finally
got fixed.** It was both "the physical yard" (an address, never changes)
and "a unit of work on that yard" (has a status, a lifecycle) — fine
while fencing was the only vertical, but the lawn-care vertical made the
conflict concrete: does adding lawn care mean a NEW top-level project on
the same address (duplicating the map/address work), or does the fence
concept need to grow a type field? Neither was right. The actual fix,
worked out with the user in conversation before any code changed:

- **`properties`** (renamed from the old top-level `projects` table) is
  now just an address — `name`, `address`, `description`, `userId`,
  `createdAt`. No type, no status. One user can have many properties
  (multiple yards) — this already worked before the rename and needed
  no new capability, just the right name.
- **`projects`** (new table) is a typed, named, statused unit of work
  *under* a property — `propertyId`, `type` (`"fence" | "lawn_care"`),
  `name`, `status` (`planning | quoting | in-progress | completed` —
  this field moved here from the old top-level table; it always
  described work-in-progress, never the property itself, so this was a
  real correctness fix, not just a rename). A property can hold
  multiple projects — a second fence plan (phased build: front yard
  this year, backyard next), or eventually a lawn-care plan alongside
  a fence one on the same yard.
- **`fenceLines.projectId`** now points at the new `projects` table
  (was the old top-level `projects`, i.e. what's now `properties`).
- **`yardBoundaries`** moved from `projectId` to `propertyId` — the
  physical yard boundary doesn't change between (say) a Spring and a
  Fall lawn-care project on the same yard, so it's measured once per
  property and reused, not duplicated per project.

**UX decision, made explicit before building**: does "New Project"
force a fence-vs-lawn-care choice up front? No — that would fragment
one physical yard into disconnected records the moment someone wants
both, directly undercutting the "One map. Every yard project." homepage
positioning (a property has ONE map; the type choice belongs on the
project you add under it, not on the property itself). Concretely:
- **"Add a Property"** (`AddPropertyDialog.tsx`, was
  `CreateProjectDialog.tsx`) stays exactly as low-friction as project
  creation was before this restructure — name + address only, and the
  server auto-creates that property's first project (`type: "fence"`,
  named from the address the same way fence lines already were) in the
  *same request*, landing the user straight in the fence editor. Zero
  added friction for the only vertical that's actually live.
- **`PropertyOverview.tsx`** (new page, `/properties/:id`) is where
  "+ Add Project" and its type picker actually live — Fence enabled,
  Lawn Care visibly present but disabled with a "Coming soon" badge
  (matching the homepage's own available-now/coming-soon language).
  This is genuinely optional, additive — most properties will show
  exactly one project for a while, since every existing property got
  exactly one auto-created fence project in the migration.

**Migration**: a real rename-and-restructure, not the free additive-
column kind documented earlier in this file. Hand-written raw SQL
against `pool` inside one transaction (rollback on any failure) —
NOT `drizzle-kit push` (would hit the documented `session`-table
interactive prompt anyway). Backed up first (67 properties-to-be, 56
fence lines, 319 coordinates, 0 yard_boundaries rows — written to
`.backups/`, gitignored, not committed) as cheap insurance given this
touches real user data (confirmed: the 22 accounts in the DB at
migration time were the user and friends testing, not the public, per
explicit user confirmation — "let's do it now and risk the data
challenges" is what greenlit skipping a more elaborate zero-downtime
migration approach). Verified post-migration with an integrity query:
zero orphan fence_lines, zero orphan projects, zero properties without
a project, spot-checked sample rows including real names ("Mimi's
fence") — all correct. See "Database migrations" below for why a new
*table* (not just a new column) still qualifies for the raw-SQL escape
hatch.

**Everywhere this touched** (for the next person's sanity, since this
was a genuinely wide change): `shared/schema.ts` (both tables +
relations + insert schemas + `ProjectWithLines` now nests `property`,
new `PropertyWithProjects` type), `shared/routes.ts` (new
`api.properties.*`, restructured `api.projects.*`), `server/storage.ts`
and `server/routes.ts` (full rewrite — ownership on `getProject` now
runs through the parent property, since a project has no `userId` of
its own), `server/events.ts` (`propertyId` field added, new
`property_created` event type), `client/src/hooks/use-projects.ts`
(`useProperties`/`useProperty`/`useCreateProperty`/etc. alongside the
narrower `useProject`/`useCreateProject`/etc.), `AddPropertyDialog.tsx`
+ `EditPropertyDialog.tsx` (renamed from the `*Project*` versions),
`Properties.tsx` (renamed from `Projects.tsx`), `PropertyOverview.tsx`
(new), `Editor.tsx` (every `project.address`/`.name`/`.description`
read that meant the property became `project.property.*`; the "Project
Details" tab became "Property Details" and shows property fields, with
a small "This Project" line for the project's own name/status),
`ShoppingList.tsx` / `BeforeYouDig.tsx` (same `project.property.address`
fix), `SignUpToSaveModal.tsx` / `Register.tsx` / `server/authRoutes.ts`
(the guest-claim-on-signup flow now threads a `propertyId` — where
ownership actually lives — AND a `returnTo` path, since claiming the
property alone doesn't say which project's editor to resume into for
the pending-fence-line-save effect), `Dashboard.tsx` / `Layout.tsx` /
`App.tsx` (nav/redirect/routing renamed to match). Also deleted while
in there: `Editor.tsx.bak`, a stray uncommitted-to-history backup file
that TypeScript never compiled (dead, not previously documented) —
found only because a restructure this size meant grepping for every
"project" reference in the client, which surfaced it.

Verified live end-to-end after the code changes (not just the DB
migration): guest creates a property → draws a fence line → signs up →
property claimed AND the pending line saved onto the correct project →
Property Details tab shows property fields correctly → Properties list
shows a project-count badge instead of a single status once a property
has more than one project → Property Overview's "+ Add Project" →
Fence creates a genuine second, independent project on the same
property, landing in its own empty editor → logged back in fresh and
confirmed the same state persisted.

## Lawn-care vertical — architecture groundwork only

Second product vertical, planned per the top of this file — fertilizer/
pre-emergent/herbicide/pesticide planning by yard size and season,
alongside the existing fence vertical on the same property. **Nothing
user-facing exists yet.** What was deliberately laid down now, while
touching schema for the rename anyway, because it's additive and
essentially free:

- `shared/schema.ts`: `yardBoundaries` (one per property — `.unique()`
  on `propertyId`, since a property has one yard the same way it has
  one address — holding a computed `areaSqFt`) and `yardBoundaryPoints`
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

**Homepage copy updated to match (2026-08-28), same honesty discipline
as the rest of this section.** The guest landing page (`Dashboard.tsx`'s
`UnauthenticatedDashboard`) used to read as a fence-only tool throughout
— hero, value props, and the three-step walkthrough all said "fence
line" specifically. Rewritten to position the product as a general
yard-project platform without overclaiming what's actually built: the
hero and value props are now vertical-agnostic, and a new "One map.
Every yard project." section explicitly labels **Fencing** "Available
now" and **Lawn care** "Coming soon" as two real, distinctly-badged
cards, with a plain-text line below (deliberately lighter visual
weight than the cards — not real cards, no badges) for "sprinkler
systems, landscaping layouts, and more." The three-step "how it works"
walkthrough still describes fencing specifically (that's the only
vertical that's actually true today) — kept as-is but now under a
`FENCING · HOW IT WORKS` eyebrow tag so it reads as "here's the fencing
flow" rather than implying it's the only flow that will ever exist.
Never claims lawn care is usable today — same posture as the
Before You Dig page: describe real status, don't get ahead of what's
built.

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

**Show/hide password toggle: added (2026-08-30).** Every password field
in the app (`LoginModal.tsx`, `Login.tsx`, `Register.tsx`,
`ResetPassword.tsx`'s two fields, `Account.tsx`'s change-password form's
three fields — 8 total) was a plain `<Input type="password">` with no
way to check what you'd typed. `client/src/components/ui/password-
input.tsx` is a single shared `PasswordInput` component (wraps the
existing `Input`, toggles `type` between `password`/`text`, an eye/
eye-off icon button positioned inside the field) — all 8 usages swapped
to it rather than wiring the same toggle by hand in each place.
`className` on `PasswordInput` deliberately lands on the outer wrapper
`<div>`, not the inner `<input>` — caught live: `LoginModal.tsx` passes
`className="col-span-3"` for its grid layout, and an earlier version of
this component forwarded `className` straight to the inner input,
which silently broke that grid span (the wrapper div, the actual grid
item, never got the class). Fixed, then verified via
`getBoundingClientRect()` that the password field's wrapper is
pixel-identical in width/alignment to the email field above it. Each
instance's show/hide state is fully independent — verified live on
Account's three-password form that toggling "New password" doesn't
affect "Current password" or "Confirm new password".

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

**A third material option: pine post/rail, cedar picket (2026-09-03).**
Direct request, prompted by the user asking how the post-spacing formula
worked and then wanting a real mixed option — cheaper structural lumber,
nicer-looking cedar face. Real structural change, not just a new
dropdown entry: post/picket had shared ONE `species` value per fence
line since the original species-consistency work (species-consistent
meant "post AND rail AND picket," on purpose, at the time) — supporting
a genuine post/rail-vs-picket split meant `calculateEstimate`
(`server/estimates.ts`) needed two independent species per line, not
one.

- `speciesFor` split into `postRailSpeciesFor` (unchanged logic — still
  "contains /pine/i, else cedar") and `picketSpeciesFor` (same fallback,
  but checks the new material value as an exact literal FIRST, so it
  doesn't fall into the plain-pine branch below it).
- Grouping key widened from `(species, height)` to `(postRailSpecies,
  picketSpecies, height)` — a project mixing plain-pine and
  pine-with-cedar-picket lines at the same height now correctly forms
  TWO groups, not one, since their pickets differ even though their
  posts don't.
- Rail sourcing stayed keyed on post/rail species only (a picket-species
  change never changes which rail gets bought); post and picket lookups
  were split into their OWN independently-keyed maps (by their own
  species+height, not the full group key) so two groups sharing a post
  species — or sharing a picket species — reuse one product lookup
  instead of repeating it.
- New picker entry: `EditFenceLineCard.tsx`'s Material `<Select>` gained
  `"wood_pine_cedar_picket"` → "Wood: Pine (Cedar Pickets)", a third
  real value alongside the existing `wood_pine`/`wood_cedar`. Needed
  **zero new seed data** — the combination just recombines the pine
  post/rail products and the cedar picket product that already exist
  for the two pure options.
- New `MATERIAL_LABELS` map (`client/src/lib/estimates.ts`, alongside
  `STORE_LABELS`/`MATERIAL_TYPE_LABELS`) gives all three real material
  values a readable label ("Pine (Cedar Pickets)", not the raw
  `wood_pine_cedar_picket` string) — used in `Editor.tsx`'s fence-line
  list badge, which was rendering `line.material` completely raw before
  this (a pre-existing, harmless-until-now gap: "wood_pine"/"wood_cedar"
  read passably raw, the new three-word value wouldn't have).

Verified live end-to-end on a real fence line (506 ft, 1 gate): pure
cedar priced at $12,726.37 (posts/rail/picket all cedar); switching to
the new mixed option repriced to $6,453.27 with posts and rails
correctly switching to the SAME pine SKUs the pure-pine option uses,
while the picket line item stayed the exact same cedar product/price as
the pure-cedar option ($3,665.92 for 1024 pickets, unchanged) — proving
the two species are genuinely independent, not one silently overriding
the other. Switched back to pure cedar and pure pine afterward and
confirmed both still price at their original, unchanged totals —
no regression to the two existing options.

**Pine post/rail + cedar picket is now the DEFAULT for a brand-new
line**, not plain cedar — direct follow-up request, same day. Was
`'wood_cedar'` hardcoded in exactly two places in `Editor.tsx`'s
`handleSaveLine` — the guest (localStorage `pendingFenceLine`) path and
the authenticated direct-save path, the only two places a newly-drawn
line's initial material gets set (confirmed via grep before changing
anything; `shared/schema.ts`'s `fenceLines.material` column has no
DB-level default of its own). Both now default to
`'wood_pine_cedar_picket'`; still fully user-changeable right after via
`EditFenceLineCard`'s Material picker, same as any other line. Verified
live on both paths: drew a real line as an authenticated user and
confirmed the saved row's `material` and the sidebar's "Pine (Cedar
Pickets)" badge; separately drew a line as a guest and confirmed the
`pendingFenceLine_*` `localStorage` entry (read before completing
signup, so no server round-trip to check instead) carries the same new
default.

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

## Gates on wooden fences — single/double, placed not drawn (2026-08-29)

Real gap identified during a pre-VPS-push strategy review: the BOM had
no concept of a gate at all — `products.type` included a `"gate"` value
and `script/seed.ts` had one row for it (a standalone black powder-
coated steel "no-dig" gate), but `server/estimates.ts`'s
`calculateEstimate` never referenced `"gate"` anywhere. It was orphaned
seed data, not a working feature, and the one product it named was the
wrong fit for a wood privacy fence's BOM anyway (breaks the species-
consistency work above).

**Explicit user direction on scope**: "I don't trust them to draw one" —
start with a simple, deterministic single/double gate placement, mark it
clearly on the map, then solve materials. Confirmed via
[[gate-placement-ux]] (or see this section if that memory doesn't
exist): click directly on the already-drawn line to place it (not a
sidebar-only picker, not freehand drawing) — the gate marker snaps to
whichever segment was clicked.

**Data model**: a new `gates` table (`shared/schema.ts`), one row per
gate — `fenceLineId`, `type` (`single`/`double`), `segmentIndex`, and
`position` (0..1 fraction along that segment). Deliberately stores a
segment-relative position, not a raw lat/lng: `MapEditorComponent`
already lets a fence line's points be dragged during an edit, and
re-deriving the gate's marker position by interpolating between
`coordinates[segmentIndex]` and `coordinates[segmentIndex+1]` at render
time means the gate stays correctly placed on the line even after a
point moves — the same "derive, don't duplicate" spirit as recomputing
length from coordinates instead of trusting a stored value. Added via
the established raw-SQL-via-`pool` migration escape hatch (a brand new,
non-destructive table, same class as `yardBoundaries`) —
`script/migrations/2026-08-29-gates.ts`. `products` also gained one new
nullable column the same way: `gateComponent` (`hardware_kit` |
`cane_bolt` — see Materials below).

**Placement UX**: `EditFenceLineCard`'s new Gates section has "+ Single
Gate" / "+ Double Gate" buttons. Clicking one puts the currently-edited
line into a placing mode — `MapEditorComponent` highlights that line's
segments (thicker, amber, dashed) and swaps their click handler from
line-selection to a segment-click handler that projects the click point
onto the clicked segment (flat-lat/lng closest-point projection, clamped
0..1 — fine for snapping a marker, unlike the real distance calculations
elsewhere in this app which correctly use `LatLng.distanceTo()`) and
immediately POSTs the new gate. A placed gate renders as a distinct
amber circle marker with a permanent "Single Gate"/"Double Gate" label,
on both the line being edited and any other saved line. Existing gates
list in the sidebar with a delete button. Scope deliberately limited to
saved, authenticated fence lines being edited — a gate can't be placed
on an in-progress guest draw or the not-yet-saved `pendingFenceLine`;
gate mutations use the same `isAuthenticated`-gated routes as fence line
mutations, so this needed no new auth model.

**Materials — the actual "how do gates affect the estimate" answer**:
`calculateEstimate` (`server/estimates.ts`) deliberately does NOT shrink
the picket/rail/post linear-footage math for a gate's width — that math
sums each line's total length with no concept of a gap partway through,
and teaching it that correctly (post-spacing near a gate opening isn't
just "subtract the width") is real, error-prone work for a feature
explicitly asked to start simple. The safe direction to be wrong in is
over-counting, not under-counting: treating the gate's span as if it
were solid fence means the picket/rail total already includes enough
lumber to build a matching gate panel, so the only thing actually
missing — and the only thing added — is the hardware to hang it.

No single-SKU "double gate kit" was found to exist at either retailer
(checked live, several search phrasings) — modeled as what a double
gate really is: two independently-hinged leaves (2x a single-gate
hardware kit) plus one cane bolt to anchor the inactive leaf into the
ground, both real, separately verified Lowe's products rather than one
fabricated SKU:
- **National Hardware 8-in Black Gate Hardware Kit** (hinges + latch),
  Item #674922 / Model N343-467, $29.98 — one per gate leaf (1 for
  single, 2 for double).
- **National Hardware 18-in Black Gate Cane Bolt**, Item #4103316 /
  Model N166-019, $19.48 — one per double gate.

Both verified live (Memphis, TN store context, this project's usual
test region) the same way every other seed row has been. **Home Depot
gate hardware is not seeded** — HD's search blocked this session's
browser tool on every attempt (the same inconsistent bot-protection
documented under Seed data below; Lowe's let the tool through every
time this session). This is handled correctly, not silently: the
existing "only offer a store if it can price everything a project
needs" rule means a project with a gate simply won't offer Home Depot
as an option until HD gate data is sourced — same mechanism that
already excludes Lowe's for cedar+8ft-post projects. A real gap to
close, not a data quality risk in the meantime.

Verified live end-to-end: placed a single gate on one segment and a
double gate on another of the same line, watched the sidebar estimate
jump by exactly $109.42 (3 hardware kits + 1 cane bolt) with Home Depot
correctly dropping out as a store option, confirmed the Shopping List
groups both under a "GATES" section with working Lowe's product links
(`gate` was already in `MATERIAL_TYPE_LABELS`/`MATERIAL_TYPE_ORDER` in
`client/src/lib/estimates.ts` — anticipated but never populated until
now), deleted the double gate and confirmed the estimate dropped back
to exactly one hardware kit with the cane bolt gone.

## Map editor polish + a real latent Tooltip bug (2026-08-29)

Four separate pieces of direct user feedback after trying the gate
feature above, all in `client/src/components/MapEditorComponent.tsx`
unless noted:

**1. Map centering on load.** Reopening a project used to leave the map
centered on the whole browser window (often not even zoomed to the
actual fence line) rather than the fence itself. Real fix needed TWO
separate react-leaflet/Leaflet timing gotchas, not just padding math:
- `fitBounds()` measures the container's size at CALL time — called too
  early (right at mount, before layout settles), it measures a 0×0
  container and "fits" by zooming out to nearly the whole world.
  `map.invalidateSize()` immediately before `fitBounds()`, deferred one
  `requestAnimationFrame` past the browser's first paint, fixes this.
- `mapRef.current` (the ref passed to `<MapContainer ref={mapRef}>`) is
  **not populated synchronously at mount** the way a normal DOM ref
  would be — react-leaflet's `MapContainer` only exposes the real map
  instance via `useImperativeHandle` after an internal `setContext`
  state update propagates, which lags a render behind actual map
  creation. Confirmed by logging: on a fresh load, a plain
  `useEffect(() => {...}, [])` in the SAME component saw
  `mapRef.current === null`. Fixed by moving the fit-on-load logic into
  a `FitBoundsOnLoad` component rendered as a CHILD of `MapContainer`,
  using react-leaflet's `useMap()` hook instead — children are only
  rendered once the real context/map already exists, so this has no
  such gap (the same reason `MapEvents`/`useMapEvents` elsewhere in this
  file already worked reliably).
- Padding is right-biased on desktop (`paddingBottomRight: [520, 40]`)
  to account for the docked right panel eating real map width whenever
  there's a line to show — see "Editor panel layout" below — so the
  fence centers in the space that's actually visible, not the space the
  panel covers. No bias on mobile, where the panel is a sheet overlay,
  not a width-eating column. Fires once per mount (ref-guarded) so it
  doesn't fight a user's own later pan/zoom.

**2. A real, previously-unknown bug: the per-segment "XXX ft" length
label had never actually rendered, ever, on any line.** Found while
restyling it (see #3) — before touching anything, a DOM check turned up
zero rendered tooltips for it. Root cause: react-leaflet's `<Tooltip>`
binds to `context.overlayContainer`, which only exists when the
Tooltip is rendered as a CHILD of a Layer component (Marker/Polyline/
etc.) — used as a bare sibling in a `<Fragment>` (its previous shape
here), `context.overlayContainer` is `null` and the tooltip's own
binding effect silently no-ops, forever. The point-number tooltips
("1", "2", "3") worked all along specifically because they're nested
INSIDE their `<Marker>`, not siblings of it — that contrast is what
surfaced the bug. Fixed by nesting the length Tooltip inside its
segment's `<Polyline>...</Polyline>` instead of self-closing it; the
same fix was needed for the new gate label (#4) too, since it was
written the same (broken) way from the start.

**3. Run length badges — restyled to match the homepage hero
illustration** (`bg-accent/95 text-primary border border-primary
font-mono`, rounded pill) instead of plain white shadowed text, per
direct feedback: "explore the idea of 'runs'... like the illustration
you created on the homepage." A "run" is just the existing per-segment
straight stretch between two consecutive points — no new data model,
purely a rendering treatment change (entangled with the #2 fix above,
since it had never actually been visible before regardless of style).

**4. Gate marker — a real span, not a dot.** Was a single `CircleMarker`
regardless of gate type; per feedback ("show a line between two dots...
a small one for single, slightly longer for double"), now renders two
dots connected by a line, sized as an ACTUAL fraction of the segment's
real length (single ≈4ft, double ≈8ft opening, via `LatLng.
distanceTo()` — same real-math discipline as every other distance in
this app) rather than a fixed pixel size, so it reads as genuinely
wider on the map at any zoom level, not just a bigger icon.

**5. Delete a single point while editing a line.** Didn't exist before
— only whole-line delete did (the sidebar's per-line trash icon, which
was already there and is unrelated to this). User picked the
interaction explicitly (asked, not assumed): hovering any point while
editing reveals a small red × button; click it to remove that point.
Desktop-only by design (hover has no touch equivalent) — a known,
accepted tradeoff from the option's own description, not an oversight.
The delete button only appears when the line has more than 2 points
(verified live: hovering a point on a 2-point line shows no delete
button at all), since a line can't be shorter than that — dropping to 1
point isn't a valid line; deleting the whole thing is the sidebar
trash icon's job instead.

Deleting a point that has a gate on either of its two adjacent segments
is blocked with a toast ("remove the gate first") rather than guessed
at — there's no sane new segment for that gate to land on. A gate on a
LATER segment has its `segmentIndex` shifted down by one to stay
attached to the same physical spot (removing a point merges two
segments into one, so every later segment's index moves down by one).
There's no gate-UPDATE endpoint (never needed one before this) — done
instead as delete-then-recreate with the same type/position via the
existing create/delete gate mutations, in `Editor.tsx`'s
`handleDeletePoint`. Reuses the same auto-save-on-edit plumbing
dragging a point already used (`onLineUpdate` → `handleUpdateLine`),
so a point deletion saves immediately, consistent with existing drag
behavior — no separate "Save Changes" click needed.

Verified live end-to-end (fresh browser tab — see the tooling note
below): deleted the endpoint of a 3-point/431ft line with a gate on its
FIRST segment; the deletion succeeded (that gate's segment was
untouched), the line correctly became 2 points/221ft, the sidebar
estimate recalculated ($10734.75 → $5628.49), the gate survived, and
the delete-point button correctly stopped appearing once only 2 points
remained.

**Logout used to leave stale data visible.** `client/src/hooks/use-
auth.tsx`'s `logout()` cleared the auth state and redirected home, but
never touched TanStack Query's cache — every property/project/estimate
query fetched while logged in (none of their query keys include a
userId) kept its last-successful data sitting in the cache, so
navigating back to a page like `PropertyOverview` after logging out
(or just having it still mounted) could keep showing the previous
session's data. Fixed with one `queryClient.clear()` call before the
redirect.

**Tooling note, for the next session**: mid-debugging, this app's dev
tab hit a state where `console.log`/`read_console_messages` kept
replaying the exact same stale error (`fitToExistingLines is not
defined`, from an already-fixed intermediate version of this work) on
every reload, even after the on-disk source was confirmed clean and
`node_modules/.vite` was deleted and the dev server restarted. A
brand-new browser tab immediately worked correctly with zero errors.
If a dev tab's console output ever seems "stuck" repeating an error
that doesn't match the current source, don't trust it — open a fresh
tab before concluding the code is still broken.

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

## Account tiers — the first real piece of the "Pro tool set" roadmap item (2026-08-30)

Prompted by a UX complaint: "My Properties" (a searchable tile grid) is
overkill for the common case — most users have exactly one property and
never need to search/switch. Two things came out of that conversation
together, deliberately: a property-count-aware nav (below), and — since
"how many properties can a free account have" is a real business
question the nav change surfaced — actual free/Pro account tiers. This
is genuinely the first concrete piece of roadmap item 3 ("Pro tool
set"), not a one-off gate; see [[product-roadmap]] memory.

**`users.plan`** (`'free' | 'pro'`, default `'free'`) — added via the
usual additive-nullable-with-default-column escape hatch
(`script/migrations/2026-08-30-user-plan.ts`). Free accounts are capped
at `FREE_PROPERTY_LIMIT = 3` properties (`server/routes.ts`); Pro is
unlimited. Enforced only for AUTHENTICATED property creation — a
guest's flow always ends in claiming exactly one property at signup, so
"free tier" has no meaning before that point.

**No billing exists, so "Pro" is self-serve and free during beta** —
`POST /api/account/upgrade` just flips the flag, no payment info
collected. This was a real, explicit choice (asked, not assumed)
between three options: self-serve free upgrade, manual-grant-only (a
"contact us" wall), or shipping the schema/limit without turning on
enforcement at all yet. Self-serve won on two grounds: lowest friction,
and it doubles as real signal for who actually wants more, before any
billing work is ever built. Live on the Account page's new "Plan" card
(`client/src/pages/Account.tsx`) — shows the current plan as a badge,
and an "Upgrade to Pro — free during beta" button when on free.
Verified live end-to-end: created 3 properties on a fresh account (hit
the cap), a 4th was correctly rejected with a clear message pointing at
the Account page, clicked Upgrade, badge flipped to Pro instantly, and
a 4th property then succeeded.

**Property-count-aware nav** (`client/src/components/Layout.tsx`,
`client/src/pages/Dashboard.tsx`) — the single nav slot that used to
always say "My Properties" → `/properties` now adapts: 0 properties
shows nothing there (they'd use "Add a Property," already prominent in
the header); exactly 1 property shows THAT property's own name, linking
straight to it; 2+ properties shows "My Properties" → the searchable
grid, same as before — it only earns a dedicated page once there's
actually something to search or switch between. `Dashboard.tsx`'s
post-login redirect got the same treatment: 1 property skips the list
and lands straight on `/properties/:id`. Deliberately did NOT move
property management under the Account page, despite that being one of
the options raised — property switching ("which yard am I working on")
and account settings ("change my password") are different concerns,
and folding one into the other would trade one confusion for another.
Verified live: an account with 1 property shows the property's name in
nav and redirects straight to it; the same account after creating a
2nd/3rd property switches back to "My Properties" on both the nav and
the post-login redirect.

**Property page redesign: built.** `PropertyOverview.tsx` was flagged
in the same conversation as "very basic, a centered list" — mocked up
as a static artifact first (dashboard layout, real app tokens), then
built for real the same day once reviewed. Same routes, same data
hooks, same "+ Add Project" flow as before — the actual change is
presentation and, in a few places, real new data:

- **Full-width dashboard layout** (`max-w-6xl`, not the old `max-w-3xl`
  centered column) — a header band (property icon/name/address + an
  "Edit Property" button, the first real trigger for
  `EditPropertyDialog`, previously unwired — see "Known dead files")
  above a two-column body: a wider project-card grid on the left, a
  narrower property-summary column on the right.
- **Project cards show real stats, not just a name and status** — for a
  fence project: total fence length and gate count (from a `useProject`
  fetch of that project's own `fenceLines`/`gates`), and estimated cost
  (from `useEstimates`). One extra fetch pair per visible project card;
  fine at today's scale (every property has ~1 project) — see the
  "N+1" note below if that changes. "+ Add Project" is an in-grid
  dashed tile, a grid member alongside the real cards, not a button
  below the fold.
- ~~A plan-preview diagram drawn from REAL coordinates, shown once in a
  property-level sidebar, mirroring the primary (first) fence
  project's shape and gates only~~ — **superseded**, see "Property page
  redesign, round two" below: the illustration now renders per-project,
  not once per-property, and the sidebar/"At a glance" stats block it
  lived in no longer exists in this layout.
- **A real, easy-to-miss CSS bug caught and fixed while building**: a
  Tailwind grid with ONLY a breakpoint-prefixed column count
  (`sm:grid-cols-2` or `lg:grid-cols-[1fr_340px]`, no unprefixed base)
  does NOT fall back to a real single-column layout below that
  breakpoint the way it looks like it should — with no explicit
  `grid-template-columns` at all, a CSS grid defaults to sizing its one
  implicit column to its content's natural width, not the container's
  available width. On mobile this silently rendered ~490px wide inside
  a 375px viewport; `document.body.scrollWidth` still read a clean 375
  because `Layout.tsx`'s own outer wrapper has `overflow-hidden` (for
  the docked-editor-panel machinery elsewhere in the app), so the
  overflow was invisibly CLIPPED, not scrollable — text just vanished
  off the right edge with no scrollbar as a hint anything was wrong.
  Fixed by always giving a grid an explicit unprefixed `grid-cols-1`
  base and layering breakpoints on top of that, every time — a bare
  `grid-cols-2`/`grid-cols-[...]` on its own, prefixed or not, is a
  latent version of this same bug. Verified live at a real 375px
  viewport (`window.innerWidth`/`body.scrollWidth`/`main.scrollWidth`
  all equal, confirming zero overflow) both before (bug reproduced) and
  after the fix.

**Upgrade prompts, placed before the wall rather than only at it
(2026-08-30).** Follow-up product conversation: where else should the
app mention account types or prompt an upgrade? Landed on two concrete,
low-risk pieces (homepage copy and a dedicated plan-comparison page
were explicitly deferred — open product/design decisions, not this
pass):

- **`AddPropertyDialog` now checks the limit BEFORE showing the create
  form**, not after a submission gets rejected. Previously a free user
  at the cap could fill out the whole name/address/notes form and only
  find out it was pointless on submit. Now `isAtLimit` (authenticated +
  `plan !== "pro"` + at `FREE_PROPERTY_LIMIT`) swaps the entire dialog
  body for a one-click upgrade prompt instead of the form — and
  upgrading transforms the SAME open dialog into the real create-property
  form in place (no close/reopen), since `isAtLimit` just flips false on
  the next render once `user.plan` updates. Guests never see this at
  all — the limit is only meaningful once a property is tied to an
  account, same reasoning as the property-count-aware nav above.
- **A quiet usage meter** — "N / 3 properties," not just text — added
  in two places for free accounts: a small pill next to the page title
  on `Properties.tsx` (links to Account, doesn't duplicate the upgrade
  pitch itself), and a proper progress bar on the Account page's Plan
  card. Both ordinary ambient awareness, not a second sales pitch —
  the actual upgrade CTA still lives in exactly two places (Account,
  and the dialog once you're actually blocked).
- **De-duplicated the upgrade call itself**: it was hand-rolled once in
  `Account.tsx`; pulled into a shared `useUpgradeToPro()` hook
  (`client/src/hooks/use-projects.ts`) used by both Account's Plan card
  and the new dialog prompt, so the fetch/toast logic can't drift
  between the two call sites the way `FREE_PROPERTY_LIMIT` almost did
  (also moved that constant to `shared/routes.ts`, one definition
  instead of hand-duplicated in `server/routes.ts` and `Account.tsx`).

Verified live end-to-end on a fresh test account: created 3 properties
via direct API calls (to skip the UI round-trip), confirmed the
Properties page showed "3 / 3 properties (Free)", clicked "Add a
Property" and got the upgrade prompt instead of a form, clicked
upgrade, watched the SAME dialog turn into the real create form with no
reopen, and confirmed a fresh 1-property account's Account page showed
a correctly-proportioned "1 / 3" progress bar.

**A Pro badge, and the header-width fix caught its own gap
(2026-08-30).** Two follow-ups from actually using the upgrade flow:

- **Pro badge on the nav avatar** — upgrading was otherwise invisible
  outside the Account page. A small badge now sits on the avatar's
  corner whenever `user.plan === "pro"`, plus a matching "Pro" `Badge`
  next to "My Account" inside the dropdown itself. Verified live on a
  Pro test account: badge visible on the avatar, and `[role="menu"]`'s
  text content confirmed literally reads "My Account Pro...". **The
  avatar-corner badge's glyph changed again the same day**, per direct
  feedback ("don't love the pro icon, can we switch to just a P") — a
  plain bold "P" character now, not a `Sparkles` icon. Scoped narrowly:
  only the avatar-corner badge changed, since it's the one place a
  Sparkles icon stood ALONE for "Pro" with no adjacent text; the
  dropdown's own "Pro" `Badge` keeps its `Sparkles` + the literal word
  "Pro" right next to it (swapping that one to "P" too would have read
  as "P Pro," redundant rather than clearer), and the Sparkles icons on
  Account.tsx's Plan card / "Upgrade to Pro" buttons elsewhere are also
  unchanged for the same reason — icon+text, not a standalone glyph.
  Verified live: upgraded a test account, confirmed via the badge
  element's own `textContent` that it renders literally `"P"`, and that
  the dropdown's separate "Pro" badge still renders its icon+text
  unchanged.
- **The header-width fix from the consistency pass had already
  drifted** — caught by direct user report ("still bounces around on
  account, sign in, sign up, and home page"), not by re-testing
  proactively, worth being honest about. Root cause: `AuthLayout.tsx`
  hand-copied Layout.tsx's header markup when it was built, and the
  later `max-w-6xl` cap fix only touched `Layout.tsx` — nothing forced
  the two to stay in sync, so Login/Register/ForgotPassword/
  ResetPassword quietly went back to an uncapped header while every
  other page had a capped one. Separately, `Dashboard.tsx`'s guest
  landing hero used its own THIRD width (`max-w-[1280px]`, a value that
  was never part of any standard) which, once the header itself got
  capped at 1152px, was now wider than the header above it — a new,
  different misalignment than the one already fixed. Real fix, not a
  patch: extracted `client/src/components/PageHeader.tsx` as the ONE
  place the header shell (border/blur/height/the `max-w-6xl mx-auto
  px-4 md:px-8` cap) is defined — `Layout.tsx` and `AuthLayout.tsx`
  both render it now instead of each authoring their own `<header>`,
  so this specific drift can't recur (a `below` prop handles
  Layout.tsx's mobile nav dropdown, which needs to live inside the
  header band but outside the capped/fixed-height content row).
  Dashboard's hero and its own loading-skeleton wrapper both moved to
  the real `max-w-6xl` standard. Verified live via
  `getBoundingClientRect()` on Login, Register, and the guest
  homepage — header and page content report byte-identical left/right
  edges (1152px) on all three, not just the pages checked in the
  original pass.

## Property page redesign, round two — "Property Dossier" (2026-08-30)

The round-one redesign above (card grid + sidebar) got a follow-up
pass, prompted by direct feedback wanting "more info, maybe geo
location... more visual interest and a stronger page structure." Six
lightly-sketched directions were explored in a design-canvas artifact
(Map-First Hero, Property Dossier, Timeline, Bento Grid, Story Scroll,
Split Workspace — the last one flagged up front as impossible to show
faithfully in a static mockup, since its whole pitch is live
interactivity), two built out in full for comparison (Map-First Hero,
using a real fetched Esri satellite tile for the property's actual
coordinates; Property Dossier, using this app's existing abstract
illustration style instead). User narrowed to two finalists (Dossier,
Bento — both built in full in the same artifact), then picked
**Dossier** as the final direction, with one explicit amendment: **keep
the existing abstract dashed-line SVG illustration** (`buildPlanPreview`
et al., unchanged) rather than adopting the mockup's satellite-tile
treatment, **and move it from once-per-property to once-per-project** —
correctly identified as a data-model fix, not just a style choice: a
property can hold multiple projects, each with its own fence lines, so
a single property-level illustration was already showing the wrong
thing (only the "primary" project's shape, silently ignoring any
others) even before this redesign.

**What changed in `PropertyOverview.tsx`**: the round-one two-column
"project-card grid + property sidebar" layout is replaced by a fixed
two-column DOSSIER shell — a `288px` left rail (property IDENTITY and
facts only: name, Edit Property button, address/notes/added-date, a
single project-count stat) beside a flexible main column listing every
project as a dense row, not a grid tile. No property-level "At a
glance" stats and no property-level plan preview exist anymore — both
were the wrong level of the data model (see above) and are gone, not
just relocated.

- **Each project row now fetches and renders its OWN
  `buildPlanPreview` illustration** — `PlanThumbnail`, a small
  (160×116 viewBox) version of the same dashed-path/dot-vertex/gate-dot
  SVG rendering, inline in a `112×80` frame to the left of that
  project's name/status/stats. A `fence` project with no lines yet
  renders a real "Nothing drawn" placeholder in the same frame (the
  function already handled the empty case; this is the first UI to
  actually render that path, previously invisible since the property-
  level illustration always had at least the primary project's data).
- **`lawn_care` project rows** get a plain dashed-border placeholder
  with a Sprout icon instead of the illustration — there's no fence
  line to draw and no lawn-care drawing UI exists yet.
- Same underlying data/hooks as round one: each `FenceProjectRow` still
  does its own `useProject` + `useEstimates` fetch (unchanged N+1-at-
  small-scale tradeoff, see round one's note) — the illustration is
  free once that fetch already exists, since `buildPlanPreview` only
  needs the same `fenceLines`/`coordinates`/`gates` the stats already
  read.
- Grid-collapse care from round one's CSS bug applied here too:
  `grid-cols-1 lg:grid-cols-[288px_1fr]`, explicit unprefixed base,
  rail stacks above the project list on mobile.

Verified live: the real "Gate Test Yard" test property (one fence
project, a real drawn line + gate) renders the rail correctly and the
project row shows the actual dashed line with its gate marker,
matching the real 221 ft / $5,628 / 1 gate stats; three other real test
properties with an empty auto-created fence project each correctly
show the "Nothing drawn" placeholder alongside `—`/`—`/`0` stats and
"No address provided"/"No notes added" fallbacks in the rail; checked
375px mobile width directly (`body.scrollWidth === clientWidth ===
375`, no clipped overflow) on both a populated and an empty property.

**Follow-up, same day: bigger project rows, and a real satellite image
in the rail.** Direct feedback after using the Dossier layout above —
two changes, same file:

- **Project-row thumbnails are 3x** (112×80 → 336×240 on sm+, full-width
  with the same aspect on mobile) and the whole row grew to match
  (larger name/status/stat type sizes, more vertical padding, `flex-col`
  on mobile so a 336px-wide frame doesn't fight a 375px viewport for
  room). `PlanThumbnail`'s SVG itself didn't need any changes — it
  already fills its container via `viewBox` + `w-full h-full`, so
  resizing the frame was purely a container-class change.
- **A real satellite image, in the rail, above "Edit Property."** Not
  the mockup's approach (a pre-fetched, base64-embedded tile — an
  Artifact-only constraint) — the real app already allows
  `server.arcgisonline.com` in `server/index.ts`'s CSP `img-src` (for
  `MapEditorComponent`'s tile layer), so `PropertySatelliteImage`
  geocodes the property's own address client-side (Nominatim, the same
  `countrycodes=us`-scoped call `MapEditorComponent.handleSearch` already
  uses, for the same US-fuzzy-match reason documented above) and points
  a plain `<img>` at Esri's World_Imagery `MapServer/export` REST
  operation — a single static image for a lat/lng bounding box, no key,
  no Leaflet/tile-grid needed for a non-interactive thumbnail. Correctly
  applies the same `cos(latitude)` longitude correction this app's real
  distance math already uses elsewhere, so the image isn't stretched
  east-west.
  - **A real, non-obvious limit found and fixed while wiring this up**:
    Esri's `export` endpoint 500s with an opaque "Error: bytes" response
    on a bounding box tighter than roughly 100m in its shorter
    dimension — confirmed live with a real curl span-sweep against a
    real address (0.0005° failed, 0.001° succeeded), not assumed from
    docs. An initial ~80m-wide attempt hit this and silently rendered a
    broken image (`naturalWidth: 0`) with no console error, no failed
    network entry visible to the usual checks — only caught by directly
    probing `img.complete`/`naturalWidth` and then curling the exact
    failing URL by hand. Fixed by widening the shown span to 200m real-
    world width, comfortably clearing the floor.
  - Deliberately independent of any project's fence-line coordinates —
    geocodes the PROPERTY's own address, so it renders even before any
    project has a drawn line, and isn't tied to whichever project
    happens to be "primary."
  - Handles all three real states: loading (`Skeleton`), no address
    ("Add an address to see a satellite view"), geocode failure
    ("Couldn't locate this address") — same category of honest,
    non-silent failure handling as `MapEditorComponent`'s own
    `geocodeIssue` banner.

Verified live: "Gate Test Yard"'s real address rendered a real,
correctly-framed satellite image of that address; a no-address test
property correctly showed the "Add an address" placeholder instead of
a broken image; confirmed the enlarged thumbnail's actual rendered box
is genuinely 336×240 (not just visually similar at a scaled-down
screenshot size) via `getBoundingClientRect()`; checked 375px mobile
width on both the satellite image and an enlarged row — rail image and
row both reflow to full width with zero horizontal overflow
(`body.scrollWidth === clientWidth === 375`).

**Second follow-up, same day: thumbnails 25% smaller, fence lines
zoomed out within them.** Direct feedback right after the 3x-size pass
above — the bigger frame was right, but the fence line itself still
filled it edge-to-edge (`buildPlanPreview` always normalized a line's
own bounding box to the full padded inset, so the shape touched the
frame no matter how big the frame was). Two independent changes:
- **Frame size**: 336×240 → 252×180 (a 25% cut), same `sm:`/mobile
  responsive pattern as before.
- **Zoom**: `buildPlanPreview`'s `project()` now shrinks the normalized
  0..1 coordinate toward the frame's center (`0.5 + (frac - 0.5) *
  ZOOM`, `ZOOM = 0.6`) before mapping to pixels, so the fence's own
  bounding box only spans 60% of the padded inset instead of 100% —
  real empty margin around the shape, reading as "a shape on a map"
  rather than "a shape stretched to fill a card." Independent of frame
  size — either can change later without touching the other.

Verified live: the real "Gate Test Yard" line now renders with visible
margin inside the grid image instead of touching its edges, an empty
"Nothing drawn" placeholder still centers correctly at the new size,
and the thumbnail's actual rendered box measures 252×180 via
`getBoundingClientRect()` — confirming the frame really shrank and
wasn't just visually smaller from an unrelated layout shift.

**Third follow-up, same day: rail/main surface tones flipped.** Direct
feedback: "the left rail is slightly lighter than the right section,
I'd like to flip that." The rail was `bg-panel` (the app's lighter
surface token, `--panel` L98%) inside an outer wrapper that was
`bg-card` (`--card` L96%, slightly darker) — main inherited that
`bg-card` since it never set its own background. Flipped by swapping
which token each side uses rather than inventing a new one: the outer
wrapper is now `bg-panel` (so main, still unset, inherits the lighter
tone) and the rail explicitly overrides to `bg-card text-card-foreground`
(darker). The two thumbnail-frame backgrounds inside each project row
(`FenceProjectRow`, `LawnCareProjectRow`) also moved `bg-panel` →
`bg-card` — they need to contrast against whatever's now behind them
(the lighter `bg-panel` main column), not the old one; left as `bg-panel`
they'd have gone flat/invisible against the new main background. The
satellite image's own frame (`PropertySatelliteImage`) deliberately
stayed `bg-panel` — it sits in the rail, which is now the darker
`bg-card`, so `bg-panel` still reads as a lighter inset frame there,
same visual relationship as before, just now on the other side.

Verified live via computed `backgroundColor`, not just eyeballing (the
two tokens are only 2 lightness points apart, easy to misjudge from a
screenshot alone): rail resolved to `rgb(249,246,241)`, main/outer to
`rgb(251,250,248)` — main is now the lighter of the two, confirming the
flip actually took effect; also confirmed a project thumbnail's frame
picked up the same `rgb(249,246,241)` as the rail, so it still contrasts
against the lighter main background. Checked 375px mobile — no
regressions, still stacks with zero horizontal overflow.

**Fourth follow-up, same day: "Add a project" moved out of the toolbar,
into the list itself.** Was a small `text-primary` text link in the
main column's top-right header row — direct feedback wanted it below
the last project row instead, "more like an empty project you can
click on than a small button." `AddProjectDialog` renamed
`AddProjectRow` and restyled from an inline text link to a full-width
dashed tile (`border-2 border-dashed`, centered `Plus` icon + "Add a
project" label, `hover:border-primary/50 hover:bg-primary/5`) sized
with the same vertical rhythm as a real project row so it reads as the
next item in the list, not a toolbar action bolted above it. The
header row above the list now just shows the "Projects (N)" label,
nothing trailing. The old `property.projects.length === 0` branch (a
separate "No projects yet — add one to get started" placeholder box)
is gone — `AddProjectRow` always renders after whatever project rows
exist (zero or more), and its own dashed empty-tile styling already
communicates "nothing here yet, click to add" without a second message
saying the same thing. Same dialog/mutation logic underneath,
untouched — only the trigger and its position moved.

Verified live: the tile renders correctly below the one existing
project row on a populated property, and as the sole element (no
separate empty-state box above it) on a property with no address/no
lines yet; clicked it and confirmed the same "What are you planning?"
Fence/Lawn Care dialog still opens. (Console briefly showed a stale
`AddProjectDialog is not defined` error after the rename, from an
already-loaded HMR module referencing the old name — the documented
"stale dev-tab console" gotcha elsewhere in this file; a fresh tab
loaded with zero errors, confirming the rename itself was clean.)

## Properties.tsx ("My Properties" grid) — real content for a blank card (2026-08-30)

Prompted directly: think through a brand-new user's first property with
nothing drawn yet, and bring content over from the Dossier page to fix
it. Worth being explicit about which page this actually is — asked the
user directly rather than guessing, since the described scenario (a
brand-new, one-property user landing on "a blank property page") could
plausibly mean either `PropertyOverview.tsx` (the single-property
Dossier, which the property-count-aware nav/redirect sends a 1-property
user straight to) or `Properties.tsx` (the literal "My Properties" grid,
normally skipped by that same redirect for a 1-property user — but
still reachable any time via the Dossier page's own "← Back to
Properties" link, which is unconditional). The user picked
`Properties.tsx`: a real card there, for a property with no address
geocoded and no fence line drawn, used to render almost nothing —  a
generic `MapPin` icon, a name, an address (or "No address provided"),
a bare "planning" badge, and a "Created {date} / View Details →"
footer. No visual context, no guidance.

**Shared two pieces out of `PropertyOverview.tsx` first**, since both
pages now need them — one source of truth, same reasoning as pulling
`STORE_LABELS`/`consolidateMaterials` into `lib/estimates.ts`:
- `client/src/lib/planPreview.tsx` — `buildPlanPreview()` +
  `PlanThumbnail` (the abstract dashed-line illustration).
- `client/src/components/PropertySatelliteImage.tsx` — the real Esri
  satellite-image component (geocode + `MapServer/export` URL builder).
  Gained a new `flush?: boolean` prop: the Dossier rail shows it inset
  (its own rounded corners + border, sitting inside the rail's padding);
  a property CARD wants it flush against the card's own top edge, where
  the card's own `overflow-hidden rounded-2xl` already handles rounding
  — a second inner border/radius right at that edge would have looked
  like a nested double-frame. `flush` drops the image's own
  rounding/border for that usage; every other behavior (geocode, states,
  URL) is identical.

`PropertyOverview.tsx` now imports both instead of defining them
locally — verified live afterward that the Dossier page still renders
byte-identical to before the extraction (same satellite image, same
per-project illustrations, zero console errors).

**What actually changed on the grid page**: each card became its own
`PropertyCard` component (previously the grid just mapped inline, no
per-item hooks) so it can do its own `useProject`/`useEstimates` fetch
for a single-fence-project property — same N+1-at-small-scale pattern
already accepted on the Dossier page for the identical reason.
- **Real satellite image at the top of every card** (`flush`), not a
  generic `MapPin` icon — this is the actual fix for "very little
  context": even a property with nothing drawn yet now shows a real
  photo of the actual yard, since the image is geocoded from the
  property's OWN address and has nothing to do with whether a fence
  line exists. The status/project-count badge and the delete control
  moved to float over the image with their own translucent backdrop
  (`bg-*-100/90 backdrop-blur-sm`) so they stay legible over a photo
  instead of a flat card background.
- **Real per-project stats** (length / est. cost / gates) when a
  single fence project has something drawn — identical numbers to what
  the Dossier page shows for that same project, not a re-derived
  approximation.
- **Honest guidance text in place of stats when nothing's drawn yet**:
  "Nothing drawn yet — click to start mapping your fence." instead of
  three dashes or blank space — this is the actual "content that makes
  the page usable with no content" the request asked for, not just a
  bigger image.
- **Context-aware footer CTA**: "Start drawing →" replaces the generic
  "View Details →" specifically when a single fence project has zero
  length — a small nudge toward the actual next action instead of a
  neutral label.
- Multi-project and lawn-care properties are deliberately left alone
  (no stats-fetch, generic "View Details →") — there's no single
  project's numbers to show, same reasoning `FenceProjectRow` vs.
  `LawnCareProjectRow` already draws on the Dossier page.

Verified live: the real "Gate Test Yard" card shows its real satellite
photo and real 221 ft / $5,628 / 1 gate stats with "View Details →";
two real test properties with no address and no lines each correctly
show the "Add an address to see a satellite view" placeholder, the
"Nothing drawn yet" guidance line, and "Start drawing →"; confirmed via
`getBoundingClientRect()` that the badge and delete-button overlays
don't collide (12px gap between them) now that they float over the
image instead of a plain card background; checked 375px mobile width —
single-column stack, zero horizontal overflow; re-checked
`PropertyOverview.tsx` after the extraction — identical render, zero
console errors in a fresh tab.

**Follow-up, same day: the TRUE zero-properties state was still
broken.** The redesign above fixed a near-empty CARD; a real screenshot
from the user caught a worse, more fundamental gap one level up — a
brand-new account with *zero* properties at all rendered "No properties
found / Try adjusting your search or add a new property to get
started," the exact same copy the page shows when a search just happens
to match nothing. Wrong message for a fresh signup: they never
searched anything, they have nothing yet. Worth being clear this
scenario is real and common, not an edge case — `Dashboard.tsx` redirects
an authenticated user to `/properties` (this page) whenever their
property count isn't exactly 1, and it's exactly 0 for every brand-new
account, so this broken message was the literal first screen a new
signup could land on.

Fixed by actually splitting the two cases, which the code had silently
conflated into one `filteredProperties.length === 0` branch:
`hasAnyProperties = propertyCount > 0` now gates a completely different
render — a real `FirstPropertyOnboarding` component instead of the
generic "no results" box, only for a genuinely empty account. The
search-input itself is hidden entirely in that state too (nothing to
search yet), and the standalone "Add a Property" button that normally
sits below the grid is suppressed there as well, since the onboarding
block already carries its own prominent CTA — three separate
"add a property" affordances stacked on one empty page would have been
worse, not better.

`FirstPropertyOnboarding` (`Properties.tsx`): a `LandPlot` icon in the
same rounded-square/primary-color badge treatment as the nav logo, "Let's
map your first yard," a plain-language sentence about what happens next,
one large `Add Your First Property` button (the existing
`AddPropertyDialog`, triggered via its `children`-as-trigger prop, same
pattern `EditPropertyDialog`/`AddProjectRow` already use), and a
three-column `STEP_01`/`STEP_02`/`STEP_03` strip reusing the exact
`FENCING · HOW IT WORKS` mono-label language from the guest homepage's
own three-step section (`Dashboard.tsx`) — same voice, not new copy
invented for this one page.

Verified live end-to-end: registered a genuinely fresh test account
(`emptytest+1@example.com`) — landed on this exact broken state
reproducing the user's screenshot first, then on the fix confirmed the
real onboarding block renders instead, the search bar is gone, clicking
"Add Your First Property" opens the real `AddPropertyDialog` (not a
dead button), and checked 375px mobile (steps stack to one column, zero
overflow). Separately confirmed the OTHER case — an account with a real
property, searched for text matching nothing — still shows the original
"No properties found / Try adjusting your search" box with the search
input present and the standalone "Add a Property" button back below the
grid, proving the split didn't regress the actual search-empty case.

**Search removed, same day, right after the fix above shipped.**
Direct instruction: "let's remove search for now." Pulled the whole
filter UI (`Search` icon input, `search`/`setSearch` state,
`filteredProperties`) rather than just hiding it — a dead input with no
way to trigger it isn't a real feature to keep half-wired. That also
made the "no results match your search" empty-state branch genuinely
unreachable (nothing sets `search` anymore), so it was deleted too, not
left as dead code; `hasAnyProperties` alone now decides grid vs.
`FirstPropertyOnboarding`, with a comment on the removal explaining how
to restore the two-way split (search-matched-nothing vs. genuinely-
zero-properties) if search comes back later, so a future re-add doesn't
re-introduce the original conflated-copy bug by accident. `Search` and
`Input` imports dropped along with it since nothing else in the file
used them.

Verified live: a fresh zero-property account still renders the exact
same onboarding block (search was never present there to begin with);
created a real property via a direct API call and confirmed the grid
renders it with no search box above it and the standalone "Add a
Property" button back below the grid, matching pre-search behavior;
`npm run check` clean, zero console errors.

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

## Page width/padding consistency pass (2026-08-30)

Prompted by direct feedback that every page's total width/padding felt
inconsistent — true, and worse in one dimension than "inconsistent
numbers": four pages had **no header at all**. Two separate fixes:

**Every "content page" now uses one of exactly two width/padding
combinations**, not whatever each page happened to pick:
- **Wide** (`max-w-6xl mx-auto p-4 md:p-8`) — browsing/dashboard pages
  with a real grid: `Properties.tsx` (was `max-w-7xl p-6 md:p-8` — a
  genuinely different width AND a different mobile padding value than
  every other page) and `PropertyOverview.tsx` (already this value —
  the standard was set to match it rather than the other way, less
  churn).
- **Narrow** (`max-w-2xl mx-auto p-4 md:p-8`) — reading/form/checklist
  pages: `Account.tsx`, `Privacy.tsx`, `BeforeYouDig.tsx`,
  `ShoppingList.tsx`. These were already identical to each other —
  confirmed live (same computed `className` on all four), not assumed.
- **Deliberately NOT forced into this mold**: `Editor.tsx` (full-bleed
  map + docked panel — a real, reviewed different layout, see "Editor
  panel layout" below) and `Dashboard.tsx`'s guest landing page
  (a marketing page with its own intentional per-section rhythm — hero,
  value props, verticals, steps, CTA — forcing one width across
  sections built to different visual weights would hurt it, not help).

**Login/Register/ForgotPassword/ResetPassword had literally no
header** — each was its own bare `flex items-center justify-center
min-h-screen` with a centered Card and nothing else: no logo, no way
back to `/` except the browser's own back button. Every other page
goes through `Layout.tsx` and gets the real header; these were a
silent, easy-to-not-notice exception (nothing crashes, it just quietly
never had one). Full `Layout` doesn't actually fit here though — its
nav (Add a Property, a Login button that would open ANOTHER login
form, the account menu) is either redundant or nonsensical mid-auth-
flow. New `client/src/components/AuthLayout.tsx` reuses Layout's exact
header markup/classes (logo mark, wordmark, height, border, blur) with
the nav/action content stripped, so switching between "logged out on
an auth page" and "logged out on any other page" reads as the same
app. All four pages now wrap in it.

**`not-found.tsx` got the same treatment, but needed more care** — it's
used TWO different ways across the app: as `App.tsx`'s catch-all route
(rendered completely bare, no Layout anywhere in the tree above it) and
as the "resource not found" branch inside several pages' own `*Content`
components (`PropertyOverviewContent`, `ShoppingListContent`,
`BeforeYouDigContent`, `Editor`'s own body), which are ALREADY nested
inside that page's own `<Layout>`. Making `NotFound` wrap its own
`<Layout>` would have fixed the first case and DOUBLE-HEADERED the
second — caught by actually grepping every `<NotFound />` call site
before changing anything, not assumed. Fixed the right way instead:
`NotFound` stays a lean, unwrapped component, and the handful of call
sites that truly had no `Layout` above them at all — `App.tsx`'s
catch-all route, and each page's OTHER early return for an invalid
route param (checked before that page's own `<Layout>` even renders) —
each add `<Layout>` at that specific call site. Verified live: a bad
URL and a valid-route/nonexistent-resource URL (`/properties/999999`)
both render exactly one header, not zero or two.

**Follow-up, same day: the header itself wasn't part of the column.**
The pass above standardized every PAGE's own content width, but missed
`Layout.tsx`'s header — its inner content row was `w-full` with no cap
at all, so on any screen wider than 1152px the logo/nav sat further out
than the "wide" content column below it, and their edges never lined
up (a real, visible misalignment on a normal desktop window, not an
edge case). Fixed by capping the header's inner row at the same
`max-w-6xl mx-auto` as the wide-page standard, with the same
`px-4 md:px-8` horizontal padding (was its own three-step `px-4 md:px-6
lg:px-8`, now two steps matching every page). The header's own
`border-b` still spans the full browser width on purpose — only the
content ROW is capped, same as a divider should. Narrow pages (the
`max-w-2xl` standard) now read as a centered, deliberately narrower
column INSET within that same header-defined column, rather than an
unrelated width — both share one `mx-auto` center line. Verified live
at 1600px: header and main content row report byte-identical
`getBoundingClientRect()` left/right/width (1152px, same edges) on a
wide page; a narrow page's content visibly nests inside the header's
column instead of just looking arbitrarily narrower.

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

**Docker deployment via Hostinger's Docker Manager (2026-08-30/31): added,
alongside the non-Docker path above (not a replacement).** User wanted the
app visible/manageable from Hostinger's own dashboard rather than a plain
SSH-and-`npm run start` process. `Dockerfile` is a two-stage build — stage
one runs the existing `npm run build` with the full dependency tree, stage
two copies just `dist/` plus a `npm prune --omit=dev`'d `node_modules`
(the esbuild bundle only inlines a small allowlist of server deps, see
above — everything else needs to actually exist at runtime). Verified
without a local Docker daemon (none installed here) by replicating the
exact sequence — `npm ci` → `npm run build` → `npm prune --omit=dev` →
`node dist/index.cjs` — in an isolated copy; booted cleanly, served a
real `200`.

Hostinger's Docker Manager can only *pull* an already-built, publicly
hosted image — it can't build from source (a `docker-compose.yml` with
`build: .` gets rejected there, confirmed live by Hostinger's own error
message). `.github/workflows/docker-publish.yml` builds the same
Dockerfile and pushes it to `ghcr.io/johnslloyd/mapmyfence:latest` on
every push to main — no Docker Hub account, uses the repo's own
`GITHUB_TOKEN`. One manual one-time step this can't automate: the ghcr.io
package starts *private*, and Hostinger can't authenticate to pull a
private one — has to be flipped to Public once, in GitHub's Packages UI.
`docker-compose.yml` points at that image; Hostinger's Docker Manager
consumes it via **the raw GitHub URL**, not the repo page.

**Temporary sharing subdomain — `myyardmanager.johnlloyd.cloud`, via
Traefik (Hostinger's reverse proxy) — added so testers don't need the
VPS's raw IP.** Real gotcha, not obvious from Hostinger's own support
chat: pointing a Traefik-managed subdomain at a container needs explicit
`traefik.*` Docker labels on the service — without them, Traefik falls
back to its default self-signed cert (a browser privacy warning) and a
404, which is genuinely confusing since it looks like the app itself is
broken rather than "no route exists yet." `docker-compose.yml`'s
`labels:` block: `entrypoints=websecure` and `certresolver=letsencrypt`
confirmed correct by Hostinger support for Docker Manager specifically
(not guessable from generic Traefik docs — these are Hostinger's own
static config names). Router/service name in the labels is `mapmyfence`
— matching Hostinger's own example AND the actual Docker Manager
**project** name for this app, which is still literally "MapMyFence"
on Hostinger's side (the in-app product rename never touched Hostinger's
own project naming) — used deliberately instead of this repo's current
`myyardmanager` image name, in case Docker Manager expects the router
label prefix to match its project name internally.

**A real, separate bug this surfaced: raw Postgres/Drizzle errors —
including literal SQL, bound parameters, and a user's email — were
leaking straight to the browser's Network tab on any unexpected server
error.** `server/index.ts`'s catch-all error middleware was sending
`err.message` to the client verbatim for every error, with no
production/dev distinction. Confirmed live: the actual production outage
(new-user registration and login both failing) turned out to be a
`ENETUNREACH` — Supabase's *direct* database connection now resolves to
an IPv6 address in this region, and the VPS/Docker networking has no
real IPv6 route, so every connection attempt failed before the query
ever ran. Real fix for THAT is infra-only (swap `DATABASE_URL` to
Supabase's Session Pooler connection string, which is IPv4-compatible —
no code change, `.env` only) — but diagnosing it live meant that raw
error message really did leak to a real user's browser first, which is
its own genuine problem independent of whatever the underlying error
happens to be. Fixed: in production, any error reaching this catch-all
with a 5xx now gets a generic "Something went wrong on our end" message
client-side — every INTENTIONAL, user-facing error (wrong password, an
expired reset link, hitting the free-plan property limit, ...) is
already sent directly via its own route handler's own
`res.status(...).json(...)` call, never through this generic path, so
nothing legitimate got quieter. The full original error (real cause
included) still reaches `console.error` server-side, unchanged —
that's what actually diagnosed the `ENETUNREACH` in the first place, and
stays available to whoever has server/container log access.

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

## Admin panel

Read-only, server-side gated on `users.isAdmin` (added alongside Pro
account tiers — see that section for `users.plan`/`isAdmin` schema
history). Every route lives under `/api/admin/*`, protected by an
`isAdmin` Express middleware (`server/routes.ts`) checked on the
server on every request — never just a hidden nav link, since a
client-side-only gate isn't real access control. A non-admin gets a
403, not a 404 — this app has no reason to hide that admin routes
exist, only to enforce who can use them. Every view is audit-logged
through the same `logEvent` funnel-logging mechanism as everything
else (`admin_viewed_users`, `admin_viewed_user`, `admin_viewed_project`
event types), not a separate audit system.

`Admin.tsx` (`/admin`): a searchable user table (email, plan,
property/project counts, joined date) and an Activity tab listing
recent events across the whole app. `AdminUserDetail.tsx`
(`/admin/users/:id`): drill-down into one user's properties and
projects, same shape a user sees on their own `/properties`. Both
self-enforce their own auth+isAdmin redirect directly in the component
(same pattern as `Account.tsx`), registered in `App.tsx` as plain
routes rather than `ProtectedRoute` — the real gate is server-side.

**Open a fence project's diagram, line detail, and materials cost
(2026-09-01).** Direct ask: view the actual fence line a user drew and
what it's estimated to cost, from the admin side — `AdminUserDetail.tsx`
previously only listed a user's projects by name/status/type icon, no
way to see what was actually inside one. Every FENCE project row (not
`lawn_care` — no fence lines to show there yet) is now a button that
opens a dialog with:

- The real plan diagram — `PlanThumbnail` (`client/src/lib/
  planPreview.tsx`), the same component the Dossier page and the
  Properties grid already share, reused rather than rebuilt a third
  time.
- Total length / est. cost / gate count, and each fence line's own
  name/length/material/height (a project can hold more than one line).
- The full materials breakdown and total — `calculateEstimate`'s real
  output, grouped and consolidated with the exact same
  `STORE_LABELS`/`MATERIAL_TYPE_LABELS`/`MATERIAL_TYPE_ORDER`/
  `consolidateMaterials` helpers (`client/src/lib/estimates.ts`) the
  editor sidebar and shopping list use — a store picker appears when
  more than one store prices everything the project needs, identical
  "Best price" logic.

**New admin-only endpoint, not a reuse of the regular one**: the
existing `/api/projects/:id/estimates` route calls
`storage.getProject(id, userId)`, which is ownership-gated to the
REQUESTING user — exactly wrong for viewing someone else's project.
`storage.getProjectWithLines(id)` (the private helper every project
mutation already used internally to return fresh data) has no such
check at all, so it was made a public `IStorage` method and given its
own route, `GET /api/admin/projects/:id` (`api.admin.getProject`,
`shared/routes.ts`) — gated by the `isAdmin` middleware instead of a
userId match, computing the same `calculateEstimate` call inline and
returning `{ project, estimate }` together in one response. `events.type`
gained `"admin_viewed_project"` (a TS-only Drizzle enum value, no
migration needed — see Database migrations below) logged with the
viewing admin as `userId` and the project owner as `targetUserId`,
same convention `admin_viewed_user` already established.

**A real accessibility bug caught live, not assumed**: the dialog's
`DialogTitle` only rendered once project data loaded, leaving Radix's
required title element absent during the loading-skeleton render —
confirmed via a genuine Radix console error (`DialogContent requires a
DialogTitle`), not a hypothetical. Fixed by moving `DialogHeader`
outside the loading conditional entirely, rendering a plain "Loading
project…" title until the real one is available, so a `DialogTitle`
is present on every render, not just the loaded one.

Verified live end-to-end: registered two fresh test accounts (one as
the data owner, one granted admin via `script/_grant_admin.ts`) rather
than reusing an existing account, specifically to prove this works
cross-user, not just on data the viewing admin happens to also own;
created a real property/fence line/gate via direct API calls, opened
it from the admin side, and confirmed the diagram rendered the real
line and gate marker, the stats matched what the line/gate actually
were, and the materials list correctly showed only Lowe's (Home
Depot drops out for any project with a gate, since HD gate hardware
isn't seeded yet — see "Gates on wooden fences" — confirming the
admin route reuses the exact same store-eligibility rule, not a
simplified copy). Reproduced the Radix warning first, then confirmed
it was gone in a fresh tab after the fix (the mid-session tab still
briefly showed the old error — the documented stale-console-replay
gotcha elsewhere in this file, not a real regression).

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

**`npm run dev` does NOT watch/auto-restart** — plain `tsx server/index.ts`,
no `--watch` flag, no nodemon. Vite's dev middleware hot-reloads CLIENT
changes on its own, but any edit to `server/**` or `shared/**` needs the
dev process manually stopped and restarted before it takes effect — found
the hard way while building gates (2026-08-29): new routes/schema/storage
code typechecked clean but a live request against them just fell through
to Vite's SPA `index.html` fallback, because the running process was still
serving the pre-edit server code. If a server-side change isn't taking
effect and there's no obvious reason why, restart the dev server before
debugging further.

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

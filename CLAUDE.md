# MapMyFence

DIY fence-planning tool: users map fence lines on a satellite view of their
property and get material estimates. Longer-term direction is a full yard
management feature set — fencing is the first vertical, not the whole product.

## Project history — read before assuming anything

This repo was built across several different tools/environments before
settling on Claude Code (Replit Agent → direct root SSH edits on the
production VPS → local Mac development). Each transition left artifacts
behind that look like real config but are dead or actively misleading. Two
concrete consequences, both still true as of writing:

- There are **two auth implementations** in this repo. Only one is real —
  see "Auth" below. Do not "complete" the other one; delete it instead.
- There are **two deployment configs** (Replit and a VPS). Only the VPS is
  real — see "Deployment" below. Treat `.replit` as legacy.

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

The fence line `material` field (Wood/Vinyl/Iron) is **not** wired to the
estimate calculation — it only ever prices a standard wood post-and-picket
fence. Vinyl/Iron are disabled in the material picker
(`EditFenceLineCard.tsx`) with a "pricing coming soon" label rather than
silently producing a wrong estimate. 3 real fence lines already have
`material: "vinyl"` from before this was caught — left alone, not mine to
migrate unsupervised. Material values in the DB are inconsistent free text
(`wood_cedar` vs `Cedar` vs `wood`, no enum constraint) — a data-quality
issue, not fixed.

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

The `.replit` file and the `@replit/vite-plugin-*` dev dependencies are
**legacy** from when this ran on Replit — they're currently harmless (guarded
by `REPL_ID` checks or just unused outside Replit's environment) but aren't
the deployment path. Don't add Replit-specific features assuming they're
load-bearing; safe to remove once confirmed unused.

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

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

- The CSP header in `server/index.ts` is currently a wildcard
  (`default-src * 'unsafe-inline' 'unsafe-eval' ...`), including a
  production-only block that strips any CSP `<meta>` tag from `index.html`
  and re-forces the wildcard policy. This is flagged as broken, not correct
  — if you're touching CSP, tighten it to the actual origins in use (tile
  servers, fonts, etc.), don't widen it further.
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

The estimates endpoint currently violates all three — its response shape
doesn't match its own declared Zod schema, and the client bypasses parsing
entirely. That's being fixed; don't copy its pattern for new routes.

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
npm run db:push   # drizzle-kit push using .env's DATABASE_URL
npm run build     # production build (see Deployment)
npm run start     # run production build
```

No test suite or CI currently exists. There's no `npm test` — don't assume
one and don't invent test infra unasked; flag it if it becomes a blocker.

## Known dead files

- ~~`server/db.ts.save`~~ — removed.

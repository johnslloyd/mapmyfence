# syntax=docker/dockerfile:1

# MyYardManager runs as a single Node process serving both the API and
# the built client (see server/static.ts, CLAUDE.md's "Deployment"
# section) — no separate Postgres/nginx service belongs in this image:
# the database is Supabase-hosted, reached over the network via
# DATABASE_URL, and Hostinger's own reverse proxy is expected to sit in
# front of this container for TLS.
#
# Two-stage build: `npm run build` (script/build.ts) needs the full
# dependency tree — vite, esbuild, typescript, tailwind, etc. — but the
# app's own esbuild bundle only inlines a small allowlist of server
# deps (see script/build.ts's `allowlist`); everything else stays an
# external `require()`, so the RUNTIME stage still needs a real
# node_modules, just pruned to production-only packages, not the build
# tooling.

FROM node:20-alpine AS build
WORKDIR /app

# Install with the lockfile before copying the rest of the source, so
# this layer only re-runs when dependencies actually change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Drop devDependencies now that vite/esbuild/tsc have already run —
# the runtime stage copies this pruned node_modules, not build tooling.
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Real env vars (DATABASE_URL, SESSION_SECRET, RESEND_API_KEY, PORT,
# ...) are supplied at `docker run`/compose time, never baked into the
# image — see docker-compose.yml and CLAUDE.md's "Environment" section
# for what's required.
EXPOSE 5051
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-5051}/" || exit 1

CMD ["node", "dist/index.cjs"]

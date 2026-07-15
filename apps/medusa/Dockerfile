# Build context is the monorepo root (see docker-compose.prod.yml) — `medusa build`
# needs the full pnpm workspace to compile. Its output (.medusa/server) ships its own
# package.json declaring the same dependencies, but with NO node_modules and NO
# lockfile — verified directly that installing fresh there (`npm install`, no
# lockfile to pin versions) can silently resolve a mismatched nested dependency
# version: got `pg@8.20.0` nested under @mikro-orm/postgresql vs `pg@8.22.0`
# top-level, and that mismatch made every `medusa db:migrate` transaction hang
# indefinitely acquiring a pool connection (retrying every 60s — tarn.js's default
# acquireTimeoutMillis — with no visible error at any log level). Confirmed by
# comparing against a plain, isolated `knex.transaction()` call using the same DB,
# which succeeded instantly — the bug was specific to mikro-orm's mismatched pg
# copy, not knex, not Docker, not alpine (also verified/ruled out along the way).
#
# Fix: don't install anything fresh in the runner stage at all. Reuse the
# workspace's own pnpm-resolved node_modules (single consistent dependency
# versions, pinned by pnpm-lock.yaml) by copying them alongside .medusa/server's
# build output rather than letting a second, unlocked install pick its own
# versions. Node's directory-walking module resolution finds them from
# apps/medusa/.medusa/server the same way it would from apps/medusa/src.
FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @strengthiva/medusa build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/medusa/node_modules ./apps/medusa/node_modules
COPY --from=builder /app/apps/medusa/.medusa/server ./apps/medusa/.medusa/server

WORKDIR /app/apps/medusa/.medusa/server
EXPOSE 9000

# Runs pending migrations before every start — safe to run repeatedly (Medusa's
# migration runner is idempotent), and means a deploy can never forget this step.
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]

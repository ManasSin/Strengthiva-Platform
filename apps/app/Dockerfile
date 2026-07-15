# Build context is the monorepo root (see docker-compose.prod.yml) — pnpm workspace
# installs need the root lockfile/workspace manifest alongside this package's own.
#
# Debian-slim, NOT alpine — see apps/medusa/Dockerfile's comment: verified directly
# that alpine's musl libc causes a silent hang (not a crash) with one of this
# workspace's native deps (sharp, used for Next's image optimization, is a likely
# suspect — same package is present in this app's dependency tree). Using slim
# across all three Dockerfiles rather than re-verifying per-app individually.
FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, not read at
# runtime — must arrive as build args (see docker-compose.prod.yml's `args:`), not
# just as `environment:` on the running container.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @strengthiva/app build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# .next/standalone mirrors the monorepo path (apps/app/server.js), plus a hoisted
# node_modules at its root — Next's own recommended pattern for standalone in a
# workspace, see https://nextjs.org/docs/app/api-reference/config/next-config-js/output.
COPY --from=builder /app/apps/app/.next/standalone ./
COPY --from=builder /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder /app/apps/app/public ./apps/app/public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/app/server.js"]

# Build context is the monorepo root (see docker-compose.prod.yml) — pnpm workspace
# installs need the root lockfile/workspace manifest alongside this package's own.
#
# Debian-slim, NOT alpine — see apps/medusa/Dockerfile's comment: verified directly
# that alpine's musl libc causes a silent hang (not a crash) with one of this
# workspace's native deps. Using slim across all three Dockerfiles rather than
# re-verifying per-app individually.
FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, not read at
# runtime — must arrive as build args (see docker-compose.prod.yml's `args:`), not
# just as `environment:` on the running container. NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
# is also enforced at config-load time by check-env-variables.js — build fails loudly
# if it's missing rather than shipping a broken image.
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_DEFAULT_REGION
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID
ARG NEXT_PUBLIC_STRIPE_KEY
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID \
    NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY

RUN pnpm --filter @strengthiva/store build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/store/.next/standalone ./
COPY --from=builder /app/apps/store/.next/static ./apps/store/.next/static
COPY --from=builder /app/apps/store/public ./apps/store/public

USER nextjs
EXPOSE 3001
ENV PORT=3001 HOSTNAME=0.0.0.0
CMD ["node", "apps/store/server.js"]

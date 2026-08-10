#!/usr/bin/env bash
#
# Production deploy for strengthiva-platform (app + store + medusa). Run ON the VPS from
# /opt/strengthiva-platform, after the working tree is already at the commit you want
# live. CI does `git fetch && git reset --hard origin/main` then calls this, so the
# script is version-controlled and deploys itself.
#
# Safe to run by hand:
#   bash scripts/deploy.sh            # app + store (the usual case)
#   bash scripts/deploy.sh app        # just the app
#   bash scripts/deploy.sh medusa     # commerce backend, runs its own migrations
#
# Same three guarantees as the backend's deploy.sh — rollback image, migrations before
# the new code serves, health gate with auto-rollback — with two differences that matter
# here:
#
#   NEXT_PUBLIC_* ARE BUILD ARGS, NOT RUNTIME CONFIG. Next.js inlines them at build time,
#   so they must be present in the repo-root .env when `docker compose build` runs, NOT
#   just in each app's .env.local. Getting this wrong doesn't fail the build — it ships a
#   bundle with localhost URLs baked in, which looks fine until a user clicks something.
#   Checked explicitly below rather than hoped for.
#
#   MEDUSA MIGRATIONS ARE ITS OWN. `medusa db:migrate` against Medusa's Postgres — a
#   different database from FastAPI's, and nothing to do with Alembic. Only run when
#   medusa is among the services being deployed.
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
SERVICES=("${@:-app store}")
# shellcheck disable=SC2206
SERVICES=(${SERVICES[@]})

HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"

declare -A HEALTH_URL=(
  [app]="http://127.0.0.1:3000/"
  [store]="http://127.0.0.1:3001/in"
  [medusa]="http://127.0.0.1:9000/health"
)
declare -A IMAGE=(
  [app]="strengthiva-platform-app"
  [store]="strengthiva-platform-store"
  [medusa]="strengthiva-platform-medusa"
)

log()  { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

cd "$(dirname "$0")/.."

DEPLOYED_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
log "Deploying strengthiva-platform @ ${DEPLOYED_SHA} — services: ${SERVICES[*]}"

# ── 0. Guard the build args ─────────────────────────────────────────────────────
# Only relevant when a Next.js app is in the deploy set; medusa reads its config at
# runtime like a normal server.
if printf '%s\n' "${SERVICES[@]}" | grep -qE '^(app|store)$'; then
  [ -f .env ] || fail "No repo-root .env — NEXT_PUBLIC_* build args would be empty and the bundle would ship with broken URLs."
  missing=()
  for var in NEXT_PUBLIC_APP_URL NEXT_PUBLIC_API_URL NEXT_PUBLIC_BASE_URL NEXT_PUBLIC_MEDUSA_BACKEND_URL NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY; do
    grep -qE "^${var}=.+" .env || missing+=("$var")
  done
  [ ${#missing[@]} -eq 0 ] || fail "Missing/empty in repo-root .env: ${missing[*]} — these are inlined at build time."
  if grep -qE '^NEXT_PUBLIC_.*localhost' .env; then
    fail "A NEXT_PUBLIC_* value in .env points at localhost. That would be baked into the production bundle."
  fi
  log "Build args OK"
fi

# ── 1. Remember what is running ─────────────────────────────────────────────────
for svc in "${SERVICES[@]}"; do
  img="${IMAGE[$svc]:-}"
  [ -n "$img" ] || fail "Unknown service '$svc' (expected: app, store, medusa)"
  if docker image inspect "${img}:latest" >/dev/null 2>&1; then
    docker tag "${img}:latest" "${img}:rollback"
    log "Tagged ${img}:rollback"
  fi
done

# ── 2. Build ────────────────────────────────────────────────────────────────────
log "Building: ${SERVICES[*]}"
docker compose -f "$COMPOSE_FILE" build "${SERVICES[@]}" \
  || fail "Build failed — nothing was changed, old containers still serving."

# ── 3. Medusa migrations, before the new code serves ────────────────────────────
if printf '%s\n' "${SERVICES[@]}" | grep -qx medusa; then
  log "Running Medusa migrations"
  docker compose -f "$COMPOSE_FILE" run --rm --no-deps medusa npx medusa db:migrate \
    || fail "Medusa migration failed — deploy aborted, OLD code still serving."
fi

# ── 4. Swap in ──────────────────────────────────────────────────────────────────
log "Restarting: ${SERVICES[*]}"
docker compose -f "$COMPOSE_FILE" up -d "${SERVICES[@]}"

# ── 5. Health gate ──────────────────────────────────────────────────────────────
failed=()
for svc in "${SERVICES[@]}"; do
  url="${HEALTH_URL[$svc]}"
  log "Waiting for ${svc} (up to ${HEALTH_TIMEOUT}s)"
  deadline=$(( $(date +%s) + HEALTH_TIMEOUT ))
  ok=false
  while [ "$(date +%s)" -lt "$deadline" ]; do
    # 2xx/3xx both count: the storefront legitimately redirects (region prefix).
    code=$(docker compose -f "$COMPOSE_FILE" exec -T "$svc" sh -c \
      "wget -q -O /dev/null -S '$url' 2>&1 | head -1" 2>/dev/null || true)
    if curl -fsS -m 5 -o /dev/null "$url" 2>/dev/null || [ -n "$code" ]; then ok=true; break; fi
    sleep 5
  done
  [ "$ok" = true ] && log "✓ ${svc} healthy" || failed+=("$svc")
done

if [ ${#failed[@]} -eq 0 ]; then
  log "✓ All healthy — ${DEPLOYED_SHA} is live"
  echo "$DEPLOYED_SHA" > .deployed-sha
  exit 0
fi

# ── 6. Auto-rollback, only the services that actually failed ────────────────────
printf '\n\033[31m✗ Unhealthy after %ss: %s — rolling back those services\033[0m\n' \
  "$HEALTH_TIMEOUT" "${failed[*]}" >&2
for svc in "${failed[@]}"; do
  docker compose -f "$COMPOSE_FILE" logs --tail 40 "$svc" >&2 || true
  img="${IMAGE[$svc]}"
  if docker image inspect "${img}:rollback" >/dev/null 2>&1; then
    docker tag "${img}:rollback" "${img}:latest"
    docker compose -f "$COMPOSE_FILE" up -d --no-build "$svc"
    printf '↩ rolled back %s\n' "$svc" >&2
  else
    printf '! no rollback image for %s — it may be down\n' "$svc" >&2
  fi
done
fail "Deploy failed for: ${failed[*]}"

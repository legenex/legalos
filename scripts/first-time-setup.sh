#!/usr/bin/env bash
# Run ONCE on the Plesk server, after the very first git pull. Brings up the
# stack, waits for Postgres, and runs the seed.
#
# Usage on the server:
#   cd /path/to/project
#   bash scripts/first-time-setup.sh

# Set PATH explicitly so this works even when invoked from Plesk's stripped
# deploy runner (no PATH inherited).
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

log() { echo "[setup $(date -u +%H:%M:%S)] $*"; }

if [ ! -f .env ]; then
  log "ERROR: .env is missing. Copy .env.example to .env and fill in production values first."
  log "  cp .env.example .env"
  log "  nano .env"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  log "ERROR: Docker is not installed on this host."
  log "Install with: curl -fsSL https://get.docker.com | sh"
  exit 1
fi

log "Building images..."
docker compose build

log "Starting containers..."
docker compose up -d

log "Waiting for Postgres..."
for i in $(seq 1 60); do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-legalos}" >/dev/null 2>&1; then
    log "✓ Postgres ready"
    break
  fi
  if [ "$i" = "60" ]; then
    log "✗ Postgres did not come up in 60s. Check 'docker compose logs postgres'."
    exit 1
  fi
  sleep 1
done

log "Running database migrations (creates tables on a fresh DB)..."
docker compose exec -T app pnpm payload migrate

log "Waiting for app on 127.0.0.1:3000..."
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null --max-time 2 http://127.0.0.1:3000/; then
    log "✓ app responding (took ${i}s)"
    break
  fi
  if [ "$i" = "60" ]; then
    log "✗ app did not start. Logs:"
    docker compose logs --tail=80 app
    exit 1
  fi
  sleep 1
done

log "Seeding initial templates + Sites..."
docker compose exec -T app pnpm seed

log "✓ first-time setup complete."
log ""
log "Next steps:"
log "  1. In Plesk, ensure os.legenex.com reverse-proxies to http://127.0.0.1:3000"
log "  2. Visit https://os.legenex.com/cms/login and log in with SUPER_ADMIN_EMAIL"
log "  3. In Plesk Git extension, set scripts/deploy.sh as the deployment action"
log "     so future pushes auto-deploy without re-running this script."

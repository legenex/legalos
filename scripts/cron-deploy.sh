#!/usr/bin/env bash
# Root cron job. Watches for /tmp/legalos-deploy.flag (created by Plesk's git
# deploy hook via scripts/trigger-deploy.sh). When the flag exists, removes it
# and runs the real deploy.
#
# Install (one-time, run as root on the server):
#   crontab -e
# Add this line (runs every minute, only does work when the flag exists):
#   * * * * * /var/www/vhosts/legenex.com/mo.legenex.com/scripts/cron-deploy.sh
#
# Logs to /var/log/legalos-deploy.log. View with:
#   tail -f /var/log/legalos-deploy.log

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

FLAG=/tmp/legalos-deploy.flag
LOG=/var/log/legalos-deploy.log
PROJECT_DIR=/var/www/vhosts/legenex.com/mo.legenex.com

# Quick exit if no work to do — keeps cron silent 99% of the time.
[ -f "$FLAG" ] || exit 0

# Atomically claim the flag so concurrent cron runs don't double-deploy.
LOCK_DIR=/tmp/legalos-deploy.lock
mkdir "$LOCK_DIR" 2>/dev/null || exit 0
trap 'rmdir "$LOCK_DIR"' EXIT

rm -f "$FLAG"

cd "$PROJECT_DIR"

{
  echo ""
  echo "===================================================================="
  echo "Cron deploy run at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "===================================================================="
  bash scripts/deploy.sh
  echo "Exit: $?"
} >> "$LOG" 2>&1

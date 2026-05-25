#!/usr/bin/env bash
# Plesk Git deploy hook. This is the script Plesk's "Additional deployment actions"
# field invokes. Plesk's git deploy runs in a chroot without docker, so we cannot
# do the actual work here. Instead, drop a flag file that the root cron job
# watches, and return immediately.
#
# Setup:
#   1. Plesk → mo.legenex.com → Git → Repository Settings → Deploy actions:
#        bash scripts/trigger-deploy.sh
#   2. As root, add a cron entry that runs scripts/cron-deploy.sh every minute
#      (see scripts/cron-deploy.sh header for the exact command).

# Use bash redirection (built-in, no external `touch` needed).
: > /tmp/legalos-deploy.flag 2>/dev/null || true

# Bash printf is a builtin and works without coreutils being on PATH.
printf '[trigger] deploy queued for cron pickup (PID %s)\n' "$$"

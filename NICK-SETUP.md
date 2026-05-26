# NICK-SETUP.md

Welcome to LegalOS. This guide gets you from zero to "I just merged my first PR and it deployed to production." Budget about 30 minutes the first time through.

> This was originally written for Nick onboarding onto LegalOS. It works for any new contributor on macOS. The Windows equivalent lives in [WORKFLOW.md](./WORKFLOW.md) under *First-time setup → Windows*.

---

## What you'll end up with

- A local clone of the LegalOS repo at `~/Documents/Projects/LegalOS`
- Toolchain matching the production server: Node 20.x, pnpm 9.15.0
- An SSH key on your Mac registered with our shared GitHub account
- `gh` CLI logged in as our shared GitHub account
- A local git identity that distinguishes your commits in `git log`
- Ability to: edit code → push to a branch → open a PR → merge → see it live at `https://os.legenex.com`

## The workflow you'll use

**Local → GitHub → server.** Edits happen on your laptop, push to a branch on GitHub, open a Pull Request, merge it. Plesk's webhook on our server picks up the merge automatically and deploys in ~30 seconds. You never SSH into the server to change a file — the next deploy would wipe it.

After setup, read [HOW-IT-WORKS.md](./HOW-IT-WORKS.md) and [WORKFLOW.md](./WORKFLOW.md). The first is the mental model; the second is the daily reference.

## Things to get from Morné (out-of-band)

Before starting, ask Morné via Signal / 1Password for:

1. **The `team@legenex.com` GitHub password** (we share one GitHub login between contributors)
2. **The 2FA TOTP** for that account (ideally via a shared 1Password vault)
3. **Confirmation that the latest workflow PR has been merged into `main`** (otherwise the docs your clone has won't match this guide)
4. **(Optional, later) Server SSH access** — only needed if you want to read live logs or check deploy status. You'll send Morné your SSH public key (Step 2 below) and he'll add it to the server.

---

# Step 1 — Install the toolchain

Open Terminal (Cmd+Space → "Terminal").

### 1a. Homebrew (skip if already installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

When it finishes, follow any final instructions it prints (usually an `eval` command to add Homebrew to your PATH for the current shell — Homebrew tells you exactly what to copy-paste).

Verify:
```bash
brew --version
# expect: Homebrew 4.x.x
```

### 1b. Node 20 + pnpm + gh

We use Node 20 specifically to match the production server (newer versions of Node mostly work but can have subtle differences). pnpm is the package manager — never use npm in this repo. `gh` is GitHub's CLI for opening PRs from the terminal.

```bash
brew install node@20 pnpm gh
brew link node@20 --force
```

Verify all four (git is usually preinstalled via Xcode tools; if not, `brew install git`):

```bash
node --version    # expect: v20.x.x
pnpm --version    # expect: 9.15.0 — if different, run: npm install -g pnpm@9.15.0
gh --version      # expect: gh version 2.x
git --version     # expect: git version 2.x
```

---

# Step 2 — Generate an SSH key

This key authenticates your Mac to GitHub for `git push`/`pull` (and to the server, later, for read-only SSH).

```bash
ls -la ~/.ssh/id_ed25519 2>/dev/null
```

If that command **prints a file** → you already have one, skip to Step 3.
If it **says "No such file"** → generate one:

```bash
ssh-keygen -t ed25519 -C "team@legenex.com"
```

Prompts:
- **File to save the key:** press Enter (accept default `~/.ssh/id_ed25519`)
- **Passphrase:** your call. Strongly recommended for security. macOS Keychain remembers it after first use so you only type it once.

Verify both files exist:
```bash
ls -la ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub
# id_ed25519     = PRIVATE key (NEVER share this)
# id_ed25519.pub = PUBLIC key (safe to share)
```

---

# Step 3 — Sign into GitHub as `team@legenex.com`

In your browser:

1. Go to https://github.com
2. If you're already signed into another GitHub account (e.g. your personal one), click the avatar in the top-right → **Sign out**
3. Sign in with the `team@legenex.com` credentials Morné gave you
4. If 2FA prompts, enter the code from 1Password
5. Confirm the top-right avatar shows the team account

> Tip: if you want to keep a personal GitHub session, use **Firefox Multi-Account Containers** or an Incognito/Private window for the team account.

---

# Step 4 — Add your SSH public key to the team@legenex.com account

Copy your public key to clipboard:

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

(Or `cat ~/.ssh/id_ed25519.pub` and copy the output manually — it's one line starting with `ssh-ed25519`.)

In the browser (signed in as `team@legenex.com`):

1. Go to https://github.com/settings/keys
2. Click **New SSH key**
3. **Title:** `Nick — Mac` (so we can tell whose key is whose)
4. **Key type:** Authentication Key (default)
5. **Key:** paste your public key
6. Click **Add SSH key**

Verify the key works:

```bash
ssh -T git@github.com
```

First time it'll ask "Are you sure you want to continue connecting?" → type `yes` and press Enter.

You should see:
```
Hi <something>! You've successfully authenticated, but GitHub does not provide shell access.
```

If you see "Permission denied (publickey)" → the key wasn't added correctly. Recheck Step 4.

---

# Step 5 — Configure your local git identity

These settings tell git who you are when you commit. `user.name` is YOUR name (so commits in `git log` show "Nick"); `user.email` is the shared address (so GitHub links commits to the `team@legenex.com` avatar).

```bash
git config --global user.name "Nick"
git config --global user.email "team@legenex.com"
git config --global init.defaultBranch main
git config --global pull.rebase true
```

Verify:
```bash
git config --global --list | grep -E '^user\.|^init\.|^pull\.'
```

Expected:
```
user.name=Nick
user.email=team@legenex.com
init.defaultbranch=main
pull.rebase=true
```

---

# Step 6 — Clone the repo

```bash
mkdir -p ~/Documents/Projects
cd ~/Documents/Projects
git clone git@github.com:legenex/legalos.git LegalOS
cd LegalOS
```

The clone is via SSH (`git@github.com:`), not HTTPS — that's why we set up the SSH key first.

Verify:

```bash
git status
# expect: "On branch main, Your branch is up to date with 'origin/main'."

git log -3 --oneline
# expect: the latest commits, with the workflow PR's merge visible
```

---

# Step 7 — Authenticate `gh` CLI as team@legenex.com

```bash
gh auth login
```

Prompts:
1. **Where?** → `GitHub.com`
2. **Preferred protocol for git?** → `SSH`
3. **Upload your SSH public key?** → `Skip` (already added in Step 4)
4. **Authenticate?** → `Login with a web browser`
5. Copy the one-time code shown → press Enter → browser opens

In the browser, GitHub asks you to authorize `gh`. Make sure the displayed account is `team@legenex.com`. Click **Authorize**.

Back in the terminal: `✓ Authentication complete.`

Verify:
```bash
gh auth status
# expect: "✓ Logged in to github.com account team@legenex.com (keyring)"
```

---

# Step 8 — (Optional) Set up local dev

You don't strictly need a local dev server to contribute. You can edit files, run `pnpm typecheck` to validate, and push. But running it locally lets you see changes in your browser at `http://localhost:3000` before pushing — much faster feedback loop.

### 8a. Install Docker Desktop

Docker runs a local Postgres + Redis. The Next.js app itself runs natively, not in Docker.

- Download from https://www.docker.com/products/docker-desktop/
- Install, launch Docker Desktop, wait for "Engine running"

### 8b. Create your local `.env`

```bash
cp .env.example .env
```

`.env` holds environment-specific secrets and config. The committed `.env.example` documents what keys exist. Ask Morné which values you need for local dev — minimum-viable defaults:

```
PAYLOAD_SECRET=<output of `openssl rand -hex 48`>
DATABASE_URI=postgres://legalos:legalos@localhost:5432/legalos
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
LEGALOS_FALLBACK_HOST=localhost
LEGALOS_DEV_SKIP_DNS=true
ANTHROPIC_API_KEY=<ask Morné — or leave empty if not touching AI features>
SUPER_ADMIN_EMAIL=team@legenex.com
SUPER_ADMIN_PASSWORD=<your choice — only matters locally>
```

### 8c. Boot the dev environment

```bash
# Postgres + Redis only (in Docker)
docker compose up -d postgres redis

# Install JavaScript dependencies (one-time per machine, plus on package.json changes)
pnpm install

# Seed the database with 9 legal templates and 3 demo Sites (idempotent)
pnpm seed

# Start the dev server
pnpm dev
```

Open `http://localhost:3000` — you should see the LegalOS marketing page.
Open `http://localhost:3000/admin` — Payload admin login (use the credentials from `.env`).

Ctrl+C to stop the dev server. `docker compose down` to stop the Docker containers.

---

# Step 9 — Smoke-test PR (your first real change)

Tiny no-risk change that exercises the entire workflow end-to-end.

```bash
# Sync main
git checkout main
git pull --rebase origin main

# Create your feature branch
git checkout -b nick/test/smoke-test
```

Make a tiny harmless edit — an HTML comment at the end of README.md works well:

```bash
echo '<!-- smoke-test: Nick verified workflow YYYY-MM-DD -->' >> README.md
```

Verify the change:
```bash
git diff
```

Commit and push:
```bash
git add README.md
git commit -m "chore: smoke-test workflow from Nick's Mac"
git push -u origin nick/test/smoke-test
```

Open the PR:
```bash
gh pr create --base main --title "Smoke test — Nick" --body "Verifying the new workflow from my Mac. Safe to merge."
```

Merge it (CLI or via the GitHub web UI):
```bash
gh pr merge --squash --delete-branch
```

Wait ~30 seconds, then verify the deploy:

```bash
# Latest commit on main
git fetch origin
git log -1 origin/main --format='%H'

# Server's deployed commit (if you have SSH access)
ssh root@51.81.202.161 cat /var/www/vhosts/legenex.com/mo.legenex.com/.git-sha
# Should match
```

If you don't have server SSH yet (Step 11 below), just open `https://os.legenex.com` — it should still be healthy.

### Clean up after the smoke test

```bash
git checkout main
git pull --rebase origin main      # pull the merge commit
git fetch --prune                  # clean up the deleted remote branch
```

If the hashes match (or the site is still healthy), you're fully set up. The new workflow works end-to-end from your Mac.

---

# Step 10 — Read the docs

Once you've done the smoke test, read these in order. They're short.

1. **[HOW-IT-WORKS.md](./HOW-IT-WORKS.md)** — the mental model. *Why* the setup is the way it is. Most useful doc for your first week.
2. **[WORKFLOW.md](./WORKFLOW.md)** — the daily-flow reference. Branch naming, commit message format, conflict avoidance, post-deploy steps.
3. **[CLAUDE.md](./CLAUDE.md)** — instructions for Claude Code sessions in this repo. Useful if you use Claude Code as your editor.
4. **[README.md](./README.md)** — stack overview, production deploy mechanics, architecture.

---

# Daily flow cheat sheet

```bash
# Every time you start a change:
git checkout main
git pull --rebase origin main
git checkout -b <type>/<short-desc>      # e.g. feat/quiz-progress, fix/csv-bug

# Edit files. Validate:
pnpm typecheck
pnpm lint
# (Optional) pnpm dev — local preview at http://localhost:3000

# Commit and push:
git add <files>                          # specific files, not `git add -A`
git commit -m "<type>(<scope>): <message>"
git push -u origin <branch>

# Open PR:
gh pr create --base main --title "..." --body "..."

# Merge (after self-review or Morné's approval):
gh pr merge --squash --delete-branch

# Live ~30s later at https://os.legenex.com
```

---

# Step 11 — (Optional) Server read-only SSH access

If you want to check live deploys, watch compile logs, or restart the dev server when it wedges:

1. Send Morné your `id_ed25519.pub` content (the file from Step 2) — via Signal or paste in 1Password.
2. Morné adds it to `/root/.ssh/authorized_keys` on the server.
3. Then you can run:

```bash
ssh root@51.81.202.161 cat /var/www/vhosts/legenex.com/mo.legenex.com/.git-sha
ssh root@51.81.202.161 'journalctl -u legalos-dev -n 30 --no-pager'
ssh root@51.81.202.161 systemctl restart legalos-dev     # only if it's wedged
```

You'll **never** SSH in to edit files. That's a hard rule — see [WORKFLOW.md](./WORKFLOW.md). The live tree gets wiped by the next deploy.

---

# Things that will trip you up

- **Don't push directly to `main`.** Always work on a branch + open a PR. If you push to main accidentally, the auto-deploy fires immediately with no review window.
- **Always `git pull --rebase origin main` before starting a new branch.** Stale starts are the #1 source of merge conflicts.
- **`pnpm`, never `npm`.** Mixing the two creates package-lock chaos.
- **`.env` is local-only** — it's in `.gitignore`. Never commit it. If you add a new env key the app needs, also add it to `.env.example` and tell Morné to add the value on the server.
- **The on-disk path is `mo.legenex.com/` but the URL is `os.legenex.com`.** Intentional — Plesk's "Rename Domain" only renamed the domain entry, not the directory. Explained in HOW-IT-WORKS.md.
- **Coordinate big changes via Signal.** *"Working on the leads dashboard, branch `nick/feat/leads-dashboard`."* Avoids both contributors grabbing the same files.

---

# Help

If anything in this guide doesn't work, ping Morné with:
- Which step you're on
- The exact error message (screenshot or copy-paste)

Most setup issues are SSH-key or `gh`-auth problems — usually fixable in a couple of minutes.

---

## Notes for the contributor who's onboarding the new person

(Morné, future-you, anyone running someone new through this guide.)

Before sending this to the new contributor, make sure:

1. **The latest workflow PR is merged into `main`.** If not, the docs they read after cloning won't match this guide's filenames.
2. **The `team@legenex.com` shared 1Password vault has:**
   - GitHub password
   - 2FA TOTP (set up if not already)
   - The Anthropic API key (if the new contributor will touch AI code locally)
   - The Plesk API credentials (only if they'll touch domain provisioning code)
3. **Plan to add their SSH public key** to the server's `/root/.ssh/authorized_keys` after they finish Step 2. Their first real PR is Step 9's smoke test — small, low-risk, and proves everything works.

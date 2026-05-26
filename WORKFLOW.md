# WORKFLOW.md

How we make changes to LegalOS: **local clone → feature branch → PR → merge → Plesk webhook deploys**. Both contributors follow this; the live server is downstream of `main` and is never edited directly.

---

## TL;DR (daily flow)

```bash
git checkout main
git pull --rebase origin main
git checkout -b <type>/<short-desc>
# ...edit...
pnpm typecheck && pnpm lint
git add <files>
git commit -m "<type>(<scope>): <message>"
git push -u origin <branch-name>
gh pr create --base main --title "<title>" --body "<what + why>"
# merge via GitHub UI → ~30s later live at https://mo.legenex.com
```

---

## First-time setup

### Both machines need

- **Node 20.x** (matched to the server)
- **pnpm 9.15.0** (matched to the server)
- **git** with your name and email configured
- **gh** CLI authenticated against your `legenex/legalos`-collaborator account
- An **SSH key registered on GitHub** (for the `git@github.com:legenex/legalos.git` remote)

### macOS

```bash
# Toolchain
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node@20 pnpm gh
brew link node@20 --force
node --version    # v20.x
pnpm --version    # 9.15.0 — if not, run: npm install -g pnpm@9.15.0

# SSH key (skip if you already have ~/.ssh/id_ed25519)
ssh-keygen -t ed25519 -C "your-email@legenex.com"
cat ~/.ssh/id_ed25519.pub
# → GitHub → Settings → SSH and GPG keys → New SSH key → paste

# Clone
mkdir -p ~/Documents/Projects && cd ~/Documents/Projects
git clone git@github.com:legenex/legalos.git LegalOS
cd LegalOS

# Identity + auth
git config --global user.name "Your Name"
git config --global user.email "your-email@legenex.com"
gh auth login    # GitHub.com → SSH → existing key → browser
```

### Windows

```powershell
# Toolchain — install via winget or installers
winget install OpenJS.NodeJS.LTS    # Node 20.x
npm install -g pnpm@9.15.0
winget install GitHub.cli

# SSH key (skip if you have ~/.ssh/id_ed25519)
ssh-keygen -t ed25519 -C "your-email@legenex.com"
type $env:USERPROFILE\.ssh\id_ed25519.pub
# → GitHub → Settings → SSH and GPG keys → New SSH key → paste

# Clone
cd $env:USERPROFILE
git clone git@github.com:legenex/legalos.git
cd legalos

# Identity + auth
git config --global user.name "Your Name"
git config --global user.email "your-email@legenex.com"
git config --global core.autocrlf input    # silence the CRLF warnings
gh auth login
```

### Local dev (optional — both OS)

```bash
cp .env.example .env
docker compose up -d postgres redis
pnpm install
pnpm seed                                  # idempotent — 9 legal templates + 3 demo Sites
pnpm dev                                   # → http://localhost:3000
```

If you don't run a local dev server, `pnpm typecheck && pnpm lint` is the minimum verification before pushing.

---

## Branch naming

`<type>/<short-kebab-desc>`, optionally prefixed with initials.

| Type | When |
|---|---|
| `feat/` | New feature or capability |
| `fix/` | Bug fix |
| `chore/` | Tooling, config, dependencies, refactors that aren't features |
| `docs/` | Documentation only |
| `refactor/` | Restructuring without behaviour change |
| `hotfix/` | Emergency production fix (see *Hotfix exception* below) |

Examples: `feat/quiz-progress-bar`, `fix/leads-csv-encoding`, `mo/chore/upgrade-payload`.

---

## Commit messages

Conventional-commit style: `<type>(<scope>): <summary>` — same prefixes as branches.

```
feat(quizzes): add progress bar to multi-step flow
fix(leads): correct CSV encoding when name contains a comma
chore(deps): bump undici to 6.21.0
```

Body (optional, on a second paragraph) explains *why* if the *what* isn't obvious. Wrap at ~72 chars.

---

## Pull requests

Every change goes through a PR, even one-liners. The PR is what makes the change visible to the other contributor before it deploys.

- **Title:** mirror the commit message (or summarize multi-commit branches).
- **Body:** what changed + why. List any manual post-deploy steps (`pnpm install` needed, schema migration, etc.).
- **Test plan:** one or two bullets on how to verify after merge.
- **Merge style:** Squash and merge if the branch has fixup/cleanup commits. Use a regular merge if each commit is meaningful and you want to preserve them.

---

## Conflict avoidance (the "don't save over each other" part)

1. **Always `git pull --rebase origin main` before starting a branch.** Stale starting points cause preventable conflicts.
2. **One concern per branch.** A sidebar tweak and a domains refactor are two PRs.
3. **Push your branch early, even WIP.** Pushed = visible to your teammate. Mark `[WIP]` in the PR title until ready for merge.
4. **Rebase on latest main if it moved while you worked:**
   ```bash
   git fetch origin
   git rebase origin/main
   # resolve conflicts file-by-file, then:
   git push --force-with-lease    # NOT --force; --force-with-lease refuses if remote changed underneath you
   ```
5. **`.env` is not in git.** Don't make code changes that require a new `.env` key without updating `.env.example` and telling your teammate to add the key.
6. **Never SSH-edit the server's working tree.** The next deploy (from either contributor) wipes the edit silently. (See *Hotfix exception* for the only allowed deviation.)
7. **Coordinate big changes.** If you're about to start something that touches many files, say so: *"Working on the leads dashboard, branch `mo/feat/leads-dashboard`."* Avoids two of you grabbing the same files.

---

## After-merge verification

Plesk's webhook pulls into the bare repo at `/var/www/vhosts/legenex.com/git/legalos.git/`, checks out into `mo.legenex.com/`, runs `scripts/deploy.sh`. The `legalos-dev` systemd service serves the site and hot-reloads off the new files.

```bash
# Confirm the deployed commit matches the merge:
ssh root@51.81.202.161 cat /var/www/vhosts/legenex.com/mo.legenex.com/.git-sha

# Watch dev-server compile output if something looks off:
ssh root@51.81.202.161 'journalctl -u legalos-dev -n 30 --no-pager'

# Hard-refresh in the browser: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
```

Read-only SSH (logs, runtime inspection) is fine. The rule against SSH is specifically about *mutating the working tree*.

---

## Things that need a manual step after merge

The webhook covers most changes. These need a follow-up over SSH:

| What you changed | Run after the deploy |
|---|---|
| `pnpm add <pkg>` (added a dependency) | `ssh root@51.81.202.161 'cd /var/www/vhosts/legenex.com/mo.legenex.com && pnpm install && systemctl restart legalos-dev'` |
| `next.config.mjs` | `ssh root@51.81.202.161 systemctl restart legalos-dev` |
| Server `.env` (it's NOT in git) | Edit on server, then `ssh root@51.81.202.161 systemctl restart legalos-dev` |
| Payload collection schema | Locally: `pnpm payload migrate:create <name>` → commit → PR → merge. After deploy, dev-mode auto-push will have applied the schema; if `pnpm payload migrate` hangs on its interactive prompt over SSH, insert the migration row directly into `payload_migrations` to record it. |
| Service stuck / weird state | `ssh root@51.81.202.161 systemctl restart legalos-dev` |

---

## Hotfix exception

If `https://mo.legenex.com` is *down* and a branch+PR is too slow:

1. SSH and apply the minimum fix to restore service.
2. **Immediately** mirror the same change into a `hotfix/<desc>` branch in your local clone.
3. Open a PR and merge it before anyone else pushes.
4. Verify `.git-sha` matches the merge commit afterwards.

Skipping step 2–4 means your fix dies on the next deploy. Treat the SSH edit as a debt that must be paid back into git within minutes.

---

## Cleaning up after a merge

```bash
git checkout main
git pull --rebase origin main      # pulls the merge commit
git branch -d <branch-name>        # delete the local branch
git fetch --prune                  # remove stale remote-tracking refs
```

---

## Quick reference

| Question | Answer |
|---|---|
| Live URL | https://mo.legenex.com |
| Admin URL | https://mo.legenex.com/admin |
| Local dev URL | http://localhost:3000 |
| Server | `root@51.81.202.161` (read-only SSH; no file mutations) |
| Live commit | `ssh root@51.81.202.161 cat /var/www/vhosts/legenex.com/mo.legenex.com/.git-sha` |
| Compile logs | `ssh root@51.81.202.161 'journalctl -u legalos-dev -n 30 --no-pager'` |
| Restart server | `ssh root@51.81.202.161 systemctl restart legalos-dev` |
| Roll back a bad merge | Revert via GitHub UI (or `git revert <sha>` locally → PR → merge) |

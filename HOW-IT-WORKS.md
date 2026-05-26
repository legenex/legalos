# HOW-IT-WORKS.md

A plain-English explanation of how the LegalOS dev/deploy setup actually works, why it's set up this way, and what each piece does.

If you only want the *commands*, see [WORKFLOW.md](./WORKFLOW.md). This doc is about the *mental model*.

---

## The big picture

```
   Morné (Windows)            Nick (Mac)
   ─────────────────          ─────────────────
   C:\Users\morne\            ~/Documents/
   legalos                    Projects/LegalOS
        │                              │
        │  feature branch + push       │  feature branch + push
        └──────────────┬───────────────┘
                       ▼
              ┌─────────────────┐
              │  GitHub.com      │   ← team@legenex.com  (one shared login)
              │  legenex/legalos │      The repo is the canonical source.
              └────────┬─────────┘
                       │  on merge to main → webhook fires
                       ▼
              ┌─────────────────┐
              │  Plesk on        │   ← 51.81.202.161 (your VPS)
              │  legenex.com     │      Pulls the repo, checks out files,
              └────────┬─────────┘      runs scripts/deploy.sh.
                       ▼
              ┌─────────────────┐
              │  legalos-dev     │   ← systemd service running `pnpm dev`
              │  systemd service │      Watches the working tree, hot-reloads
              └────────┬─────────┘      Next.js on every file save.
                       ▼
              https://os.legenex.com   ← what users see
```

Three places. Each has a specific job. Edits flow in **one direction only**: local → GitHub → server. The arrow doesn't go backwards. If you edit the server directly, the next deploy from GitHub wipes you out.

---

## The three places, and what each one is for

### 1. Local clones (your laptop, Nick's Mac)

This is where editing happens. It's a normal git clone — you have all the source files, you can run `pnpm dev` locally to test changes at `http://localhost:3000`, and you commit to feature branches.

Nothing on your laptop is "live." It's a private sandbox. The only way your changes affect the live site is by pushing to GitHub *and* getting that push merged into `main`.

### 2. GitHub (`github.com/legenex/legalos`)

This is the **canonical truth**. Whatever is in `main` on GitHub is what the live site runs. Period.

Why three places, not two (laptop + server)? Because GitHub:
- Is the **coordination point** between Morné and Nick — neither of you sees the other's work until it's on GitHub.
- Holds **history** — every change is a commit, you can revert any of them.
- Triggers the **deploy** — pushes to `main` are what cause the server to update.

### 3. The server (`root@51.81.202.161`)

This is where the live site runs. Specifically, a Next.js process (`pnpm dev`) running on `localhost:3000`, wrapped by Plesk's nginx so the world can reach it as `https://os.legenex.com`.

The server doesn't have an editor open. You never SSH in to change a file. The server is a **consumer** of GitHub — its job is to grab whatever's on `main` and run it.

---

## Why a shared GitHub login, not collaborators

You and Nick both sign in as **`team@legenex.com`**. Same login, same password, same SSH key list, same permissions.

We picked this over "two separate accounts, both added as collaborators on legenex/legalos" because:

| | Shared login (current) | Separate accounts + collaborator setup |
|---|---|---|
| Permissions | Zero — you ARE the owner | Manual: add each person as a collaborator, grant scopes |
| Cost | Free | Free (GitHub allows unlimited private collaborators since 2020) |
| 2FA | One shared TOTP (use 1Password) | Each person manages their own |
| Avatar on commits | Everything shows the team avatar | Each person's avatar |
| Commit attribution in `git log` | Distinguishable via `user.name` ("Morné" vs "Nick") | Distinguishable via GitHub account |
| Future repos under legenex | Just works | Re-add each collaborator per repo |
| Risk if shared credentials leak | Both at once | One at a time |

For a 2-person team, the shared login is simpler and the 2FA risk is manageable. If you ever scale to 4+ people, separate accounts becomes the better trade.

### What "shared login" actually means in practice

- **Browser:** Both of you sign into github.com as `team@legenex.com`.
- **`gh` CLI:** `gh auth login` as `team@legenex.com` on both machines.
- **SSH keys:** Each machine has its own key (Morné's on Windows, Nick's on Mac). Both keys are added as user-level SSH keys on the `team@legenex.com` GitHub account. GitHub doesn't care that two machines share an account.
- **Git commits:** `user.name` is the person ("Morné" / "Nick"), `user.email` is the shared address (`team@legenex.com`). So `git log` shows who-did-what locally; GitHub shows the team avatar.

The old `Morne080` GitHub account has been retired — it's not used for anything in this project anymore.

---

## What a daily change actually does

Walking through each step of the daily flow and what it accomplishes:

### `git checkout main && git pull --rebase origin main`

Sync your local `main` with GitHub's `main`. **Why before every change?** Because your teammate may have merged something while you were doing other things. Starting from a stale `main` is the most common cause of merge conflicts.

`--rebase` (vs a plain `git pull`) means: if you somehow have local commits on `main`, replay them on top of the new remote commits instead of creating a merge commit. Keeps history linear.

### `git checkout -b <type>/<short-desc>`

Create a new branch. **Why a branch instead of just editing on `main`?** Because `main` is the canonical truth that auto-deploys. A branch is a safe workspace where your half-done work doesn't affect anything. The branch only "matters" once you push it and open a PR.

### Edit, `pnpm typecheck`, `pnpm lint`

Local verification. Catches type errors and lint problems before they reach GitHub. If you have `pnpm dev` running locally, you can also visually verify in the browser.

There's no test suite, so `pnpm typecheck` + `pnpm lint` *is* your safety net.

### `git add <files> && git commit -m "..."`

Snapshot your changes into a commit. **Why commit message format `<type>(<scope>): <message>`?** It makes the git log scannable. When you `git log --oneline` six months from now, "fix(leads): correct CSV encoding when name contains comma" tells you what happened without opening the diff. "stuff" doesn't.

### `git push -u origin <branch-name>`

Send your branch to GitHub. **`-u` (set upstream)** means future `git push`es from this branch don't need to specify where to push — it remembers. Only matters the first push.

After this point, your branch is visible to Nick (or vice-versa).

### `gh pr create --base main --title "..." --body "..."`

Open a Pull Request. This is the **coordination event**. A PR is a proposal: "I want these commits to become part of `main`." Anyone can look at the diff, comment, run it, or merge it.

**Why do we open a PR for every change, even one-liners?** Because:

1. **It gates the auto-deploy.** Without a PR, you'd push to `main` directly and the webhook would deploy immediately — no window to say "wait, I forgot to commit something."
2. **It's a reviewable unit.** Even self-review catches mistakes. Reading your own diff one more time before merging finds real bugs.
3. **It's a clean revert unit.** "Revert that PR" is one click. "Revert those 3 commits that got mixed up because I pushed in a hurry" is painful.
4. **It's visible.** Nick can see your branch as soon as you push it; the PR makes it a thing to look at.

### Merge in GitHub UI

This is the moment the change becomes "real." Until you click Merge, your branch is just a proposal. After you merge, it becomes part of `main`.

**Why click vs `gh pr merge`?** You can do either. The GitHub UI is slower but lets you double-check the diff one last time. The CLI is faster.

**Choose Squash and merge** if your branch has fixup/cleanup commits ("oh wait, fix that thing"). Choose **regular merge** if each commit is meaningful and you want to preserve them.

---

## What happens when you click Merge

This is the magic part. From your perspective, you clicked Merge. From the server's perspective:

```
1. GitHub: "PR merged. New commit on main: abc1234."
   ↓
2. GitHub fires the webhook to Plesk.
   ↓
3. Plesk: "Got the webhook. Pulling latest from main into the bare repo."
   ↓
4. Plesk: "Now checking out the bare repo's HEAD into the working tree at
           /var/www/vhosts/legenex.com/mo.legenex.com/"
   ↓
5. Plesk: "Running the post-deploy script: bash scripts/deploy.sh"
   ↓
6. scripts/deploy.sh: (does any bootstrap it needs to)
   ↓
7. Files on disk are now updated.
   ↓
8. legalos-dev systemd service is running `pnpm dev` and watches the file system.
   It notices the changes and recompiles the affected Next.js routes.
   ↓
9. Within ~30 seconds, https://os.legenex.com serves the new code.
```

To verify, you can read the deployed commit hash:
```bash
ssh root@51.81.202.161 cat /var/www/vhosts/legenex.com/mo.legenex.com/.git-sha
```

That file is written by `scripts/deploy.sh`. If it matches the merge commit, the deploy succeeded.

---

## Wait — `/mo.legenex.com/` but the URL is `os.legenex.com`?

Yes. **The on-disk directory is still named `mo.legenex.com/` even though the public URL is `os.legenex.com`.** This is a historical artifact:

- Originally the project was at `mo.legenex.com`.
- We renamed the domain in Plesk to `os.legenex.com`.
- Plesk's "Rename Domain" only renames the **domain entry** (what nginx serves), not the **document root** (the actual directory on disk).

The directory name is internal-only — no user, browser, or external service sees it. It just happens to be the historical filesystem path. Trying to rename it would mean re-pointing Plesk's nginx vhost via CLI, regenerating certs, possibly re-configuring the Git extension — a lot of risk for zero functional benefit.

So: `os.legenex.com` is the URL. `mo.legenex.com/` is the directory. They don't have to match.

---

## The server: Plesk + systemd + `legalos-dev`

The live site is one Next.js process. Three layers wrap it:

### Layer 1: Plesk (nginx)

Plesk is a control-panel-ish thing on top of nginx. Its job:
- Terminate HTTPS (Let's Encrypt certs)
- Receive incoming traffic on port 443
- Reverse-proxy `os.legenex.com` (and tenant domains) to `127.0.0.1:3000`
- Run the Git extension that handles the webhook deploys

You almost never interact with Plesk directly. The exceptions:
- Adding a tenant domain (admin panel does this via Plesk's REST API)
- Issuing/renewing Let's Encrypt certs
- Changing the Git extension's webhook config

### Layer 2: The `legalos-dev` systemd service

A normal Linux service that runs:
```
pnpm dev
```
in the directory `/var/www/vhosts/legenex.com/mo.legenex.com/`. That's it. It's literally `pnpm dev` — the same command you'd use locally for development. Defined in `/etc/systemd/system/legalos-dev.service`.

**Why `pnpm dev` and not `pnpm build && pnpm start` like a normal production setup?**

Because hot-reload: when files change (because of a deploy, or in development), `pnpm dev` recompiles affected routes in seconds. No image rebuild. No container restart. Deploys are essentially "git pull + wait for Next.js to notice."

Trade-off: `pnpm dev` is slower per request than a built production bundle. For a low-traffic admin site, that's acceptable.

You'll occasionally need to restart this service:
- After editing `.env` (env vars only re-read on startup)
- After `pnpm add` (need to re-link installed packages)
- If the service crashes or wedges

```bash
ssh root@51.81.202.161 systemctl restart legalos-dev
```

### Layer 3: Next.js / Payload

The actual app. Payload is the CMS (admin UI, ORM, auth). Next.js is the public-facing framework. PostgreSQL is the database, Redis the cache. Docker Compose runs Postgres+Redis on the same VPS, but the app itself runs natively (not in Docker).

---

## Authentication: SSH keys vs `gh` CLI vs browser

Three different things, easy to confuse.

### SSH keys (`~/.ssh/id_ed25519`)

Used for:
- **`git clone`/`git push`/`git pull` over `git@github.com:...`** — every git operation against the legenex/legalos repo from your machine.
- **`ssh root@51.81.202.161`** — connecting to the VPS.

How they work: your machine presents the SSH key as proof of identity. The remote server checks a list of authorized keys. If yours is on the list, you're in.

For GitHub: your key needs to be on the `team@legenex.com` GitHub account (Settings → SSH and GPG keys) *or* configured as a deploy key on the repo. Either works for git operations.

For the VPS: your key needs to be in `/root/.ssh/authorized_keys` on the server.

### `gh` CLI (`gh auth login`)

Used for:
- **Opening PRs (`gh pr create`)**
- **Reading PR comments, merging via CLI, fetching issue lists, anything you'd otherwise do in the GitHub web UI from the terminal.**

How it works: `gh auth login` does a browser-based OAuth flow, gets a personal access token tied to whichever GitHub user you signed in as, stores it in your OS keyring. Future `gh` commands use that token.

If you're signed in as `team@legenex.com`, `gh pr create` opens PRs as `team@legenex.com`. If you're signed in as Morne080, it tries to act as Morne080 — and fails for legenex/legalos because Morne080 isn't a collaborator there.

### Browser sign-in (`github.com`)

Used for:
- The PR-creation flow when you click "Create pull request" on the GitHub UI
- Settings (SSH keys, branch protection, etc.)
- Reading the repo / viewing PRs

How it works: standard web sign-in. The session is per-browser, per-domain.

If your browser is signed in as Morne080 and you visit a PR-create URL for legenex/legalos, you get "must be a collaborator" — because the GitHub session is Morne080, who isn't.

### Why all three?

- SSH keys → for *raw git/SSH* operations (deterministic, no browser needed).
- `gh` CLI → for *GitHub-specific* operations from the terminal.
- Browser → for everything that's easier to do visually.

You set them all to `team@legenex.com`, and they stop bothering you.

---

## `.env` and why it's not in git

The `.env` file holds **environment-specific secrets and config**: `PAYLOAD_SECRET`, `ANTHROPIC_API_KEY`, `PLESK_API_KEY`, `PG_*` credentials, etc.

Each environment (your local machine, Nick's local machine, the server) has its **own** `.env`. They're all different:
- Local `.env` → connects to Docker Postgres/Redis on `localhost`, uses dev API keys, has `LEGALOS_DEV_SKIP_DNS=true`.
- Server `.env` → connects to the production database, uses production API keys, has `LEGALOS_DEV_SKIP_DNS=false`.

`.env` is in `.gitignore` so it never gets committed. The committed `.env.example` documents which keys exist and what they're for.

**To change a server env var:**
1. SSH in
2. Edit `/var/www/vhosts/legenex.com/mo.legenex.com/.env`
3. `systemctl restart legalos-dev` (env vars are only read at startup)

**To add a new env key the app needs:** add it to `.env.example` in a PR, tell Nick to add the key to his local `.env`, and add it to the server's `.env` after the PR merges.

---

## Tenant domains (quick explanation)

LegalOS is multi-tenant. Each "Site" (a customer brand) can have one or more domains pointed at it. When a customer adds a domain in the admin:

1. The admin DNS-checks that the domain resolves to our server's IP.
2. The admin calls Plesk's REST API to register the domain, set up the same nginx reverse-proxy directives we use for `os.legenex.com`, and issue a Let's Encrypt cert.
3. The Domain row in the database transitions `provisioning` → `active` → `ssl_status: active`.
4. When a request comes in with `Host: customer-domain.com`, the public router (`src/app/(public)/[[...slug]]/page.tsx`) looks up the Domain → Site, applies that Site's brand tokens, and renders the requested page.

This is why we don't add tenant domains manually in Plesk — the admin UI does it automatically via the Plesk REST API.

---

## Where to find things

| Thing | Where |
|---|---|
| Live URL | https://os.legenex.com |
| Admin URL | https://os.legenex.com/admin |
| Raw Payload admin (rarely needed) | https://os.legenex.com/cms |
| GitHub repo | https://github.com/legenex/legalos |
| Shared GitHub login | `team@legenex.com` |
| Server | `root@51.81.202.161` (SSH, read-only for code) |
| Server work tree | `/var/www/vhosts/legenex.com/mo.legenex.com/` |
| Server env | `/var/www/vhosts/legenex.com/mo.legenex.com/.env` (hand-edited) |
| Server bare git repo | `/var/www/vhosts/legenex.com/git/legalos.git/` |
| Currently deployed commit | `ssh root@51.81.202.161 cat /var/www/vhosts/legenex.com/mo.legenex.com/.git-sha` |
| Compile logs | `ssh root@51.81.202.161 'journalctl -u legalos-dev -n 30 --no-pager'` |
| Restart the app | `ssh root@51.81.202.161 systemctl restart legalos-dev` |

---

## Other docs in this repo, and what each is for

| Doc | Purpose |
|---|---|
| [README.md](./README.md) | Stack overview, one-time production deploy setup, architecture diagram |
| [WORKFLOW.md](./WORKFLOW.md) | Daily flow + first-time setup commands (both macOS and Windows) |
| [HOW-IT-WORKS.md](./HOW-IT-WORKS.md) | (This doc) Plain-English explanation of why the setup is the way it is |
| [CLAUDE.md](./CLAUDE.md) | Instructions for Claude Code sessions working in this repo |
| [ONBOARDING.md](./ONBOARDING.md) | Redirect to WORKFLOW.md (kept for back-compat) |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Detailed deploy mechanics + troubleshooting |

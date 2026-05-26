# Legenex LegalOS

Multi-site legal brand platform. One codebase, one admin, many public-facing brand sites.

## Stack

- Payload CMS 3 on Next.js 15 (App Router)
- PostgreSQL 16
- Redis 7
- Plesk (Debian 12) — handles TLS termination + tenant domain SSL provisioning via REST API
- Anthropic SDK (AI generators + humanizer)

## Local development

```bash
cp .env.example .env
# fill in PAYLOAD_SECRET, SUPER_ADMIN_EMAIL/PASSWORD, ANTHROPIC_API_KEY

# start Postgres + Redis only:
docker compose up -d postgres redis

# install + dev server:
pnpm install
pnpm dev

# in a second terminal, seed the 9 legal templates and 3 placeholder Sites:
pnpm seed
```

Admin: http://localhost:3000/admin
Marketing fallback: http://localhost:3000

To preview a Site without DNS, append `?site=<slug>` to any URL — e.g. http://localhost:3000/privacy?site=check-my-claim.

`LEGALOS_DEV_SKIP_DNS=true` enables a "Skip DNS" button in the Connect Domain modal for local testing.

## Pushing updates to production

After the one-time deploy below is done, the day-to-day workflow is:

```bash
# on your laptop:
git add -A
git commit -m "describe what changed"
git push
# ...that's it. The Plesk Git extension picks up the push via webhook,
# pulls the new commit, and runs scripts/deploy.sh which rebuilds and restarts.
```

If the deploy script fails (a build error, a failing health check), Plesk shows the output in the Git tab. The previous container keeps running until the new one passes the 30-second health check, so a broken commit doesn't take the site down — it just won't replace what's already running.

To force a manual redeploy (e.g. an env-var change without a code push):

```bash
# on the server:
cd /path/to/project
bash scripts/deploy.sh
```

To roll back:

```bash
# on your laptop:
git revert <bad-commit-sha>
git push
# the revert is itself a normal push, so Plesk auto-deploys the rollback
```

## Production deploy (Plesk on Debian 12)

### One-time host setup

1. **Install Docker + docker-compose** on the Plesk host (if not already installed):
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **In Plesk → Tools & Settings → API Keys → Add API Key.** Note the key — set it as `PLESK_API_KEY` in `.env`.

3. **Add `mo.legenex.com` as a Plesk domain** (Plesk → Domains → Add Domain). Make sure the Let's Encrypt extension is installed (Plesk → Extensions). Issue a cert for `mo.legenex.com`.

4. **Configure `mo.legenex.com` to reverse-proxy to localhost:3000.** Plesk → mo.legenex.com → Apache & nginx Settings → Additional nginx directives (HTTP and HTTPS):
   ```nginx
   location / {
     proxy_pass http://127.0.0.1:3000;
     proxy_http_version 1.1;
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Host $host;
     proxy_set_header X-Forwarded-Proto $scheme;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
   }
   ```

5. **At your `legenex.com` DNS provider**, add (one-time, used by every tenant):
   ```
   A      cname       <Plesk server IP>     # tenant CNAME target → matches LEGALOS_CNAME_TARGET=mo.legenex.com (resolves to same IP)
   A      *.preview   <Plesk server IP>     # wildcard for {slug}.preview.legenex.com
   A      mo          <Plesk server IP>     # admin hostname
   ```

   Optional: a separate `cname.legenex.com` A record if you want CNAME-target separation from the admin hostname. Otherwise tenants CNAME directly at `mo.legenex.com`.

### First deploy

#### A. Push this codebase to GitHub

On your laptop, in the project directory:

```bash
git add -A
git commit -m "Initial commit"
# Create a NEW repo on github.com (private). Copy the SSH URL.
git remote add origin git@github.com:<your-account>/legalos.git
git push -u origin main
```

#### B. Connect Plesk's Git extension to that GitHub repo

1. In Plesk → **Extensions** → install **Git** if not already (free, bundled).
2. Plesk → **Websites & Domains** → `mo.legenex.com` → **Git** → **Add Repository**.
3. **Remote repository URL:** the SSH URL from GitHub.
4. **Server path:** something outside the web root, e.g. `/var/www/vhosts/legenex.com/legalos/`. Make sure this directory is NOT served by Plesk's nginx — only the reverse-proxy block from step 4 above is.
5. **Deployment mode:** *Automatic deployment (recommended)*. Plesk gives you a webhook URL.
6. Copy the SSH deploy key Plesk shows. In GitHub → repo → Settings → **Deploy keys** → Add deploy key (read-only).
7. Copy the webhook URL. In GitHub → repo → Settings → **Webhooks** → Add webhook → paste URL, content type `application/json`, secret optional.
8. Plesk pulls the repo. Verify the files are present in the deploy path.

#### C. Configure env on the server

SSH in:

```bash
cd /var/www/vhosts/legenex.com/legalos/     # whatever path you chose
cp .env.example .env
nano .env
```

Fill in production values. At minimum:

```
PAYLOAD_SECRET=<openssl rand -hex 48>
NEXT_PUBLIC_SERVER_URL=https://mo.legenex.com
LEGALOS_FALLBACK_HOST=mo.legenex.com
ANTHROPIC_API_KEY=<your key>
PLESK_API_URL=https://your-plesk-host:8443
PLESK_API_KEY=<from one-time setup step 2>
PLESK_IP_ADDRESS=<server IP>
LEGALOS_CNAME_TARGET=mo.legenex.com
LEGALOS_A_TARGET=<server IP>
LEGALOS_DEV_SKIP_DNS=false
SUPER_ADMIN_EMAIL=team@legenex.com
SUPER_ADMIN_PASSWORD=<change me on first login>
```

#### D. First-time bootstrap

```bash
bash scripts/first-time-setup.sh
```

This brings up Docker (app + Postgres + Redis), waits for everything to be healthy, and runs the seed.

#### E. Wire the auto-deploy hook

Back in Plesk → mo.legenex.com → Git → your repo → **Additional deployment actions**, set:

```
bash {DOCROOT}/scripts/deploy.sh
```

`{DOCROOT}` is the deploy path you set in step B-4.

Now every push to `main` will:
1. Trigger the GitHub webhook → Plesk
2. Plesk pulls the new commit
3. Plesk runs `scripts/deploy.sh`
4. Script rebuilds the app image and restarts the container
5. Script health-checks `127.0.0.1:3000` before declaring success
6. Old Docker images get pruned

Visit `https://mo.legenex.com/admin` and log in.

### How tenant domains flow through Plesk

When admin clicks **Connect Domain** on a Site and the DNS check passes:

1. `verifyAndPromoteDomain` action calls Plesk REST API:
   - `POST /api/v2/domains` — registers the tenant domain in Plesk
   - `PUT /api/v2/domains/{id}/nginx` — sets reverse-proxy directives pointing at `localhost:3000`
   - `POST /api/v2/cli/extension/call` (letsencrypt) — issues a Let's Encrypt cert
2. Domain row gets `status: provisioning` while Plesk works, then `status: active` on success.
3. `pollDomainSslStatus` runs every 30s for ~4 minutes hitting `https://<host>/` until it returns 2xx. Sets `ssl_status: active` when reachable, `error` on timeout.
4. The public router resolves `Host: tenant-domain.com` → Domain row → Site → renders Site's pages.

Removing a custom domain calls `DELETE /api/v2/domains/{plesk_domain_id}` so Plesk cleans up the vhost and cert too.

## Architecture

```
Internet → mo.legenex.com / tenant-domain.com
   ↓
Plesk (nginx, ports 80/443, Let's Encrypt termination)
   ↓ reverse-proxy
127.0.0.1:3000 (Next.js app in Docker)
   ├─ /admin/*                Custom branded dashboard (per-Site sidebar swap)
   ├─ /cms/*                  Raw Payload admin (for fields not yet in custom UI)
   ├─ /api/*                  Payload REST + GraphQL
   ├─ /api/legalos/*          Our endpoints: dns-check, test-capture, etc.
   ├─ /api/leads              Public lead capture endpoint
   └─ /* (everything else)    Public router (host-routed)
         ├─ Match Host → Domain → Site
         ├─ Apply Site brand tokens (--site-* CSS vars)
         ├─ Match path → Page / LandingPage / BlogPost
         ├─ Fall back to SharedLegalTemplate for known legal slugs
         └─ Fall back to LegalOS marketing site if no Site matches
```

## Hard rules enforced in code

- Phone numbers display only via `resolvePhoneForPath(path, site_id)` — never as denormalized fields on Pages, LPs, or Quizzes.
- Every Lead, Page, Quiz, LP, BlogPost, Number, TrackingConfig, AuditLog row carries a required `site` relationship; access control filters by it.
- TrustedForm cert claim and HLR lookup are server-side only. Credentials never leave the server.
- Pixel + CAPI conversions share an `event_id` per the Meta dedupe contract.
- SharedLegalTemplate edits surface an affected-Sites list before save.
- Banned-vocab and em-dash linters run on every AI output; failures trigger up to 2 retries before surfacing.
- Preview domains (`{slug}.preview.legenex.com`) are auto-issued, always primary until a custom domain is verified, and cannot be deleted from the UI.
- `ssl_status='active'` only after a real HTTPS handshake succeeds via the SSL poller — never assumed.

<!-- smoke-test: Nick verified workflow 2026-05-26 -->

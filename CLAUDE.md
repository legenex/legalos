# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## CRITICAL: Standard workflow — edit local, push, webhook deploys

**The flow is:** edit files in this local repo → `git commit && git push` → GitHub webhook fires → Plesk pulls into `/var/www/vhosts/legenex.com/os.legenex.com/` on `root@51.81.202.161` → **you must run `pnpm build && systemctl restart legalos-dev` on the server** → change is live at `https://os.legenex.com` once the build finishes.

The `legalos-dev` systemd unit runs the **production build** (`pnpm start` against prebuilt `.next/`), not `pnpm dev`. There is no HMR. A `git pull` alone will not change what users see — the prebuilt `.next/` output has to be regenerated and the service restarted.

There is no Docker rebuild. There is no `scripts/deploy.sh` step (the file is retained as historical reference only).

### Rules

- **ALWAYS edit files in this local clone.** Never SSH-edit server source files — they'll be overwritten on the next deploy.
- **ALWAYS commit + push to deploy.** That's the only mechanism that ships changes to the server.
- **EVERY src/ change requires `pnpm build && systemctl restart legalos-dev` on the server after the push.** The webhook only pulls; it does not rebuild. Without the rebuild + restart, users keep seeing the old prebuilt output.
- **SSH is used for the rebuild + restart, logs, and service state.** Use SSH for builds (`pnpm build`), restarts (`systemctl restart legalos-dev`), logs (`journalctl -u legalos-dev`), and one-off Plesk admin work. Never edit `src/` there.
- **NEVER suggest `docker compose up app` or `bash scripts/deploy.sh`.** The Docker app container is stopped; the production flow is git pull → `pnpm build` → restart.

### Standard operations

```bash
# Make a change — edit locally, then:
git add -A && git commit -m "what changed" && git push

# Tail the server's output to confirm the new build is up (after the user deploys)
ssh root@51.81.202.161 'journalctl -u legalos-dev -n 30 --no-pager -f'

# Read server-side state (logs / service / db)
ssh root@51.81.202.161 'systemctl status legalos-dev --no-pager'
```

### 🚨 MANDATORY: every reply that pushes src/ MUST end with the deploy block

After **any** `git push` you make that touches `src/`, `package.json`, `next.config.mjs`, `tailwind.config.*`, `payload.config.ts`, or anything compiled into `.next/`, the **final block of your reply** must be the exact SSH commands below so the user can copy-paste them. This applies *every* time, even for a one-line fix, even if the previous reply already showed them. The user has explicitly asked for this and will get stuck without it.

```
cd /var/www/vhosts/legenex.com/os.legenex.com
git pull
systemctl stop legalos-dev
pnpm install
pnpm generate:importmap
pnpm build
systemctl start legalos-dev
systemctl status legalos-dev --no-pager
```

What each step does (most are fast no-ops if nothing changed):
- `git pull` — fetch your new commits.
- `pnpm install` — only runs if `package.json` changed; otherwise ~1s.
- `pnpm generate:importmap` — regenerates the Payload admin import map (required before a prod build per CLAUDE.md).
- `pnpm build` — production build (~60–90s, the slow step).
- `systemctl start legalos-dev` — boots `next start` against the fresh `.next/`.
- `systemctl status legalos-dev --no-pager` — confirms it came up; should end with **`active (running)`**.

Then have the user hard-refresh: **Ctrl+Shift+R** (Windows) / **Cmd+Shift+R** (Mac).

The change is **not** live until this block has run. Never tell the user "it's live in ~10 seconds" — give them this block.

### Things that require an extra step after the push

All `src/` changes require the rebuild + restart from "Standard operations" above. The table below covers cases that need *additional* steps on top of that.

| What changed | Run on the server (in addition to the standard rebuild + restart) |
|---|---|
| Added a package (`pnpm add ...`) | `pnpm install` before `pnpm build` |
| Edited `.env` | `.env` is gitignored — edit it on the server (`ssh root@51.81.202.161 nano /var/www/vhosts/legenex.com/os.legenex.com/.env`) then rebuild + restart |
| Created a Payload migration | `pnpm payload migrate` after `pnpm build`, before the restart |
| Edited `next.config.mjs` | (covered by the standard rebuild + restart) |
| Service stuck / weird state | `ssh root@51.81.202.161 systemctl restart legalos-dev` on its own |

---

## Stack

Payload CMS 3 on Next.js 15 (App Router, React 19), PostgreSQL 16, Redis 7, Anthropic SDK, deployed via Docker on a Plesk host. Package manager is `pnpm@9.15.0`, Node `>=20.9`.

## Common commands

```bash
pnpm dev                                  # dev server on :3000 (Payload auto-pushes schema in dev)
pnpm build && pnpm start                  # production-mode local
pnpm typecheck                            # tsc --noEmit
pnpm lint                                 # next lint
pnpm seed                                 # idempotent — seeds 9 legal templates + 3 placeholder Sites
pnpm payload migrate                      # apply migrations from src/migrations/
pnpm payload migrate:create <name>        # generate a new migration after schema changes
pnpm payload generate:types               # regenerate src/payload-types.ts
pnpm payload generate:importmap           # regenerate Payload admin import map (run before build)
docker compose up -d postgres redis       # local Postgres + Redis only
```

There is no test suite. "Correctness" checks are `pnpm typecheck` and `pnpm lint`.

## Deploy model

A `git push` to `main` triggers Plesk's Git extension via webhook, which pulls into `/var/www/vhosts/legenex.com/os.legenex.com/` on the host. The `legalos-dev.service` systemd unit serves the **production build** (`pnpm start` against `.next/`) from that directory — there is no HMR and no auto-rebuild. After the pull, you must SSH in and run `pnpm build && systemctl restart legalos-dev` for the change to take effect.

There is no container rebuild and no automatic migrate step. Rollback: `git revert && git push` (then rebuild + restart again).

Migrations are NOT auto-applied. If your push includes a new file under `src/migrations/`, run `ssh root@51.81.202.161 'cd /var/www/vhosts/legenex.com/os.legenex.com && pnpm payload migrate'` after the push (and as part of the same rebuild + restart sequence).

## Architecture: how a request flows

Every request hits Plesk's nginx (TLS termination) which reverse-proxies to the Next.js app on `127.0.0.1:3000`. From there:

1. **`src/middleware.ts`** decides whether the path is "Payload territory" (`/admin/*`, `/cms/*`, `/api/*`) or "public site territory". For the public path it stamps `x-legalos-host` (or `x-legalos-preview-site` if `?site=<slug>` was used) onto the response so the catch-all route can read it.
2. **`/admin/*`** is the custom branded dashboard (`src/app/(app)/admin/`). **`/cms/*`** is the raw Payload admin (configured via `routes.admin: '/cms'` in `src/payload.config.ts`) — used for fields not yet exposed in the custom UI.
3. **`/api/*`** is Payload's REST/GraphQL surface plus our own endpoints (`/api/legalos/*` for dns-check / test-capture, `/api/leads` for public capture).
4. **`/(public)/[[...slug]]/page.tsx`** is the public catch-all. It calls `resolveSiteByHost()` in `src/lib/site-resolver.ts` to map `Host:` → Domain → Site, applies the Site's brand tokens, then resolves the path to a `Page`/`LandingPage`/`BlogPost`, falling back to a `SharedLegalTemplate` for known legal slugs (`/privacy`, `/terms`, `/partners`, `/submitted`, `/thanks`, `/tcpa`, `/disclosures`), and finally to the marketing site (`LegalOSMarketing`) if no Site matches the host.

The host cache in `site-resolver.ts` has a 60s TTL — call `invalidateHostCache(host)` after Domain mutations.

## Multi-tenancy model

This is the single most load-bearing concept. **Everything is scoped to a `Site`.**

- `Sites` is the tenant root. Each Site has `Domains` (one with `primary: true`), `Pages`, `LandingPages`, `Quizzes`, `BlogPosts`, `Leads`, `Numbers`, `TrackingConfig`. Every one of those rows has a required `site` relationship — access control filters on it.
- `Users.siteBindings[]` assigns users to Sites with role `admin` / `editor` / `analyst`. `super_admin: true` bypasses scoping. The helpers in `src/access/index.ts` (`siteScopedRead`, `siteScopedWrite`, `siteScopedAdmin`, `isSuperAdmin`) return either `true` or a `{ site: { in: ids } }` filter — use them on collection access rules, don't reimplement.
- `SharedLegalTemplates` is the one collection that is NOT site-scoped — it's the global library of legal page bodies (privacy, terms, TCPA, etc.) with `{{site.*}}` variables substituted at render via `renderTemplateVars()` in `src/lib/template-vars.ts`. Sites can override on a per-template basis.

## Hard rules enforced in code

These aren't style preferences — violating them creates correctness bugs or compliance risk:

- **Phone numbers** display only via `resolvePhoneForPath(path, site_id)` in `src/lib/resolve-phone.ts`. Never denormalize a phone onto a Page / LP / Quiz. Resolution order: matching `Numbers.page_paths[]` (longest prefix wins) → Site's fallback Number → `Site.default_phone`.
- **Pixel + CAPI** conversions share an `event_id` per the Meta dedupe contract. See `src/lib/lead-pipeline/event-id.ts`.
- **TrustedForm cert claim** and **HLR lookup** are server-side only. Credentials never leave the server (`src/lib/integrations/`).
- **Banned-vocab and em-dash linters** run on every AI output (`enforceNoBannedVocab: true` on `invokeLLM` in `src/lib/ai/invoke.ts`). Failures trigger up to 2 retries before surfacing.
- **`ssl_status='active'`** is set only after a real HTTPS handshake by the SSL poller (`src/lib/ssl-poll.ts`) — never assumed from Plesk's response.
- **Preview domains** (`{slug}.preview.legenex.com`) are auto-issued, always `primary: true` until a custom domain is verified, and cannot be deleted from the UI.
- **`SharedLegalTemplate` edits** must surface an affected-Sites list before save.
- **No placeholders in any working config.** `.env`, server actions, scripts, and runtime config must never contain placeholder strings (`<your-server-ip>`, `CHANGEME`, `paste-here`, `TODO`, etc.). `.env.example` is the only file that may carry placeholders. `scripts/deploy.sh` rejects placeholder-looking values at boot. If a value isn't known yet, leave the key blank rather than inserting a fake — code branches on emptiness, not on placeholder text. Every shipped feature must be a fully functioning, well-built path; partial-with-placeholder is treated as broken.

## Tenant domain provisioning

Connecting a custom domain to a Site goes through Plesk's REST API (`src/lib/plesk/`):

1. `verifyAndPromoteDomain` checks DNS, then calls Plesk to register the domain, set reverse-proxy directives to `localhost:3000`, and issue a Let's Encrypt cert.
2. The Domain row flips `status: provisioning` → `active`.
3. `pollDomainSslStatus` (every 30s for ~4 minutes) hits `https://<host>/` until it returns 2xx, then flips `ssl_status: active`.
4. The public router can now resolve `Host: tenant-domain.com` → Domain → Site.

`LEGALOS_DEV_SKIP_DNS=true` (dev only — must be `false` in prod) reveals a "Skip DNS" button for local testing.

## AI usage

`src/lib/ai/invoke.ts` wraps the Anthropic SDK with: Zod schema → JSON schema for `tool_use`, forced tool invocation, automatic banned-vocab post-check, and up to 2 retries with the validation error fed back into the prompt. Default model is `claude-sonnet-4-6`. Prefer this over calling `Anthropic` directly so the retry + vocab guarantees stay intact.

## Lead capture pipeline

Public lead submissions (`POST /api/legalos/leads` and the test harness `POST /api/legalos/test-capture`) funnel into one orchestrator: `runLeadPipeline()` in `src/lib/lead-pipeline/run.ts`. It runs **synchronously inside the request** — there is no background worker. Despite `bullmq` being a declared dependency, no queue/worker is wired up; the only runtime use of Redis is a health-check ping in `src/lib/system-health/checks.ts`. Don't assume lead work is async.

The orchestrator's steps (each returns a `PipelineStep` for the result trace): derive attribution / `fbc` (`attribution.ts`) → mint the shared `event_id` (`event-id.ts`) → claim the TrustedForm cert and verify the Jornaya lead (`src/lib/integrations/`) → enrich the phone via HLR → persist the `Leads` row → fire Meta CAPI + TrueCall → dispatch outbound webhooks (`dispatch-webhooks.ts`) → Slack notify (`slack.ts`). All integration calls and credentials are server-side only.

## Globals and cross-cutting hooks

- **`IntegrationConfig` global** (`src/globals/IntegrationConfig.ts`, slug `integration-config`) holds LegalOS-wide integration settings (SMTP, Slack, GitHub, Search Console) and is **super-admin only**. Per-Site integration values live on `TrackingConfig` instead — don't conflate the two.
- **Audit log**: the `auditAfterChange` / after-delete hooks (`src/hooks/audit.ts`) write a diff of every authenticated mutation to the `AuditLog` collection. They're attached across nearly all collections.
- **Slug redirects**: `captureSlugRedirect` (`src/hooks/slug-redirects.ts`) appends the old slug to `slug_redirects[]` when a *published* doc's slug changes, so the public router can 301 old → new.

## Path aliases

- `@/*` → `./src/*`
- `@payload-config` → `./src/payload.config.ts`

## Things to know when editing

- Schema changes: dev auto-pushes (Payload default outside production). For production, generate a migration with `pnpm payload migrate:create <name>`, commit and push it, then run `pnpm payload migrate` on the server (deploys don't auto-migrate).
- After editing collection fields, run `pnpm generate:types` so `src/payload-types.ts` stays in sync (it's imported throughout).
- `next.config.mjs` is minimal and `cors: '*'` plus `csrf: [NEXT_PUBLIC_SERVER_URL]` is set in `payload.config.ts` — don't add CORS handling at the route layer.
- The `(payload)` route group exists because Payload's `withPayload` Next plugin convention expects it; the `(public)`, `(app)`, `(auth)` groups exist so each can have its own root `layout.tsx`.
- Before a production build, regenerate the Payload admin import map with `pnpm generate:importmap` (it's a committed artifact, not built on the fly).
- `README.md` still documents the old `scripts/deploy.sh` rebuild flow — it is **outdated**. The deploy model in this file (git push → Plesk webhook pull → `pnpm build` + `systemctl restart legalos-dev` on the server) is authoritative; `scripts/deploy.sh` is retained only as historical reference.

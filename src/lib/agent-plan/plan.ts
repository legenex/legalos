// AUTO-GENERATED from the 2026-06-04 bug audit (docs/audit-2026-06-04.md).
// Static plan: which agent owns which confirmed finding. Live status lives in the
// runtime store (src/lib/agent-plan/store.ts) and is merged in at read time.

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'nit'

export type PlanFinding = {
  id: string
  agent: string
  severity: Severity
  category: string
  file: string
  line: string
  title: string
  fix: string
}

export type PlanAgent = {
  name: string
  label: string
  role: 'reviewer-fixer' | 'verifier'
  findingIds: string[]
}

export const PLAN_FINDINGS: PlanFinding[] = [
  {
    "id": "F001",
    "agent": "legalos-migrations-reviewer",
    "severity": "critical",
    "category": "schema-migration",
    "file": "src/migrations/20260513_221103_init.ts",
    "line": "66-95",
    "title": "Sites collection: brand_identity, legal_*, typography_*, and new brand_* columns exist in no migration (schema drift, breaks prod)",
    "fix": "Run `pnpm payload migrate:create sites_brand_identity_legal_typography` against an up-to-date schema, or hand-write an idempotent migration that ADDs the missing columns: brand_display_name, brand_short_name, brand_logo_url_dark, brand_t..."
  },
  {
    "id": "F002",
    "agent": "legalos-lead-pipeline-reviewer",
    "severity": "high",
    "category": "data-integrity",
    "file": "src/app/api/leads/route.ts",
    "line": "38-122",
    "title": "`extra` custom form fields are parsed and validated but never forwarded to the pipeline or persisted",
    "fix": "Thread `extra` through: add `extra?: Record<string, unknown>` to LeadCaptureInput, pass `extra: data.extra` from the route, and persist it on the lead (e.g. merge into quiz_answers or add a dedicated `extra` JSON field on the Leads colle..."
  },
  {
    "id": "F003",
    "agent": "legalos-integrations-reviewer",
    "severity": "high",
    "category": "error-handling",
    "file": "src/lib/integrations/meta-capi.ts",
    "line": "70-74",
    "title": "No fetch timeout on synchronous in-request integration calls \u2014 a hung remote stalls the lead response",
    "fix": "Add a timeout to each blocking integration fetch, e.g. pass `signal: AbortSignal.timeout(8000)` to the fetch options in meta-capi.ts, trustedform.ts, jornaya.ts, and truecall.ts, and treat the resulting AbortError as a normal `{ ok: fals..."
  },
  {
    "id": "F004",
    "agent": "legalos-site-routing-reviewer",
    "severity": "high",
    "category": "tenant-isolation",
    "file": "src/app/(public)/[[...slug]]/page.tsx",
    "line": "126-128, 137-152, 168-174",
    "title": "?site= and ?preview=1 preview bypass any tenant boundary \u2014 any authenticated user can view another Site's draft/paused content",
    "fix": "After resolving the preview siteId, require the user to be bound to it: for the ?site= path, set `previewSiteSlug` only if `isBoundToSite(authedUser, resolvedSiteId)`; for ?preview=1 compute `isAuthedAdminPreview = previewMode && isBound..."
  },
  {
    "id": "F005",
    "agent": "legalos-provisioning-reviewer",
    "severity": "high",
    "category": "correctness",
    "file": "src/app/(app)/admin/(top)/brands/domains/actions.ts",
    "line": "11, 163-167",
    "title": "Brands UI domain delete uses the wrong pleskIsConfigured, so it never unprovisions the nginx vhost/cert",
    "fix": "Import pleskIsConfigured from '@/lib/plesk/provision-domain' (the filesystem/CLI-based model) instead of '@/lib/plesk/client', matching removeDomain() in settings/domains/actions.ts, so the Brands delete path actually removes the nginx v..."
  },
  {
    "id": "F006",
    "agent": "legalos-builder-lib-reviewer",
    "severity": "high",
    "category": "correctness",
    "file": "src/lib/builder/html-to-structured-blocks.ts",
    "line": "555",
    "title": "Structured import 'no matches' fallback never fires when CSS yields a brand palette, producing a content-less page",
    "fix": "Track how many scaffold blocks were pushed and compare against that. e.g. `const scaffoldCount = (overrideCss ? 1 : 0) + (css ? 1 : 0)` set just after the two pushes, then `if (blocks.length === scaffoldCount) { ... }`. This restores the..."
  },
  {
    "id": "F007",
    "agent": "legalos-block-renderer-reviewer",
    "severity": "high",
    "category": "compliance",
    "file": "src/components/blocks/LeadForm.tsx",
    "line": "234, 101-156",
    "title": "LeadForm has noValidate but performs zero client-side validation, so required fields (incl. TCPA consent) are never enforced",
    "fix": "Either remove `noValidate` (let the browser enforce `required`/`type=email`), or in onSubmit call `if (!formRef.current.checkValidity()) { formRef.current.reportValidity(); setPending(false); return }` before building the payload. Additi..."
  },
  {
    "id": "F008",
    "agent": "legalos-block-renderer-reviewer",
    "severity": "high",
    "category": "security",
    "file": "src/components/blocks/BlockRenderer.tsx",
    "line": "235-249",
    "title": "MarkdownLite injects unescaped source via dangerouslySetInnerHTML (stored XSS in prose/faq/disclosure/footer)",
    "fix": "HTML-escape the paragraph text before applying the inline-markdown replacements (escape &, <, >, \"), and validate/escape the link href (reject non-http(s)/mailto/tel schemes, escape quotes). Or route MarkdownLite output through sanitizeH..."
  },
  {
    "id": "F009",
    "agent": "legalos-block-renderer-reviewer",
    "severity": "high",
    "category": "security",
    "file": "src/components/blocks/BlockRenderer.tsx",
    "line": "228-232",
    "title": "sanitizeHtml misses unquoted on*= handlers, iframes, and javascript: URLs (custom_html / embed XSS bypass)",
    "fix": "Replace the hand-rolled regex with a real sanitizer (e.g. DOMPurify / sanitize-html) with an allowlist of tags/attributes/URL schemes, or at minimum also strip unquoted on*= handlers (`/\\son[a-z]+\\s*=\\s*[^\\s>]+/gi`), <iframe>/<object>/<e..."
  },
  {
    "id": "F010",
    "agent": "legalos-access-reviewer",
    "severity": "high",
    "category": "tenant-isolation",
    "file": "src/access/index.ts",
    "line": "17-51",
    "title": "Site-scoped access helpers don't normalize populated siteBindings.site, breaking tenant filters",
    "fix": "Normalize each binding's site to a scalar id (and coerce type) before building the filter, mirroring isBoundToSite/auth.ts: `.map((b) => (b.site && typeof b.site === 'object' ? (b.site as { id: string | number }).id : b.site))`. Apply th..."
  },
  {
    "id": "F011",
    "agent": "legalos-builder-actions-reviewer",
    "severity": "high",
    "category": "security",
    "file": "src/app/(app)/admin/sites/[slug]/pages/new/ai-clone-action.ts",
    "line": "52-90",
    "title": "createPageFromUrl performs server-side fetch of arbitrary user URL (SSRF)",
    "fix": "Before fetching, parse the URL, reject non-http(s) schemes, resolve the hostname and reject loopback/link-local/private/reserved ranges (127.0.0.0/8, 10/8, 172.16/12, 192.168/16, 169.254/16, ::1, fc00::/7) and localhost; re-validate afte..."
  },
  {
    "id": "F012",
    "agent": "legalos-system-health-reviewer",
    "severity": "high",
    "category": "security",
    "file": "src/app/(app)/admin/(top)/system/page.tsx",
    "line": "43-48",
    "title": "System Health page exposes infra secrets to any authenticated user (no super_admin gate)",
    "fix": "At the top of SystemPage (and the settings/system copy), fetch the current user and gate on super_admin, mirroring settings/integrations/page.tsx: `const me = await getCurrentUser(); if (!me) redirect('/sign-in?next=/admin/system'); if (..."
  },
  {
    "id": "F013",
    "agent": "legalos-migrations-reviewer",
    "severity": "high",
    "category": "schema-migration",
    "file": "src/payload.config.ts",
    "line": "60-65",
    "title": "Six funnel-builder collections have no migration \u2014 tables and locked-documents FK columns are absent in production",
    "fix": "Generate a migration (`pnpm payload migrate:create funnel_builder_collections`) that creates all six funnel tables (plus their nested array/relationship child tables) and adds the matching FK columns (funnel_landing_pages_id, funnel_lp_d..."
  },
  {
    "id": "F014",
    "agent": "legalos-lead-pipeline-reviewer",
    "severity": "medium",
    "category": "data-integrity",
    "file": "src/lib/lead-pipeline/attribution.ts",
    "line": "20-32",
    "title": "Client-supplied fbc/fbp cookies are silently dropped server-side, degrading Meta CAPI match/dedupe",
    "fix": "Add 'fbc' and 'fbp' (and likely 'gclid' is already present) to ATTRIBUTION_KEYS so the client-supplied Meta cookies survive the server-side filter and reach sendMetaCAPIEvent. Then the deriveFbc fallback at run.ts:84 only kicks in when n..."
  },
  {
    "id": "F015",
    "agent": "legalos-site-routing-reviewer",
    "severity": "medium",
    "category": "security",
    "file": "src/app/(public)/[[...slug]]/page.tsx",
    "line": "458-495",
    "title": "Shared-template markdown renders unescaped HTML and allows javascript: links (stored-XSS surface)",
    "fix": "escapeHtml the raw text in every branch (paragraphs, list items) before applying inline markdown replacements, and reject/strip non-http(s) URLs in the link rule (e.g. only emit href when /^https?:\\/\\//.test(url) or a relative path)."
  },
  {
    "id": "F016",
    "agent": "legalos-site-routing-reviewer",
    "severity": "medium",
    "category": "security",
    "file": "src/app/(public)/layout.tsx",
    "line": "32-49, 86",
    "title": "Brand color/font values are injected raw into a <style> tag without sanitization (CSS-injection / style breakout)",
    "fix": "Validate each brand token against an allowlist (hex/rgb/hsl color regex for colors; a font-name regex for fonts) and fall back to the default when it doesn't match, before interpolating into the style string."
  },
  {
    "id": "F017",
    "agent": "legalos-provisioning-reviewer",
    "severity": "medium",
    "category": "correctness",
    "file": "src/lib/plesk/provision-domain.ts",
    "line": "97-100, 128-133",
    "title": "Tenant nginx serves www.<host> over TLS but the cert is only issued for the apex host (www TLS mismatch)",
    "fix": "Add `-d`, `www.${host}` to the LE issuance args so the cert SAN covers www, or drop `www.${host}` from the :443 server_name (keeping it on :80 to 301 www \u2192 https://<host>)."
  },
  {
    "id": "F018",
    "agent": "legalos-builder-lib-reviewer",
    "severity": "medium",
    "category": "data-integrity",
    "file": "src/lib/builder/html-to-structured-blocks.ts",
    "line": "101",
    "title": "nav_header detector emits logo_url, but the Pages nav_header block has no logo_url field, so the logo is silently dropped on save",
    "fix": "Add `{ name: 'logo_url', type: 'text' }` to the nav_header block fields in src/collections/Pages.ts (and to NavHeaderSchema in block-schemas.ts for the AI path), then run pnpm generate:types. This keeps the detector, renderer, schema, an..."
  },
  {
    "id": "F019",
    "agent": "legalos-access-reviewer",
    "severity": "medium",
    "category": "data-integrity",
    "file": "src/collections/AuditLog.ts",
    "line": "19",
    "title": "AuditLog create access is `() => true`, allowing forged/spoofed audit entries via REST",
    "fix": "Restrict create to authenticated requests at minimum (`create: isAuthenticated`) so anonymous forging is blocked; ideally only allow the internal hook path (e.g. gate on a server-only flag) so end users can never write audit rows directly."
  },
  {
    "id": "F020",
    "agent": "legalos-collections-reviewer",
    "severity": "medium",
    "category": "security",
    "file": "src/collections/TrackingConfigs.ts",
    "line": "13-17",
    "title": "TrackingConfigs read access (siteScopedRead) lets analyst-role users read per-site server secrets",
    "fix": "Either set `read: siteScopedAdmin` for TrackingConfigs, or add field-level `access: { read: ... }` to the credential fields (capi_token, api_secret, access_token, api_key, hmac_secret) so the analyst role cannot read raw secrets."
  },
  {
    "id": "F021",
    "agent": "legalos-admin-actions-reviewer",
    "severity": "medium",
    "category": "error-handling",
    "file": "src/app/(app)/admin/sites/[slug]/settings/general/actions.ts",
    "line": "56-67",
    "title": "saveGeneralSettings has no try/catch \u2014 access-denied / duplicate-slug / validation errors become unhandled rejections, client never sees {ok:false}",
    "fix": "Wrap the payload.update in try/catch and return `{ ok: false, error: e instanceof Error ? e.message : 'Failed to save settings' }` on failure, matching the pattern in saveTracking/updateProfile."
  },
  {
    "id": "F022",
    "agent": "legalos-admin-actions-reviewer",
    "severity": "medium",
    "category": "routing",
    "file": "src/app/(app)/admin/sites/[slug]/settings/general/actions.ts",
    "line": "65",
    "title": "saveGeneralSettings revalidates the NEW slug path and never redirects \u2014 a slug rename strands the user on a now-dead URL",
    "fix": "If the slug changed, revalidate the old path too and return the new slug so the client can `router.replace(\\`/admin/sites/${newSlug}/settings/general\\`)`; otherwise disallow slug edits in this form."
  },
  {
    "id": "F023",
    "agent": "legalos-admin-actions-reviewer",
    "severity": "medium",
    "category": "error-handling",
    "file": "src/app/(app)/admin/(top)/sites/actions.ts",
    "line": "82-204",
    "title": "createSite only checks authentication, not super_admin \u2014 non-super-admins hit an unguarded payload.create that throws an unhandled rejection",
    "fix": "Add an explicit `if (!user.super_admin) return { ok: false, error: 'forbidden \u2014 super admin required' }` early-return, and/or wrap the create chain in try/catch returning `{ ok: false, error }`."
  },
  {
    "id": "F024",
    "agent": "legalos-admin-actions-reviewer",
    "severity": "medium",
    "category": "data-integrity",
    "file": "src/app/(app)/admin/(top)/sites/actions.ts",
    "line": "207-252",
    "title": "createSite leaves a partially-built (orphaned) Site if any post-create step throws \u2014 no rollback or try/catch around preview-domain, pages, or tracking creation",
    "fix": "Wrap the post-create steps in try/catch and, on failure, delete the just-created Site (and its children) before returning `{ ok: false, error }`, so a failed creation does not leave an unusable half-site."
  },
  {
    "id": "F025",
    "agent": "legalos-builder-actions-reviewer",
    "severity": "medium",
    "category": "tenant-isolation",
    "file": "src/app/(app)/admin/sites/[slug]/pages/[id]/media-actions.ts",
    "line": "74-101",
    "title": "listSiteMedia leaks another tenant's media (cross-tenant read via overrideAccess: true)",
    "fix": "Verify the caller is bound to args.siteId before reading: import { isBoundToSite } from '@/lib/auth' and `if (!isBoundToSite(user, args.siteId)) return { ok: false, error: 'forbidden' }`. Alternatively drop overrideAccess (use overrideAc..."
  },
  {
    "id": "F026",
    "agent": "legalos-builder-actions-reviewer",
    "severity": "medium",
    "category": "tenant-isolation",
    "file": "src/app/(app)/admin/sites/[slug]/pages/new/ai-clone-action.ts",
    "line": "42-50",
    "title": "AI clone burns an LLM call before verifying the user may write to the target site",
    "fix": "Add `if (!isBoundToSite(user, args.siteId)) return { ok: false, error: 'forbidden' }` (from @/lib/auth) immediately after the getCurrentUser() check, before the fetch and invokeLLM call."
  },
  {
    "id": "F027",
    "agent": "legalos-funnel-reviewer",
    "severity": "medium",
    "category": "data-integrity",
    "file": "src/app/(app)/admin/(top)/quizzes/actions.ts",
    "line": "14-18,124",
    "title": "numFromBrandId maps empty/no-brand selection to site id 0 instead of null",
    "fix": "Treat an empty/zero numeric id as null, e.g.: `const numFromBrandId = (brandId) => { if (typeof brandId !== 'string') return null; const m = brandId.match(/^site_(\\d+)$/); return m ? Number(m[1]) : null }`. This returns null for '', 'sit..."
  },
  {
    "id": "F028",
    "agent": "legalos-funnel-reviewer",
    "severity": "medium",
    "category": "data-integrity",
    "file": "src/app/(app)/admin/(top)/advertorials/actions.ts",
    "line": "14-18,92",
    "title": "saveQuizDeployment writes site 0 for unselected brand (same numFromBrandId defect)",
    "fix": "Fix numFromBrandId as described in the quizzes finding (anchor on /^site_(\\d+)$/), or short-circuit: `site: dep.brandId ? numFromBrandId(dep.brandId) : null` plus an inner check that rejects 0/NaN."
  },
  {
    "id": "F029",
    "agent": "legalos-public-cmc-reviewer",
    "severity": "medium",
    "category": "compliance",
    "file": "src/components/public/check-my-claim/Submitted.tsx",
    "line": "30",
    "title": "Client Meta Pixel fires 'Submit form event' but server CAPI fires 'Lead' \u2014 event_id dedupe never matches (double-counted conversions)",
    "fix": "Fire the same standard event name the CAPI side uses: window.fbq?.('track', 'Lead', {}, eventId ? { eventID: eventId } : undefined). Keep the event_id identical (already passed) so Pixel/CAPI deduplicate correctly."
  },
  {
    "id": "F030",
    "agent": "legalos-public-cmc-reviewer",
    "severity": "medium",
    "category": "compliance",
    "file": "src/components/public/check-my-claim/Submitted.tsx",
    "line": "33",
    "title": "TikTok client Pixel omits event_id and uses a different event name than the TikTok Events API call \u2014 no deduplication",
    "fix": "Match the CAPI event and pass the shared id: window.ttq?.track?.('SubmitForm', {}, eventId ? { event_id: eventId } : undefined). Use the same name 'SubmitForm' the Events API call uses and forward the event_id from the query string."
  },
  {
    "id": "F031",
    "agent": "legalos-system-health-reviewer",
    "severity": "medium",
    "category": "security",
    "file": "src/app/(app)/admin/(top)/system/actions.ts",
    "line": "7-12",
    "title": "refreshSystemReport server action only checks login, not super_admin",
    "fix": "Add `if (!user.super_admin) return` after the existing null check, matching the access level the page itself should enforce."
  },
  {
    "id": "F032",
    "agent": "legalos-system-health-reviewer",
    "severity": "medium",
    "category": "security",
    "file": "src/app/api/media/upload/route.ts",
    "line": "14-26",
    "title": "Media upload accepts unsanitized SVG, served same-origin (stored XSS)",
    "fix": "Either drop image/svg+xml from ALLOWED_MIME, or sanitize SVG bytes (e.g. DOMPurify with SVG profile / svgo strip-scripts) before writing, and serve uploads with `Content-Security-Policy: default-src 'none'` / `Content-Disposition: attach..."
  },
  {
    "id": "F033",
    "agent": "legalos-migrations-reviewer",
    "severity": "medium",
    "category": "schema-migration",
    "file": "src/migrations/20260529_060000_sites_global_blocks.ts",
    "line": "6-11",
    "title": "20260529_060000 comment falsely claims brand_identity has existed since init, masking the missing-column bug",
    "fix": "Either add brand_identity (and the rest of the missing Sites columns) in a real migration per the prior finding, then correct this comment; or, if this no-op truly depends on brand_identity, have THIS migration ADD COLUMN IF NOT EXISTS \"..."
  },
  {
    "id": "F034",
    "agent": "legalos-lead-pipeline-reviewer",
    "severity": "low",
    "category": "error-handling",
    "file": "src/lib/lead-pipeline/run.ts",
    "line": "235-236",
    "title": "Enabled-but-misconfigured TikTok/GA4/TrueCall integrations report ok:true and skip the delivery log",
    "fix": "Split the disabled vs. misconfigured cases like the Meta task does: when `tk.enabled` is true but a credential is missing, push `ok: false` and call `logDelivery(step, false, 'missing credentials')`. Apply the same fix to the ga4Task (li..."
  },
  {
    "id": "F035",
    "agent": "legalos-integrations-reviewer",
    "severity": "low",
    "category": "data-integrity",
    "file": "src/lib/integrations/hlr.ts",
    "line": "53",
    "title": "HLR carrier.type is cast from Plivo's raw value without mapping \u2014 Plivo \"fixed\" never becomes \"landline\"",
    "fix": "Map Plivo's vocabulary onto the result union explicitly, e.g. `const raw = r.carrier?.type; const type = raw === 'fixed' ? 'landline' : (raw === 'mobile' || raw === 'voip' ? raw : 'unknown')` before assigning, rather than casting the pro..."
  },
  {
    "id": "F036",
    "agent": "legalos-site-routing-reviewer",
    "severity": "low",
    "category": "routing",
    "file": "src/collections/Domains.ts",
    "line": "37-56",
    "title": "redirects_from[].host is never normalized, so case/whitespace variants silently fail to 301",
    "fix": "In the same beforeValidate hook, also normalize each entry: `if (Array.isArray(data.redirects_from)) data.redirects_from = data.redirects_from.map(r => ({ ...r, host: normalizeHost(r.host) }))` using the same normalization (or import nor..."
  },
  {
    "id": "F037",
    "agent": "legalos-site-routing-reviewer",
    "severity": "low",
    "category": "correctness",
    "file": "src/app/(public)/[[...slug]]/page.tsx",
    "line": "507-535",
    "title": "LandingPage and BlogPost bodies skip {{site.*}} substitution, so raw placeholders can leak to public visitors",
    "fix": "Run renderTemplateVars/deepRenderTemplateVars on lp.hero and body_sections (and the blog post title/body) with the resolved site before rendering, matching the Pages path."
  },
  {
    "id": "F038",
    "agent": "legalos-provisioning-reviewer",
    "severity": "low",
    "category": "error-handling",
    "file": "src/app/(app)/admin/(top)/brands/domains/actions.ts",
    "line": "92-94",
    "title": "attachDomainToSite swallows a failed verify and returns ok:true",
    "fix": "Propagate the failure, e.g. `if (!result.ok) return { ok: false, error: result.error }`, so the Brands UI can show why verification could not run; leave the verified:false path for the legitimate 'DNS not ready' case where result.ok is t..."
  },
  {
    "id": "F039",
    "agent": "legalos-ai-reviewer",
    "severity": "low",
    "category": "correctness",
    "file": "src/lib/ai/invoke.ts",
    "line": "81-89",
    "title": "Banned-vocab/em-dash check inspects the serialized JSON envelope (keys + structure), not text values",
    "fix": "Run the check over the concatenated string *values* of parsed.data rather than the JSON envelope \u2014 e.g. recursively collect all string leaf values (JSON.stringify with a replacer that joins strings, or a small walker) and pass only that ..."
  },
  {
    "id": "F040",
    "agent": "legalos-builder-lib-reviewer",
    "severity": "low",
    "category": "correctness",
    "file": "src/lib/builder/extract-brand-tokens.ts",
    "line": "9",
    "title": "CSS :root variable parser drops the final declaration when it omits a trailing semicolon",
    "fix": "Make the trailing terminator optional / also accept end-of-body: e.g. `/--([a-zA-Z0-9-]+)\\s*:\\s*([^;]+)(?:;|$)/g` (the body has no closing brace since it is already the inner :root text), or split the body on ';' and parse each segment. ..."
  },
  {
    "id": "F041",
    "agent": "legalos-block-renderer-reviewer",
    "severity": "low",
    "category": "routing",
    "file": "src/components/blocks/LeadForm.tsx",
    "line": "185-186",
    "title": "Empty-string success_slug reloads the current page instead of redirecting",
    "fix": "Treat empty as missing: `const slug = block.success_slug || '/submitted'`."
  },
  {
    "id": "F042",
    "agent": "legalos-access-reviewer",
    "severity": "low",
    "category": "compliance",
    "file": "src/collections/SharedLegalTemplates.ts",
    "line": "33-35",
    "title": "SharedLegalTemplates has no afterDelete audit hook, so template deletions are unaudited",
    "fix": "Import auditAfterDelete and add `afterDelete: [auditAfterDelete]` to the hooks block, matching every other collection."
  },
  {
    "id": "F043",
    "agent": "legalos-collections-reviewer",
    "severity": "low",
    "category": "tenant-isolation",
    "file": "src/collections/Sites.ts",
    "line": "14-21",
    "title": "Sites read access maps raw binding values that may be populated objects into an id `in` filter",
    "fix": "Map to the underlying id with the object-or-id normalization used in src/lib/auth.ts: `const ids = (user.siteBindings ?? []).map((b) => (typeof b.site === 'object' && b.site ? (b.site as { id: unknown }).id : b.site))` before building th..."
  },
  {
    "id": "F044",
    "agent": "legalos-admin-actions-reviewer",
    "severity": "low",
    "category": "data-integrity",
    "file": "src/app/(app)/admin/(top)/settings/integrations/actions.ts",
    "line": "39",
    "title": "saveIntegrationConfig saves SMTP port 0 when the port field is cleared (empty-string short-circuits ?? and Number('') === 0)",
    "fix": "Parse defensively: `const port = Number(formData.get('smtp_port')); data.smtp.port = Number.isFinite(port) && port > 0 ? port : 587`."
  },
  {
    "id": "F045",
    "agent": "legalos-admin-actions-reviewer",
    "severity": "low",
    "category": "security",
    "file": "src/app/(auth)/sign-in/actions.ts",
    "line": "19",
    "title": "signIn open-redirect guard allows backslash paths (e.g. /\\evil.com) that browsers normalize to a protocol-relative external URL",
    "fix": "Reject backslashes too, e.g. require `/^\\/[^/\\\\]/.test(requestedRedirect)` (starts with a single '/', second char is neither '/' nor '\\\\'), or parse with `new URL(requestedRedirect, base)` and verify the resolved origin matches."
  },
  {
    "id": "F046",
    "agent": "legalos-builder-actions-reviewer",
    "severity": "low",
    "category": "tenant-isolation",
    "file": "src/app/(app)/admin/sites/[slug]/pages/[id]/site-defaults-action.ts",
    "line": "45-49",
    "title": "saveAsSiteDefault reads arbitrary tenant's brand_identity via overrideAccess: true",
    "fix": "Gate the action with isBoundToSite(user, args.siteId) at the top, and/or perform the read with overrideAccess: false so Sites read access applies."
  },
  {
    "id": "F047",
    "agent": "legalos-funnel-reviewer",
    "severity": "low",
    "category": "error-handling",
    "file": "src/app/(app)/admin/(top)/advertorials/actions.ts",
    "line": "187-188",
    "title": "aiBulkSimplify silently returns the original (un-simplified) text on a length mismatch while reporting ok:true",
    "fix": "Return a signal when the fallback fires, e.g. `return { ok: false, error: 'AI returned a mismatched result; nothing was changed.' }` on length mismatch, or include a `changed: boolean` flag so the UI can surface that no rewrite occurred."
  },
  {
    "id": "F048",
    "agent": "legalos-public-cmc-reviewer",
    "severity": "low",
    "category": "react-state",
    "file": "src/components/builder/quiz/preview.tsx",
    "line": "106-124",
    "title": "SmartDatePicker keeps stale internal year/month/day across consecutive smart_date questions (seeds local state only on mount, never remounted)",
    "fix": "Give the picker a stable per-node key (e.g. <SmartDatePicker key={node.id} ...>) so it remounts per question, or sync internal state to `value` via a useEffect when the value prop is cleared."
  },
  {
    "id": "F049",
    "agent": "legalos-system-health-reviewer",
    "severity": "low",
    "category": "error-handling",
    "file": "src/lib/system-health/checks.ts",
    "line": "190-196",
    "title": "Redis health check leaks the connection when ping() throws",
    "fix": "Wrap the connect/ping in try/finally and call client.quit() (or client.disconnect()) in the finally, so the client is always torn down regardless of whether ping() succeeds."
  },
  {
    "id": "F050",
    "agent": "legalos-builder-actions-reviewer",
    "severity": "nit",
    "category": "error-handling",
    "file": "src/app/(app)/admin/sites/[slug]/pages/[id]/blocks-actions.ts",
    "line": "88",
    "title": "Invalid publish_at fails the whole page save with an unhelpful generic error",
    "fix": "Validate explicitly: `const d = args.publish_at ? new Date(args.publish_at) : null; if (d && isNaN(d.getTime())) return { ok: false, error: 'Publish date is not a valid date.' }` and use d.toISOString() only when valid."
  }
]

export const PLAN_AGENTS: PlanAgent[] = [
  {
    "name": "legalos-lead-pipeline-reviewer",
    "label": "Lead pipeline core",
    "role": "reviewer-fixer",
    "findingIds": [
      "F002",
      "F014",
      "F034"
    ]
  },
  {
    "name": "legalos-integrations-reviewer",
    "label": "External integrations",
    "role": "reviewer-fixer",
    "findingIds": [
      "F003",
      "F035"
    ]
  },
  {
    "name": "legalos-site-routing-reviewer",
    "label": "Site resolution & routing",
    "role": "reviewer-fixer",
    "findingIds": [
      "F004",
      "F015",
      "F016",
      "F036",
      "F037"
    ]
  },
  {
    "name": "legalos-provisioning-reviewer",
    "label": "Provisioning / Plesk / SSL",
    "role": "reviewer-fixer",
    "findingIds": [
      "F005",
      "F017",
      "F038"
    ]
  },
  {
    "name": "legalos-ai-reviewer",
    "label": "AI invoke layer",
    "role": "reviewer-fixer",
    "findingIds": [
      "F039"
    ]
  },
  {
    "name": "legalos-builder-lib-reviewer",
    "label": "Page builder lib",
    "role": "reviewer-fixer",
    "findingIds": [
      "F006",
      "F018",
      "F040"
    ]
  },
  {
    "name": "legalos-block-renderer-reviewer",
    "label": "Block renderer & lead form",
    "role": "reviewer-fixer",
    "findingIds": [
      "F007",
      "F008",
      "F009",
      "F041"
    ]
  },
  {
    "name": "legalos-access-reviewer",
    "label": "Access & multi-tenancy",
    "role": "reviewer-fixer",
    "findingIds": [
      "F010",
      "F019",
      "F042"
    ]
  },
  {
    "name": "legalos-collections-reviewer",
    "label": "Collections schema",
    "role": "reviewer-fixer",
    "findingIds": [
      "F020",
      "F043"
    ]
  },
  {
    "name": "legalos-admin-actions-reviewer",
    "label": "Admin server actions",
    "role": "reviewer-fixer",
    "findingIds": [
      "F021",
      "F022",
      "F023",
      "F024",
      "F044",
      "F045"
    ]
  },
  {
    "name": "legalos-builder-actions-reviewer",
    "label": "Page-builder server actions",
    "role": "reviewer-fixer",
    "findingIds": [
      "F011",
      "F025",
      "F026",
      "F046",
      "F050"
    ]
  },
  {
    "name": "legalos-funnel-reviewer",
    "label": "Funnel builder",
    "role": "reviewer-fixer",
    "findingIds": [
      "F027",
      "F028",
      "F047"
    ]
  },
  {
    "name": "legalos-public-cmc-reviewer",
    "label": "Public check-my-claim flow",
    "role": "reviewer-fixer",
    "findingIds": [
      "F029",
      "F030",
      "F048"
    ]
  },
  {
    "name": "legalos-system-health-reviewer",
    "label": "System health & misc API",
    "role": "reviewer-fixer",
    "findingIds": [
      "F012",
      "F031",
      "F032",
      "F049"
    ]
  },
  {
    "name": "legalos-migrations-reviewer",
    "label": "Migrations / schema drift",
    "role": "reviewer-fixer",
    "findingIds": [
      "F001",
      "F013",
      "F033"
    ]
  },
  {
    "name": "legalos-adversarial-verifier",
    "label": "Adversarial verifier",
    "role": "verifier",
    "findingIds": []
  }
]

export const AGENT_NAMES: string[] = PLAN_AGENTS.map((a) => a.name)

export const findingById = (id: string): PlanFinding | undefined =>
  PLAN_FINDINGS.find((f) => f.id === id)

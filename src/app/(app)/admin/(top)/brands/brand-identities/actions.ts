'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { invokeLLM } from '@/lib/ai/invoke'
import { createSite } from '../../sites/actions'
import { seedStarterFunnelsForBrand } from '@/lib/funnel-samples'
import { fetchUrlBundle, fetchGithubBundle } from '@/lib/builder/extract/fetch-bundle'
import { extractColors, parseTailwindConfig } from '@/lib/builder/extract/extract-colors'
import { extractLogosFromUrl, extractLogosFromGithub } from '@/lib/builder/extract/extract-logos'
import { extractCopyFromUrl, extractCopyFromGithub } from '@/lib/builder/extract/extract-copy'
import { mapExtractedToOutput, type MappedBrand } from '@/lib/builder/extract/map-output'

// In production a "brand" is a Site. The funnel builder's brand object (the
// artifact shape) is stored verbatim on Site.brand_identity (JSON). These
// actions persist that object and manage the backing Site.

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

// Strip transient client-only linkage fields (siteId/siteSlug and any __ keys
// like __domains/__domainCount) before persisting the JSON.
const cleanBrand = (brand: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(brand ?? {})) {
    if (k === 'siteId' || k === 'siteSlug' || k.startsWith('__')) continue
    out[k] = v
  }
  return out
}

// Map the brand-identity color/typography tokens onto Site.brand, which is what
// the page builder + public renderer read to theme blocks. Without this the
// seeded starter content renders in the LegalOS default navy/gold instead of
// the brand's palette. Only well-formed hex values are applied; anything missing
// falls back so we never write blanks.
const SITE_BRAND_DEFAULT = {
  primary: '#0B1F3A',
  accent: '#E8B14B',
  surface: '#F7F5F0',
  ink: '#0E1116',
  muted: '#5C6470',
  font_heading: 'Inter',
  font_body: 'Inter',
}
const isHex = (v: unknown): v is string => typeof v === 'string' && /^#([0-9a-fA-F]{3,8})$/.test(v.trim())
const brandTokensFromIdentity = (brand: Record<string, unknown>): Record<string, string> => {
  const colors = (brand.colors ?? {}) as Record<string, unknown>
  const typo = (brand.typography ?? {}) as Record<string, unknown>
  return {
    primary: isHex(colors.primary) ? colors.primary.trim() : SITE_BRAND_DEFAULT.primary,
    accent: isHex(colors.accent) ? colors.accent.trim() : SITE_BRAND_DEFAULT.accent,
    // brand_identity.colors.background is the DARK card backdrop in the
    // funnel-artifact model — the colour the quiz / advertorial / LP
    // preview paint behind their cards. It maps to Site.brand.ink (which
    // siteToBrand reads back into colors.background for those previews).
    // Mapping it to Site.brand.surface was wrong: surface drives the
    // light page background on Site Pages, so the user's dark identity
    // colour was lost on the way to the funnel renderers.
    ink: isHex(colors.background) ? (colors.background as string).trim() : SITE_BRAND_DEFAULT.ink,
    // surface stays at the LegalOS default light page colour — it's a
    // distinct concept (light page bg for Site Pages) that the funnel
    // artifact has no equivalent for. Users can still override it via
    // the Site → Settings → Brand editor if they want a different page
    // bg.
    surface: SITE_BRAND_DEFAULT.surface,
    muted: SITE_BRAND_DEFAULT.muted,
    font_heading: typeof typo.headlineFont === 'string' && typo.headlineFont.trim() ? typo.headlineFont.trim() : SITE_BRAND_DEFAULT.font_heading,
    font_body: typeof typo.bodyFont === 'string' && typo.bodyFont.trim() ? typo.bodyFont.trim() : SITE_BRAND_DEFAULT.font_body,
  }
}

// One-time backfill: re-applies brandTokensFromIdentity to every Site that
// already has a brand_identity. Earlier versions of brandTokensFromIdentity
// wrote brand_identity.colors.background into Site.brand.surface (a light
// page bg) instead of Site.brand.ink (the dark card backdrop the quiz / LP
// preview actually reads). Existing brands ended up with Site.brand.ink set
// to a generic dark default, so siteToBrand never surfaced the user's chosen
// brand colour to the funnel renderers.
//
// Re-applying the (now corrected) mapping fixes that without asking the user
// to manually re-save every brand. Idempotent — Sites whose Site.brand already
// matches the derived tokens are skipped.
const brandTokensSynced = new Set<number>()
export const ensureBrandTokensSyncedForAllBrands = async (): Promise<void> => {
  const payload = await getPayload({ config })
  try {
    const sitesRes = await payload.find({ collection: 'sites', limit: 500, overrideAccess: true })
    for (const s of sitesRes.docs) {
      const siteId = Number(s.id)
      if (brandTokensSynced.has(siteId)) continue
      const identity = (s as { brand_identity?: Record<string, unknown> | null }).brand_identity
      if (!identity || typeof identity !== 'object') {
        brandTokensSynced.add(siteId)
        continue
      }
      const desired = brandTokensFromIdentity(identity)
      const current = ((s as { brand?: Record<string, unknown> }).brand ?? {}) as Record<string, unknown>
      // Compare the four colour tokens that actually drive funnel rendering;
      // any difference means a re-sync is needed.
      const matches = ['primary', 'accent', 'ink', 'surface'].every(
        (k) => String(current[k] ?? '') === desired[k],
      )
      if (matches) {
        brandTokensSynced.add(siteId)
        continue
      }
      try {
        await payload.update({
          collection: 'sites',
          id: siteId,
          data: { brand: desired } as never,
          overrideAccess: true,
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[brand-identities] brand-token re-sync failed for site=${siteId}:`, err)
      }
      brandTokensSynced.add(siteId)
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[brand-identities] brand-token backfill walk failed:', err)
  }
}

// Mirror the brand's call number onto the Site's phone fields so it actually
// drives the public site (resolvePhoneForPath falls back to Site.default_phone).
const phoneFields = (brand: Record<string, unknown>): Record<string, string> => {
  const contact = (brand.contact ?? {}) as Record<string, unknown>
  const raw = typeof contact.callNumber === 'string' ? contact.callNumber.trim() : ''
  if (!raw) return {}
  const digits = raw.replace(/[^\d]/g, '')
  let tel = ''
  if (digits.length === 10) tel = `+1${digits}`
  else if (digits.length === 11 && digits.startsWith('1')) tel = `+${digits}`
  else if (digits.length > 0) tel = `+${digits}`
  return tel ? { default_phone: raw, default_phone_tel: tel } : { default_phone: raw }
}

async function freeSlug(payload: Awaited<ReturnType<typeof getPayload>>, base: string): Promise<string> {
  const root = slugify(base) || 'brand'
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${Math.random().toString(36).slice(2, 6)}`
    const conflict = await payload.find({ collection: 'sites', where: { slug: { equals: candidate } }, limit: 1, overrideAccess: true })
    if (!conflict.docs[0]) return candidate
  }
  return `${root}-${Date.now().toString(36)}`
}

/** Save the brand-identity JSON on an existing Site. */
export async function saveBrandIdentity(args: {
  siteId: number
  brand: Record<string, unknown>
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  if (!args.siteId || typeof args.brand !== 'object') return { ok: false, error: 'invalid input' }

  const payload = await getPayload({ config })
  const brand = cleanBrand(args.brand)
  const name = typeof brand.name === 'string' && brand.name.trim() ? brand.name.trim() : undefined

  try {
    await payload.update({
      collection: 'sites',
      id: args.siteId,
      // Mirror the brand name onto Site.name so the Sites list stays in sync,
      // and re-theme Site.brand from the identity colors so content follows the
      // brand palette; the rest lives in the brand_identity JSON.
      data: { brand_identity: brand, brand: brandTokensFromIdentity(brand), ...(name ? { name } : {}), ...phoneFields(brand) } as never,
      user: user as never,
      overrideAccess: false,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'save failed' }
  }
  revalidatePath('/admin/brands/brand-identities')
  return { ok: true }
}

/** Create a new Site for a brand and attach the brand-identity JSON. */
export async function createBrandSite(args: {
  brand: Record<string, unknown>
}): Promise<
  | {
      ok: true
      siteId: number
      slug: string
      previewHost: string
      starterFunnels?: {
        quizDeploymentId: string | null
        quizPath: string | null
        lpDeploymentId: string | null
        lpPath: string | null
        warnings: string[]
      } | null
    }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const brand = cleanBrand(args.brand)
  const name =
    (typeof brand.name === 'string' && brand.name.trim()) ||
    (typeof brand.displayName === 'string' && brand.displayName.trim()) ||
    'New Brand'

  const payload = await getPayload({ config })
  const slug = await freeSlug(payload, name)

  // Reuse the full site-creation flow (preview domain, default pages, tracking config).
  const created = await createSite({ mode: 'blank', name, slug, vertical: 'multi' })
  if (!created.ok) return { ok: false, error: created.error }

  try {
    await payload.update({
      collection: 'sites',
      id: created.site.id,
      data: { brand_identity: brand, brand: brandTokensFromIdentity(brand), ...phoneFields(brand) } as never,
      user: user as never,
      overrideAccess: false,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'attach brand failed' }
  }

  // Auto-seed a starter Landing Page deployment + Quiz deployment for the
  // new brand so the funnel builders surface working content from day one.
  // Per-step error reporting (warnings[]) lets the UI surface partial
  // failures — the brand is still created either way.
  const seeded = await seedStarterFunnelsForBrand(payload, Number(created.site.id))

  // Funnel pages cache the LP / Quiz / Deployments lists at request time —
  // bust those caches so the new deployments show up immediately.
  revalidatePath('/admin/brands/brand-identities')
  revalidatePath('/admin/landing-pages')
  revalidatePath('/admin/quizzes')

  return {
    ok: true,
    siteId: created.site.id,
    slug: created.site.slug,
    previewHost: created.preview_host,
    starterFunnels: seeded.ok
      ? {
          quizDeploymentId: seeded.quizDeploymentId,
          quizPath: seeded.quizPath,
          lpDeploymentId: seeded.lpDeploymentId,
          lpPath: seeded.lpPath,
          warnings: seeded.warnings,
        }
      : null,
  }
}

/** Delete the Site backing a brand. Super-admin only (enforced by Sites access). */
export async function deleteBrandSite(args: { siteId: number }): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    // The Sites beforeDelete hook cascade-removes child rows (pages, leads,
    // domains, etc.) first, so this no longer trips the SET NULL / NOT NULL FK.
    await payload.delete({ collection: 'sites', id: args.siteId, user: user as never, overrideAccess: false })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'delete failed' }
  }
  revalidatePath('/admin/brands/brand-identities')
  return { ok: true }
}

// ----------------------------------------------------------------------------
// AI brand generation (Create with AI / GitHub).
//
// Architecture: SCRAPE EVERYTHING REAL FIRST, then let the LLM fill ONLY the
// gaps. The old flow let the model invent colors/logos and only patched a few
// color tokens after — which is why "from URL / GitHub" was inaccurate. Now:
//
//   1. fetch one asset bundle from the source (page + CSS + manifest, or repo
//      tailwind/globals/package/readme + probed public assets),
//   2. run three independent extractors over it — colors (by role, not var
//      name), logos (HEAD-validated real URLs), copy/legal (name, tagline,
//      phone, copyright, privacy/terms),
//   3. map those internal roles into the output shape (mapExtractedToOutput —
//      where the dark-backdrop-vs-light-surface seam is enforced),
//   4. ask the LLM to fill ONLY the fields we could NOT scrape, treating the
//      scraped values as authoritative and never changing them, and to always
//      author the TCPA + disclaimer copy,
//   5. deep-merge with scraped-wins precedence and fill any final defaults.
//
// Precedence everywhere: scraped > AI > seed-default.
// ----------------------------------------------------------------------------
const AiBrandSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  tagline: z.string(),
  logoUrl: z.string(),
  faviconUrl: z.string(),
  colors: z.object({
    primary: z.string(),
    accent: z.string(),
    background: z.string(),
    cardBg: z.string(),
    textOnDark: z.string(),
    success: z.string(),
    warning: z.string(),
    danger: z.string(),
  }),
  typography: z.object({ headlineFont: z.string(), bodyFont: z.string(), baseSize: z.string() }),
  contact: z.object({ callNumber: z.string(), callCtaText: z.string(), callCtaStyle: z.string() }),
  domains: z.array(z.string()),
  legal: z.object({
    copyright: z.string(),
    tcpaText: z.string(),
    privacyUrl: z.string(),
    termsUrl: z.string(),
    defaultDisclaimer: z.string(),
  }),
  bgPattern: z.string(),
})

type AiBrand = z.infer<typeof AiBrandSchema>

// Run the three extractors over a real source and map to the output shape.
// Returns null when the source could not be fetched at all (caller then falls
// back to pure-LLM inference). Never throws.
async function scrapeBrand(args: { mode: 'ai' | 'github'; urls?: string[]; repoUrl?: string }): Promise<MappedBrand | null> {
  try {
    if (args.mode === 'github') {
      const bundle = await fetchGithubBundle(args.repoUrl ?? '')
      if (!bundle || !bundle.accessible) return null
      const tw = bundle.files.tailwindConfig ? parseTailwindConfig(bundle.files.tailwindConfig) : undefined
      const colors = extractColors({ tailwind: tw, css: bundle.files.globalsCss || '' })
      const [logos, copy] = await Promise.all([
        extractLogosFromGithub(bundle),
        Promise.resolve(extractCopyFromGithub(bundle)),
      ])
      return mapExtractedToOutput({ colors, logos, copy })
    }
    // URL mode: extract from the first reachable URL.
    for (const raw of args.urls ?? []) {
      const bundle = await fetchUrlBundle(raw)
      if (!bundle) continue
      const colors = extractColors({ css: bundle.css, html: bundle.html, googleFontFamilies: bundle.googleFontFamilies })
      const logos = await extractLogosFromUrl(bundle)
      const copy = extractCopyFromUrl(bundle)
      return mapExtractedToOutput({ colors, logos, copy })
    }
    return null
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[brand-identities] scrapeBrand failed:', err)
    return null
  }
}

// Overlay only the DEFINED leaves of a scraped partial onto a complete brand,
// so scraped values win but never blank out fields the LLM authored.
const SCALAR_KEYS = ['name', 'displayName', 'tagline', 'logoUrl', 'faviconUrl'] as const
function applyScrapedWins(base: AiBrand, scraped: MappedBrand): AiBrand {
  const out: AiBrand = { ...base, colors: { ...base.colors }, typography: { ...base.typography }, contact: { ...base.contact }, legal: { ...base.legal } }
  for (const k of SCALAR_KEYS) {
    const v = scraped[k]
    if (typeof v === 'string' && v.trim()) (out as Record<string, unknown>)[k] = v
  }
  for (const [k, v] of Object.entries(scraped.colors)) if (typeof v === 'string' && v.trim()) (out.colors as Record<string, string>)[k] = v
  if (scraped.typography.headlineFont) out.typography.headlineFont = scraped.typography.headlineFont
  if (scraped.typography.bodyFont) out.typography.bodyFont = scraped.typography.bodyFont
  if (scraped.contact.callNumber) out.contact.callNumber = scraped.contact.callNumber
  if (scraped.legal.copyright) out.legal.copyright = scraped.legal.copyright
  if (scraped.legal.privacyUrl) out.legal.privacyUrl = scraped.legal.privacyUrl
  if (scraped.legal.termsUrl) out.legal.termsUrl = scraped.legal.termsUrl
  if (scraped.domains && scraped.domains.length) out.domains = scraped.domains
  return out
}

export async function aiGenerateBrand(args: {
  mode: 'ai' | 'github'
  urls?: string[]
  repoUrl?: string
}): Promise<{ ok: true; brand: AiBrand } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const source =
    args.mode === 'github'
      ? `GitHub repository: ${args.repoUrl ?? ''}`
      : `Brand URLs:\n${(args.urls ?? []).join('\n')}`

  try {
    // 1. Scrape everything real we can from the source.
    const scraped = await scrapeBrand(args)

    // 2. Ask the LLM to fill ONLY the gaps. The scraped JSON is injected as
    //    authoritative; the model must not change provided values, only author
    //    what is missing (and always write the TCPA + disclaimer).
    // Elide long data-URI logos from the prompt (the real value is re-applied
    // verbatim by applyScrapedWins; the LLM only needs to know one exists).
    const forPrompt = scraped ? stripConfidence(scraped) : null
    if (forPrompt?.logoUrl?.startsWith('data:')) forPrompt.logoUrl = '(inline SVG logo extracted — keep as provided)'
    if (forPrompt?.faviconUrl?.startsWith('data:')) forPrompt.faviconUrl = '(inline icon extracted — keep as provided)'
    const scrapedJson = forPrompt ? JSON.stringify(forPrompt, null, 2) : '(none — extraction failed; infer everything)'
    const brand = await invokeLLM({
      system: [
        'You design legal-vertical brand identity systems for an attorney lead-gen platform.',
        'You will be given an EXTRACTED partial brand identity scraped from the real source.',
        'RULES:',
        '1. Treat every provided (non-empty) field as AUTHORITATIVE — copy it verbatim into your output. NEVER change a provided color hex, font, name, logo URL, phone, or legal URL.',
        '2. Fill in ONLY the fields that are missing or empty, choosing values consistent with the provided ones.',
        '3. Always AUTHOR fresh legal.tcpaText and legal.defaultDisclaimer using the displayName — attorney-advertising safe, no guaranteed-result claims.',
        '4. All colors must be valid 6-digit hex. Do not use em dashes. US English.',
        '5. colors.background is a DARK backdrop; colors.textOnDark must be readable on it — never change a provided one.',
      ].join('\n'),
      user: `${source}\n\nEXTRACTED (authoritative — fill only the gaps):\n${scrapedJson}\n\nReturn one complete brand identity object.`,
      schema: AiBrandSchema,
      schemaName: 'brand_identity',
      model: 'claude-sonnet-4-6',
      enforceNoBannedVocab: true,
    })

    // 3. Defensively re-overlay scraped values (scraped > AI), in case the
    //    model ignored rule 1 for any field.
    const final = scraped ? applyScrapedWins(brand, scraped) : brand

    return { ok: true, brand: final }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'AI generation failed' }
  }
}

// Drop the internal _confidence metadata before showing the partial to the LLM.
function stripConfidence(m: MappedBrand): Omit<MappedBrand, '_confidence'> {
  const { _confidence: _omit, ...rest } = m
  void _omit
  return rest
}

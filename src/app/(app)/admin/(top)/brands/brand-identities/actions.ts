'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { invokeLLM } from '@/lib/ai/invoke'
import { extractBrandFromCss, type ExtractedBrand } from '@/lib/builder/extract-brand-tokens'
import { createSite } from '../../sites/actions'
import { seedStarterFunnelsForBrand } from '@/lib/funnel-samples'

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
    // brand_identity.background is the page background → Site surface.
    surface: isHex(colors.background) ? (colors.background as string).trim() : SITE_BRAND_DEFAULT.surface,
    // Keep a readable dark ink for body text on the light surface.
    ink: SITE_BRAND_DEFAULT.ink,
    muted: SITE_BRAND_DEFAULT.muted,
    font_heading: typeof typo.headlineFont === 'string' && typo.headlineFont.trim() ? typo.headlineFont.trim() : SITE_BRAND_DEFAULT.font_heading,
    font_body: typeof typo.bodyFont === 'string' && typo.bodyFont.trim() ? typo.bodyFont.trim() : SITE_BRAND_DEFAULT.font_body,
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
}): Promise<{ ok: true; siteId: number; slug: string; previewHost: string } | { ok: false; error: string }> {
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
  // Idempotent + never-throwing — if seeding fails we still return success
  // for the brand itself (it's already created) and surface a warning.
  const seeded = await seedStarterFunnelsForBrand(payload, Number(created.site.id))
  if (!seeded.ok) {
    // eslint-disable-next-line no-console
    console.warn('[brand-identities] starter funnels not seeded for new brand:', seeded.error)
  }

  // Funnel pages cache the LP / Quiz / Deployments lists at request time —
  // bust those caches so the new deployments show up immediately.
  revalidatePath('/admin/brands/brand-identities')
  revalidatePath('/admin/landing-pages')
  revalidatePath('/admin/quizzes')
  return { ok: true, siteId: created.site.id, slug: created.site.slug, previewHost: created.preview_host }
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
// AI brand generation (Create with AI / GitHub). Routed through invokeLLM so the
// banned-vocab + em-dash guards apply. The model infers name/tagline/legal copy;
// for URL mode the color + font tokens are then overridden with values read off
// the real site CSS (extractBrandColorsFromUrl) so the palette actually matches.
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

// Best-effort: fetch a page and a few of its stylesheets, then pull the real
// brand colors/fonts out of the CSS. Returns {} on any failure so the caller
// falls back to the model's inference. This grounds the palette in the actual
// site instead of letting the model guess (the #1 cause of "colors don't match").
const UA_BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

async function fetchTextSafe(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, { headers: { 'User-Agent': UA_BROWSER, Accept: '*/*' }, redirect: 'follow', signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

async function extractBrandColorsFromUrl(rawUrl: string): Promise<ExtractedBrand> {
  let url = (rawUrl || '').trim()
  if (!url) return {}
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  const html = await fetchTextSafe(url)
  if (!html) return {}

  let css = ''
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let m: RegExpExecArray | null
  while ((m = styleRe.exec(html)) !== null) css += '\n' + m[1]

  // Pull up to 3 linked stylesheets (where :root brand vars usually live).
  const linkRe = /<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi
  const hrefRe = /href=["']([^"']+)["']/i
  const hrefs: string[] = []
  let lm: RegExpExecArray | null
  while ((lm = linkRe.exec(html)) !== null && hrefs.length < 3) {
    const hm = hrefRe.exec(lm[0])
    if (hm) hrefs.push(hm[1])
  }
  for (const href of hrefs) {
    let cssUrl: string
    try {
      cssUrl = new URL(href, url).toString()
    } catch {
      continue
    }
    const sheet = await fetchTextSafe(cssUrl)
    if (sheet) css += '\n' + sheet
    if (css.length > 400_000) break
  }

  if (!css.trim()) return {}
  try {
    return extractBrandFromCss(css)
  } catch {
    return {}
  }
}

export async function aiGenerateBrand(args: {
  mode: 'ai' | 'github'
  urls?: string[]
  repoUrl?: string
}): Promise<{ ok: true; brand: z.infer<typeof AiBrandSchema> } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const source =
    args.mode === 'github'
      ? `GitHub repository: ${args.repoUrl ?? ''}`
      : `Brand URLs:\n${(args.urls ?? []).join('\n')}`

  try {
    const brand = await invokeLLM({
      system:
        'You design legal-vertical brand identity systems for an attorney lead-gen platform. From the given source, infer a complete brand identity: internal name, display name, tagline, color tokens (valid hex codes), typography, a call CTA, likely domains, and attorney-advertising-safe legal copy (copyright, TCPA consent, privacy/terms URLs, disclaimer). Colors must be valid hex. Do not use em dashes. US English. No guaranteed-result claims.',
      user: `${source}\n\nReturn one complete brand identity object.`,
      schema: AiBrandSchema,
      schemaName: 'brand_identity',
      model: 'claude-sonnet-4-6',
      enforceNoBannedVocab: true,
    })

    // Ground the palette in the real site CSS (URL mode only). The model infers
    // name/tagline/legal copy well, but invents colors — so override the color
    // and font tokens with what we actually read off the source site whenever
    // extraction succeeds.
    if (args.mode === 'ai' && args.urls?.[0]) {
      const real = await extractBrandColorsFromUrl(args.urls[0])
      if (real.primary) brand.colors.primary = real.primary
      if (real.accent) brand.colors.accent = real.accent
      if (real.surface) brand.colors.background = real.surface
      if (real.success) brand.colors.success = real.success
      if (real.warning) brand.colors.warning = real.warning
      if (real.danger) brand.colors.danger = real.danger
      if (real.fontHeading) brand.typography.headlineFont = real.fontHeading
      if (real.fontBody) brand.typography.bodyFont = real.fontBody
    }

    return { ok: true, brand }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'AI generation failed' }
  }
}

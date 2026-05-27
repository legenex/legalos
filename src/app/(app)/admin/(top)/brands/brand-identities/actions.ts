'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { invokeLLM } from '@/lib/ai/invoke'
import { createSite } from '../../sites/actions'

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
      // Mirror the brand name onto Site.name so the Sites list stays in sync;
      // everything else lives in the brand_identity JSON.
      data: { brand_identity: brand, ...(name ? { name } : {}), ...phoneFields(brand) } as never,
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
      data: { brand_identity: brand, ...phoneFields(brand) } as never,
      user: user as never,
      overrideAccess: false,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'attach brand failed' }
  }

  revalidatePath('/admin/brands/brand-identities')
  return { ok: true, siteId: created.site.id, slug: created.site.slug, previewHost: created.preview_host }
}

/** Delete the Site backing a brand. Super-admin only (enforced by Sites access). */
export async function deleteBrandSite(args: { siteId: number }): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    await payload.delete({ collection: 'sites', id: args.siteId, user: user as never, overrideAccess: false })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'delete failed (super-admin only)' }
  }
  revalidatePath('/admin/brands/brand-identities')
  return { ok: true }
}

// ----------------------------------------------------------------------------
// AI brand generation (Create with AI / GitHub). Routed through invokeLLM so the
// banned-vocab + em-dash guards apply. Note: web browsing is not wired yet, so
// the model infers a plausible identity; live URL/repo scraping comes in Phase 9.
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
    return { ok: true, brand }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'AI generation failed' }
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

// In production a "brand" is a Site. This action updates the brand-identity
// fields on a Site: the brand group (logos + colors + names), the legal group,
// and the typography group. Slug is intentionally not editable here, since
// changing it triggers redirect bookkeeping and belongs in the Site editor.
const BrandInput = z.object({
  siteId: z.number(),
  name: z.string().min(2, 'name must be at least 2 characters'),
  brand: z.object({
    display_name: z.string(),
    short_name: z.string(),
    tagline_brand: z.string(),
    logo_url: z.string(),
    logo_url_dark: z.string(),
    favicon_url: z.string(),
    primary: z.string(),
    accent: z.string(),
    surface: z.string(),
    ink: z.string(),
    muted: z.string(),
    success: z.string(),
    warning: z.string(),
    danger: z.string(),
  }),
  legal: z.object({
    copyright: z.string(),
    tcpa_text: z.string(),
    privacy_url: z.string(),
    terms_url: z.string(),
    default_disclaimer: z.string(),
  }),
  typography: z.object({
    headline_font: z.string(),
    body_font: z.string(),
    base_size: z.enum(['sm', 'md', 'lg']),
  }),
})

export async function updateSiteBrand(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const parsed = BrandInput.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(', ') }
  }
  const input = parsed.data
  const payload = await getPayload({ config })

  // Merge onto the existing brand group so legacy fields we don't surface in this
  // editor (e.g. font_heading / font_body) are preserved on save.
  const existing = (await payload.findByID({
    collection: 'sites',
    id: input.siteId,
    overrideAccess: true,
  })) as { brand?: Record<string, unknown> } | null
  if (!existing) return { ok: false, error: 'brand not found' }

  try {
    await payload.update({
      collection: 'sites',
      id: input.siteId,
      data: {
        name: input.name,
        brand: { ...(existing.brand ?? {}), ...input.brand },
        legal: input.legal,
        typography: input.typography,
      } as never,
      user: user as never,
      overrideAccess: false,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'update failed' }
  }

  revalidatePath('/admin/brands/brand-identities')
  return { ok: true }
}

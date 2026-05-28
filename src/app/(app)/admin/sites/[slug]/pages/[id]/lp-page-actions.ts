'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

// Persists an LP-shape landing-page state onto a Page row. The LP builder
// (LandingPageBuilder) drives a `{ name, slug, templateId, angle, isPublished,
// sections }` object; we mirror name -> title, isPublished -> status, and
// stash the full LP state inside the existing shared_template_overrides JSON
// column under `lp_state` (no migration needed). slug is normalized to a
// leading slash to match the public router's expectations.
type LPState = {
  name: string
  slug: string
  templateId: string
  angle: string
  isPublished: boolean
  sections: Array<Record<string, unknown>>
}

type SaveResult = { ok: true } | { ok: false; error: string }

export async function savePageLPState(args: {
  pageId: number | string
  siteSlug: string
  lp: LPState
}): Promise<SaveResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const lp = args.lp || ({} as LPState)
  const title = (lp.name || '').trim()
  let slug = (lp.slug || '').trim()
  if (!title) return { ok: false, error: 'Name is required' }
  if (!slug) return { ok: false, error: 'Slug is required' }
  if (slug !== '/' && !slug.startsWith('/')) slug = '/' + slug

  const payload = await getPayload({ config })
  try {
    const src = (await payload.findByID({
      collection: 'pages',
      id: args.pageId,
      overrideAccess: true,
    })) as Record<string, unknown>
    if (!src) return { ok: false, error: 'page not found' }
    const siteRel = src.site as { id?: number } | number | undefined
    const siteId =
      typeof siteRel === 'object' && siteRel ? Number(siteRel.id) : Number(siteRel)

    const dup = await payload.find({
      collection: 'pages',
      where: {
        and: [
          { site: { equals: siteId } },
          { slug: { equals: slug } },
          { id: { not_equals: args.pageId } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (dup.docs.length > 0) {
      return { ok: false, error: `Another page on this site already uses slug "${slug}".` }
    }

    const existingOverrides =
      (src.shared_template_overrides as Record<string, unknown> | null) || {}
    const mergedOverrides = {
      ...existingOverrides,
      lp_state: {
        templateId: lp.templateId || 'bold_modern',
        angle: lp.angle || 'pain',
        sections: Array.isArray(lp.sections) ? lp.sections : [],
      },
    }

    await payload.update({
      collection: 'pages',
      id: args.pageId,
      data: {
        title,
        slug,
        status: lp.isPublished ? 'published' : 'draft',
        template_key: 'custom',
        uses_shared_template: false,
        shared_template_overrides: mergedOverrides,
      } as never,
      user: user as never,
      overrideAccess: false,
    })
    revalidatePath(`/admin/sites/${args.siteSlug}/pages`)
    revalidatePath(`/admin/sites/${args.siteSlug}/pages/${args.pageId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'save failed' }
  }
}

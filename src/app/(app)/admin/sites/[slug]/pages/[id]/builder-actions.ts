'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

type Result = { ok: true } | { ok: false; error: string }

// Single-shot save from the LP-style PageBuilder. Receives the entire current
// state of a custom page (metadata + body_blocks + visual_template) and writes
// it in one update. The client builder debounces on its side so this is hit
// once per edit burst, not per keystroke.
export async function savePageFromBuilder(args: {
  pageId: number | string
  siteSlug: string
  title: string
  slug: string
  status: string
  template_key: string
  visual_template: string
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
  body_blocks: Array<Record<string, unknown>>
}): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const title = (args.title || '').trim()
  let slug = (args.slug || '').trim()
  if (!title) return { ok: false, error: 'Title is required' }
  if (!slug) return { ok: false, error: 'Slug is required' }
  if (slug !== '/' && !slug.startsWith('/')) slug = '/' + slug

  const payload = await getPayload({ config })
  try {
    const src = await payload.findByID({ collection: 'pages', id: args.pageId, overrideAccess: true })
    if (!src) return { ok: false, error: 'page not found' }
    const siteId = typeof src.site === 'object' ? src.site.id : src.site

    // Slug uniqueness inside the site (excluding the current page).
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
    if (dup.docs.length > 0) return { ok: false, error: `Another page on this site already uses slug "${slug}".` }

    // visual_template lives inside shared_template_overrides JSON to avoid a
    // schema migration. Merge it in so we don't clobber other keys.
    const existingOverrides =
      (src.shared_template_overrides as Record<string, unknown> | null) || {}
    const mergedOverrides = {
      ...existingOverrides,
      visual_template: args.visual_template || 'bold_modern',
    }
    await payload.update({
      collection: 'pages',
      id: args.pageId,
      data: {
        title,
        slug,
        status: args.status || 'draft',
        template_key: args.template_key || 'custom',
        // The builder is only used for custom pages, so uses_shared_template is
        // always off when saving through it.
        uses_shared_template: false,
        shared_template_overrides: mergedOverrides,
        meta_title: args.meta_title?.trim() || null,
        meta_description: args.meta_description?.trim() || null,
        og_image_url: args.og_image_url?.trim() || null,
        body_blocks: args.body_blocks ?? [],
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

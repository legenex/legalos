'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

type Result = { ok: true } | { ok: false; error: string }

const nextCopySlug = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  siteId: number | string,
  baseSlug: string,
): Promise<string> => {
  const root = baseSlug === '/' ? '/copy' : `${baseSlug.replace(/-copy(-\d+)?$/, '')}-copy`
  let candidate = root
  let n = 2
  while (true) {
    const existing = await payload.find({
      collection: 'pages',
      where: { and: [{ site: { equals: siteId } }, { slug: { equals: candidate } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length === 0) return candidate
    candidate = `${root}-${n++}`
  }
}

export async function duplicatePage(args: { pageId: number | string; siteSlug: string }): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    const src = await payload.findByID({ collection: 'pages', id: args.pageId, overrideAccess: true })
    if (!src) return { ok: false, error: 'page not found' }
    const siteId = typeof src.site === 'object' ? src.site.id : src.site
    const newSlug = await nextCopySlug(payload, siteId, src.slug)
    await payload.create({
      collection: 'pages',
      data: {
        site: siteId,
        title: `${src.title} (Copy)`,
        slug: newSlug,
        status: 'draft',
        template_key: src.template_key ?? 'custom',
        uses_shared_template: src.uses_shared_template ?? false,
        shared_template_overrides: src.shared_template_overrides ?? undefined,
        body_blocks: src.body_blocks ?? undefined,
        meta_title: src.meta_title ?? undefined,
        meta_description: src.meta_description ?? undefined,
        og_image_url: src.og_image_url ?? undefined,
        schema_json: src.schema_json ?? undefined,
      } as never,
      user: user as never,
      overrideAccess: false,
    })
    revalidatePath(`/admin/sites/${args.siteSlug}/pages`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'duplicate failed' }
  }
}

export async function deletePage(args: { pageId: number | string; siteSlug: string }): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    const src = await payload.findByID({ collection: 'pages', id: args.pageId, overrideAccess: true })
    if (!src) return { ok: false, error: 'page not found' }
    if (src.slug === '/') return { ok: false, error: 'cannot delete the home page' }
    await payload.delete({
      collection: 'pages',
      id: args.pageId,
      user: user as never,
      overrideAccess: false,
    })
    revalidatePath(`/admin/sites/${args.siteSlug}/pages`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'delete failed' }
  }
}

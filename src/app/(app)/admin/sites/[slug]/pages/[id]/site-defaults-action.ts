'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

// Persist a single body_blocks block onto the Site as the global nav or
// global footer. The caller (page builder) hands us the block JSON exactly
// as it sits in the Page's body_blocks; we strip the `id` so the global
// copy can be safely re-used across pages without colliding with any one
// page's hidden_blocks list, and store the rest as a JSON blob on
// sites.site_nav or sites.site_footer. The public route auto-prepends /
// appends the global when a page's own body_blocks doesn't include the
// matching blockType, so authors only configure the chrome once.

type Result = { ok: true } | { ok: false; error: string }

export async function saveAsSiteDefault(args: {
  siteSlug: string
  siteId: number | string
  kind: 'nav' | 'footer'
  block: Record<string, unknown> & { blockType?: string }
}): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const expected = args.kind === 'nav' ? 'nav_header' : 'site_footer'
  if (args.block?.blockType !== expected) {
    return {
      ok: false,
      error: `This action requires a ${expected} block; got "${args.block?.blockType}".`,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...rest } = args.block as Record<string, unknown> & { id?: string }
  const value = { ...rest, blockType: expected }

  const payload = await getPayload({ config })
  try {
    // Stored inside the existing brand_identity JSON column to avoid a
    // schema migration that broke prod. Read-modify-write so the rest of
    // brand_identity (logo/colors/etc.) stays intact.
    const src = (await payload.findByID({
      collection: 'sites',
      id: args.siteId,
      overrideAccess: true,
    })) as { brand_identity?: Record<string, unknown> | null }
    const currentBI = (src.brand_identity && typeof src.brand_identity === 'object'
      ? src.brand_identity
      : {}) as Record<string, unknown>
    const nextBI = {
      ...currentBI,
      ...(args.kind === 'nav' ? { site_nav: value } : { site_footer: value }),
    }

    await payload.update({
      collection: 'sites',
      id: args.siteId,
      data: { brand_identity: nextBI } as never,
      user: user as never,
      overrideAccess: false,
    })
    revalidatePath(`/admin/sites/${args.siteSlug}/pages`)
    revalidatePath(`/admin/sites/${args.siteSlug}/settings/general`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'save failed' }
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

type Result =
  | { ok: true; id: string | number; url: string; filename: string; alt: string }
  | { ok: false; error: string }

// Upload a single image to the Media collection, stamped with the current
// site. Returns the public URL so the caller can drop it into a body_blocks
// field. The file payload is a base64 data URL because <input type=file>
// can't survive a server-action JSON serialization round-trip otherwise.
export async function uploadMediaFromDataURL(args: {
  siteSlug: string
  siteId: number | string
  dataUrl: string
  filename: string
  alt?: string
}): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const m = /^data:([^;]+);base64,(.+)$/.exec(args.dataUrl || '')
  if (!m) return { ok: false, error: 'Invalid data URL — expected a base64 image.' }
  const mimeType = m[1]
  if (!mimeType.startsWith('image/')) return { ok: false, error: 'Only image uploads are supported right now.' }

  const buf = Buffer.from(m[2], 'base64')
  if (buf.byteLength > 10 * 1024 * 1024) {
    return { ok: false, error: 'Image is larger than 10 MB. Compress it before uploading.' }
  }

  const safeFilename = (args.filename || 'upload.png')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

  const payload = await getPayload({ config })
  try {
    const created = (await payload.create({
      collection: 'media',
      data: {
        site: args.siteId as never,
        alt: (args.alt || '').trim() || safeFilename,
      } as never,
      file: {
        data: buf,
        mimetype: mimeType,
        name: safeFilename,
        size: buf.byteLength,
      } as never,
      user: user as never,
      overrideAccess: false,
    })) as { id: string | number; url?: string; filename?: string; alt?: string }

    revalidatePath(`/admin/sites/${args.siteSlug}/pages`)
    return {
      ok: true,
      id: created.id,
      url: created.url || '',
      filename: created.filename || safeFilename,
      alt: created.alt || safeFilename,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'upload failed' }
  }
}

// Return the most recent images for a given Site so the picker can show
// previously uploaded files. Capped at 60 to keep the modal snappy.
export async function listSiteMedia(args: {
  siteId: number | string
}): Promise<
  | { ok: true; items: Array<{ id: string | number; url: string; filename: string; alt: string }> }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const payload = await getPayload({ config })
  try {
    const res = await payload.find({
      collection: 'media',
      where: { site: { equals: args.siteId } },
      limit: 60,
      sort: '-createdAt',
      overrideAccess: true,
    })
    const items = res.docs.map((r) => ({
      id: r.id as string | number,
      url: ((r as { url?: string }).url ?? '') as string,
      filename: ((r as { filename?: string }).filename ?? '') as string,
      alt: ((r as { alt?: string }).alt ?? '') as string,
    }))
    return { ok: true, items }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'list failed' }
  }
}

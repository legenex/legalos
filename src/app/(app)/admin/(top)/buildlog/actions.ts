'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

const PATH = '/admin/buildlog'

/**
 * Comments on the build log.
 *
 * Every action re-checks the session. A server action does not inherit Payload's
 * access control, so an unauthenticated call would otherwise write happily.
 *
 * The author is taken from the session and never from the client. The email is
 * copied in at write time as well as related, so a comment stays attributable
 * after the user row is gone.
 */

const MAX_BODY = 4000

export async function addBuildLogComment(args: {
  entryId: string
  itemId?: string
  targetLabel?: string
  body: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'You are signed out. Sign in and try again.' }

  const body = (args.body ?? '').trim()
  if (!body) return { ok: false, error: 'Write something first.' }
  if (body.length > MAX_BODY) return { ok: false, error: `Keep it under ${MAX_BODY} characters.` }
  if (!args.entryId) return { ok: false, error: 'Missing the entry this comment belongs to.' }

  const payload = await getPayload({ config })
  try {
    const created = await payload.create({
      collection: 'buildlog-comments',
      data: {
        entry_id: args.entryId,
        item_id: args.itemId || null,
        target_label: args.targetLabel || null,
        body,
        status: 'open',
        author: Number(user.id),
        author_email: user.email ?? null,
      },
      user,
      overrideAccess: false,
    })
    revalidatePath(PATH)
    return { ok: true, id: String(created.id) }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not save the comment.' }
  }
}

export async function setBuildLogCommentStatus(args: {
  id: string
  status: 'open' | 'resolved'
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'You are signed out. Sign in and try again.' }
  if (args.status !== 'open' && args.status !== 'resolved') {
    return { ok: false, error: 'Unknown status.' }
  }

  const payload = await getPayload({ config })
  try {
    await payload.update({
      collection: 'buildlog-comments',
      id: args.id,
      data: { status: args.status },
      user,
      overrideAccess: false,
    })
    revalidatePath(PATH)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not update the comment.' }
  }
}

/**
 * Delete a comment.
 *
 * Only the author or a super admin. Resolving is the normal way to close a
 * thread; deleting removes the record of the exchange, so it is deliberately
 * not something one person can do to another person's note.
 */
export async function deleteBuildLogComment(args: {
  id: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'You are signed out. Sign in and try again.' }

  const payload = await getPayload({ config })
  try {
    const existing = (await payload.findByID({
      collection: 'buildlog-comments',
      id: args.id,
      depth: 0,
      overrideAccess: true,
    })) as unknown as { author?: unknown } | null
    if (!existing) return { ok: false, error: 'That comment is already gone.' }

    const authorId =
      existing.author == null
        ? null
        : typeof existing.author === 'object'
          ? String((existing.author as { id: unknown }).id)
          : String(existing.author)

    const isOwn = authorId != null && String(user.id) === authorId
    if (!isOwn && !user.super_admin) {
      return { ok: false, error: 'You can only delete your own comments. Resolve it instead.' }
    }

    await payload.delete({ collection: 'buildlog-comments', id: args.id, user, overrideAccess: false })
    revalidatePath(PATH)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not delete the comment.' }
  }
}

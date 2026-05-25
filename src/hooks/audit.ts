import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

type DiffEntry = { field: string; before: unknown; after: unknown }

const shallowDiff = (before: Record<string, unknown> | undefined, after: Record<string, unknown>): DiffEntry[] => {
  if (!before) return []
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  const out: DiffEntry[] = []
  for (const key of keys) {
    if (key === 'updatedAt' || key === 'createdAt') continue
    const a = before[key]
    const b = after[key]
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.push({ field: key, before: a, after: b })
    }
  }
  return out
}

export const auditAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, collection }) => {
  if (!req?.user) return doc
  try {
    await req.payload.create({
      collection: 'audit-log',
      data: {
        user: typeof req.user.id === 'string' ? req.user.id : Number(req.user.id),
        action: operation,
        entity_type: collection.slug,
        entity_id: String(doc.id),
        site: ((doc as Record<string, unknown>).site as number | null | undefined) ?? null,
        diff: shallowDiff(previousDoc as Record<string, unknown> | undefined, doc as Record<string, unknown>),
      },
      req,
    })
  } catch (err) {
    req.payload.logger.error({ msg: 'audit log write failed', err })
  }
  return doc
}

export const auditAfterDelete: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
  if (!req?.user) return
  try {
    await req.payload.create({
      collection: 'audit-log',
      data: {
        user: typeof req.user.id === 'string' ? req.user.id : Number(req.user.id),
        action: 'delete',
        entity_type: collection.slug,
        entity_id: String(doc.id),
        site: ((doc as Record<string, unknown>).site as number | null | undefined) ?? null,
        diff: [{ field: '__deleted__', before: doc, after: null }],
      },
      req,
    })
  } catch (err) {
    req.payload.logger.error({ msg: 'audit log delete-write failed', err })
  }
}

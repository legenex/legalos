import { getPayload } from 'payload'
import config from '@payload-config'

export type ResolvedPhone = {
  display: string
  tel: string
  number_id: string | number | null
}

const matchesPath = (path: string, candidate: string): boolean => {
  if (candidate === path) return true
  if (candidate.endsWith('/*')) {
    const prefix = candidate.slice(0, -2)
    return path === prefix || path.startsWith(`${prefix}/`)
  }
  return false
}

/**
 * Resolve which phone to display for a given path on a given Site.
 *
 * Order of precedence:
 *  1. Numbers whose page_paths[] matches the path (most specific wins).
 *  2. The Site's fallback Number (single row with fallback=true).
 *  3. The Site.default_phone / default_phone_tel.
 */
export const resolvePhoneForPath = async (
  path: string,
  siteId: string | number,
): Promise<ResolvedPhone> => {
  const payload = await getPayload({ config })
  const numbers = await payload.find({
    collection: 'numbers',
    where: { site: { equals: siteId } },
    limit: 200,
    overrideAccess: true,
  })

  const candidates = numbers.docs
    .map((n) => {
      const paths = (n.page_paths ?? []) as Array<{ path: string }>
      const match = paths
        .map((p) => p.path)
        .filter((p) => matchesPath(path, p))
        .sort((a, b) => b.length - a.length)[0]
      return match ? { number: n, match } : null
    })
    .filter((c): c is { number: typeof numbers.docs[number]; match: string } => c !== null)
    .sort((a, b) => b.match.length - a.match.length)

  if (candidates[0]) {
    const n = candidates[0].number
    return { display: n.display, tel: n.tel, number_id: n.id }
  }

  const fallback = numbers.docs.find((n) => n.fallback)
  if (fallback) return { display: fallback.display, tel: fallback.tel, number_id: fallback.id }

  const site = await payload.findByID({ collection: 'sites', id: siteId, overrideAccess: true })
  return {
    display: site.default_phone ?? '',
    tel: site.default_phone_tel ?? '',
    number_id: null,
  }
}

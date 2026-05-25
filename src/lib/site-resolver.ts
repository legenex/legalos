import { getPayload } from 'payload'
import config from '@payload-config'

type CacheEntry = { siteId: string | number; primaryHost: string | null; redirectTo: string | null; expiresAt: number }
const HOST_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 1000

const normalizeHost = (host: string | null | undefined): string =>
  (host ?? '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/:\d+$/, '').replace(/\/$/, '')

export type ResolvedSite = {
  siteId: string | number
  primaryHost: string | null
  redirectTo: string | null
}

export const invalidateHostCache = (host?: string): void => {
  if (host) HOST_CACHE.delete(normalizeHost(host))
  else HOST_CACHE.clear()
}

export const resolveSiteByHost = async (rawHost: string | null | undefined): Promise<ResolvedSite | null> => {
  const host = normalizeHost(rawHost)
  if (!host) return null
  const now = Date.now()
  const cached = HOST_CACHE.get(host)
  if (cached && cached.expiresAt > now) {
    return { siteId: cached.siteId, primaryHost: cached.primaryHost, redirectTo: cached.redirectTo }
  }

  const payload = await getPayload({ config })

  // 1. Direct host match on Domain.
  const direct = await payload.find({
    collection: 'domains',
    where: { host: { equals: host } },
    limit: 1,
    overrideAccess: true,
  })

  if (direct.docs.length > 0) {
    const domain = direct.docs[0]
    // Unassigned domain in the pool: do not resolve (treat as 404).
    if (!domain.site) return null
    const siteId = typeof domain.site === 'object' ? domain.site.id : domain.site
    // Look up the primary host for this site (for canonical redirect / link emission).
    const primaryRow = await payload.find({
      collection: 'domains',
      where: { and: [{ site: { equals: siteId } }, { primary: { equals: true } }] },
      limit: 1,
      overrideAccess: true,
    })
    const primaryHost = primaryRow.docs[0]?.host ?? null
    const redirectTo = !domain.primary && primaryHost && primaryHost !== host ? primaryHost : null
    const entry: CacheEntry = { siteId, primaryHost, redirectTo, expiresAt: now + CACHE_TTL_MS }
    HOST_CACHE.set(host, entry)
    return entry
  }

  // 2. Check if any Domain lists this host in `redirects_from[]`.
  const redirectRow = await payload.find({
    collection: 'domains',
    where: { 'redirects_from.host': { equals: host } },
    limit: 1,
    overrideAccess: true,
  })

  if (redirectRow.docs.length > 0) {
    const target = redirectRow.docs[0]
    if (!target.site) return null
    const siteId = typeof target.site === 'object' ? target.site.id : target.site
    const entry: CacheEntry = { siteId, primaryHost: target.host, redirectTo: target.host, expiresAt: now + CACHE_TTL_MS }
    HOST_CACHE.set(host, entry)
    return entry
  }

  return null
}

export const isFallbackHost = (host: string | null | undefined): boolean => {
  const normalized = normalizeHost(host)
  const fallback = normalizeHost(process.env.LEGALOS_FALLBACK_HOST)
  return Boolean(fallback) && normalized === fallback
}

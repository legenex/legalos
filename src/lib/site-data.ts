import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

// React.cache() memoizes per-request so layouts + pages + components that all
// need the same site/domain dedupe to a single DB query during one render.
export const getSiteBySlug = cache(async (slug: string) => {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'sites',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  return res.docs[0] ?? null
})

export const getPrimaryDomain = cache(async (siteId: string | number) => {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'domains',
    where: { and: [{ site: { equals: siteId } }, { primary: { equals: true } }] },
    limit: 1,
    overrideAccess: true,
  })
  return res.docs[0] ?? null
})

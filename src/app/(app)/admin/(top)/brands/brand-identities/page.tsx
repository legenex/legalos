import { getPayload } from 'payload'
import config from '@payload-config'
import { BrandIdentitiesApp } from '@/components/builder/brand/BrandModule'
import { buildBrandsFromSites } from '@/lib/brand-map'

export const dynamic = 'force-dynamic'

export default async function BrandIdentitiesPage() {
  const payload = await getPayload({ config })
  const [sitesRes, domainsRes] = await Promise.all([
    payload.find({ collection: 'sites', limit: 500, sort: 'name', overrideAccess: true }),
    payload.find({ collection: 'domains', limit: 1000, sort: ['-primary'], overrideAccess: true }),
  ])

  const brands = buildBrandsFromSites(
    sitesRes.docs as unknown as Array<Record<string, unknown>>,
    domainsRes.docs as unknown as Array<Record<string, unknown>>,
  )

  return <BrandIdentitiesApp initialBrands={brands} />
}

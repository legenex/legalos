import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SiteSidebar } from '@/components/app/SiteSidebar'
import { SiteContextProvider } from './SiteContext'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'sites',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  const site = res.docs[0]
  if (!site) notFound()

  const primaryDomain = await payload.find({
    collection: 'domains',
    where: { and: [{ site: { equals: site.id } }, { primary: { equals: true } }] },
    limit: 1,
    overrideAccess: true,
  })
  const primaryHost = primaryDomain.docs[0]?.host ?? null
  const primaryStatus = primaryDomain.docs[0]?.status ?? null
  const livePreviewUrl = primaryHost ? `https://${primaryHost}` : `/?site=${site.slug}`
  const user = await getCurrentUser()

  return (
    <>
      <SiteSidebar
        site={{ slug: site.slug, name: site.name, brand: site.brand ?? undefined }}
        livePreviewUrl={livePreviewUrl}
        userEmail={user?.email ?? ''}
      />
      <main className="flex-1 min-w-0 bg-[var(--color-canvas)]">
        <SiteContextProvider
          value={{
            id: Number(site.id),
            slug: site.slug,
            name: site.name,
            primaryHost,
            primaryStatus,
            livePreviewUrl,
          }}
        >
          {children}
        </SiteContextProvider>
      </main>
    </>
  )
}

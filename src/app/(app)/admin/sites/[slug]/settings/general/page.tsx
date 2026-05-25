import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { GeneralForm } from './GeneralForm'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export default async function GeneralSettingsPage({ params }: Props) {
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

  return (
    <div className="p-10 max-w-[1100px]">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-white">General Settings</h1>
        <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">Configure {site.name}</p>
      </header>
      <GeneralForm
        site={{
          id: Number(site.id),
          name: site.name,
          slug: site.slug,
          tagline: site.tagline,
          vertical: site.vertical,
          org_name: site.org_name,
          org_address: site.org_address,
          support_email: site.support_email,
          default_phone: site.default_phone,
          default_phone_tel: site.default_phone_tel,
          default_disclaimer_md: site.default_disclaimer_md,
          brand: site.brand,
        }}
      />
    </div>
  )
}

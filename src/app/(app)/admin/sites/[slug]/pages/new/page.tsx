import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ChevronLeft } from 'lucide-react'
import { CreatePageForm } from './CreatePageForm'
import { TEMPLATE_KEYS } from '@/collections/SharedLegalTemplates'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export default async function NewSitePage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const siteRes = await payload.find({
    collection: 'sites',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  const site = siteRes.docs[0]
  if (!site) notFound()

  const templateOptions = [
    { label: 'Custom', value: 'custom' },
    ...TEMPLATE_KEYS.map((k) => ({ label: `Shared: ${k}`, value: k })),
  ]

  return (
    <div className="p-10 max-w-[820px]">
      <Link
        href={`/admin/sites/${slug}/pages`}
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Pages
      </Link>

      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-white">New Page</h1>
        <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">
          Creating a page on <span className="text-[var(--color-ink)]">{site.name}</span>
        </p>
      </header>

      <CreatePageForm
        siteId={site.id as number}
        siteSlug={slug}
        templateOptions={templateOptions}
      />
    </div>
  )
}

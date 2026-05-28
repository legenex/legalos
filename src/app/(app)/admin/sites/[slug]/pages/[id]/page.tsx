// @ts-nocheck
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ChevronLeft } from 'lucide-react'
import { EditPageForm } from './EditPageForm'
import { PageBlocksBuilderApp } from '@/components/builder/page-builder/PageBlocksBuilderApp'
import { TEMPLATE_KEYS } from '@/collections/SharedLegalTemplates'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string; id: string }> }

export default async function EditPageRoute({ params }: Props) {
  const { slug, id } = await params
  const payload = await getPayload({ config })

  const siteRes = await payload.find({
    collection: 'sites',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  const site = siteRes.docs[0]
  if (!site) notFound()

  let page
  try {
    page = await payload.findByID({ collection: 'pages', id, overrideAccess: true })
  } catch {
    notFound()
  }
  if (!page) notFound()
  const pageSiteId = typeof page.site === 'object' ? page.site.id : page.site
  if (Number(pageSiteId) !== Number(site.id)) notFound()

  const dom = await payload.find({
    collection: 'domains',
    where: { and: [{ site: { equals: site.id } }, { primary: { equals: true } }] },
    limit: 1,
    overrideAccess: true,
  })
  const primaryHost = (dom.docs[0]?.host as string | undefined) || `${slug}.preview.legenex.com`

  // Any page that is NOT rendering a shared legal template gets the body_blocks
  // builder. The user edits body_blocks directly; the public BlockRenderer
  // renders the exact same JSX from the exact same row, so backend and frontend
  // share one source of truth.
  const usesBuilder = !page.uses_shared_template

  if (usesBuilder) {
    return (
      <PageBlocksBuilderApp
        pageId={page.id as number}
        siteSlug={slug}
        primaryHost={primaryHost}
        initial={{
          title: (page.title as string) || '',
          slug: (page.slug as string) || '/',
          status: (page.status as string) || 'draft',
          meta_title: (page.meta_title as string | null) || '',
          meta_description: (page.meta_description as string | null) || '',
          og_image_url: (page.og_image_url as string | null) || '',
          body_blocks: Array.isArray(page.body_blocks)
            ? (page.body_blocks as Array<Record<string, unknown>>)
            : [],
        }}
      />
    )
  }

  const templateOptions = [
    { label: 'Custom (author your own blocks)', value: 'custom' },
    ...TEMPLATE_KEYS.map((k) => ({ label: `Shared: ${k}`, value: k })),
  ]
  const blockCount = Array.isArray(page.body_blocks) ? (page.body_blocks as unknown[]).length : 0

  return (
    <div className="px-10 py-8 max-w-[820px]">
      <Link
        href={`/admin/sites/${slug}/pages`}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-ink-muted)] hover:text-white transition-colors mb-5"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Back to Pages
      </Link>

      <header className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-tight text-white">{(page.title as string) || 'Untitled'}</h1>
        <p className="text-[var(--color-ink-muted)] text-[14px] mt-1">
          Editing page on <span className="text-white font-medium">{site.name as string}</span>
        </p>
      </header>

      <EditPageForm
        pageId={page.id as number}
        siteSlug={slug}
        primaryHost={primaryHost}
        templateOptions={templateOptions}
        initial={{
          title: (page.title as string) || '',
          slug: (page.slug as string) || '',
          status: (page.status as string) || 'draft',
          template_key: (page.template_key as string) || 'custom',
          uses_shared_template: Boolean(page.uses_shared_template),
          meta_title: (page.meta_title as string | null) || '',
          meta_description: (page.meta_description as string | null) || '',
          og_image_url: (page.og_image_url as string | null) || '',
          blockCount,
        }}
      />
    </div>
  )
}

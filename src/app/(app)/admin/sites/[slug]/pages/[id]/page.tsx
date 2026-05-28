// @ts-nocheck
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PageBlocksBuilderApp } from '@/components/builder/page-builder/PageBlocksBuilderApp'

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

  // Every Page edit opens in the body_blocks builder, including pages that
  // currently render via a shared legal template. If body_blocks is empty
  // (the page has only ever rendered the shared template), the builder
  // hydrates with the rendered template markdown as a single `prose` block
  // so the user sees the current content and can edit it. The save action
  // forces uses_shared_template=false so edits in the builder actually
  // drive the public render.
  const existingBlocks = Array.isArray(page.body_blocks)
    ? (page.body_blocks as Array<Record<string, unknown>>)
    : []

  let seedBlocks = existingBlocks
  if (seedBlocks.length === 0 && page.uses_shared_template && page.template_key && page.template_key !== 'custom') {
    try {
      const tpl = await payload.find({
        collection: 'shared-legal-templates',
        where: { template_key: { equals: page.template_key } },
        limit: 1,
        overrideAccess: true,
      })
      const t = tpl.docs[0] as { body_markdown_with_vars?: string } | undefined
      if (t?.body_markdown_with_vars) {
        seedBlocks = [
          {
            blockType: 'prose',
            markdown: t.body_markdown_with_vars,
          },
        ]
      }
    } catch {
      // Shared template lookup is best-effort: failure just leaves the
      // canvas empty so the user can author from scratch.
    }
  }

  return (
    <PageBlocksBuilderApp
      pageId={page.id as number}
      siteSlug={slug}
      siteId={site.id as number}
      primaryHost={primaryHost}
      initial={{
        title: (page.title as string) || '',
        slug: (page.slug as string) || '/',
        status: (page.status as string) || 'draft',
        meta_title: (page.meta_title as string | null) || '',
        meta_description: (page.meta_description as string | null) || '',
        og_image_url: (page.og_image_url as string | null) || '',
        body_blocks: seedBlocks,
        hidden_blocks: Array.isArray(page.hidden_blocks)
          ? (page.hidden_blocks as string[])
          : [],
        block_meta:
          page.block_meta && typeof page.block_meta === 'object'
            ? (page.block_meta as Record<string, { hide_mobile?: boolean; hide_desktop?: boolean }>)
            : {},
        publish_at: (page.publish_at as string | null) || '',
        schema_json: page.schema_json
          ? typeof page.schema_json === 'string'
            ? (page.schema_json as string)
            : JSON.stringify(page.schema_json, null, 2)
          : '',
      }}
    />
  )
}

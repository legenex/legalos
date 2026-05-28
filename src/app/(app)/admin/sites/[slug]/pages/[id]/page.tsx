// @ts-nocheck -- LP builder + brand-map shapes are loosely typed; payload-types
// regen on the server restores strictness for the rest of this file.
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ChevronLeft } from 'lucide-react'
import { EditPageForm } from './EditPageForm'
import { PageLPBuilderApp } from '@/components/builder/page-builder/PageLPBuilderApp'
import { TEMPLATE_KEYS } from '@/collections/SharedLegalTemplates'
import { buildBrandsFromSites } from '@/lib/brand-map'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string; id: string }> }

const relId = (v) => (v == null ? '' : typeof v === 'object' ? String(v.id) : String(v))

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

  // Any page that is NOT rendering a shared legal template gets the LP-style
  // builder. template_key acts as a starter-template slot (custom/home/privacy
  // /etc.) but the editing UX is unified across them, per direct user request:
  // "the landing pages and site pages backend builder must be the same".
  const usesBuilder = !page.uses_shared_template

  if (usesBuilder) {
    // Custom pages use the SAME backend builder as Landing Pages. The LP-shape
    // state lives inside shared_template_overrides.lp_state (no migration); the
    // server action mirrors name/slug/status back onto the row so the public
    // router keeps working.
    const overrides = (page.shared_template_overrides as Record<string, unknown> | null) || {}
    const lpState = (overrides.lp_state as Record<string, unknown> | null) || {}

    // Builder needs the full Brand catalog + Quizzes/QuizDeployments for the
    // "Preview as" picker, mirroring how /admin/landing-pages loads them.
    const [allSitesRes, allDomainsRes, quizzesRes, quizDepsRes] = await Promise.all([
      payload.find({ collection: 'sites', limit: 500, sort: 'name', overrideAccess: true }),
      payload.find({ collection: 'domains', limit: 1000, sort: ['-primary'], overrideAccess: true }),
      payload.find({ collection: 'funnel-quizzes', limit: 500, overrideAccess: true }).catch(() => ({ docs: [] })),
      payload.find({ collection: 'funnel-quiz-deployments', limit: 1000, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] })),
    ])

    const brands = buildBrandsFromSites(
      allSitesRes.docs as unknown as Array<Record<string, unknown>>,
      allDomainsRes.docs as unknown as Array<Record<string, unknown>>,
    )

    const domainHostById = new Map<string, string>()
    for (const d of allDomainsRes.docs) domainHostById.set(String(d.id), String((d as { host?: string }).host ?? ''))

    const quizzes = quizzesRes.docs.map((r) => ({ id: String(r.id), name: (r as { name?: string }).name || 'Quiz' }))
    const quizDeployments = quizDepsRes.docs.map((r) => {
      const siteId = relId((r as { site?: unknown }).site)
      const domId = relId((r as { domain?: unknown }).domain)
      return {
        id: String(r.id),
        quizId: relId((r as { quiz?: unknown }).quiz),
        brandId: siteId ? `site_${siteId}` : '',
        domain: domId ? domainHostById.get(domId) ?? '' : '',
        path: (r as { path?: string }).path ?? '',
      }
    })

    const initial = {
      id: String(page.id),
      name: (page.title as string) || 'Untitled',
      slug: (page.slug as string) || '/',
      templateId: (lpState.templateId as string) || 'bold_modern',
      angle: (lpState.angle as string) || 'pain',
      isPublished: (page.status as string) === 'published',
      sections: Array.isArray(lpState.sections) ? (lpState.sections as Array<Record<string, unknown>>) : [],
    }

    return (
      <PageLPBuilderApp
        pageId={page.id as number}
        siteSlug={slug}
        primaryHost={primaryHost}
        brands={brands}
        quizzes={quizzes}
        quizDeployments={quizDeployments}
        initial={initial}
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

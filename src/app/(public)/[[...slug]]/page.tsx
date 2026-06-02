import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveSiteByHost, isFallbackHost } from '@/lib/site-resolver'
import { renderTemplateVars, applyTemplateOverrides, deepRenderTemplateVars, type SiteForTemplate } from '@/lib/template-vars'
import { resolvePhoneForPath } from '@/lib/resolve-phone'
import { getCurrentUser } from '@/lib/auth'
import LegalOSMarketing from '@/components/LegalOSMarketing'
import { BlockRenderer, type Block, type SiteForRender } from '@/components/blocks/BlockRenderer'
import { SiteScripts, type TrackingConfigShape } from '@/components/public/SiteScripts'
import CmcAdvertisingDisclosure from '@/components/public/check-my-claim/AdvertisingDisclosure'
import CmcPrivacyPolicy from '@/components/public/check-my-claim/PrivacyPolicy'
import CmcTermsOfService from '@/components/public/check-my-claim/TermsOfService'
import CmcSubmitted from '@/components/public/check-my-claim/Submitted'
import CmcThanks from '@/components/public/check-my-claim/Thanks'
import CmcSorry from '@/components/public/check-my-claim/Sorry'
import CmcPartnerList from '@/components/public/check-my-claim/PartnerList'
import CmcSb37List from '@/components/public/check-my-claim/Sb37List'

// Map of normalized path → custom component for the check-my-claim brand.
// Path comparison is case-insensitive (live site accepts /PartnerList and /partnerlist).
//
// '/' is INTENTIONALLY omitted so the Home page falls through to the Pages
// collection and its body_blocks render via BlockRenderer. This is what makes
// the /admin Pages editor and the public Home page share a single source of
// truth — what you save in /admin renders for visitors. The bespoke
// CheckMyClaimHome component is kept in the codebase as the historical
// reference for the design but no longer wired to a route.
const CMC_PAGES: Record<string, () => ReactNode> = {
  '/partnerlist': CmcPartnerList,
  '/partners': CmcPartnerList,
  '/submitted': CmcSubmitted,
  '/thanks': CmcThanks,
  '/sorry': CmcSorry,
  '/sb-37-list': CmcSb37List,
  '/privacypolicy': CmcPrivacyPolicy,
  '/privacy-policy': CmcPrivacyPolicy,
  '/privacy': CmcPrivacyPolicy,
  '/termsofservice': CmcTermsOfService,
  '/terms-of-service': CmcTermsOfService,
  '/terms': CmcTermsOfService,
  '/advertisingdisclosure': CmcAdvertisingDisclosure,
  '/disclosures': CmcAdvertisingDisclosure,
}

const hasLeadFormBlock = (blocks: unknown[] | null | undefined): boolean => {
  if (!Array.isArray(blocks)) return false
  return blocks.some((b) => typeof b === 'object' && b !== null && (b as { blockType?: string }).blockType === 'lead_form')
}

const loadTrackingConfig = async (siteId: string | number): Promise<TrackingConfigShape | null> => {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'tracking-configs',
    where: { site: { equals: siteId } },
    limit: 1,
    overrideAccess: true,
  })
  const tc = res.docs[0]
  if (!tc) return null
  return {
    meta_pixel: tc.meta_pixel,
    google_ads: tc.google_ads as TrackingConfigShape['google_ads'],
    ga4: tc.ga4,
    tiktok: tc.tiktok,
    gtm: tc.gtm,
    trustedform: tc.trustedform,
    jornaya: tc.jornaya,
  }
}

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug?: string[] }> }

const normalizePath = (segments: string[] | undefined): string => {
  if (!segments || segments.length === 0) return '/'
  return `/${segments.join('/')}`
}

const isSharedTemplatePath = (path: string): boolean => {
  const map: Record<string, string> = {
    '/': 'home',
    '/privacy': 'privacy',
    '/privacy-policy': 'privacy-policy',
    '/terms-of-service': 'terms',
    '/terms': 'terms',
    '/partners': 'partners',
    '/submitted': 'submitted',
    '/thanks': 'thanks-dq',
    '/tcpa': 'tcpa',
    '/disclosures': 'disclosures',
  }
  return path in map
}

const sharedTemplateKeyForPath = (path: string): string | null => {
  const map: Record<string, string> = {
    '/privacy': 'privacy',
    '/privacy-policy': 'privacy-policy',
    '/terms-of-service': 'terms',
    '/terms': 'terms',
    '/partners': 'partners',
    '/submitted': 'submitted',
    '/thanks': 'thanks-dq',
    '/tcpa': 'tcpa',
    '/disclosures': 'disclosures',
  }
  return map[path] ?? null
}

export default async function PublicCatchAll({ params }: Props) {
  const { slug } = await params
  const path = normalizePath(slug)
  const h = await headers()
  const rawPreviewSiteSlug = h.get('x-legalos-preview-site')
  const previewMode = h.get('x-legalos-preview') === '1'
  const host = h.get('x-legalos-host') ?? h.get('host')

  // Both preview channels (?site=<slug> and ?preview=1) are admin-only. Resolve
  // the user once, up front, so an anonymous visitor can never use a preview
  // header to view another Site or its draft / paused content. An unauthenticated
  // ?site= is ignored entirely and falls back to normal host resolution.
  const wantsPreview = previewMode || Boolean(rawPreviewSiteSlug)
  const authedUser = wantsPreview ? await getCurrentUser() : null
  const previewSiteSlug = authedUser ? rawPreviewSiteSlug : null

  if (!previewSiteSlug && (!host || isFallbackHost(host))) {
    return <LegalOSMarketing />
  }

  const payload = await getPayload({ config })

  let siteId: string | number | null = null
  if (previewSiteSlug) {
    const matches = await payload.find({
      collection: 'sites',
      where: { slug: { equals: previewSiteSlug } },
      limit: 1,
      overrideAccess: true,
    })
    siteId = matches.docs[0]?.id ?? null
  } else {
    const resolved = await resolveSiteByHost(host)
    if (resolved?.redirectTo) {
      const target = `https://${resolved.redirectTo}${path}`
      redirect(target)
    }
    siteId = resolved?.siteId ?? null
  }

  if (!siteId) {
    return <LegalOSMarketing />
  }

  const site = (await payload.findByID({ collection: 'sites', id: siteId, overrideAccess: true })) as SiteForTemplate & {
    id: string | number
    name?: string | null
    status?: string
  }

  // Admin preview is gated on the request being authenticated as a user (the
  // user was resolved up front). ?preview=1 additionally bypasses the status
  // filter to render draft / scheduled content; ?site=<slug> (already proven
  // authenticated above) selects which Site to preview.
  const isAuthedAdminPreview = previewMode && Boolean(authedUser)
  const isAdminPreview = Boolean(previewSiteSlug) || isAuthedAdminPreview
  if (site.status === 'archived') notFound()
  if (site.status === 'draft' && !isAdminPreview) notFound()
  if (site.status === 'paused' && !isAdminPreview) {
    return <PausedSite name={site.name ?? 'This site'} />
  }

  const siteSlug = (site as { slug?: string }).slug

  // Pages are visible publicly if status='published', OR if status='scheduled'
  // and publish_at has already passed. Captured once so the Pages + redirect
  // queries below stay terse. In an authenticated admin preview we relax this
  // to 'any non-archived status' so draft / scheduled / paused content also
  // renders — that's the whole point of the Preview button in the builder.
  const nowIso = new Date().toISOString()
  const publishedOrLive = isAuthedAdminPreview
    ? { status: { not_equals: 'archived' } }
    : {
        or: [
          { status: { equals: 'published' } },
          {
            and: [
              { status: { equals: 'scheduled' } },
              { publish_at: { less_than_equal: nowIso } },
            ],
          },
        ],
      }

  // 1. Look for an explicit Page that matches this path.
  const slugVariants = [path, path.replace(/^\//, '')]
  const explicit = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { site: { equals: siteId } },
        publishedOrLive,
        { slug: { in: slugVariants } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (explicit.docs[0]) {
    return <RenderPage page={explicit.docs[0] as unknown as RenderPageDoc} site={site} path={path} />
  }

  // 1b. Brand-specific hardcoded fallback. Authored Pages above always win,
  // so this only ever fires for CMC paths the author hasn't written a Page
  // for yet. Skipped entirely under any preview (?site= or ?preview=1) so
  // the builder never accidentally shows a hardcoded component instead of
  // the author's draft.
  if (siteSlug === 'check-my-claim' && !isAdminPreview) {
    const CmcComponent = CMC_PAGES[path.toLowerCase()]
    if (CmcComponent) {
      const tc = await loadTrackingConfig(site.id)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <SiteScripts tc={tc} hasForm={false} />
          <CmcComponent />
        </div>
      )
    }
  }

  // 2. Check slug_redirects on Pages collection for this Site.
  const redirected = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { site: { equals: siteId } },
        publishedOrLive,
        { 'slug_redirects.from': { in: slugVariants } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (redirected.docs[0]) {
    const newSlug = redirected.docs[0].slug
    redirect(newSlug.startsWith('/') ? newSlug : `/${newSlug}`)
  }

  // 3. If this is a known shared-template path, render the shared template wrapped in Site chrome.
  if (isSharedTemplatePath(path)) {
    const key = sharedTemplateKeyForPath(path)
    if (key) {
      const tpl = await payload.find({
        collection: 'shared-legal-templates',
        where: { template_key: { equals: key } },
        limit: 1,
        overrideAccess: true,
      })
      const t = tpl.docs[0]
      if (t) {
        const rendered = renderTemplateVars(t.body_markdown_with_vars, site)
        return <SharedTemplatePage title={t.default_meta_title ?? key} markdown={rendered} site={site} path={path} />
      }
    }
  }

  // 4. Try LandingPages.
  const lp = await payload.find({
    collection: 'landing-pages',
    where: {
      and: [
        { site: { equals: siteId } },
        { status: { equals: 'published' } },
        { slug: { in: slugVariants } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (lp.docs[0]) {
    return <RenderLandingPage lp={lp.docs[0] as unknown as RenderLPDoc} site={site} path={path} />
  }

  // 5. Try BlogPosts under /blog/<slug>.
  if (path.startsWith('/blog/')) {
    const blogSlug = path.slice('/blog/'.length)
    const post = await payload.find({
      collection: 'blog-posts',
      where: {
        and: [
          { site: { equals: siteId } },
          { status: { equals: 'published' } },
          { slug: { equals: blogSlug } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (post.docs[0]) {
      return (
        <article style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
          <h1>{post.docs[0].title}</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{post.docs[0].body_markdown}</pre>
        </article>
      )
    }
  }

  notFound()
}

type RenderPageDoc = {
  uses_shared_template?: boolean
  template_key?: string
  shared_template_overrides?: Record<string, string> | null
  title: string
  body_blocks?: unknown[]
  hidden_blocks?: string[] | null
  block_meta?: Record<string, { hide_mobile?: boolean; hide_desktop?: boolean }> | null
  schema_json?: Record<string, unknown> | null
}

async function RenderPage({
  page,
  site,
  path,
}: {
  page: RenderPageDoc
  site: SiteForTemplate & { id: string | number }
  path: string
}) {
  const phone = await resolvePhoneForPath(path, site.id)

  // Shared legal template path
  if (page.uses_shared_template && page.template_key && page.template_key !== 'custom') {
    const payload = await getPayload({ config })
    const tpl = await payload.find({
      collection: 'shared-legal-templates',
      where: { template_key: { equals: page.template_key } },
      limit: 1,
      overrideAccess: true,
    })
    const t = tpl.docs[0]
    if (t) {
      const rendered = applyTemplateOverrides(
        renderTemplateVars(t.body_markdown_with_vars, site),
        page.shared_template_overrides ?? undefined,
      )
      return <SharedTemplatePage title={page.title} markdown={rendered} site={site} path={path} />
    }
  }

  // Custom blocks path: substitute {{site.*}} server-side then dispatch.
  // Filter out blocks the page author has marked as hidden in the builder.
  const hidden = new Set(Array.isArray(page.hidden_blocks) ? page.hidden_blocks : [])
  const pageBlocks = ((page.body_blocks ?? []) as Block[]).filter(
    (b) => !b.id || !hidden.has(b.id),
  )

  // Global nav + footer: if the page's body_blocks doesn't include a
  // nav_header / site_footer, fall back to the Site's globals. Authors set
  // these once per Site (via 'Save as Site default' on any nav_header /
  // site_footer block); we stash them inside brand_identity to avoid a
  // schema migration that was breaking prod.
  const hasNav = pageBlocks.some((b) => b.blockType === 'nav_header')
  const hasFooter = pageBlocks.some((b) => b.blockType === 'site_footer')
  const bi = ((site as { brand_identity?: Record<string, unknown> | null }).brand_identity || {}) as Record<string, unknown>
  const globalNav = bi.site_nav as Block | undefined
  const globalFooter = bi.site_footer as Block | undefined
  const blocksWithChrome: Block[] = [
    ...(!hasNav && globalNav && (globalNav as Block).blockType === 'nav_header'
      ? [{ ...(globalNav as Block), id: (globalNav as Block).id || 'site-nav' }]
      : []),
    ...pageBlocks,
    ...(!hasFooter && globalFooter && (globalFooter as Block).blockType === 'site_footer'
      ? [{ ...(globalFooter as Block), id: (globalFooter as Block).id || 'site-footer' }]
      : []),
  ]

  const renderedBlocks = deepRenderTemplateVars(blocksWithChrome, site)
  const tc = await loadTrackingConfig(site.id)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SiteScripts tc={tc} hasForm={hasLeadFormBlock(renderedBlocks)} />
      {page.schema_json ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(page.schema_json) }}
        />
      ) : null}
      <BlockRenderer
        blocks={renderedBlocks}
        blockMeta={page.block_meta ?? undefined}
        ctx={{
          site: site as SiteForRender,
          phone: { display: phone.display, tel: phone.tel },
        }}
      />
    </div>
  )
}

/**
 * Render a shared legal template inside the Site's brand chrome.
 * We re-use the home page's nav_header + site_footer blocks so the legal page
 * does not appear as a naked Markdown document.
 */
async function SharedTemplatePage({
  title,
  markdown,
  site,
  path,
}: {
  title: string
  markdown: string
  site: SiteForTemplate & { id: string | number }
  path: string
}) {
  const phone = await resolvePhoneForPath(path, site.id)
  const payload = await getPayload({ config })
  const home = await payload.find({
    collection: 'pages',
    where: { and: [{ site: { equals: site.id } }, { slug: { in: ['/', ''] } }] },
    limit: 1,
    overrideAccess: true,
  })
  const homeBlocks = (home.docs[0]?.body_blocks ?? []) as Block[]
  const homeBlocksRendered = deepRenderTemplateVars(homeBlocks, site)
  const navHeader = homeBlocksRendered.find((b) => (b as Block).blockType === 'nav_header')
  const siteFooter = homeBlocksRendered.find((b) => (b as Block).blockType === 'site_footer')
  const ctx = {
    site: site as SiteForRender,
    phone: { display: phone.display, tel: phone.tel },
  }
  const tc = await loadTrackingConfig(site.id)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SiteScripts tc={tc} hasForm={false} />
      {navHeader ? <BlockRenderer blocks={[navHeader as Block]} ctx={ctx} /> : null}
      <main style={{ flex: 1, padding: '64px 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--site-ink)', margin: 0 }}>{title}</h1>
          <article
            style={{ marginTop: 32, color: 'var(--site-ink)', lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }}
          />
        </div>
      </main>
      {siteFooter ? <BlockRenderer blocks={[siteFooter as Block]} ctx={ctx} /> : null}
    </div>
  )
}

function markdownToHtml(md: string): string {
  // Block-level: headings, paragraphs, simple lists. Avoids a Markdown library dependency.
  const blocks = md.trim().split(/\n{2,}/)
  return blocks
    .map((block) => {
      const trimmed = block.trim()
      const h = trimmed.match(/^(#{1,6})\s+(.+)$/)
      if (h) {
        const level = h[1].length
        return `<h${level} style="font-weight:800;color:var(--site-ink);margin-top:32px;font-size:${Math.max(16, 32 - level * 4)}px;">${escapeHtml(h[2])}</h${level}>`
      }
      // Unordered list
      if (/^[-*]\s+/.test(trimmed)) {
        const items = trimmed.split(/\n/).map((line) => {
          const m = line.match(/^[-*]\s+(.+)$/)
          return m ? `<li>${inlineMd(m[1])}</li>` : ''
        }).join('')
        return `<ul style="padding-left:22px;margin:12px 0;">${items}</ul>`
      }
      // Ordered list
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = trimmed.split(/\n/).map((line) => {
          const m = line.match(/^\d+\.\s+(.+)$/)
          return m ? `<li>${inlineMd(m[1])}</li>` : ''
        }).join('')
        return `<ol style="padding-left:22px;margin:12px 0;">${items}</ol>`
      }
      return `<p style="margin:12px 0;">${inlineMd(trimmed.replace(/\n/g, '<br />'))}</p>`
    })
    .join('')
}

function inlineMd(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--site-primary);">$1</a>')
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!))
}

type RenderLPDoc = {
  name: string
  hero?: { eyebrow?: string | null; heading?: string; sub?: string | null } | null
  body_sections?: Array<{ heading?: string | null; body_markdown?: string | null }> | null
}

async function RenderLandingPage({
  lp,
  site,
  path,
}: {
  lp: RenderLPDoc
  site: SiteForTemplate & { id: string | number }
  path: string
}) {
  const phone = await resolvePhoneForPath(path, site.id)
  return (
    <article style={{ maxWidth: 880, margin: '0 auto', padding: '64px 24px' }}>
      {lp.hero?.eyebrow ? <p style={{ color: 'var(--site-accent)', fontWeight: 600 }}>{lp.hero.eyebrow}</p> : null}
      <h1>{lp.hero?.heading ?? lp.name}</h1>
      {lp.hero?.sub ? <p style={{ fontSize: 18, color: 'var(--site-muted)' }}>{lp.hero.sub}</p> : null}
      {(lp.body_sections ?? []).map((s, i) => (
        <section key={i} style={{ marginTop: 32 }}>
          {s.heading ? <h2>{s.heading}</h2> : null}
          {s.body_markdown ? <pre style={{ whiteSpace: 'pre-wrap' }}>{s.body_markdown}</pre> : null}
        </section>
      ))}
      {phone.display ? (
        <p style={{ marginTop: 32, color: 'var(--site-muted)' }}>
          Speak with us at <a href={`tel:${phone.tel}`}>{phone.display}</a>
        </p>
      ) : null}
    </article>
  )
}

function PausedSite({ name }: { name: string }) {
  return (
    <main style={{ maxWidth: 600, margin: '120px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1>{name} is temporarily unavailable</h1>
      <p style={{ color: 'var(--site-muted)' }}>We will be back shortly. Thanks for your patience.</p>
    </main>
  )
}

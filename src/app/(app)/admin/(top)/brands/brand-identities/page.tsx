import { getPayload } from 'payload'
import config from '@payload-config'
import { BrandIdentitiesApp } from '@/components/builder/brand/BrandModule'

export const dynamic = 'force-dynamic'

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)

// Map a production Site into the funnel-builder artifact's brand object shape.
// Site.brand_identity (JSON) is the source of truth when present; otherwise we
// synthesize a sensible default from the Site's existing brand/legal/typography
// fields so pre-existing sites still render in the editor.
function siteToBrand(s: Record<string, unknown>, domainList: Array<{ host: string; primary: boolean; status: string }>) {
  const id = Number(s.id)
  const primaryDomain = domainList.find((d) => d.primary)?.host ?? domainList[0]?.host ?? ''
  const brand = (s.brand ?? {}) as Record<string, unknown>
  const legal = (s.legal ?? {}) as Record<string, unknown>
  const typo = (s.typography ?? {}) as Record<string, unknown>

  const fallback = {
    id: `site_${id}`,
    name: str(s.name),
    displayName: str(brand.display_name) || str(s.name),
    shortName: str(brand.short_name),
    tagline: str(brand.tagline_brand) || str(s.tagline),
    logoUrl: str(brand.logo_url),
    logoUrlDark: str(brand.logo_url_dark),
    faviconUrl: str(brand.favicon_url),
    primaryDomain,
    colors: {
      primary: str(brand.primary, '#1d8df6'),
      accent: str(brand.accent, '#1d8df6'),
      background: str(brand.ink, '#0a1a3a'),
      cardBg: '#0d2447',
      textOnDark: '#ffffff',
      success: str(brand.success, '#10b981'),
      warning: str(brand.warning, '#f59e0b'),
      danger: str(brand.danger, '#ef4444'),
    },
    typography: {
      headlineFont: str(typo.headline_font) || str(brand.font_heading, 'Inter'),
      bodyFont: str(typo.body_font) || str(brand.font_body, 'Inter'),
      baseSize: str(typo.base_size, 'md'),
    },
    contact: {
      callNumber: str(s.default_phone),
      callCtaText: 'CLICK HERE TO CALL',
      callCtaStyle: 'pill',
    },
    domains: [] as string[],
    legal: {
      copyright: str(legal.copyright),
      tcpaText: str(legal.tcpa_text),
      privacyUrl: str(legal.privacy_url),
      termsUrl: str(legal.terms_url),
      defaultDisclaimer: str(legal.default_disclaimer) || str(s.default_disclaimer_md),
    },
    bgPattern: 'plus',
    bgColor: str(brand.ink, '#0a1a3a'),
    defaultBodySections: [] as unknown[],
  }

  const stored = s.brand_identity
  const merged = stored && typeof stored === 'object' ? { ...fallback, ...(stored as Record<string, unknown>) } : fallback

  // Force the production linkage fields regardless of what is stored.
  return {
    ...merged,
    id: `site_${id}`,
    siteId: id,
    siteSlug: str(s.slug),
    primaryDomain: primaryDomain || str((merged as Record<string, unknown>).primaryDomain),
    __domainCount: domainList.length,
    __domains: domainList,
  }
}

export default async function BrandIdentitiesPage() {
  const payload = await getPayload({ config })
  const [sitesRes, domainsRes] = await Promise.all([
    payload.find({ collection: 'sites', limit: 500, sort: 'name', overrideAccess: true }),
    payload.find({ collection: 'domains', limit: 1000, sort: ['-primary'], overrideAccess: true }),
  ])

  const domainsBySite = new Map<number, Array<{ host: string; primary: boolean; status: string }>>()
  for (const d of domainsRes.docs) {
    if (d.site == null) continue
    const sid = typeof d.site === 'object' ? Number(d.site.id) : Number(d.site)
    const arr = domainsBySite.get(sid) ?? []
    arr.push({ host: d.host, primary: Boolean(d.primary), status: typeof d.status === 'string' ? d.status : 'pending' })
    domainsBySite.set(sid, arr)
  }

  const brands = sitesRes.docs.map((s) =>
    siteToBrand(s as unknown as Record<string, unknown>, domainsBySite.get(Number(s.id)) ?? []),
  )

  return <BrandIdentitiesApp initialBrands={brands} />
}

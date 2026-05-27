// Maps a production Site (+ its attached domains) into the funnel-builder
// artifact's brand object shape. Site.brand_identity (JSON) is the source of
// truth when present; otherwise a default is synthesized from Site fields.
// Shared by the Brand Identities and Landing Pages admin pages.

export type DomainLite = { host: string; primary: boolean; status: string }

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)

export function siteToBrand(s: Record<string, unknown>, domainList: DomainLite[]) {
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
    contact: { callNumber: str(s.default_phone), callCtaText: 'CLICK HERE TO CALL', callCtaStyle: 'pill' },
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

// Build the full brand list + per-site domain map from raw Payload docs.
export function buildBrandsFromSites(
  siteDocs: Array<Record<string, unknown>>,
  domainDocs: Array<Record<string, unknown>>,
) {
  const domainsBySite = new Map<number, DomainLite[]>()
  for (const d of domainDocs) {
    if (d.site == null) continue
    const sid = typeof d.site === 'object' ? Number((d.site as { id: unknown }).id) : Number(d.site)
    const arr = domainsBySite.get(sid) ?? []
    arr.push({ host: String(d.host ?? ''), primary: Boolean(d.primary), status: typeof d.status === 'string' ? d.status : 'pending' })
    domainsBySite.set(sid, arr)
  }
  return siteDocs.map((s) => siteToBrand(s, domainsBySite.get(Number(s.id)) ?? []))
}

// Maps a production Site (+ its attached domains) into the funnel-builder
// artifact's brand object shape. Used by the Site Pages renderer (via the
// public layout CSS vars), the Quiz builder, the Landing Page builder, the
// Advertorial builder, and the Brand Identities admin page — so a change
// to a Site's brand fields flows everywhere.
//
// Merge rule (THE invariant the whole platform relies on):
//   1. Site.brand.* fields are the SINGLE SOURCE OF TRUTH for canonical
//      brand identity — colours, fonts, logos, taglines, display name.
//      They beat brand_identity.* every time.
//   2. brand_identity.* (JSON column) is for funnel-only extensions:
//      contact CTA copy, legal disclaimer, default body sections, bg
//      pattern. Anything that has no Site.brand equivalent.
//
// So: editing a colour in the Site brand editor instantly recolours every
// quiz, LP, advertorial, and site page that points at that Site, even if
// brand_identity still has an older value in its JSON blob.

import { onPrimaryText } from './builder/color-system'

export type DomainLite = { host: string; primary: boolean; status: string }

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)

// Field-by-field "non-empty wins" merge for nested colour/typography/etc.
// objects. brand_identity's fields fill in any slot Site.brand left empty
// without ever overriding a Site.brand value.
const mergeNested = (
  fromSite: Record<string, string>,
  fromIdentity: Record<string, unknown> | undefined,
): Record<string, string> => {
  if (!fromIdentity || typeof fromIdentity !== 'object') return fromSite
  const out: Record<string, string> = { ...fromSite }
  for (const k of Object.keys(fromIdentity)) {
    const v = (fromIdentity as Record<string, unknown>)[k]
    if (!out[k] && typeof v === 'string' && v.trim() !== '') out[k] = v
  }
  return out
}

export function siteToBrand(s: Record<string, unknown>, domainList: DomainLite[]) {
  const id = Number(s.id)
  const primaryDomain = domainList.find((d) => d.primary)?.host ?? domainList[0]?.host ?? ''
  const brand = (s.brand ?? {}) as Record<string, unknown>
  const legal = (s.legal ?? {}) as Record<string, unknown>
  const typo = (s.typography ?? {}) as Record<string, unknown>
  const identity = (s.brand_identity && typeof s.brand_identity === 'object'
    ? (s.brand_identity as Record<string, unknown>)
    : {}) as Record<string, unknown>

  // Site.brand colours come first; brand_identity colours only fill empty
  // slots. So editing Site.brand.primary always cascades.
  const colorsFromSite: Record<string, string> = {
    primary: str(brand.primary),
    accent: str(brand.accent),
    background: str(brand.ink),
    cardBg: '',
    textOnDark: '#ffffff',
    success: str(brand.success),
    warning: str(brand.warning),
    danger: str(brand.danger),
  }
  const colors = mergeNested(colorsFromSite, identity.colors as Record<string, unknown> | undefined)
  // Final defaults for anything still empty so renderers always have values.
  const primaryResolved = colors.primary || '#1d8df6'
  const colorsResolved = {
    primary: primaryResolved,
    accent: colors.accent || colors.primary || '#1d8df6',
    background: colors.background || '#0a1a3a',
    cardBg: colors.cardBg || '#0d2447',
    // textOnDark stays only as a legacy alias = "text on a known-dark
    // surface". Templates no longer source text from it — they derive
    // contrast-verified text via color-system.ts. Do not reintroduce it
    // as a generic text color or white-on-white returns.
    textOnDark: colors.textOnDark || '#ffffff',
    // Contrast-safe text color for ON the primary (filled buttons/badges).
    // Lets non-template consumers get a readable button-text color without
    // recomputing. Computed via the same verifier the templates use.
    onPrimary: onPrimaryText(primaryResolved),
    success: colors.success || '#10b981',
    warning: colors.warning || '#f59e0b',
    danger: colors.danger || '#ef4444',
  }

  const typographyFromSite: Record<string, string> = {
    headlineFont: str(typo.headline_font) || str(brand.font_heading),
    bodyFont: str(typo.body_font) || str(brand.font_body),
    baseSize: str(typo.base_size),
  }
  const typography = mergeNested(typographyFromSite, identity.typography as Record<string, unknown> | undefined)
  const typographyResolved = {
    headlineFont: typography.headlineFont || 'Inter',
    bodyFont: typography.bodyFont || 'Inter',
    baseSize: typography.baseSize || 'md',
  }

  const contactFromSite: Record<string, string> = {
    callNumber: str(s.default_phone),
    callCtaText: '',
    callCtaStyle: '',
  }
  const contact = mergeNested(contactFromSite, identity.contact as Record<string, unknown> | undefined)
  const contactResolved = {
    callNumber: contact.callNumber || '',
    callCtaText: contact.callCtaText || 'CLICK HERE TO CALL',
    callCtaStyle: contact.callCtaStyle || 'pill',
  }

  const legalFromSite: Record<string, string> = {
    copyright: str(legal.copyright),
    tcpaText: str(legal.tcpa_text),
    privacyUrl: str(legal.privacy_url),
    termsUrl: str(legal.terms_url),
    defaultDisclaimer: str(legal.default_disclaimer) || str(s.default_disclaimer_md),
  }
  const legalResolved = mergeNested(legalFromSite, identity.legal as Record<string, unknown> | undefined)

  // Top-level scalars: Site.brand wins, fall back to brand_identity, then
  // to a sensible default.
  const pick = (siteVal: string, identityKey: string, fallback = ''): string => {
    if (siteVal) return siteVal
    const iv = identity[identityKey]
    return typeof iv === 'string' && iv ? iv : fallback
  }

  return {
    id: `site_${id}`,
    siteId: id,
    siteSlug: str(s.slug),
    name: str(s.name),
    displayName: pick(str(brand.display_name), 'displayName', str(s.name)),
    shortName: pick(str(brand.short_name), 'shortName'),
    tagline: pick(str(brand.tagline_brand) || str(s.tagline), 'tagline'),
    logoUrl: pick(str(brand.logo_url), 'logoUrl'),
    logoUrlDark: pick(str(brand.logo_url_dark), 'logoUrlDark'),
    faviconUrl: pick(str(brand.favicon_url), 'faviconUrl'),
    primaryDomain: primaryDomain || str(identity.primaryDomain),
    colors: colorsResolved,
    typography: typographyResolved,
    contact: contactResolved,
    domains: [] as string[],
    legal: legalResolved,
    bgPattern: (typeof identity.bgPattern === 'string' && identity.bgPattern) || 'plus',
    bgColor: colorsResolved.background,
    defaultBodySections: Array.isArray(identity.defaultBodySections) ? (identity.defaultBodySections as unknown[]) : [],
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

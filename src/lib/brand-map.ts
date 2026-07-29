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

import { resolveBrandTokens, MissingBrandTokenError } from './brand/resolve-tokens'

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

  // Colour comes from the canonical brand tokens through the one resolver.
  //
  // What this replaces was the reason quizzes did not look like their brand.
  // Two bugs, both silent:
  //
  //   1. The page background was read from `brand.ink` - the BODY TEXT colour.
  //      Ink is dark by definition, so every quiz rendered on a dark ground no
  //      matter what the brand's actual background was.
  //   2. `cardBg` was never populated at all, so it always fell through to a
  //      hardcoded '#0d2447'. That plus a '#1d8df6' primary default meant any
  //      brand with a sparse record rendered in Check My Claim's blue and navy.
  //      Not "close to the wrong colour" - literally another brand's palette.
  //
  // brand_identity is no longer consulted for colour either. The token columns
  // are the single store (the P0-B migration promoted the JSON values into
  // them), and reading both is how two stores drift apart.
  let tokens: ReturnType<typeof resolveBrandTokens> | null = null
  let missingTokens: string[] = []
  try {
    tokens = resolveBrandTokens({
      primary: str(brand.primary),
      primary_ink: str(brand.primary_ink),
      accent: str(brand.accent),
      accent_ink: str(brand.accent_ink),
      cta: str(brand.cta),
      cta_ink: str(brand.cta_ink),
      bg: str(brand.bg),
      surface: str(brand.surface),
      surface_2: str(brand.surface_2),
      ink: str(brand.ink),
      ink_muted: str(brand.ink_muted) || str(brand.muted),
      border: str(brand.border),
      font_heading: str(brand.font_heading),
      font_body: str(brand.font_body),
      radius: str(brand.radius),
      radius_lg: str(brand.radius_lg),
      shadow: str(brand.shadow),
    })
  } catch (err) {
    missingTokens = err instanceof MissingBrandTokenError ? err.missing : ['primary']
    // A brand with no colours set resolves to a TRUE NEUTRAL grey, no hue at
    // all, deliberately.
    // The builders need something to render, but an invented brand palette is
    // the bug: grey reads as "this brand has no colours yet", where a blue
    // would read as a finished brand that happens to be wrong. Even a blue-grey
    // could pass for a deliberate choice, so the placeholder carries zero
    // saturation. `incomplete` below is what the UI should surface.
    tokens = resolveBrandTokens({ primary: '#737373', cta: '#737373', bg: '#f5f5f5', ink: '#171717' })
  }

  const v = tokens.vars
  const colorsResolved = {
    primary: v['--site-primary'],
    accent: v['--site-accent'],
    // The page ground and the card, from the tokens that actually mean those
    // things rather than from the text colour.
    background: v['--site-bg'],
    cardBg: v['--site-surface'],
    cta: v['--site-cta'],
    ctaInk: v['--site-cta-ink'],
    ink: v['--site-ink'],
    inkMuted: v['--site-ink-muted'],
    border: v['--site-border'],
    // Legacy alias: "text on a known-dark surface". Now derived against the ink
    // colour rather than assumed white, so it stays legible for a brand whose
    // ink is light.
    textOnDark: v['--site-ink-inverse'],
    onPrimary: v['--site-primary-ink'],
    // Status colours are system-wide. A brand does not get its own danger red,
    // because a warning that changes colour per tenant stops meaning warning.
    success: v['--sys-success'],
    warning: v['--sys-warning'],
    danger: v['--sys-danger'],
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

  // Destination URLs for this brand: where its quizzes and funnels send people
  // (thank you, did-not-qualify, partners, legal pages). Stored under
  // brand_identity.urls; privacy and terms fall back to the Site's own legal
  // fields so a brand that only filled those in still resolves them, and
  // anything still empty falls back to the site's built-in page at render time
  // (see resolveDestination in quiz-destinations.ts).
  const urlsFromIdentity = (identity.urls && typeof identity.urls === 'object'
    ? (identity.urls as Record<string, unknown>)
    : {}) as Record<string, unknown>
  const urls: Record<string, string> = {}
  for (const k of ['thank_you', 'dq', 'partners', 'privacy', 'terms', 'disclosures']) {
    const v = urlsFromIdentity[k]
    if (typeof v === 'string' && v.trim()) urls[k] = v.trim()
  }
  if (!urls.privacy && legalResolved.privacyUrl) urls.privacy = legalResolved.privacyUrl
  if (!urls.terms && legalResolved.termsUrl) urls.terms = legalResolved.termsUrl

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
    // The full CSS variable map, so a renderer can hand the whole set to a
    // style tag instead of picking values out one at a time.
    tokens: tokens.vars,
    contrast: tokens.audit,
    /** True when the brand has no usable colours and is rendering as grey. */
    incomplete: missingTokens.length > 0,
    missingTokens,
    typography: typographyResolved,
    contact: contactResolved,
    domains: [] as string[],
    legal: legalResolved,
    urls,
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

/**
 * Where a quiz sends people.
 *
 * The problem this fixes: an endpoint node used to carry a raw URL typed into
 * the quiz itself. That is the wrong place for it. A quiz is the FLOW - the
 * questions and the routing - and it is meant to run under many brands. The
 * moment a thank-you URL is typed into a node, that quiz belongs to one brand,
 * and deploying it for a second brand silently sends that brand's traffic to
 * the first brand's pages.
 *
 * So a node no longer names a URL. It names a DESTINATION - "thank you",
 * "did not qualify", "partners" - and the URL for that destination is resolved
 * at render time from the brand and the deployment:
 *
 *     node.redirect.destination
 *        -> deployment.destination_overrides[key]   (this one placement)
 *        -> brand.urls[key]                         (this brand, everywhere)
 *        -> DEFAULT_PATHS[key]                      (the site's own page)
 *
 * The same quiz then behaves correctly under every brand it runs under, and
 * changing a brand's thank-you page updates every quiz that brand runs without
 * opening a single node.
 *
 * 'custom' remains available for a genuinely one-off URL (a partner postback,
 * a campaign-specific page), and is what an existing node with a hand-typed URL
 * is treated as, so nothing already built changes behaviour.
 *
 * Pure and isomorphic: no React, no server imports. The builder preview, the
 * public runtime and any server-side redirect all resolve identically.
 */

export type DestinationKey =
  | 'thank_you'
  | 'dq'
  | 'partners'
  | 'privacy'
  | 'terms'
  | 'disclosures'

export const DESTINATION_KEYS: DestinationKey[] = [
  'thank_you',
  'dq',
  'partners',
  'privacy',
  'terms',
  'disclosures',
]

export const DESTINATION_LABELS: Record<DestinationKey, string> = {
  thank_you: 'Thank you page',
  dq: 'Did not qualify page',
  partners: 'Partner list',
  privacy: 'Privacy policy',
  terms: 'Terms of service',
  disclosures: 'Advertising disclosures',
}

export const DESTINATION_HINTS: Record<DestinationKey, string> = {
  thank_you: 'Where a qualified lead lands after submitting.',
  dq: 'Where someone lands when they do not qualify.',
  partners: 'The list of partners a lead may be shared with.',
  privacy: 'Linked from consent text and the footer.',
  terms: 'Linked from consent text and the footer.',
  disclosures: 'Advertising and compensation disclosure.',
}

/**
 * The site's own pages, used when neither the deployment nor the brand names a
 * URL. These paths are already served by the public router from
 * SharedLegalTemplates, so the fallback is a real page rather than a 404.
 */
export const DEFAULT_PATHS: Record<DestinationKey, string> = {
  thank_you: '/submitted',
  dq: '/thanks',
  partners: '/partners',
  privacy: '/privacy',
  terms: '/terms',
  disclosures: '/disclosures',
}

/**
 * Schemes allowed in a destination.
 *
 * This is a security boundary, not tidiness. A destination ends up in an href
 * and in `window.location`, so a stored `javascript:` or `data:` value would be
 * script execution on the public page triggered by an admin-editable field.
 * Anything not on this list is rejected at validation and never rendered.
 */
const SAFE_ABSOLUTE = /^https?:\/\/[^\s]+$/i
const SAFE_CONTACT = /^(?:tel:|mailto:)[^\s]+$/i

/** A site-relative path: '/thanks', '/thanks?x=1'. Never '//evil.com'. */
const SAFE_RELATIVE = /^\/(?!\/)[^\s]*$/

export const isSafeDestinationUrl = (value: unknown): boolean => {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (!v) return false
  return SAFE_ABSOLUTE.test(v) || SAFE_CONTACT.test(v) || SAFE_RELATIVE.test(v)
}

export type DestinationMap = Partial<Record<DestinationKey, string>>

/**
 * Coerce stored destination config into a validated map. Each key is validated
 * independently, so one bad URL never discards the rest.
 */
export const normalizeDestinations = (raw: unknown): DestinationMap => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const src = raw as Record<string, unknown>
  const out: DestinationMap = {}
  for (const key of DESTINATION_KEYS) {
    const v = src[key]
    if (isSafeDestinationUrl(v)) out[key] = (v as string).trim()
  }
  return out
}

export type DestinationContext = {
  /** Per-deployment overrides. Beats the brand. */
  deployment?: unknown
  /** The brand's own URLs. Beats the built-in default. */
  brand?: unknown
}

/**
 * Resolve one destination to a URL. Always returns something usable - the
 * built-in site path is the floor, so a redirect can never resolve to an empty
 * string and strand a visitor on a dead screen.
 */
export const resolveDestination = (key: DestinationKey, ctx: DestinationContext): string => {
  const dep = normalizeDestinations(ctx.deployment)
  if (dep[key]) return dep[key] as string
  const brand = normalizeDestinations(ctx.brand)
  if (brand[key]) return brand[key] as string
  return DEFAULT_PATHS[key]
}

/** Where a resolved destination came from. Drives the "inherited" hint in the editors. */
export const destinationOrigin = (
  key: DestinationKey,
  ctx: DestinationContext,
): 'deployment' | 'brand' | 'default' => {
  if (normalizeDestinations(ctx.deployment)[key]) return 'deployment'
  if (normalizeDestinations(ctx.brand)[key]) return 'brand'
  return 'default'
}

export type NodeRedirect = {
  mode?: 'none' | 'button' | 'immediate'
  /** Named destination. Absent or 'custom' means use `url`. */
  destination?: DestinationKey | 'custom'
  url?: string
  buttonText?: string
}

/** Substitute {{field_key}} with captured answers. Unknown keys resolve to ''. */
export const interpolateFields = (
  template: string,
  fieldValues: Record<string, unknown>,
): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = fieldValues[key]
    return v == null ? '' : String(v)
  })

/**
 * The final URL for an endpoint node, or null when there is nothing to go to.
 *
 * Returning null rather than '' matters: the runtime uses it to decide whether
 * to render a redirect at all, and an empty string in an href navigates to the
 * current page, which looks like a broken button rather than no button.
 */
export const resolveRedirectUrl = (
  redirect: NodeRedirect | null | undefined,
  ctx: DestinationContext,
  fieldValues: Record<string, unknown> = {},
): string | null => {
  if (!redirect || !redirect.mode || redirect.mode === 'none') return null

  // A node saved before named destinations existed has a url and no
  // destination. Treating that as 'custom' keeps it working untouched.
  const kind = redirect.destination ?? 'custom'

  if (kind === 'custom') {
    const raw = (redirect.url ?? '').trim()
    if (!raw) return null
    const filled = interpolateFields(raw, fieldValues)
    // Validation happens AFTER interpolation: a captured answer is attacker
    // controlled, so checking the template alone would let a value smuggle in
    // a scheme the template did not have.
    return isSafeDestinationUrl(filled) ? filled : null
  }

  if (!DESTINATION_KEYS.includes(kind as DestinationKey)) return null
  const resolved = resolveDestination(kind as DestinationKey, ctx)
  const filled = interpolateFields(resolved, fieldValues)
  return isSafeDestinationUrl(filled) ? filled : null
}

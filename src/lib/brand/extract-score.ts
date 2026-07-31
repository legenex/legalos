/**
 * Scoring and rejection for computed-style brand extraction.
 *
 * Deliberately separate from the browser driver. The browser's job is to read
 * the DOM; every judgement about what the readings MEAN happens here, in pure
 * functions with no Playwright import. That split is what makes the hard part
 * testable: the rules below can be exercised against synthetic samples without
 * launching Chromium, which matters because the decision "is this the brand's
 * colour or the framework's default" is exactly where the old extractor went
 * wrong.
 *
 * The old method parsed declared stylesheet values, so on any Tailwind site it
 * returned Tailwind's palette in declaration order. This one reads what the
 * page actually PAINTED, weights by semantic role, and throws away anything too
 * rare or too small to be a brand decision.
 */

export type Role =
  | 'cta'
  | 'accent'
  | 'logo'
  | 'page_bg'
  | 'surface'
  | 'ink'
  | 'heading'
  | 'link'

/** One observed colour, with everything needed to judge it. */
export type Sample = {
  role: Role
  /** Normalised '#rrggbb'. */
  color: string
  /** How many distinct elements painted it. */
  count: number
  /** Share of the rendered viewport this role covered, 0..1. */
  pixelShare: number
  /** Human-readable origin, shown as evidence in the UI. */
  source: string
}

export type FontSample = {
  role: 'heading' | 'body'
  family: string
  count: number
}

/**
 * How much each role is trusted when two disagree.
 *
 * The primary call-to-action outranks everything because it is the one colour a
 * brand is guaranteed to have chosen deliberately. A logo is close behind. Body
 * text and page background are reliable but say little about identity. Links
 * rank last: they are frequently left at a framework default.
 */
export const ROLE_WEIGHT: Record<Role, number> = {
  cta: 1.0,
  logo: 0.85,
  accent: 0.7,
  page_bg: 0.8,
  surface: 0.6,
  ink: 0.6,
  heading: 0.55,
  link: 0.3,
}

/**
 * Minimum occurrences before a colour counts as a decision. Roles absent from
 * this table are exempt.
 *
 * Repetition is only EVIDENCE for roles whose whole claim is that they are
 * systematic: a card background means something because it recurs, and a link
 * colour seen once may just be a stray anchor. For the rest, repetition is not
 * the point - a page has exactly one background, usually one logo, and very
 * often exactly one hero call to action. Requiring three of those would reject
 * the single strongest brand signal on the page.
 */
export const MIN_COUNT: Partial<Record<Role, number>> = {
  surface: 3,
  link: 2,
}

/**
 * Minimum share of the rendered viewport, by role. Roles absent are exempt.
 *
 * Set from how large each role actually is, not from one global number. A hero
 * button at 1440x900 covers well under 1% of the viewport - an earlier flat 2%
 * floor would have thrown away every call to action it was written to find.
 * These floors only exclude things too small to be a deliberate area of colour:
 * icons, badges, hairlines.
 *
 * Grounds (page background, card surface, body ink) and logos are exempt.
 * A background trivially covers everything, prose legitimately covers very
 * little, and a logo is small by nature.
 */
export const MIN_PIXEL_SHARE: Partial<Record<Role, number>> = {
  cta: 0.0015,
  accent: 0.0015,
  heading: 0.002,
  link: 0.0008,
}

const HEX = /^#[0-9a-f]{6}$/i

/** Near-white and near-black carry no brand information. */
export const isNeutralExtreme = (hex: string): boolean => {
  if (!HEX.test(hex)) return true
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  // Achromatic and at either end of the range.
  const chroma = max - min
  return (chroma <= 12 && (max >= 240 || max <= 24))
}

/**
 * Is this a neutral rather than an identity colour?
 *
 * Measured by SATURATION, not by raw channel spread. Spread cannot tell a
 * blue-grey from a desaturated navy: Tailwind's grey-500 (#6b7280) and a
 * perfectly good brand navy (#252e39) both span about 20 points. Saturation
 * separates them cleanly - 9% against 21% - because it accounts for how dark
 * the colour is, and a dark colour needs far less spread to read as coloured.
 *
 * The distinction matters: treating a brand's navy as "no brand found" is as
 * wrong as proposing Tailwind's grey as a brand colour.
 */
export const GREY_MAX_SATURATION = 0.15

export const isGrey = (hex: string): boolean => {
  if (!HEX.test(hex)) return true
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const l = (max + min) / 2
  if (l === 0 || l === 1) return true
  const saturation = (max - min) / (1 - Math.abs(2 * l - 1))
  return saturation <= GREY_MAX_SATURATION
}

export type Rejection = { sample: Sample; reason: string }

/**
 * Apply the rejection rules, per role.
 *
 * Every rejection carries the rule that caused it, in words an operator can act
 * on. "Covers 0.1% of the page, needs 0.15%" tells someone their button is too
 * small to sample; "rejected" on its own tells them nothing.
 */
export const applyRejections = (
  samples: Sample[],
): { kept: Sample[]; rejected: Rejection[] } => {
  const kept: Sample[] = []
  const rejected: Rejection[] = []

  for (const s of samples) {
    if (!HEX.test(s.color)) {
      rejected.push({ sample: s, reason: 'not a resolvable colour' })
      continue
    }

    const minCount = MIN_COUNT[s.role]
    if (minCount !== undefined && s.count < minCount) {
      rejected.push({
        sample: s,
        reason: `seen ${s.count} time${s.count === 1 ? '' : 's'}, needs ${minCount} to count as systematic`,
      })
      continue
    }

    const minShare = MIN_PIXEL_SHARE[s.role]
    if (minShare !== undefined && s.pixelShare < minShare) {
      rejected.push({
        sample: s,
        reason: `covers ${(s.pixelShare * 100).toFixed(2)}% of the page, needs ${(minShare * 100).toFixed(2)}%`,
      })
      continue
    }

    kept.push(s)
  }
  return { kept, rejected }
}

export type TokenProposal = {
  value: string
  confidence: number
  source: string
}

/**
 * Choose one colour per token from the surviving samples.
 *
 * Confidence is the role weight scaled by how much corroboration there is: a
 * colour seen once at the top weight scores lower than the same colour seen
 * across several roles. That is what lets the UI say "35%" honestly rather than
 * presenting every guess as equally good.
 */
export const proposeTokens = (
  kept: Sample[],
): Record<string, TokenProposal> => {
  const out: Record<string, TokenProposal> = {}

  const best = (roles: Role[], filter?: (s: Sample) => boolean): Sample | null => {
    const pool = kept.filter((s) => roles.includes(s.role) && (!filter || filter(s)))
    if (pool.length === 0) return null
    return pool.sort((a, b) => ROLE_WEIGHT[b.role] - ROLE_WEIGHT[a.role] || b.count - a.count)[0]
  }

  /** How many OTHER samples painted the same colour. Corroboration. */
  const echoes = (hex: string): number =>
    kept.filter((s) => s.color.toLowerCase() === hex.toLowerCase()).length

  const put = (token: string, s: Sample | null) => {
    if (!s) return
    const corroboration = Math.min(0.15, (echoes(s.color) - 1) * 0.05)
    out[token] = {
      value: s.color,
      confidence: Math.min(0.95, Number((ROLE_WEIGHT[s.role] * 0.8 + corroboration).toFixed(2))),
      source: s.source,
    }
  }

  // Identity colours must carry chroma. A grey "primary" is the extractor
  // finding no brand at all, and saying so is more useful than proposing grey.
  put('cta', best(['cta'], (s) => !isGrey(s.color)))
  put('primary', best(['cta', 'logo'], (s) => !isGrey(s.color)))
  put('accent', best(['accent', 'logo', 'link'], (s) => !isGrey(s.color) && s.color !== out.primary?.value))
  put('bg', best(['page_bg']))
  put('surface', best(['surface']))
  put('ink', best(['ink', 'heading']))

  return out
}

/** Pick the most-used family per role, ignoring generic stacks. */
export const proposeFonts = (fonts: FontSample[]): Record<string, TokenProposal> => {
  const GENERIC = /^(inherit|initial|system-ui|sans-serif|serif|monospace|ui-[a-z-]+|-apple-system|blinkmacsystemfont|segoe ui|roboto|helvetica( neue)?|arial)$/i
  const out: Record<string, TokenProposal> = {}
  for (const role of ['heading', 'body'] as const) {
    const pool = fonts
      .filter((f) => f.role === role)
      .map((f) => ({ ...f, family: f.family.split(',')[0].replace(/["']/g, '').trim() }))
      .filter((f) => f.family && !GENERIC.test(f.family))
      .sort((a, b) => b.count - a.count)
    if (pool[0]) {
      out[role === 'heading' ? 'font_heading' : 'font_body'] = {
        value: pool[0].family,
        confidence: 0.7,
        source: `computed font-family on ${pool[0].count} ${role === 'heading' ? 'heading' : 'body'} element${pool[0].count === 1 ? '' : 's'}`,
      }
    }
  }
  return out
}

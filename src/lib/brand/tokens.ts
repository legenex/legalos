/**
 * The brand token contract.
 *
 * This module answers one question and nothing else: what values may a human
 * author on a brand, and which of them are mandatory. It has no dependencies
 * beyond types so that the schema, the resolver, the admin UI and the lint
 * script can all read the same list rather than three of them keeping their own
 * copy in sync by hand.
 *
 * The rule this exists to enforce: colour has ONE owner. Before this, a Brand
 * Identity record, a per-deployment theme generator, and hardcoded values
 * inside template components all believed they decided what colour something
 * was. Three owners of one value produce arbitrary output, which is what
 * "Don't Settle colours are completely wrong" actually was.
 */

/** Colour tokens a human authors on the brand. Every one is a hex string. */
export const COLOR_TOKENS = [
  'primary',
  'primary_ink',
  'accent',
  'accent_ink',
  'cta',
  'cta_ink',
  'bg',
  'surface',
  'surface_2',
  'ink',
  'ink_muted',
  'border',
] as const

/** Non-colour tokens a human authors on the brand. */
export const SHAPE_TOKENS = ['font_heading', 'font_body', 'radius', 'radius_lg', 'shadow'] as const

export type ColorToken = (typeof COLOR_TOKENS)[number]
export type ShapeToken = (typeof SHAPE_TOKENS)[number]
export type BrandToken = ColorToken | ShapeToken

export const ALL_TOKENS: BrandToken[] = [...COLOR_TOKENS, ...SHAPE_TOKENS]

/**
 * Required tokens. A brand missing any of these cannot resolve, and therefore
 * cannot publish.
 *
 * These four are required rather than all twelve because every other colour is
 * derivable from them with a defensible rule: an `_ink` is computed for
 * contrast against the surface it sits on, `surface` and `surface_2` step off
 * `bg`, `border` steps off `ink`. `cta` is required separately from `primary`
 * because a brand whose action colour differs from its identity colour is
 * common, and silently reusing `primary` for buttons is a guess, not a
 * derivation.
 */
export const REQUIRED_TOKENS: BrandToken[] = ['primary', 'cta', 'bg', 'ink']

/**
 * Fixed system colours. Identical for every brand, never brand-derived.
 *
 * Status has to mean the same thing everywhere. A destructive action rendered
 * in brand orange on one site and brand red on another teaches people to read
 * colour as decoration rather than as meaning, and the cost lands on whoever
 * clicks Delete expecting it to be Save.
 */
export const SYSTEM_COLORS = {
  success: '#1f9d55',
  warning: '#b45309',
  danger: '#c0392b',
  info: '#1d6fb8',
} as const

export type SystemColor = keyof typeof SYSTEM_COLORS

/** Human labels, used by the brand editor and by resolver error messages. */
export const TOKEN_LABELS: Record<BrandToken, string> = {
  primary: 'Primary',
  primary_ink: 'Text on primary',
  accent: 'Accent',
  accent_ink: 'Text on accent',
  cta: 'Call to action',
  cta_ink: 'Text on call to action',
  bg: 'Page background',
  surface: 'Card surface',
  surface_2: 'Nested surface',
  ink: 'Body text',
  ink_muted: 'Secondary text',
  border: 'Border',
  font_heading: 'Heading font',
  font_body: 'Body font',
  radius: 'Corner radius',
  radius_lg: 'Large corner radius',
  shadow: 'Shadow',
}

/** What each token is for, shown under the field in the brand editor. */
export const TOKEN_HINTS: Record<BrandToken, string> = {
  primary: 'The brand’s main colour. Required.',
  primary_ink: 'Left blank, computed for legibility on primary.',
  accent: 'Secondary emphasis. Falls back to primary.',
  accent_ink: 'Left blank, computed for legibility on accent.',
  cta: 'The button colour. Required, even when it equals primary.',
  cta_ink: 'Left blank, computed for legibility on the button.',
  bg: 'The page background. Required.',
  surface: 'Cards and panels. Left blank, derived from the background.',
  surface_2: 'Nested panels and input backgrounds. Derived when blank.',
  ink: 'Body text colour. Required.',
  ink_muted: 'Secondary text. Derived for a softer contrast when blank.',
  border: 'Hairlines and dividers. Derived from ink when blank.',
  font_heading: 'Family name only, no CSS stack.',
  font_body: 'Family name only, no CSS stack.',
  radius: 'Corner radius in pixels, e.g. 8.',
  radius_lg: 'Larger radius for cards and modals.',
  shadow: 'A CSS box-shadow value.',
}

/** The ramp steps generated for primary and accent. */
export const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const

/**
 * Interaction-state lightness deltas, applied to the base colour.
 *
 * Fixed rather than per-brand on purpose: a hover that moves by a consistent
 * amount reads as the same interaction everywhere, and letting brands tune it
 * would reintroduce per-brand styling decisions through a side door.
 */
export const STATE_DELTAS = {
  hover: -0.06,
  active: -0.12,
  focus: 0.0,
  disabled: 0.0,
} as const

/** WCAG thresholds the audit enforces. */
export const CONTRAST_MIN_BODY = 4.5
export const CONTRAST_MIN_LARGE = 3

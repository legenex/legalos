/**
 * Where a landing page's colours come from.
 *
 * The template decides the SHAPE and the brand decides the COLOUR. That is the
 * split, and it is worth stating plainly because it has moved twice and the
 * comments left behind by the previous arrangement will read as contradictions
 * otherwise.
 *
 * What a template identity still owns is everything that is not a hue: the
 * typeface pairing, the display weight and tracking, the radii, the border
 * weight, the eyebrow treatment, the shape of its mark, and the structure of
 * the page itself. Counterweight under any brand is still compressed poster
 * caps on square corners with 2px rules, an argument on the left and the form
 * on the right. What it is no longer is vermilion: a page deployed under a
 * teal-and-gold brand renders teal and gold.
 *
 * The identity's own palette survives as the FALLBACK, which is what makes a
 * brandless preview and the template gallery still look like themselves, and
 * what keeps a brand that has only set a primary from collapsing to grey. Every
 * value records where it came from, so the builder can say so rather than
 * leaving someone to guess why a colour is not theirs.
 */

import { relativeLuminance, contrastRatio } from '@/lib/builder/page-lint'
import { hslToHex, parseHex, rgbToHsl } from '@/lib/builder/color-system'
import type { LpIdentity } from '@/lib/lp-identities'

export type Palette = {
  /** The page ground. */
  surface: string
  /** One step off the page: cards, alternating bands. */
  surfaceAlt: string
  /** The dark ground, for inverted bands and dark heroes. */
  surfaceDark: string
  primary: string
  /** The primary remapped so it still reads on `surfaceDark`. */
  primaryDark: string
  /** The stated ink for text sitting on `primary`. */
  primaryInk: string
  accent: string
  ink: string
  inkMuted: string
  line: string
  /** Names of the values the brand did not supply, so the UI can say so. */
  fromIdentity: string[]
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const hex = (v: unknown): string => (typeof v === 'string' && HEX.test(v.trim()) ? v.trim() : '')
const lum = (c: string): number => relativeLuminance(c) ?? 1
const ratio = (a: string, b: string): number => contrastRatio(a, b) ?? 0

/**
 * Re-light a colour, optionally capping its saturation.
 *
 * The cap is what stops a dark ground derived from a vivid primary reading as a
 * dark RED rather than as a near-black that happens to carry the brand's hue.
 * Keeping some of the hue is the point; keeping all of the chroma is not.
 */
export const atLightness = (source: string, lightness: number, maxSaturation = 1): string => {
  const rgb = parseHex(source)
  if (!rgb) return source
  const [h, s] = rgbToHsl(rgb)
  return hslToHex(h, Math.min(s, maxSaturation), Math.max(0, Math.min(1, lightness)))
}

export type PaletteFallback = Pick<
  Palette,
  'surface' | 'surfaceAlt' | 'surfaceDark' | 'primary' | 'primaryInk' | 'accent' | 'ink' | 'inkMuted' | 'line'
>

/**
 * Build a palette from a brand, falling back to a stated set where it is silent.
 *
 * Nothing here is verified against anything: this is the raw set of grounds and
 * hues. Verification happens in `deriveSurface`, against the ground each colour
 * will actually sit on, which is the only place it means anything. A brand that
 * states white ink on a white page - which one of ours does - produces a
 * readable page because of that step, not because of this one.
 *
 * The fallback is a parameter rather than an identity because quizzes need this
 * too. A standalone quiz has no template identity to fall back to, only the
 * neutral set its own handoff draws in, and a second copy of this derivation
 * would give two subtly different ideas of what a brand's dark ground is -
 * which a landing page and the form embedded in it would then disagree about.
 */
export const paletteFrom = (
  identity: PaletteFallback,
  brand: { colors?: Record<string, unknown> } | null | undefined,
): Palette => {
  const c = (brand?.colors ?? {}) as Record<string, unknown>
  const fromIdentity: string[] = []

  const take = (name: string, stated: unknown, fallback: string): string => {
    const v = hex(stated)
    if (v) return v
    fromIdentity.push(name)
    return fallback
  }

  const surface = take('surface', c.background, identity.surface)
  const primary = take('primary', c.primary, identity.primary)
  const accent = take('accent', c.accent, identity.accent)

  // The card ground. A brand that sets its card to the same colour as its page
  // has not really distinguished them, so one is derived rather than leaving
  // every alternating band identical to the one before it.
  const statedCard = hex(c.cardBg)
  const surfaceAlt =
    statedCard && statedCard.toLowerCase() !== surface.toLowerCase()
      ? statedCard
      : hex(c.background)
        ? atLightness(surface, lum(surface) < 0.5 ? Math.min(0.24, lum(surface) + 0.07) : Math.max(0.9, lum(surface) - 0.045))
        : identity.surfaceAlt

  // No brand states a dark ground, so it is derived from the brand's own hue.
  // A brand that is already dark keeps its own; deepening it further would take
  // the page somewhere the brand never chose.
  const surfaceDark =
    lum(surface) < 0.35 ? surface : atLightness(hex(c.primary) ? primary : surface, 0.085, 0.34)

  // The primary on a dark ground. Several identities publish a lifted value for
  // exactly this; a brand does not, so it is lifted until it reads, keeping the
  // hue so it is still recognisably the brand's colour.
  let primaryDark = primary
  if (ratio(primaryDark, surfaceDark) < 4.5) {
    for (let step = 1; step <= 20; step += 1) {
      primaryDark = atLightness(primary, 0.5 + step * 0.025)
      if (ratio(primaryDark, surfaceDark) >= 4.5) break
    }
  }

  return {
    surface,
    surfaceAlt,
    surfaceDark,
    primary,
    primaryDark,
    primaryInk: take('primaryInk', c.ctaInk, identity.primaryInk),
    accent,
    ink: take('ink', c.ink, identity.ink),
    inkMuted: take('inkMuted', c.inkMuted, identity.inkMuted),
    line: take('line', c.border, identity.line),
    fromIdentity,
  }
}

/**
 * Recolour an identity's mark to the brand.
 *
 * The mark's SHAPE belongs to the identity - a counterweight, a stepped path, a
 * fluted column, two chevrons - and its colours were chosen from the identity's
 * own palette. Each one is remapped by the ROLE it was playing rather than by
 * position, so the path that was the identity's primary becomes the brand's
 * primary and the dot that was its accent becomes the brand's accent. Matching
 * on the original value is what makes that possible without the design handoff
 * having to label them.
 */
export const markColors = (
  identity: LpIdentity,
  palette: Palette,
  onDark: boolean,
): { fill: string; stroke: string; fill2: string; strokeWidth: number } => {
  const { mark } = identity
  const role = (value: string, darkValue: string): string => {
    const v = (onDark ? darkValue : value) || value
    if (!v || v === 'none') return 'none'
    const same = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()
    if (same(v, identity.primary) || same(v, identity.primaryDark)) return onDark ? palette.primaryDark : palette.primary
    if (same(v, identity.accent)) return palette.accent
    if (same(v, identity.ink)) return onDark ? palette.surface : palette.ink
    if (same(v, identity.surface) || same(v, identity.surfaceAlt)) return onDark ? palette.surface : palette.ink
    // A value the identity does not name is carried through rather than guessed
    // at, so an unrecognised mark still draws.
    return v
  }
  return {
    fill: role(mark.fill, mark.fillDark),
    stroke: role(mark.stroke, mark.strokeDark),
    fill2: role(mark.fill2, mark.fill2Dark),
    strokeWidth: mark.strokeWidth,
  }
}

/** A template identity is one kind of fallback. */
export const resolveLpPalette = (
  identity: LpIdentity,
  brand: { colors?: Record<string, unknown> } | null | undefined,
): Palette => paletteFrom(identity, brand)

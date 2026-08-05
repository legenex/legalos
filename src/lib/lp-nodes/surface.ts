/**
 * Every colour a section paints with, derived from the ground it actually sits
 * on and checked before it is handed out.
 *
 * The rule this file exists to keep is the one that survived the change of
 * palette ownership: text colours are DERIVED and VERIFIED, never assumed. A
 * renderer asks for `surface.text` and gets something that has been measured
 * against `surface.bg`; it never writes `#fff` and hopes. Card copy is derived
 * against the CARD, not the page behind it, because those are two different
 * grounds and only one of them is what the words land on.
 *
 * The colours themselves arrive as a `Palette`, which is resolved from the
 * BRAND with the template identity as a fallback. Nothing in this file chooses
 * a hue; it decides which ground a tone lands on and then works out what can be
 * read on it. That separation is why the same code serves a brand with a full
 * palette, a brand with only a primary, and no brand at all.
 *
 * What a template identity still supplies here is `lookOf`: the faces, the
 * weight, the tracking, the radii, the border weight and the eyebrow treatment.
 * Shape, not colour.
 */

import { contrastRatio, relativeLuminance } from '@/lib/builder/page-lint'
import { getSafeMutedColor, getSafeTextColor, onPrimaryText } from '@/lib/builder/color-system'
import type { LpIdentity } from '@/lib/lp-identities'
import type { LpSection, ToneId } from './model'
import { atLightness, type Palette } from './palette'

const lum = (hex: string): number => relativeLuminance(hex) ?? 1
const ratio = (a: string, b: string): number => contrastRatio(a, b) ?? 0

export type Surface = {
  /** Opaque. Every colour below is verified against this. */
  bg: string
  text: string
  muted: string
  /** The accent used AS TEXT on `bg`, lifted until it reads. */
  accent: string
  /** The accent used as a FILL. Text on it is `onAccentFill`. */
  accentFill: string
  onAccentFill: string
  /** A card sitting on `bg`, with its own verified copy colours. */
  card: string
  cardText: string
  cardMuted: string
  line: string
  isDark: boolean
}

export type Look = {
  display: string
  body: string
  utility: string
  displayWeight: number
  headingTransform: string
  headingTracking: string
  wordmarkTransform: string
  wordmarkTracking: string
  radius: number
  radiusLg: number
  radiusPill: string
  borderWidth: string
  /** How this identity draws the small label above a heading. */
  eyebrowStyle: EyebrowStyle
}

export type EyebrowStyle = 'flame_tag' | 'rule_line' | 'uppercase_caps' | 'pill_dot'

/**
 * The eyebrow follows the identity's shape language rather than being a
 * separate choice: a square, 2px-rule identity gets a hard filled tag, a
 * hairline-and-pill one gets a rule and letterspaced caps.
 */
const EYEBROW_BY_POSITION: Record<string, EyebrowStyle> = {
  adversary: 'flame_tag',
  clarity: 'rule_line',
  authority: 'uppercase_caps',
  direct: 'pill_dot',
}

const px = (v: string | undefined, fallback: number): number => {
  const n = parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

export const lookOf = (identity: LpIdentity): Look => ({
  display: identity.fontDisplay,
  body: identity.fontBody,
  utility: identity.fontUtility,
  displayWeight: identity.fdw,
  headingTransform: identity.h1tt,
  headingTracking: identity.h1ls,
  wordmarkTransform: identity.wmTt,
  wordmarkTracking: identity.wmLs,
  radius: px(identity.rMd, 8),
  radiusLg: px(identity.rLg, 14),
  radiusPill: identity.rPill || '999px',
  borderWidth: identity.bw || '1px',
  eyebrowStyle: EYEBROW_BY_POSITION[identity.position] || 'pill_dot',
})

/**
 * The opaque ground a tone resolves to.
 *
 * Each is a colour the brand already chose, or one derived from the brand's own
 * hue where it did not choose one, so re-toning a section moves it between that
 * brand's grounds rather than inventing a colour. `brand` fills with the
 * primary; `inverse` flips to the opposite end of the range.
 */
export const groundFor = (tone: ToneId | undefined, palette: Palette): string => {
  switch (tone) {
    case 'surface':
      return palette.surfaceAlt
    case 'dark':
      return palette.surfaceDark
    case 'brand':
      return palette.primary
    case 'inverse':
      return lum(palette.surface) < 0.5 ? palette.surfaceAlt : palette.surfaceDark
    default:
      return palette.surface
  }
}

/**
 * Build the full colour set for a ground.
 *
 * The palette states an ink, a muted ink and a rule, and each is used when it
 * can be read on the ground in question and replaced when it cannot. That is
 * the whole safety property, and it earns its keep on real data: one of our
 * brands states a near-white ink and a near-white page, which would be an
 * invisible page if the stated value were trusted.
 */
export const deriveSurface = (bg: string, palette: Palette): Surface => {
  const isDark = lum(bg) < 0.5

  const statedInk = isDark ? palette.surface : palette.ink
  const text = ratio(statedInk, bg) >= 4.5 ? statedInk : getSafeTextColor(bg).hex

  const statedMuted = palette.inkMuted
  const muted = !isDark && ratio(statedMuted, bg) >= 4.5 ? statedMuted : getSafeMutedColor(text, bg).hex

  // On a dark ground the design's own remap applies: several identities lift
  // their primary specifically so buttons and links keep contrast there.
  const accentFill = isDark ? palette.primaryDark || palette.primary : palette.primary

  // The same colour used as TEXT has to clear 4.5:1, which a saturated brand
  // colour usually does not on its own surface. Lifting it toward or away from
  // the ground keeps the hue, which is what keeps it recognisably the brand.
  let accent = accentFill
  if (ratio(accent, bg) < 4.5) {
    const towardLight = isDark
    for (let step = 1; step <= 20; step += 1) {
      accent = atLightness(accentFill, towardLight ? 0.5 + step * 0.025 : 0.5 - step * 0.025)
      if (ratio(accent, bg) >= 4.5) break
    }
    // A hue with no headroom left (a pure yellow on white) still has to read,
    // so the last resort is the verified neutral rather than an unreadable brand.
    if (ratio(accent, bg) < 4.5) accent = text
  }

  const bgL = lum(bg)
  const card = isDark
    ? atLightness(bg, Math.min(0.26, bgL + 0.07) || 0.14)
    : atLightness(bg, bgL > 0.9 ? 0.965 : Math.min(0.985, bgL + 0.06))

  const cardStatedInk = lum(card) < 0.5 ? palette.surface : palette.ink
  const cardText = ratio(cardStatedInk, card) >= 4.5 ? cardStatedInk : getSafeTextColor(card).hex
  const cardMuted = getSafeMutedColor(cardText, card).hex

  const onIdentityInk = palette.primaryInk
  const onAccentFill = ratio(onIdentityInk, accentFill) >= 4.5 ? onIdentityInk : onPrimaryText(accentFill)

  return {
    bg,
    text,
    muted,
    accent,
    accentFill,
    onAccentFill,
    card,
    cardText,
    cardMuted,
    // The brand's own rule colour when it states one that can be seen on this
    // ground, and a neutral veil when it does not. A hairline that vanishes is
    // the same bug as text that vanishes, one degree quieter.
    line: ratio(palette.line, bg) >= 1.25 ? palette.line : isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)',
    isDark,
  }
}

/**
 * Layer a section's hand-picked colours over the derived ones.
 *
 * These are free values by deliberate decision: the builder shows a live
 * contrast reading beside them and warns rather than refusing, because a tool
 * that silently corrects a colour someone chose on purpose is worse than one
 * that tells them what they have done. The protection that remains is narrow
 * and load-bearing: changing a background without naming a text colour
 * re-derives the text, so a colour verified against the old ground cannot
 * survive onto a new one it was never checked against.
 */
export const applySectionColors = (
  surface: Surface,
  palette: Palette,
  colors: LpSection['colors'],
): Surface => {
  if (!colors || Object.keys(colors).length === 0) return surface
  let out = colors.bg ? deriveSurface(colors.bg, palette) : { ...surface }
  if (colors.surface) {
    out = { ...out, card: colors.surface }
    out.cardText = getSafeTextColor(out.card).hex
    out.cardMuted = getSafeMutedColor(out.cardText, out.card).hex
  }
  if (colors.text) {
    out = { ...out, text: colors.text, muted: getSafeMutedColor(colors.text, out.bg).hex }
  }
  if (colors.accent) {
    let accent = colors.accent
    out = { ...out, accentFill: colors.accent, onAccentFill: onPrimaryText(colors.accent) }
    // The fill is the operator's to choose; the same colour used as small text
    // is still lifted until it reads, because that is a legibility floor rather
    // than a style opinion.
    if (ratio(accent, out.bg) < 4.5) {
      for (let step = 1; step <= 20; step += 1) {
        accent = atLightness(colors.accent, out.isDark ? 0.5 + step * 0.025 : 0.5 - step * 0.025)
        if (ratio(accent, out.bg) >= 4.5) break
      }
    }
    out.accent = ratio(accent, out.bg) >= 4.5 ? accent : out.text
  }
  return out
}

/** The finished surface for one section: palette, then tone, then overrides. */
export const surfaceForSection = (section: LpSection, palette: Palette): Surface =>
  applySectionColors(deriveSurface(groundFor(section.tone, palette), palette), palette, section.colors)

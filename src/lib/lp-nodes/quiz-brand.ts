/**
 * The colours a quiz wears when it is running inside a landing page.
 *
 * A quiz on its own URL derives its palette from its brand's raw tokens. Inside
 * a landing page it has to agree with the page around it, which has already
 * resolved those same tokens into grounds, verified inks and a dark remap. The
 * two would drift otherwise: the page's dark band and the quiz's idea of dark
 * would be different colours, both defensible, neither matching.
 *
 * So the quiz is handed the page's resolved palette rather than the brand's raw
 * one. It is still the brand's colour - the palette came from the brand - and
 * the brand is otherwise untouched, so the number the quiz shows and the place
 * the lead goes are unchanged. What it borrows from the identity is the faces,
 * because those are the template's and the form should not be set in a
 * different typeface to the copy beside it.
 *
 * A standalone quiz deployment does not come through here at all.
 */

import { contrastRatio } from '@/lib/builder/page-lint'
import { getSafeTextColor, onPrimaryText } from '@/lib/builder/color-system'
import type { LpIdentity } from '@/lib/lp-identities'
import type { Palette } from './palette'

type BrandLike = Record<string, unknown> & { colors?: Record<string, unknown> }

const ratio = (a: string, b: string): number => contrastRatio(a, b) ?? 0

/**
 * Rebuild a brand's colour set from the page's resolved palette.
 *
 * `onDark` picks the palette's lifted primary, which was raised until it read
 * on the dark ground, so a button inside a form on a dark card keeps the same
 * contrast as a button outside it.
 *
 * The ink is verified against the surface the quiz will actually sit on, which
 * is the host card rather than the page behind it. Everything the brand owns
 * that is not a colour passes through untouched.
 */
export const quizBrandForPage = (
  brand: BrandLike | null | undefined,
  palette: Palette,
  identity: LpIdentity,
  surface: string,
  onDark: boolean,
): BrandLike => {
  const base = (brand ?? {}) as BrandLike
  const primary = onDark ? palette.primaryDark || palette.primary : palette.primary
  const statedInk = onDark ? palette.surface : palette.ink
  const ink = ratio(statedInk, surface) >= 4.5 ? statedInk : getSafeTextColor(surface).hex

  return {
    ...base,
    colors: {
      ...(base.colors ?? {}),
      primary,
      accent: palette.accent,
      background: surface,
      cardBg: surface,
      cta: primary,
      ctaInk: ratio(palette.primaryInk, primary) >= 4.5 ? palette.primaryInk : onPrimaryText(primary),
      ink,
      inkMuted: palette.inkMuted,
      border: palette.line,
      onPrimary: onPrimaryText(primary),
      textOnDark: palette.surface,
    },
    typography: {
      ...((base.typography as Record<string, unknown>) ?? {}),
      headlineFont: identity.fontDisplay,
      bodyFont: identity.fontBody,
    },
  }
}

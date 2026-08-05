/**
 * The colours a quiz wears when it is running inside a landing page.
 *
 * The form is the most prominent thing on a landing page, and it was the one
 * thing on it not obeying the rule the rest of the page follows. Every section,
 * heading, card and button takes its colour from the template's identity; the
 * embedded quiz took its colour from the SITE's brand, because that is what a
 * standalone quiz deployment correctly does. So a Plainpath page rendered
 * cornflower blue everywhere except the form in the middle of it, which came
 * out in the brand's red.
 *
 * The split is the same one the rest of the system makes. The template identity
 * owns everything about how the page LOOKS - palette, faces, radii, marks. The
 * brand owns everything about WHO IS SPEAKING - the name, the phone number, the
 * legal text, the lead destination. So the quiz keeps the brand it belongs to
 * and borrows the identity's colours to draw with, which is what "the flow is
 * the quiz's, the appearance is the host's" was always supposed to mean.
 *
 * This does not touch a standalone quiz deployment. A quiz served on its own URL
 * has no host identity to inherit and keeps using its brand's palette.
 */

import { contrastRatio } from '@/lib/builder/page-lint'
import { getSafeTextColor, onPrimaryText } from '@/lib/builder/color-system'
import type { LpIdentity } from '@/lib/lp-identities'

type BrandLike = Record<string, unknown> & { colors?: Record<string, unknown> }

const ratio = (a: string, b: string): number => contrastRatio(a, b) ?? 0

/**
 * Rebuild a brand's colour set from a template identity.
 *
 * `onDark` picks between the identity's two published states rather than
 * inventing a third: several of the four specify a lifted primary for dark
 * grounds precisely so buttons and links keep their contrast there.
 *
 * The ink is still verified against the surface the quiz will actually sit on,
 * because that surface is the host card and the identity's ink was chosen
 * against the identity's own page. Everything the brand owns that is not a
 * colour is passed through untouched.
 */
export const quizBrandForIdentity = (
  brand: BrandLike | null | undefined,
  identity: LpIdentity,
  surface: string,
  onDark: boolean,
): BrandLike => {
  const base = (brand ?? {}) as BrandLike
  const primary = onDark ? identity.primaryDark || identity.primary : identity.primary
  const statedInk = onDark ? identity.surface : identity.ink
  const ink = ratio(statedInk, surface) >= 4.5 ? statedInk : getSafeTextColor(surface).hex

  return {
    ...base,
    colors: {
      ...(base.colors ?? {}),
      primary,
      accent: identity.accent,
      background: surface,
      cardBg: surface,
      cta: primary,
      ctaInk: ratio(identity.primaryInk, primary) >= 4.5 ? identity.primaryInk : onPrimaryText(primary),
      ink,
      inkMuted: identity.inkMuted,
      border: identity.line,
      onPrimary: onPrimaryText(primary),
      textOnDark: identity.surface,
    },
    typography: {
      ...((base.typography as Record<string, unknown>) ?? {}),
      headlineFont: identity.fontDisplay,
      bodyFont: identity.fontBody,
    },
  }
}

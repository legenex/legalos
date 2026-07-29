/**
 * Template selection and host-surface inheritance for funnel quizzes.
 *
 * This module used to let a DEPLOYMENT author its own palette. That has been
 * removed (P0-C). Colour has one owner - the brand - and a per-deployment
 * palette was the third owner that made "Don't Settle colours are completely
 * wrong" possible: the brand said one thing, the deployment's generated theme
 * said another, and whichever ran last won.
 *
 * What a deployment may still decide is which TEMPLATE it uses. That is a
 * choice among brand-derived presentations, not a new colour.
 *
 * The one remaining colour operation here is host-surface inheritance, and it
 * is not authoring: when a quiz is dropped into a landing-page card, the HOST
 * tells it which opaque colour it will sit on so text can be derived against
 * the real backdrop. That is context being passed down, not a palette being
 * invented, and removing it would put unreadable text inside light landing
 * pages.
 */

import { onPrimaryText } from './builder/color-system'

/** Template ids the quiz renderer knows. Anything else falls back to the default. */
export const QUIZ_TEMPLATE_IDS = ['default', 'minimal', 'editorial', 'gradient', 'glass', 'compact'] as const
export type QuizTemplateId = (typeof QUIZ_TEMPLATE_IDS)[number]

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

const cleanTemplateId = (v: unknown): QuizTemplateId | undefined =>
  typeof v === 'string' && (QUIZ_TEMPLATE_IDS as readonly string[]).includes(v)
    ? (v as QuizTemplateId)
    : undefined

/** The template a deployment renders with. Its own id, or the safe default. */
export const resolveQuizTemplateId = (
  deployment: { templateId?: string | null } | null | undefined,
): QuizTemplateId => cleanTemplateId(deployment?.templateId) ?? 'minimal'

type SurfacedBrand = {
  colors: Record<string, string> & { primary: string }
  [k: string]: unknown
}

/**
 * Tell a quiz which opaque surface it is being rendered onto.
 *
 * Returns a new brand whose background and card colours are the host's, so
 * every text colour the renderer derives is measured against the surface the
 * text will actually sit on. `onPrimary` is recomputed for the same reason it
 * always is: a carried-over value is the white-on-white bug waiting to happen.
 *
 * The brand's own identity colours (primary, accent) are untouched. This
 * changes where the quiz is standing, not what brand it is.
 */
export const withHostSurface = <B extends SurfacedBrand>(brand: B, surfaceColor: unknown): B => {
  if (!brand) return brand
  if (typeof surfaceColor !== 'string' || !HEX.test(surfaceColor.trim())) return brand
  const surface = surfaceColor.trim()
  const colors = { ...brand.colors, background: surface, cardBg: surface }
  colors.onPrimary = onPrimaryText(colors.primary)
  return { ...brand, colors }
}

/**
 * Per-deployment theme overrides for funnel quizzes.
 *
 * Why this module exists: a brandless quiz (the parent) owns the questions and
 * the routing; a deployment (the child) owns how it LOOKS. Until now "how it
 * looks" was only a template id, so every deployment of a brand rendered in
 * that brand's exact colours. This adds a per-deployment override layer that
 * sits on top of the brand without mutating it, so two deployments of the same
 * quiz under the same brand can look completely different.
 *
 * Rules that make wrong states unreachable rather than merely unlikely:
 *  - Overrides are VALIDATED before they are applied. A malformed colour (from
 *    an AI generation, a hand edit, or an old row) is dropped, not rendered, so
 *    a bad value degrades to the brand's own colour instead of an invalid CSS
 *    string that paints nothing.
 *  - `onPrimary` is always RECOMPUTED from the resolved primary. Overriding the
 *    primary without recomputing it would leave button text derived from the
 *    brand's old primary - the exact class of white-on-white bug color-system
 *    exists to make impossible.
 *  - Applying is immutable and total: it always returns a usable brand, even
 *    when the override object is null, partial, or garbage.
 *
 * Pure and isomorphic - no React, no server-only imports - so the builder
 * preview, the public runtime, and the server-side metadata pass all resolve
 * the same theme from the same code.
 */

import { onPrimaryText } from './builder/color-system'

/** Template ids the quiz renderer knows. Anything else falls back to the brand default. */
export const QUIZ_TEMPLATE_IDS = ['default', 'minimal', 'editorial', 'gradient', 'glass', 'compact'] as const
export type QuizTemplateId = (typeof QUIZ_TEMPLATE_IDS)[number]

export type QuizThemeColors = {
  primary?: string
  accent?: string
  background?: string
  cardBg?: string
}

export type QuizThemeTypography = {
  headlineFont?: string
  bodyFont?: string
}

export type QuizThemeSource = {
  /** How the theme was produced, for the "generated from" line in the editor. */
  kind: 'url' | 'prompt' | 'image' | 'manual'
  /** The URL / prompt text / image filename. Never a data URI - those are huge. */
  value: string
  generatedAt: string
}

export type QuizThemeOverrides = {
  templateId?: QuizTemplateId
  colors?: QuizThemeColors
  typography?: QuizThemeTypography
  source?: QuizThemeSource
  /** One sentence explaining the palette choice. Shown in the editor, never rendered publicly. */
  rationale?: string
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/** A font family name safe to interpolate into a CSS font stack. */
const FONT_NAME = /^[a-z0-9 _-]{1,48}$/i

const cleanHex = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return HEX.test(t) ? t : undefined
}

const cleanFont = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return FONT_NAME.test(t) ? t : undefined
}

const cleanTemplateId = (v: unknown): QuizTemplateId | undefined =>
  typeof v === 'string' && (QUIZ_TEMPLATE_IDS as readonly string[]).includes(v)
    ? (v as QuizTemplateId)
    : undefined

/**
 * Coerce whatever is stored in `theme_overrides` into a valid override object.
 * Every field is validated independently, so one bad colour never discards the
 * rest of the theme.
 */
export const normalizeQuizTheme = (raw: unknown): QuizThemeOverrides | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>

  const colorsIn = (o.colors && typeof o.colors === 'object' ? o.colors : {}) as Record<string, unknown>
  const colors: QuizThemeColors = {}
  for (const k of ['primary', 'accent', 'background', 'cardBg'] as const) {
    const v = cleanHex(colorsIn[k])
    if (v) colors[k] = v
  }

  const typoIn = (o.typography && typeof o.typography === 'object' ? o.typography : {}) as Record<string, unknown>
  const typography: QuizThemeTypography = {}
  for (const k of ['headlineFont', 'bodyFont'] as const) {
    const v = cleanFont(typoIn[k])
    if (v) typography[k] = v
  }

  const templateId = cleanTemplateId(o.templateId)

  const srcIn = (o.source && typeof o.source === 'object' ? o.source : null) as Record<string, unknown> | null
  const source: QuizThemeSource | undefined =
    srcIn && typeof srcIn.kind === 'string' && ['url', 'prompt', 'image', 'manual'].includes(srcIn.kind)
      ? {
          kind: srcIn.kind as QuizThemeSource['kind'],
          value: typeof srcIn.value === 'string' ? srcIn.value.slice(0, 300) : '',
          generatedAt: typeof srcIn.generatedAt === 'string' ? srcIn.generatedAt : '',
        }
      : undefined

  const rationale = typeof o.rationale === 'string' ? o.rationale.slice(0, 400) : undefined

  const hasAnything =
    templateId ||
    Object.keys(colors).length > 0 ||
    Object.keys(typography).length > 0 ||
    source ||
    rationale
  if (!hasAnything) return null

  return {
    ...(templateId ? { templateId } : {}),
    ...(Object.keys(colors).length ? { colors } : {}),
    ...(Object.keys(typography).length ? { typography } : {}),
    ...(source ? { source } : {}),
    ...(rationale ? { rationale } : {}),
  }
}

/** The subset of a brand this module reads and rewrites. */
type ThemableBrand = {
  colors: Record<string, string> & { primary: string }
  typography: Record<string, string>
  [k: string]: unknown
}

/**
 * Layer a deployment's theme over a brand.
 *
 * Returns a NEW brand object; the input is never mutated, so the same brand can
 * be themed differently for several deployments in one render pass.
 */
export const applyQuizTheme = <B extends ThemableBrand>(brand: B, raw: unknown): B => {
  const theme = normalizeQuizTheme(raw)
  if (!brand) return brand
  if (!theme || (!theme.colors && !theme.typography)) return brand

  const colors = { ...brand.colors }
  if (theme.colors) {
    for (const [k, v] of Object.entries(theme.colors)) {
      if (v) colors[k] = v
    }
    // Text ON the primary is always derived from the primary actually in play.
    // Carrying the brand's value forward here is what would put unreadable
    // text on every filled button the moment a deployment recolours.
    colors.onPrimary = onPrimaryText(colors.primary)
  }

  const typography = { ...brand.typography }
  if (theme.typography) {
    for (const [k, v] of Object.entries(theme.typography)) {
      if (v) typography[k] = v
    }
  }

  return { ...brand, colors, typography }
}

/**
 * The template a deployment renders with: its theme override wins, then its
 * own `templateId` column, then the safe default.
 */
export const resolveQuizTemplateId = (
  deployment: { templateId?: string | null; themeOverrides?: unknown } | null | undefined,
): QuizTemplateId => {
  const theme = normalizeQuizTheme(deployment?.themeOverrides)
  return theme?.templateId ?? cleanTemplateId(deployment?.templateId) ?? 'minimal'
}

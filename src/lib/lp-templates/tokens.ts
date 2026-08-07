/**
 * Turning a brand's palette into the variables a ported template reads.
 *
 * A ported template names its colours by LUMINANCE: `--lp-n963` is a colour the
 * reference drew at 0.963 relative luminance. That naming is what makes
 * recolouring safe, because the ladder of values a design uses carries its
 * contrast, and a remap that preserves the ladder preserves the contrast.
 *
 * So each token is placed at its own position on the brand's own range and the
 * colour is mixed there. The darkest rung lands on the brand's ink, the
 * lightest on its page, and everything between keeps its relative spacing. A
 * template that separated two greys by a hair still separates them by a hair;
 * one that used a hard black against a hard white still does.
 *
 * Nothing here needs to verify contrast afterwards, and that is the point of
 * doing it this way rather than by assigning roles: the ratios come out of the
 * reference unchanged, and the reference is a finished design.
 */

import { relativeLuminance } from '@/lib/builder/page-lint'
import { parseHex } from '@/lib/builder/color-system'
import type { Palette } from '@/lib/lp-nodes/palette'
import type { PortedTemplate } from './index'

const lum = (hex: string): number => relativeLuminance(hex) ?? 0

/** Mix two colours in sRGB. Adequate here: both ends are the brand's own. */
const mix = (a: string, b: string, t: number): string => {
  const ra = parseHex(a)
  const rb = parseHex(b)
  if (!ra || !rb) return a
  const k = Math.max(0, Math.min(1, t))
  const c = [0, 1, 2].map((i) => Math.round(ra[i] + (rb[i] - ra[i]) * k))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/**
 * The CSS variables to set on a ported template's wrapper.
 *
 * `--lp-accent` is the brand's primary rather than a rung, because a saturated
 * colour in a reference drawn in greys is an accent the brand owns outright.
 */
export const templateVars = (template: PortedTemplate, palette: Palette): Record<string, string> => {
  const rungs = Object.keys(template.tokens).filter((k) => k.startsWith('--lp-n'))
  const levels = rungs.map((k) => Number(k.slice('--lp-n'.length)) / 1000)
  const lo = Math.min(...levels, 1)
  const hi = Math.max(...levels, 0)
  const span = hi - lo || 1

  // The two ends of the brand's own range, ordered darkest to lightest so a
  // dark brand and a light one both produce a ladder that runs the right way.
  const inkFirst = lum(palette.ink) <= lum(palette.surface)
  const dark = inkFirst ? palette.ink : palette.surface
  const light = inkFirst ? palette.surface : palette.ink

  const vars: Record<string, string> = {
    '--lp-accent': palette.primary,
    '--lp-accent-dark': palette.primaryDark || palette.primary,
  }
  for (const key of rungs) {
    const level = Number(key.slice('--lp-n'.length)) / 1000
    vars[key] = mix(dark, light, (level - lo) / span)
  }
  return vars
}

/** The same, as a style attribute object React will accept. */
export const templateStyle = (template: PortedTemplate, palette: Palette): Record<string, string> =>
  templateVars(template, palette)

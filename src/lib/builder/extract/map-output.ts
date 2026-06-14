// Translate the three extractors' INTERNAL roles into the brand-identity output
// shape (AiBrandSchema). This is the load-bearing schema seam:
//
//   AiBrandSchema.colors.background is the DARK card backdrop the quiz / LP /
//   advertorial previews paint behind their cards (it maps to Site.brand.ink).
//   The single most common extraction bug is writing the page's LIGHT surface
//   into colors.background — which makes every funnel preview render light-on-
//   light. So: background ALWAYS comes from the dark role, never from surface.
//
// Everything here emits ONLY fields we actually extracted; gaps stay undefined
// so the LLM gap-fill can author them without clobbering real scraped values.

import { parseHex, rgbToHsl, getSafeTextColor, deriveBrandSurface } from '../color-system'
import type { ExtractedColors } from './extract-colors'
import type { ExtractedLogos } from './extract-logos'
import type { ExtractedCopy } from './extract-copy'

export type BrandColorsOut = {
  primary?: string
  accent?: string
  background?: string
  cardBg?: string
  textOnDark?: string
  success?: string
  warning?: string
  danger?: string
}

export type MappedBrand = {
  name?: string
  displayName?: string
  tagline?: string
  logoUrl?: string
  faviconUrl?: string
  colors: BrandColorsOut
  typography: { headlineFont?: string; bodyFont?: string }
  contact: { callNumber?: string }
  domains?: string[]
  legal: { copyright?: string; privacyUrl?: string; termsUrl?: string }
  _confidence: { colors: number; hasLogo: boolean; hasCopy: boolean }
}

const lum = (hex: string | undefined): number | null => {
  const rgb = hex ? parseHex(hex) : null
  return rgb ? rgbToHsl(rgb)[2] : null
}

// A solid dark backdrop, brand-hued. Used when the source had no real dark
// area (a fully-light brand still needs a dark backdrop for the funnel model).
function deriveDarkBackdrop(primary: string | undefined, ink: string | undefined): string {
  // Prefer a genuinely-dark ink if present.
  const inkLum = lum(ink)
  if (ink && inkLum != null && inkLum < 0.2) return ink
  // Else tint a deep neutral toward the brand primary.
  if (primary && parseHex(primary)) return deriveBrandSurface('#0b1220', primary, { hueBlend: 0.5 })
  return '#0b1220'
}

export function mapExtractedToOutput(input: {
  colors: ExtractedColors
  logos: ExtractedLogos
  copy: ExtractedCopy
}): MappedBrand {
  const { colors, logos, copy } = input

  // --- backdrop (dark) — NEVER the light surface ---
  const background = colors.darkBackdrop && (lum(colors.darkBackdrop) ?? 1) < 0.3
    ? colors.darkBackdrop
    : deriveDarkBackdrop(colors.primary, colors.ink)

  // --- card surface that sits on the backdrop ---
  // Prefer a real light surface; else an elevated tint of the backdrop.
  const surfaceLum = lum(colors.surface)
  const cardBg =
    colors.surface && surfaceLum != null && surfaceLum > 0.8
      ? colors.surface
      : deriveBrandSurface(background, colors.primary || background, { lighten: 0.08, hueBlend: 0.1 })

  // --- text on the dark backdrop — verified to clear WCAG ---
  const textOnDark = getSafeTextColor(background, {
    preferLight: true,
    brandLight: colors.surface,
  }).hex

  const out: MappedBrand = {
    name: copy.name,
    displayName: copy.displayName || copy.name,
    tagline: copy.tagline,
    logoUrl: logos.logoUrl,
    faviconUrl: logos.faviconUrl,
    colors: {
      primary: colors.primary,
      accent: colors.accent,
      background,
      cardBg,
      textOnDark,
      success: colors.success,
      warning: colors.warning,
      danger: colors.danger,
    },
    typography: {
      headlineFont: colors.fontHeading,
      bodyFont: colors.fontBody,
    },
    contact: { callNumber: copy.callNumber },
    domains: copy.domains && copy.domains.length ? copy.domains : undefined,
    legal: {
      copyright: copy.copyright,
      privacyUrl: copy.privacyUrl,
      termsUrl: copy.termsUrl,
    },
    _confidence: {
      colors: colors.confidence,
      hasLogo: Boolean(logos.logoUrl),
      hasCopy: Boolean(copy.name && copy.tagline),
    },
  }

  // Drop empty-string / invalid leaves so they read as "missing" downstream.
  const clean = (o: Record<string, unknown>) => {
    for (const k of Object.keys(o)) if (o[k] === '' || o[k] == null) delete o[k]
  }
  clean(out as unknown as Record<string, unknown>)
  clean(out.colors as unknown as Record<string, unknown>)
  clean(out.typography as unknown as Record<string, unknown>)
  clean(out.contact as unknown as Record<string, unknown>)
  clean(out.legal as unknown as Record<string, unknown>)

  return out
}

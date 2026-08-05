/**
 * Brand token substitution for landing-page content.
 *
 * A landing page is authored brandless, so anywhere a brand's name, number or
 * legal text belongs, the author types `{{brand.callNumber}}` and it resolves
 * at render against whichever brand the page is deployed under. That is what
 * makes one page runnable under four brands instead of four near-identical
 * copies drifting apart.
 *
 * Split out of the renderer and kept free of React so it can be walked over a
 * whole node tree without dragging a component module along with it. An unknown
 * token is left exactly as written rather than blanked, so a typo shows itself
 * on the page instead of silently deleting a phone number.
 */

type Brand = Record<string, unknown> | null | undefined

const nested = (brand: Brand, group: string, key: string): string => {
  const g = (brand as Record<string, unknown> | null)?.[group]
  if (!g || typeof g !== 'object') return ''
  const v = (g as Record<string, unknown>)[key]
  return typeof v === 'string' ? v : ''
}

const own = (brand: Brand, key: string): string => {
  const v = (brand as Record<string, unknown> | null)?.[key]
  return typeof v === 'string' ? v : ''
}

/** Initials, derived rather than stored, matching the builder's own helper. */
const shortName = (brand: Brand): string => {
  if (!brand) return 'YB'
  const stated = own(brand, 'shortName')
  if (stated) return stated
  const name = own(brand, 'displayName') || own(brand, 'name') || 'YB'
  return name.split(/\s+/).map((w) => w[0] || '').join('').slice(0, 3).toUpperCase()
}

export const resolveTokens = (
  input: unknown,
  ctx: { brand?: Brand; quiz?: Record<string, unknown> | null } = {},
): unknown => {
  if (typeof input !== 'string') return input
  const { brand, quiz } = ctx
  const year = new Date().getFullYear()
  const displayName = own(brand, 'displayName') || own(brand, 'name') || (brand ? 'Your Brand' : 'Your Brand')

  const lookup: Record<string, string> = {
    'brand.displayName': displayName,
    'brand.name': own(brand, 'name') || 'Your Brand',
    'brand.shortName': shortName(brand),
    'brand.tagline': own(brand, 'tagline'),
    'brand.primaryDomain': own(brand, 'primaryDomain'),
    'brand.callNumber': nested(brand, 'contact', 'callNumber'),
    'brand.callNumberRaw': nested(brand, 'contact', 'callNumber').replace(/[^\d+]/g, ''),
    'brand.copyright': nested(brand, 'legal', 'copyright') || `(c) ${year} ${displayName}`,
    'brand.disclaimer': nested(brand, 'legal', 'defaultDisclaimer'),
    'brand.tcpaText': nested(brand, 'legal', 'tcpaText'),
    'brand.privacyUrl': nested(brand, 'legal', 'privacyUrl'),
    'brand.termsUrl': nested(brand, 'legal', 'termsUrl'),
    'brand.logoUrl': own(brand, 'logoUrl'),
    'brand.logoUrlDark': own(brand, 'logoUrlDark'),
    'brand.faviconUrl': own(brand, 'faviconUrl'),
    'brand.primary': nested(brand, 'colors', 'primary'),
    'brand.accent': nested(brand, 'colors', 'accent'),
    'brand.logoText': displayName,
    'brand.logoMark': shortName(brand),
    'quiz.fullUrl':
      (typeof quiz?.fullUrl === 'string' && quiz.fullUrl) ||
      (typeof quiz?.domain === 'string' ? `https://${quiz.domain}${typeof quiz.path === 'string' ? quiz.path : ''}` : ''),
    'quiz.path': typeof quiz?.path === 'string' ? quiz.path : '',
    'quiz.name': typeof quiz?.name === 'string' ? quiz.name : '',
    'site.currentYear': String(year),
    'site.year': String(year),
  }

  return input.replace(/\{\{([\w.]+)\}\}/g, (whole, key: string) =>
    key in lookup ? lookup[key] : whole,
  )
}

/** Walk any structure, resolving every string it contains. */
export const fillAll = <V,>(value: V, brand: Brand): V => {
  if (typeof value === 'string') return resolveTokens(value, { brand }) as V
  if (Array.isArray(value)) return value.map((v) => fillAll(v, brand)) as unknown as V
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value as Record<string, unknown>)) {
      out[k] = fillAll((value as Record<string, unknown>)[k], brand)
    }
    return out as V
  }
  return value
}

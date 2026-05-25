export type SiteForTemplate = {
  name?: string | null
  default_phone?: string | null
  default_phone_tel?: string | null
  org_name?: string | null
  org_address?: string | null
  support_email?: string | null
}

const today = (): string =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const year = (): string => String(new Date().getFullYear())

const VARS: Record<string, (site: SiteForTemplate) => string> = {
  'site.name': (s) => s.name ?? '',
  'site.phone': (s) => s.default_phone ?? '',
  'site.phone_tel': (s) => s.default_phone_tel ?? '',
  'site.support_phone': (s) => s.default_phone ?? '',
  'site.org_name': (s) => s.org_name ?? s.name ?? '',
  'site.org_address': (s) => s.org_address ?? '',
  'site.support_email': (s) => s.support_email ?? '',
  today,
  year,
}

/**
 * Substitute {{site.*}}, {{today}}, {{year}} in a markdown template string.
 * Unknown variables are left in place so they're visible in the rendered output (easier QA).
 */
export const renderTemplateVars = (template: string, site: SiteForTemplate): string => {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key: string) => {
    const fn = VARS[key]
    if (!fn) return match
    return fn(site)
  })
}

/**
 * Apply per-Site overrides on top of a rendered template body. Overrides are a JSON object
 * of the shape `{ "search": "replace", ... }`. Each entry is a string-replace pass.
 */
export const applyTemplateOverrides = (rendered: string, overrides: Record<string, string> | null | undefined): string => {
  if (!overrides) return rendered
  let out = rendered
  for (const [search, replace] of Object.entries(overrides)) {
    out = out.split(search).join(replace)
  }
  return out
}

/**
 * Recursively walk an object / array / primitive and substitute {{site.*}} variables
 * in every string. Used to render block data server-side before it reaches the public render.
 *
 * The hard rule: public pages must NEVER show raw {{placeholders}} to end users.
 */
export const deepRenderTemplateVars = <T,>(value: T, site: SiteForTemplate): T => {
  if (value == null) return value
  if (typeof value === 'string') return renderTemplateVars(value, site) as unknown as T
  if (Array.isArray(value)) {
    return value.map((v) => deepRenderTemplateVars(v, site)) as unknown as T
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepRenderTemplateVars(v, site)
    }
    return out as T
  }
  return value
}

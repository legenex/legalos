export type Attribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  gclid?: string
  fbclid?: string
  ttclid?: string
  referrer?: string
  landing_path?: string
  session_id?: string
  user_agent?: string
  ip?: string
  fbc?: string
  fbp?: string
  captured_at?: string
}

const ATTRIBUTION_KEYS: Array<keyof Attribution> = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'ttclid',
  'referrer',
  'landing_path',
  'session_id',
]

export const pickAttributionFromObject = (raw: Record<string, unknown> | null | undefined): Attribution => {
  const out: Attribution = {}
  if (!raw) return out
  for (const key of ATTRIBUTION_KEYS) {
    const value = raw[key]
    if (typeof value === 'string' && value.trim()) {
      out[key] = value.trim()
    }
  }
  return out
}

/**
 * Derive Meta `fbc` (click ID cookie) from a raw fbclid if present. Meta expects:
 *   fbc = fb.subdomain_index.creation_time.fbclid
 * where subdomain_index = 1 for primary domain, creation_time = unix-ms.
 */
export const deriveFbc = (fbclid: string | undefined, createdAtMs: number): string | undefined => {
  if (!fbclid) return undefined
  return `fb.1.${createdAtMs}.${fbclid}`
}

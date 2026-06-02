import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

export type AuthedUser = {
  id: string | number
  email: string
  name?: string | null
  super_admin?: boolean | null
  siteBindings?: Array<{ site: { id: string | number; name: string; slug: string } | string | number; role: 'admin' | 'editor' | 'analyst' }> | null
}

export const getCurrentUser = async (): Promise<AuthedUser | null> => {
  const headers = await nextHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })
  return (user ?? null) as AuthedUser | null
}

/**
 * True if the user may act on the given Site: super admins always, otherwise
 * the user must have a siteBindings entry for that Site. Handles bindings whose
 * `site` is either a populated object or a raw id.
 */
export const isBoundToSite = (user: AuthedUser | null, siteId: string | number): boolean => {
  if (!user) return false
  if (user.super_admin) return true
  return (user.siteBindings ?? []).some((b) => {
    const bound = typeof b.site === 'object' && b.site ? b.site.id : b.site
    return Number(bound) === Number(siteId)
  })
}

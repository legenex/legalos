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

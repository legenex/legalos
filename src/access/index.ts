import type { Access, AccessArgs, FieldAccess } from 'payload'

type UserLike = {
  id: string | number
  super_admin?: boolean | null
  siteBindings?: Array<{ site: string | number; role: 'admin' | 'editor' | 'analyst' }> | null
}

const getUser = (args: AccessArgs): UserLike | null => (args.req?.user as UserLike) ?? null

export const isSuperAdmin: Access = (args) => Boolean(getUser(args)?.super_admin)

export const isSuperAdminField: FieldAccess = ({ req }) => Boolean((req?.user as UserLike)?.super_admin)

export const isAuthenticated: Access = (args) => Boolean(getUser(args))

const siteIdsForUser = (user: UserLike | null, minRole?: 'admin' | 'editor' | 'analyst'): Array<string | number> => {
  if (!user?.siteBindings) return []
  const rank: Record<string, number> = { analyst: 1, editor: 2, admin: 3 }
  const min = rank[minRole ?? 'analyst']
  return user.siteBindings
    .filter((b) => rank[b.role] >= min)
    .map((b) => b.site)
}

export const siteScopedRead: Access = (args) => {
  const user = getUser(args)
  if (!user) return false
  if (user.super_admin) return true
  const siteIds = siteIdsForUser(user, 'analyst')
  if (siteIds.length === 0) return false
  return { site: { in: siteIds } }
}

export const siteScopedWrite: Access = (args) => {
  const user = getUser(args)
  if (!user) return false
  if (user.super_admin) return true
  const siteIds = siteIdsForUser(user, 'editor')
  if (siteIds.length === 0) return false
  return { site: { in: siteIds } }
}

export const siteScopedAdmin: Access = (args) => {
  const user = getUser(args)
  if (!user) return false
  if (user.super_admin) return true
  const siteIds = siteIdsForUser(user, 'admin')
  if (siteIds.length === 0) return false
  return { site: { in: siteIds } }
}

export const anyAuthenticatedRead: Access = (args) => Boolean(getUser(args))

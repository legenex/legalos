import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { ShieldAlert } from 'lucide-react'
import { UsersClient, type UserRow, type SiteOption } from './UsersClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UsersPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/sign-in?next=/admin/settings/users')

  if (!me.super_admin) {
    return (
      <div className="p-10 max-w-[1100px]">
        <header className="mb-6">
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Users</h1>
          <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">
            LegalOS-wide roster and per-Site role bindings.
          </p>
        </header>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-10 text-center card-edge">
          <ShieldAlert className="w-10 h-10 mx-auto text-[var(--color-ink-muted)] mb-3" />
          <h2 className="text-[18px] font-semibold text-white">Super admin only</h2>
          <p className="text-[14px] text-[var(--color-ink-muted)] mt-2">
            Managing users requires LegalOS super admin permissions.
          </p>
        </div>
      </div>
    )
  }

  const payload = await getPayload({ config })

  const [usersRes, sitesRes] = await Promise.all([
    payload.find({
      collection: 'users',
      sort: '-createdAt',
      limit: 500,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'sites',
      sort: 'name',
      limit: 500,
      overrideAccess: true,
    }),
  ])

  const sites: SiteOption[] = sitesRes.docs.map((s) => ({
    id: Number(s.id),
    name: s.name,
    slug: s.slug,
  }))

  const users: UserRow[] = usersRes.docs.map((u) => {
    const bindings = (u as { siteBindings?: Array<{ site: unknown; role: 'admin' | 'editor' | 'analyst' }> }).siteBindings ?? []
    return {
      id: String(u.id),
      email: u.email,
      name: (u as { name?: string }).name ?? '',
      super_admin: Boolean((u as { super_admin?: boolean }).super_admin),
      status: ((u as { status?: 'invited' | 'active' | 'disabled' }).status ?? 'active'),
      last_login_at: (u as { last_login_at?: string | null }).last_login_at ?? null,
      created_at: (u as { createdAt?: string }).createdAt ?? null,
      bindings: bindings.map((b) => {
        const site = b.site
        const siteId =
          site && typeof site === 'object'
            ? Number((site as { id?: string | number }).id)
            : Number(site)
        return { site: siteId, role: b.role }
      }),
    }
  })

  return <UsersClient meId={String(me.id)} users={users} sites={sites} />
}

import { getPayload } from 'payload'
import config from '@payload-config'
import { Globe, Activity, Users as UsersIcon, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

const fmt = (d: string | Date | null | undefined): string => {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function OverviewPage() {
  const payload = await getPayload({ config })

  const [sitesAll, sitesActive, sitesPaused, sitesArchived, pagesAll, pagesPublished, users, audit] = await Promise.all([
    payload.count({ collection: 'sites', overrideAccess: true }),
    payload.count({ collection: 'sites', where: { status: { equals: 'active' } }, overrideAccess: true }),
    payload.count({ collection: 'sites', where: { status: { equals: 'paused' } }, overrideAccess: true }),
    payload.count({ collection: 'sites', where: { status: { equals: 'archived' } }, overrideAccess: true }),
    payload.count({ collection: 'pages', overrideAccess: true }),
    payload.count({ collection: 'pages', where: { status: { equals: 'published' } }, overrideAccess: true }),
    payload.count({ collection: 'users', overrideAccess: true }),
    payload.find({
      collection: 'audit-log',
      sort: '-createdAt',
      limit: 10,
      depth: 1,
      overrideAccess: true,
    }),
  ])

  return (
    <div className="p-10 max-w-[1400px]">
      <header className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight">Overview</h1>
        <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">Legenex LegalOS dashboard</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Active Sites"
          value={sitesActive.totalDocs}
          sub={`${sitesPaused.totalDocs} paused, ${sitesArchived.totalDocs} archived`}
          icon={<Globe className="w-4 h-4" />}
          accent
        />
        <KPICard label="Total Sites" value={sitesAll.totalDocs} sub="All statuses" icon={<Globe className="w-4 h-4" />} />
        <KPICard
          label="Published Pages"
          value={pagesPublished.totalDocs}
          sub={`${pagesAll.totalDocs} total`}
          icon={<FileText className="w-4 h-4" />}
        />
        <KPICard label="Users" value={users.totalDocs} sub="All roles" icon={<UsersIcon className="w-4 h-4" />} />
      </div>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] card-edge">
        <header className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-[16px] font-semibold">Recent Activity</h2>
        </header>
        {audit.docs.length === 0 ? (
          <EmptyState message="No activity yet. Make a change in the admin to see it here." />
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {audit.docs.map((entry) => {
              const user = entry.user as { email?: string } | string | number | null
              const email = typeof user === 'object' && user?.email ? user.email : '—'
              const entityShort = String(entry.entity_id).slice(0, 8)
              return (
                <li key={entry.id} className="px-5 py-3.5 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-info)]">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px]">
                      <span className="text-[var(--color-ink)] font-medium">{email}</span>{' '}
                      <span className="text-[var(--color-ink-muted)]">{entry.action}</span>{' '}
                      <EntityChip>{entry.entity_type}</EntityChip>{' '}
                      <span className="text-[var(--color-ink-dim)] text-[13px]">({entityShort})</span>
                    </p>
                    <p className="text-[12px] text-[var(--color-ink-dim)] mt-0.5">{fmt(entry.createdAt)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function KPICard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string
  value: number
  sub?: string
  icon?: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 card-edge overflow-hidden">
      {accent ? <span className="absolute inset-x-0 top-0 h-[3px] brand-gradient" aria-hidden /> : null}
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">{label}</p>
        {icon ? <span className="text-[var(--color-ink-muted)]">{icon}</span> : null}
      </div>
      <p className="text-[44px] font-bold text-white leading-none mt-3">{value}</p>
      {sub ? <p className="text-[12px] text-[var(--color-ink-dim)] mt-2">{sub}</p> : null}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-5 py-10 text-center text-[var(--color-ink-dim)] text-[14px]">{message}</div>
}

function EntityChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-info)] uppercase tracking-wide">
      {children}
    </span>
  )
}

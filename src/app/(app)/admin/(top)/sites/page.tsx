import Link from 'next/link'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { SitesFilters } from './SitesFilters'
import { NewSiteButton } from './CreateSiteWizard'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ status?: string; vertical?: string; q?: string }>

const VERTICAL_LABEL: Record<string, string> = {
  'mass-tort': 'Mass Tort',
  'mva': 'MVA',
  'workers-comp': "Workers' Comp",
  'personal-injury': 'Personal Injury',
  'medical-malpractice': 'Medical Malpractice',
  'class-action': 'Class Action',
  'multi': 'Multi',
}

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function SitesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const status = params.status ?? 'all'
  const vertical = params.vertical ?? ''
  const q = (params.q ?? '').trim()

  const payload = await getPayload({ config })

  const [allCount, activeCount, pausedCount, archivedCount] = await Promise.all([
    payload.count({ collection: 'sites', overrideAccess: true }),
    payload.count({ collection: 'sites', where: { status: { equals: 'active' } }, overrideAccess: true }),
    payload.count({ collection: 'sites', where: { status: { equals: 'paused' } }, overrideAccess: true }),
    payload.count({ collection: 'sites', where: { status: { equals: 'archived' } }, overrideAccess: true }),
  ])

  const ands: Where[] = []
  if (status !== 'all') ands.push({ status: { equals: status } })
  if (vertical) ands.push({ vertical: { equals: vertical } })
  if (q) ands.push({ or: [{ name: { like: q } }, { slug: { like: q } }] })
  const where: Where = ands.length > 0 ? { and: ands } : {}

  const sites = await payload.find({
    collection: 'sites',
    where,
    sort: '-updatedAt',
    limit: 100,
    overrideAccess: true,
  })

  const siteIds = sites.docs.map((s) => s.id)
  const domains = siteIds.length
    ? await payload.find({
        collection: 'domains',
        where: { and: [{ site: { in: siteIds } }, { primary: { equals: true } }] },
        limit: 200,
        overrideAccess: true,
      })
    : { docs: [] as Array<{ site: number | string | { id: number | string }; host: string; status: string }> }

  const primaryByEntry = new Map<string | number, { host: string; status: string }>()
  for (const d of domains.docs) {
    if (d.site == null) continue
    const sid = typeof d.site === 'object' ? d.site.id : d.site
    primaryByEntry.set(sid, { host: d.host, status: d.status ?? 'pending' })
  }

  return (
    <div className="p-10 max-w-[1400px]">
      <header className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Sites</h1>
          <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">Manage all legal brand sites</p>
        </div>
        <NewSiteButton sources={sites.docs.map((s) => ({ id: Number(s.id), name: s.name, slug: s.slug }))} />
      </header>

      <StatusTabs
        current={status}
        counts={{ all: allCount.totalDocs, active: activeCount.totalDocs, paused: pausedCount.totalDocs, archived: archivedCount.totalDocs }}
        q={q}
        vertical={vertical}
      />

      <SitesFilters status={status} vertical={vertical} q={q} />

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] card-edge overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1.8fr_0.9fr_1fr_0.9fr_0.9fr_60px] px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold border-b border-[var(--color-border)]">
          <span>Site</span>
          <span>Primary Domain</span>
          <span>Vertical</span>
          <span>Rebuild</span>
          <span>Status</span>
          <span>Updated</span>
          <span></span>
        </div>
        {sites.docs.length === 0 ? (
          <div className="px-5 py-12 text-center text-[var(--color-ink-dim)]">No sites match your filters.</div>
        ) : (
          <ul>
            {sites.docs.map((site) => {
              const primary = primaryByEntry.get(site.id)
              const previewUrl = `/?site=${encodeURIComponent(site.slug)}`
              return (
                <li
                  key={site.id}
                  className="grid grid-cols-[1.6fr_1.8fr_0.9fr_1fr_0.9fr_0.9fr_60px] px-5 py-4 items-center border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <Link href={`/admin/sites/${site.slug}`} className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-9 h-9 shrink-0 rounded-md flex items-center justify-center text-[12px] font-bold text-white"
                      style={{ backgroundColor: site.brand?.primary ?? '#0B1F3A' }}
                    >
                      {initials(site.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-[14px] truncate">{site.name}</span>
                      <span className="block text-[12px] text-[var(--color-ink-dim)] truncate">{site.slug}</span>
                    </span>
                  </Link>
                  <span className="text-[13px]">
                    {primary ? (
                      <a href={`https://${primary.host}`} target="_blank" rel="noreferrer" className="text-[var(--color-info)] hover:underline">
                        {primary.host}
                      </a>
                    ) : (
                      <span className="text-[var(--color-ink-dim)] italic">
                        Not connected{' '}
                        <Link href={`/cms/collections/domains/create?site=${site.id}`} className="text-[var(--color-info)] not-italic hover:underline">
                          Add Domain
                        </Link>
                      </span>
                    )}
                  </span>
                  <span className="text-[13px]">{VERTICAL_LABEL[site.vertical] ?? site.vertical}</span>
                  <span>
                    {primary?.status === 'active' ? (
                      <RebuildBadge ok />
                    ) : (
                      <RebuildBadge />
                    )}
                  </span>
                  <span>
                    <StatusBadge status={site.status} />
                  </span>
                  <span className="text-[13px] text-[var(--color-ink-muted)]">{fmtDate(site.updatedAt ?? null)}</span>
                  <Link
                    href={previewUrl}
                    target="_blank"
                    className="text-[var(--color-info)] hover:text-white inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--color-surface-3)] transition-colors"
                    aria-label="Open site preview"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatusTabs({
  current,
  counts,
  q,
  vertical,
}: {
  current: string
  counts: { all: number; active: number; paused: number; archived: number }
  q: string
  vertical: string
}) {
  const tabs: Array<{ key: string; label: string; count: number }> = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'paused', label: 'Paused', count: counts.paused },
    { key: 'archived', label: 'Archived', count: counts.archived },
  ]
  return (
    <div className="inline-flex p-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] mb-4">
      {tabs.map((tab) => {
        const params = new URLSearchParams()
        if (tab.key !== 'all') params.set('status', tab.key)
        if (q) params.set('q', q)
        if (vertical) params.set('vertical', vertical)
        const href = `/admin/sites${params.toString() ? `?${params}` : ''}`
        const active = current === tab.key
        return (
          <Link
            key={tab.key}
            href={href}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              active ? 'bg-[var(--color-surface-3)] text-white' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            {tab.label} ({tab.count})
          </Link>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    active: { label: 'Active', bg: 'rgba(45,190,108,0.12)', fg: '#7FE3A8', border: 'rgba(45,190,108,0.3)' },
    paused: { label: 'Paused', bg: 'rgba(232,177,75,0.12)', fg: '#F4C97F', border: 'rgba(232,177,75,0.3)' },
    archived: { label: 'Archived', bg: 'rgba(140,148,166,0.12)', fg: '#A8AFC0', border: 'rgba(140,148,166,0.3)' },
  }
  const v = map[status] ?? map.archived
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: v.bg, color: v.fg, border: `1px solid ${v.border}` }}
    >
      {v.label}
    </span>
  )
}

function RebuildBadge({ ok }: { ok?: boolean }) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] text-[var(--color-pos)] font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-[var(--color-warn)] font-medium">
      <AlertCircle className="w-3.5 h-3.5" /> Partial
    </span>
  )
}

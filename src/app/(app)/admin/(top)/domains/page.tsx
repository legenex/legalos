import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ExternalLink, Star, ShieldCheck, AlertCircle, Clock, Settings as SettingsIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type SiteLite = { id: string | number; name: string; slug: string }

export default async function DomainsIndexPage() {
  const payload = await getPayload({ config })
  const [sitesRes, domainsRes] = await Promise.all([
    payload.find({ collection: 'sites', limit: 500, overrideAccess: true }),
    payload.find({
      collection: 'domains',
      sort: ['site', 'kind', '-primary', 'host'],
      limit: 1000,
      overrideAccess: true,
    }),
  ])

  const siteById = new Map<string | number, SiteLite>()
  for (const s of sitesRes.docs) siteById.set(s.id, { id: s.id, name: s.name, slug: s.slug })

  const previewCount = domainsRes.docs.filter((d) => (d.kind ?? 'custom') === 'preview').length
  const customCount = domainsRes.docs.length - previewCount
  const activeCount = domainsRes.docs.filter((d) => d.status === 'active').length
  const pendingCount = domainsRes.docs.filter((d) => d.status === 'pending' || d.status === 'error').length

  return (
    <div className="p-10 max-w-[1400px]">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-white">Domains</h1>
        <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">
          Every domain across every site. To connect or verify a domain, open its site&apos;s Domains settings.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total" value={domainsRes.docs.length} />
        <Stat label="Active" value={activeCount} tone="pos" />
        <Stat label="Pending / Error" value={pendingCount} tone="warn" />
        <Stat label="Custom / Preview" value={`${customCount} / ${previewCount}`} />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] card-edge overflow-hidden">
        <div className="grid grid-cols-[2fr_1.4fr_110px_110px_110px_120px_80px] px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold border-b border-[var(--color-border)]">
          <span>Hostname</span>
          <span>Site</span>
          <span>Kind</span>
          <span>Status</span>
          <span>SSL</span>
          <span>Last Checked</span>
          <span className="text-right">Manage</span>
        </div>
        {domainsRes.docs.length === 0 ? (
          <div className="px-5 py-12 text-center text-[var(--color-ink-dim)]">
            No domains connected yet. Open a site&apos;s settings to connect one.
          </div>
        ) : (
          <ul>
            {domainsRes.docs.map((d) => {
              const sid =
                typeof d.site === 'object' && d.site
                  ? (d.site as { id: string | number }).id
                  : (d.site as string | number)
              const site = siteById.get(sid)
              return (
                <li
                  key={d.id}
                  className="grid grid-cols-[2fr_1.4fr_110px_110px_110px_120px_80px] px-5 py-4 items-center border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)] transition-colors text-[13px]"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      {d.primary ? (
                        <Star
                          className="w-3.5 h-3.5 text-[var(--color-warn)] fill-[var(--color-warn)] shrink-0"
                          aria-label="Primary"
                        />
                      ) : null}
                      <a
                        href={`https://${d.host}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-info)] hover:underline truncate"
                      >
                        {d.host}
                      </a>
                    </span>
                  </span>
                  <span>
                    {site ? (
                      <Link href={`/admin/sites/${site.slug}`} className="hover:underline">
                        {site.name}
                      </Link>
                    ) : (
                      <span className="text-[var(--color-ink-dim)] italic">— unlinked —</span>
                    )}
                  </span>
                  <KindBadge kind={(d.kind ?? 'custom') as 'preview' | 'custom'} />
                  <StatusBadge status={d.status ?? 'pending'} />
                  <SslBadge status={d.ssl_status ?? 'unknown'} />
                  <span className="text-[var(--color-ink-muted)]">{fmtDate(d.last_checked_at ?? null)}</span>
                  <span className="flex justify-end gap-1.5">
                    {site ? (
                      <Link
                        href={`/admin/sites/${site.slug}/settings/domains`}
                        className="text-[var(--color-ink-muted)] hover:text-white inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--color-surface-3)] transition-colors"
                        aria-label="Manage in site settings"
                      >
                        <SettingsIcon className="w-4 h-4" />
                      </Link>
                    ) : null}
                    <a
                      href={`https://${d.host}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-ink-muted)] hover:text-white inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--color-surface-3)] transition-colors"
                      aria-label="Open in browser"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: 'pos' | 'warn' }) {
  const color = tone === 'pos' ? 'var(--color-pos)' : tone === 'warn' ? 'var(--color-warn)' : 'white'
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">{label}</p>
      <p className="text-[22px] font-semibold mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

function KindBadge({ kind }: { kind: 'preview' | 'custom' }) {
  const isPreview = kind === 'preview'
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md w-fit"
      style={{
        background: isPreview ? 'rgba(140,148,166,0.12)' : 'rgba(72,142,255,0.12)',
        color: isPreview ? '#A8AFC0' : '#9BC4FF',
        border: `1px solid ${isPreview ? 'rgba(140,148,166,0.3)' : 'rgba(72,142,255,0.3)'}`,
      }}
    >
      {isPreview ? 'Preview' : 'Custom'}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string; Icon: typeof ShieldCheck }> = {
    active: { label: 'Active', bg: 'rgba(45,190,108,0.12)', fg: '#7FE3A8', border: 'rgba(45,190,108,0.3)', Icon: ShieldCheck },
    verified: { label: 'Verified', bg: 'rgba(45,190,108,0.12)', fg: '#7FE3A8', border: 'rgba(45,190,108,0.3)', Icon: ShieldCheck },
    provisioning: { label: 'Provisioning', bg: 'rgba(232,177,75,0.12)', fg: '#F4C97F', border: 'rgba(232,177,75,0.3)', Icon: Clock },
    pending: { label: 'Pending', bg: 'rgba(232,177,75,0.12)', fg: '#F4C97F', border: 'rgba(232,177,75,0.3)', Icon: Clock },
    error: { label: 'Error', bg: 'rgba(192,58,43,0.12)', fg: '#F09080', border: 'rgba(192,58,43,0.3)', Icon: AlertCircle },
  }
  const v = map[status] ?? map.pending
  const Icon = v.Icon
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md w-fit"
      style={{ background: v.bg, color: v.fg, border: `1px solid ${v.border}` }}
    >
      <Icon className="w-3 h-3" />
      {v.label}
    </span>
  )
}

function SslBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; fg: string }> = {
    active: { label: 'Active', fg: 'var(--color-pos)' },
    pending: { label: 'Pending', fg: 'var(--color-warn)' },
    error: { label: 'Error', fg: 'var(--color-neg)' },
    unknown: { label: 'Unknown', fg: 'var(--color-ink-dim)' },
  }
  const v = map[status] ?? map.unknown
  return (
    <span className="text-[12px] font-medium" style={{ color: v.fg }}>
      {v.label}
    </span>
  )
}

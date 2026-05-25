import { getPayload } from 'payload'
import config from '@payload-config'
import { AddDomainButton } from './AddDomainModal'
import { BrandDomainRow } from './BrandDomainRow'

export const dynamic = 'force-dynamic'

type SiteLite = { id: number; name: string; slug: string }
type DnsRecord = { type: string; name: string; value: string; note?: string }
type DomainLite = {
  id: number
  host: string
  kind: 'preview' | 'custom'
  status: string
  primary: boolean
  siteId: number | null
  siteSlug: string | null
  verificationToken: string | null
  dnsRecords: DnsRecord[]
  lastCheckedAt: string | null
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join('')
    .toUpperCase()

const brandColorOf = (slug: string): string => {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  const palette = ['#4F86E1', '#FF5C75', '#2DBE6C', '#B57DE1', '#E8B14B', '#5CC1E1']
  return palette[h % palette.length]
}

export default async function DomainsIndexPage() {
  const payload = await getPayload({ config })
  const [sitesRes, domainsRes] = await Promise.all([
    payload.find({ collection: 'sites', limit: 500, overrideAccess: true }),
    payload.find({
      collection: 'domains',
      sort: ['-primary', 'kind', 'host'],
      limit: 1000,
      overrideAccess: true,
    }),
  ])

  const sites: SiteLite[] = sitesRes.docs.map((s) => ({ id: Number(s.id), name: s.name, slug: s.slug }))
  const siteById = new Map<number, SiteLite>(sites.map((s) => [s.id, s]))

  const domains: DomainLite[] = domainsRes.docs.map((d) => {
    const siteId = d.site == null ? null : typeof d.site === 'object' ? Number(d.site.id) : Number(d.site)
    const siteSlug = siteId != null ? (siteById.get(siteId)?.slug ?? null) : null
    return {
      id: Number(d.id),
      host: d.host,
      kind: (d.kind ?? 'custom') as 'preview' | 'custom',
      status: d.status ?? 'pending',
      primary: Boolean(d.primary),
      siteId,
      siteSlug,
      verificationToken: d.verification_token ?? null,
      dnsRecords: Array.isArray(d.dns_records) ? (d.dns_records as DnsRecord[]) : [],
      lastCheckedAt: d.last_checked_at ?? null,
    }
  })

  const unassigned = domains.filter((d) => d.siteId == null)
  const byBrand = new Map<number, DomainLite[]>()
  for (const d of domains) {
    if (d.siteId == null) continue
    const arr = byBrand.get(d.siteId) ?? []
    arr.push(d)
    byBrand.set(d.siteId, arr)
  }
  const brandGroups = [...byBrand.entries()]
    .map(([siteId, list]) => ({ site: siteById.get(siteId), list }))
    .filter((g): g is { site: SiteLite; list: DomainLite[] } => Boolean(g.site))
    .sort((a, b) => a.site.name.localeCompare(b.site.name))

  return (
    <div className="p-10 max-w-[1400px]">
      <header className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Domains</h1>
          <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">
            All domain configuration lives here: add, verify DNS, set primary, attach/detach to brands, delete.
          </p>
        </div>
        <AddDomainButton />
      </header>

      <div className="space-y-8">
        {unassigned.length > 0 ? (
          <BrandGroup
            heading="Unassigned"
            badge={String(unassigned.length)}
            tint="#5C6376"
            initials="—"
            sub="Expand a row to attach it to a brand"
          >
            {unassigned.map((d) => (
              <BrandDomainRow key={d.id} domain={d} sites={sites} />
            ))}
          </BrandGroup>
        ) : null}

        {brandGroups.map(({ site, list }) => (
          <BrandGroup
            key={site.id}
            heading={site.name}
            badge={String(list.length)}
            tint={brandColorOf(site.slug)}
            initials={initialsOf(site.name)}
            sub={null}
          >
            {list.map((d) => (
              <BrandDomainRow key={d.id} domain={d} sites={sites} />
            ))}
          </BrandGroup>
        ))}

        {domains.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-1)] py-16 text-center">
            <p className="text-[var(--color-ink-muted)] text-[14px]">
              No domains yet. Click <strong className="text-white">Add Domain</strong> to add your first one.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function BrandGroup({
  heading,
  badge,
  initials,
  tint,
  sub,
  children,
}: {
  heading: string
  badge: string
  initials: string
  tint: string
  sub: string | null
  children: React.ReactNode
}) {
  return (
    <section>
      <header className="flex items-center gap-3 mb-3">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[11px] font-bold text-white"
          style={{ background: tint }}
        >
          {initials}
        </span>
        <h2 className="text-[16px] font-semibold text-white">{heading}</h2>
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-surface-1)] text-[var(--color-ink-muted)] border border-[var(--color-border)]">
          {badge}
        </span>
        {sub ? <span className="text-[12px] text-[var(--color-ink-dim)] ml-2">{sub}</span> : null}
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { DomainRow } from './DomainRow'
import { DomainsAutoVerify } from './DomainsAutoVerify'
import { ConnectDomainButton } from './ConnectDomainModal'
import { InfraReadinessBanner } from '@/components/app/InfraReadinessBanner'
import { checkInfra } from '@/lib/infra-check'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export default async function DomainsPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const siteRes = await payload.find({
    collection: 'sites',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  const site = siteRes.docs[0]
  if (!site) notFound()
  const domains = await payload.find({
    collection: 'domains',
    where: { site: { equals: site.id } },
    sort: ['kind', '-createdAt'], // preview first, then custom by created desc
    limit: 100,
    overrideAccess: true,
  })
  const devSkipAllowed = (process.env.LEGALOS_DEV_SKIP_DNS ?? 'false').toLowerCase() === 'true'
  const infra = await checkInfra()

  return (
    <div className="p-10 max-w-[1400px]">
      <header className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Domains</h1>
          <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">
            Manage domains for {site.name}. Preview subdomain is always live; custom domains require DNS verification.
          </p>
        </div>
        <ConnectDomainButton siteId={Number(site.id)} siteSlug={slug} devSkipAllowed={devSkipAllowed} />
      </header>

      <InfraReadinessBanner infra={infra} />

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] card-edge">
        <div className="grid grid-cols-[2fr_120px_110px_110px_110px_60px] px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold border-b border-[var(--color-border)]">
          <span>Hostname</span>
          <span>Kind</span>
          <span>Status</span>
          <span>Primary</span>
          <span>Added</span>
          <span className="text-right">Actions</span>
        </div>
        {domains.docs.length === 0 ? (
          <div className="px-5 py-12 text-center text-[var(--color-ink-dim)]">
            No domains yet. Click <strong>Connect Domain</strong> to add one.
          </div>
        ) : (
          <ul>
            {domains.docs.map((d) => (
              <DomainRow
                key={d.id}
                domain={{
                  id: Number(d.id),
                  host: d.host,
                  kind: (d.kind ?? 'custom') as 'preview' | 'custom',
                  status: d.status ?? 'pending',
                  ssl_status: d.ssl_status ?? 'unknown',
                  primary: Boolean(d.primary),
                  createdAt: d.createdAt ?? new Date().toISOString(),
                  last_checked_at: d.last_checked_at ?? null,
                }}
                siteId={Number(site.id)}
                siteSlug={slug}
                devSkipAllowed={devSkipAllowed}
              />
            ))}
          </ul>
        )}
      </div>

      <DomainsAutoVerify
        siteSlug={slug}
        pendingDomains={domains.docs
          .filter((d) => (d.kind ?? 'custom') === 'custom' && (d.status === 'pending' || d.status === 'error'))
          .map((d) => ({ id: Number(d.id), host: d.host, status: d.status ?? 'pending' }))}
      />

      <p className="mt-5 text-[12px] text-[var(--color-ink-dim)]">
        Preview URL pattern: <code className="text-[var(--color-info)] font-mono">{`{slug}.${process.env.LEGALOS_PREVIEW_DOMAIN ?? 'preview.legenex.com'}`}</code>. Custom-domain connections target{' '}
        <code className="text-[var(--color-info)] font-mono">{process.env.LEGALOS_CNAME_TARGET ?? 'cname.legenex.com'}</code>
        {process.env.LEGALOS_A_TARGET ? <> or A → <code className="text-[var(--color-info)] font-mono">{process.env.LEGALOS_A_TARGET}</code></> : null}.
      </p>
    </div>
  )
}

import { getPayload } from 'payload'
import config from '@payload-config'
import { NewSiteButton } from '../../sites/CreateSiteWizard'
import { BrandCard, type BrandData } from './BrandCard'

export const dynamic = 'force-dynamic'

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)

export default async function BrandIdentitiesPage() {
  const payload = await getPayload({ config })
  const [sitesRes, domainsRes] = await Promise.all([
    payload.find({ collection: 'sites', limit: 500, sort: 'name', overrideAccess: true }),
    payload.find({ collection: 'domains', limit: 1000, overrideAccess: true }),
  ])

  const domainCountBySite = new Map<number, number>()
  for (const d of domainsRes.docs) {
    if (d.site == null) continue
    const sid = typeof d.site === 'object' ? Number(d.site.id) : Number(d.site)
    domainCountBySite.set(sid, (domainCountBySite.get(sid) ?? 0) + 1)
  }

  const brands: BrandData[] = sitesRes.docs.map((s) => {
    // legal + typography are new groups not yet in the committed payload-types,
    // so read them through a loose cast until types are regenerated on the server.
    const loose = s as unknown as Record<string, unknown>
    const b = (s.brand ?? {}) as Record<string, unknown>
    const legal = (loose.legal ?? {}) as Record<string, unknown>
    const typo = (loose.typography ?? {}) as Record<string, unknown>
    const baseSize = str(typo.base_size, 'md')
    return {
      id: Number(s.id),
      name: s.name,
      slug: s.slug,
      status: str(s.status, 'draft'),
      domainCount: domainCountBySite.get(Number(s.id)) ?? 0,
      brand: {
        display_name: str(b.display_name),
        short_name: str(b.short_name),
        tagline_brand: str(b.tagline_brand),
        logo_url: str(b.logo_url),
        logo_url_dark: str(b.logo_url_dark),
        favicon_url: str(b.favicon_url),
        primary: str(b.primary, '#0B1F3A'),
        accent: str(b.accent, '#E8B14B'),
        surface: str(b.surface, '#F7F5F0'),
        ink: str(b.ink, '#0E1116'),
        muted: str(b.muted, '#5C6470'),
        success: str(b.success, '#1F9D55'),
        warning: str(b.warning, '#E8B14B'),
        danger: str(b.danger, '#C03A2B'),
      },
      legal: {
        copyright: str(legal.copyright),
        tcpa_text: str(legal.tcpa_text),
        privacy_url: str(legal.privacy_url),
        terms_url: str(legal.terms_url),
        default_disclaimer: str(legal.default_disclaimer),
      },
      typography: {
        headline_font: str(typo.headline_font, 'Inter'),
        body_font: str(typo.body_font, 'Inter'),
        base_size: baseSize === 'sm' || baseSize === 'lg' ? baseSize : 'md',
      },
    }
  })

  const sources = sitesRes.docs.map((s) => ({ id: Number(s.id), name: s.name, slug: s.slug }))

  return (
    <div className="p-10 max-w-[1400px]">
      <header className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Brand Identities</h1>
          <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">
            Each brand is a Site: its logo, colors, typography, and legal copy. Funnels and pages inherit these.
          </p>
        </div>
        <NewSiteButton sources={sources} />
      </header>

      {brands.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-1)] py-16 text-center">
          <p className="text-[var(--color-ink-muted)] text-[14px]">
            No brands yet. Click <strong className="text-white">New Site</strong> to create your first one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {brands.map((b) => (
            <BrandCard key={b.id} data={b} />
          ))}
        </div>
      )}
    </div>
  )
}

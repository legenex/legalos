import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { ShieldAlert } from 'lucide-react'
import { IntegrationsForm, type SiteOption } from './IntegrationsForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function IntegrationsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/sign-in?next=/admin/settings/integrations')

  if (!me.super_admin) {
    return (
      <div className="p-10 max-w-[1100px]">
        <header className="mb-6">
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Integrations</h1>
          <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">
            LegalOS-wide integrations (SMTP, Slack, GitHub, Search Console).
          </p>
        </header>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-10 text-center card-edge">
          <ShieldAlert className="w-10 h-10 mx-auto text-[var(--color-ink-muted)] mb-3" />
          <h2 className="text-[18px] font-semibold text-white">Super admin only</h2>
          <p className="text-[14px] text-[var(--color-ink-muted)] mt-2">
            Managing integrations requires LegalOS super admin permissions.
          </p>
        </div>
      </div>
    )
  }

  const payload = await getPayload({ config })
  const [cfg, sitesRes] = await Promise.all([
    payload.findGlobal({ slug: 'integration-config', overrideAccess: true }),
    payload.find({ collection: 'sites', sort: 'name', limit: 500, overrideAccess: true }),
  ])

  const sites: SiteOption[] = sitesRes.docs.map((s) => ({ id: Number(s.id), name: s.name }))

  const smtp = (cfg as { smtp?: Record<string, unknown> }).smtp ?? {}
  const slack = (cfg as { slack?: { webhooks?: Array<{ label?: string; url?: string; events?: string }> } }).slack ?? {}
  const github = (cfg as { github?: { repos?: Array<{ site?: { id?: number | string } | number | string | null; repo_url?: string }> } }).github ?? {}
  const sc = (cfg as { search_console_root?: { verification_method?: string; verification_token?: string } }).search_console_root ?? {}
  const billing = (cfg as { billing?: { plan?: string; notes?: string } }).billing ?? {}

  return (
    <IntegrationsForm
      sites={sites}
      initial={{
        smtp: {
          host: (smtp.host as string) ?? '',
          port: Number(smtp.port ?? 587),
          user: (smtp.user as string) ?? '',
          pass: (smtp.pass as string) ?? '',
          from_name: (smtp.from_name as string) ?? 'Legenex LegalOS',
          from_email: (smtp.from_email as string) ?? 'noreply@legenex.com',
        },
        slack_webhooks: (slack.webhooks ?? []).map((w) => ({
          label: w.label ?? '',
          url: w.url ?? '',
          events: w.events ?? '',
        })),
        github_repos: (github.repos ?? []).map((r) => {
          const s = r.site
          const siteId =
            s && typeof s === 'object'
              ? Number((s as { id?: string | number }).id)
              : s != null
                ? Number(s)
                : null
          return { site: siteId, repo_url: r.repo_url ?? '' }
        }),
        sc: {
          method: sc.verification_method ?? '',
          token: sc.verification_token ?? '',
        },
        billing: { plan: billing.plan ?? 'internal', notes: billing.notes ?? '' },
      }}
    />
  )
}

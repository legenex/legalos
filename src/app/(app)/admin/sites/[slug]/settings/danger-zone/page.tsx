import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AlertOctagon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export default async function DangerZonePage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const siteRes = await payload.find({
    collection: 'sites',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  const site = siteRes.docs[0]; if (!site) notFound()

  return (
    <div className="p-10 max-w-[900px]">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-white">Danger Zone</h1>
        <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">Destructive actions for {site.name}</p>
      </header>

      <div className="space-y-4">
        <DangerCard
          title="Pause Site"
          body="Pause public traffic to this site. Visitors will see a maintenance page. Admin remains accessible. Reversible."
          action="Pause Site"
        />
        <DangerCard
          title="Archive Site"
          body="Soft-delete. Site is hidden from the public router and the default Sites list. Content is preserved and restorable."
          action="Archive Site"
        />
        <DangerCard
          title="Delete Site"
          body="Permanently delete this Site and all its Pages, Quizzes, Landing Pages, Numbers, and Tracking config. Leads are preserved. Type-to-confirm required."
          action="Delete Site"
          destructive
        />
      </div>
    </div>
  )
}

function DangerCard({
  title,
  body,
  action,
  destructive,
}: {
  title: string
  body: string
  action: string
  destructive?: boolean
}) {
  return (
    <section className={`rounded-xl border ${destructive ? 'border-[var(--color-neg)]/40' : 'border-[var(--color-border)]'} bg-[var(--color-surface-1)] p-5 card-edge flex items-start gap-4`}>
      <span className={`w-9 h-9 shrink-0 rounded-lg inline-flex items-center justify-center ${destructive ? 'text-[var(--color-neg)] bg-[var(--color-neg)]/10' : 'text-[var(--color-warn)] bg-[var(--color-warn)]/10'}`}>
        <AlertOctagon className="w-4 h-4" />
      </span>
      <div className="flex-1">
        <h2 className="text-[15px] font-semibold text-white">{title}</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)] mt-1 leading-relaxed">{body}</p>
      </div>
      <button
        type="button"
        disabled
        className={`shrink-0 text-[13px] font-semibold px-4 py-2 rounded-md disabled:opacity-50 ${
          destructive ? 'bg-[var(--color-neg)]/15 text-[var(--color-neg)] border border-[var(--color-neg)]/30' : 'bg-[var(--color-surface-3)] text-white border border-[var(--color-border-strong)]'
        }`}
        title="Wired in next phase"
      >
        {action}
      </button>
    </section>
  )
}

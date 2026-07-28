import { redirect } from 'next/navigation'
import { CheckCircle2, CircleDashed, CircleDot, FlaskConical, AlertTriangle, Terminal } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { ENTRIES, STATUS_LABEL, type ItemStatus, type BuildLogEntry } from '@/lib/buildlog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const STATUS_STYLE: Record<ItemStatus, { icon: typeof CheckCircle2; className: string }> = {
  shipped: { icon: CheckCircle2, className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  partial: { icon: CircleDot, className: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  open: { icon: CircleDashed, className: 'text-[var(--color-ink-muted)] bg-white/5 border-[var(--color-border)]' },
}

const formatDate = (iso: string): string => {
  // Absolute and unambiguous. A build log read weeks later must not say "today".
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function StatusChip({ status }: { status: ItemStatus }) {
  const { icon: Icon, className } = STATUS_STYLE[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap ${className}`}
    >
      <Icon className="w-3 h-3" />
      {STATUS_LABEL[status]}
    </span>
  )
}

function Entry({ entry }: { entry: BuildLogEntry }) {
  return (
    <section className="border-t border-[var(--color-border)] pt-8 mt-8 first:mt-0 first:border-t-0 first:pt-0">
      <header className="mb-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-[20px] font-semibold text-white tracking-tight">{entry.title}</h2>
          <time
            dateTime={entry.date}
            className="text-[12px] font-mono text-[var(--color-ink-muted)] tabular-nums"
          >
            {formatDate(entry.date)}
          </time>
        </div>
        <p className="text-[14.5px] text-[var(--color-ink-muted)] mt-2 leading-relaxed max-w-[75ch]">
          {entry.summary}
        </p>
      </header>

      <ol className="flex flex-col gap-3">
        {entry.items.map((item, i) => (
          <li
            key={`${entry.date}-${i}`}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 card-edge"
          >
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              {item.ref ? (
                <span className="font-mono text-[11px] text-[var(--color-ink-muted)] tabular-nums">
                  #{item.ref}
                </span>
              ) : null}
              <h3 className="text-[15px] font-semibold text-white">{item.title}</h3>
              <StatusChip status={item.status} />
            </div>
            <p className="text-[13.5px] text-[var(--color-ink-muted)] leading-relaxed max-w-[80ch]">
              {item.detail}
            </p>
            {item.files?.length ? (
              <ul className="flex flex-wrap gap-1.5 mt-3">
                {item.files.map((f) => (
                  <li
                    key={f}
                    className="font-mono text-[10.5px] text-[var(--color-ink-muted)] bg-black/25 border border-[var(--color-border)] rounded px-1.5 py-0.5 break-all"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="grid gap-4 mt-6 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 card-edge">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white mb-3">
            <FlaskConical className="w-3.5 h-3.5 text-[var(--color-ink-muted)]" />
            What was checked
          </h3>
          <ul className="flex flex-col gap-3">
            {entry.verification.map((v) => (
              <li key={v.label}>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                      v.state === 'verified' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-[13px] font-medium text-white">{v.label}</span>
                  <span
                    className={`text-[10.5px] font-mono uppercase tracking-wider ${
                      v.state === 'verified' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {v.state === 'verified' ? 'verified' : 'not run'}
                  </span>
                </div>
                <p className="text-[12.5px] text-[var(--color-ink-muted)] leading-relaxed mt-1 pl-3.5">
                  {v.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          {entry.deployNotes?.length ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 card-edge">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white mb-3">
                <Terminal className="w-3.5 h-3.5 text-[var(--color-ink-muted)]" />
                On deploy
              </h3>
              <ul className="flex flex-col gap-2">
                {entry.deployNotes.map((n) => (
                  <li key={n} className="text-[12.5px] text-[var(--color-ink-muted)] leading-relaxed pl-3 relative">
                    <span className="absolute left-0 top-[0.62em] w-1.5 h-px bg-[var(--color-border)]" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {entry.openIssues?.length ? (
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.04] p-4">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-amber-300 mb-3">
                <AlertTriangle className="w-3.5 h-3.5" />
                Still open
              </h3>
              <ul className="flex flex-col gap-2">
                {entry.openIssues.map((n) => (
                  <li key={n} className="text-[12.5px] text-[var(--color-ink-muted)] leading-relaxed pl-3 relative">
                    <span className="absolute left-0 top-[0.62em] w-1.5 h-px bg-amber-400/40" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default async function BuildLogPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/sign-in?next=/admin/buildlog')

  return (
    <div className="p-10 max-w-[1100px]">
      <header className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-white">Build log</h1>
        <p className="text-[var(--color-ink-muted)] text-[15px] mt-1 max-w-[75ch]">
          What shipped, what is only partly done, and what was actually checked rather than assumed. Newest
          first.
        </p>
      </header>

      {ENTRIES.map((entry, i) => (
        <Entry key={`${entry.date}-${i}`} entry={entry} />
      ))}
    </div>
  )
}

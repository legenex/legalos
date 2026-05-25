import { runSystemReport, type SystemCheck, type Category, type CheckStatus } from '@/lib/system-health'
import { CheckCircle2, AlertCircle, XCircle, Info, Activity, GitCommit, Database, RefreshCw, Globe, Sparkles } from 'lucide-react'
import { refreshSystemReport } from './actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CATEGORY_LABEL: Record<Category, string> = {
  deploy: 'Deploy',
  runtime: 'Runtime',
  database: 'Data',
  integrations: 'Integrations',
  dns: 'DNS & SSL',
}

const CATEGORY_ICON: Record<Category, typeof Activity> = {
  deploy: GitCommit,
  runtime: Activity,
  database: Database,
  integrations: Sparkles,
  dns: Globe,
}

const ORDER: Category[] = ['deploy', 'runtime', 'database', 'integrations', 'dns']

const STATUS_TONE: Record<CheckStatus, { color: string; bg: string; border: string }> = {
  ok: { color: '#7FE3A8', bg: 'rgba(45,190,108,0.10)', border: 'rgba(45,190,108,0.25)' },
  warn: { color: '#F4C97F', bg: 'rgba(232,177,75,0.10)', border: 'rgba(232,177,75,0.25)' },
  error: { color: '#F1A39B', bg: 'rgba(192,58,43,0.12)', border: 'rgba(192,58,43,0.30)' },
  info: { color: '#9FD8EE', bg: 'rgba(92,193,225,0.08)', border: 'rgba(92,193,225,0.20)' },
}

const STATUS_ICON: Record<CheckStatus, typeof CheckCircle2> = {
  ok: CheckCircle2,
  warn: AlertCircle,
  error: XCircle,
  info: Info,
}

const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })

export default async function SystemPage() {
  const report = await runSystemReport()
  const groups = ORDER.map((cat) => ({
    category: cat,
    checks: report.checks.filter((c) => c.category === cat),
  })).filter((g) => g.checks.length > 0)

  return (
    <div className="p-10 max-w-[1100px]">
      <header className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">System Health</h1>
          <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">
            Live deploy, runtime, and integration status. Cached 30s.
          </p>
        </div>
        <RefreshButton />
      </header>

      <SummaryStrip report={report} />

      <div className="space-y-5 mt-6">
        {groups.map((g) => {
          const Icon = CATEGORY_ICON[g.category]
          return (
            <section key={g.category} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] card-edge overflow-hidden">
              <header className="px-5 py-3 flex items-center gap-2.5 border-b border-[var(--color-border)]">
                <Icon className="w-4 h-4 text-[var(--color-ink-muted)]" />
                <h2 className="text-[14px] font-semibold text-white">{CATEGORY_LABEL[g.category]}</h2>
              </header>
              <ul className="divide-y divide-[var(--color-border)]">
                {g.checks.map((c) => (
                  <CheckRow key={c.id} check={c} />
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <footer className="mt-6 text-[12px] text-[var(--color-ink-dim)] flex items-center justify-between">
        <span>Generated {fmtTime(report.generated_at)} · {report.duration_ms}ms</span>
        <span>Cache TTL 30s — refresh page or click Refresh to bypass</span>
      </footer>
    </div>
  )
}

function SummaryStrip({ report }: { report: { counts: { ok: number; warn: number; error: number; info: number } } }) {
  const cells: Array<{ label: string; value: number; status: CheckStatus }> = [
    { label: 'OK', value: report.counts.ok, status: 'ok' },
    { label: 'Warning', value: report.counts.warn, status: 'warn' },
    { label: 'Error', value: report.counts.error, status: 'error' },
    { label: 'Info', value: report.counts.info, status: 'info' },
  ]
  return (
    <div className="grid grid-cols-4 gap-3">
      {cells.map((c) => {
        const tone = STATUS_TONE[c.status]
        return (
          <div
            key={c.label}
            className="rounded-xl border bg-[var(--color-surface-1)] p-4 card-edge"
            style={{ borderColor: tone.border }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: tone.color }}>
              {c.label}
            </p>
            <p className="text-[32px] font-bold leading-none mt-1.5 text-white">{c.value}</p>
          </div>
        )
      })}
    </div>
  )
}

function CheckRow({ check }: { check: SystemCheck }) {
  const tone = STATUS_TONE[check.status]
  const Icon = STATUS_ICON[check.status]
  const detailEntries = check.detail ? Object.entries(check.detail).filter(([, v]) => v !== null && v !== undefined && v !== '') : []
  return (
    <li className="px-5 py-3.5">
      <details className="group">
        <summary className="flex items-center gap-3 cursor-pointer list-none">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0"
            style={{ background: tone.bg, color: tone.color }}
          >
            <Icon className="w-3.5 h-3.5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-medium text-white truncate">{check.label}</span>
            <span className="block text-[12px] text-[var(--color-ink-muted)] truncate">{check.message}</span>
          </span>
          {typeof check.duration_ms === 'number' ? (
            <span className="text-[11px] text-[var(--color-ink-dim)] font-mono shrink-0">{check.duration_ms}ms</span>
          ) : null}
          {detailEntries.length > 0 ? (
            <span className="text-[11px] text-[var(--color-ink-dim)] shrink-0 group-open:hidden">expand</span>
          ) : null}
        </summary>
        {detailEntries.length > 0 ? (
          <div className="mt-3 ml-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-3">
            <dl className="grid grid-cols-[160px_1fr] gap-x-3 gap-y-1.5 text-[12px]">
              {detailEntries.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-[var(--color-ink-muted)] font-mono truncate">{k}</dt>
                  <dd className="text-[var(--color-ink)] font-mono break-all">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </details>
    </li>
  )
}

function RefreshButton() {
  return (
    <form action={refreshSystemReport}>
      <button
        type="submit"
        className="text-[13px] text-white font-medium px-4 py-2 rounded-lg border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] inline-flex items-center gap-1.5"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh
      </button>
    </form>
  )
}

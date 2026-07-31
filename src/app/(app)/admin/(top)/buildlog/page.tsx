import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CheckCircle2, CircleDashed, CircleDot, FlaskConical, AlertTriangle, Terminal, Eye, Archive } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import {
  ENTRIES,
  STATUS_LABEL,
  inferArea,
  isOutstanding,
  buildLogEntryId,
  buildLogItemId,
  type ItemStatus,
  type BuildLogEntry,
  type BuildLogItem,
  type BuildLogEvidence,
} from '@/lib/buildlog'
import { CommentThread, type BuildLogComment } from './CommentThread'

type CommentIndex = {
  byItem: Map<string, BuildLogComment[]>
  byEntry: Map<string, BuildLogComment[]>
  openTotal: number
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

const STATUS_STYLE: Record<ItemStatus, { icon: typeof CheckCircle2; className: string }> = {
  shipped: { icon: CheckCircle2, className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  partial: { icon: CircleDot, className: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  open: { icon: CircleDashed, className: 'text-[var(--color-ink-muted)] bg-white/5 border-[var(--color-border)]' },
  // Replaced by a later item. Kept visible so the history reads, dimmed so it
  // does not compete with work that is actually outstanding.
  superseded: { icon: Archive, className: 'text-[var(--color-ink-muted)]/70 bg-transparent border-[var(--color-border)]' },
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


/**
 * Where to look, and eventually a picture of it.
 *
 * Most of what ships lives behind an interaction rather than at a URL - the
 * redirect editor is a tab inside a modal inside the quiz builder - so the
 * steps are the primary content and the image is the extra. A reader can follow
 * the recipe today; a capture job will drive the same recipe later and fill in
 * `image`.
 */
function Evidence({ evidence }: { evidence: BuildLogEvidence[] }) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      {evidence.map((ev) => (
        <div key={`${ev.path}-${ev.label}`} className="rounded-lg border border-[var(--color-border)] bg-black/20 overflow-hidden">
          {ev.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ev.image} alt={ev.label} className="block w-full border-b border-[var(--color-border)]" />
          ) : null}
          <div className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Eye className="w-3 h-3 text-[var(--color-ink-muted)] shrink-0" />
              <span className="text-[12.5px] font-medium text-white">{ev.label}</span>
              <a
                href={ev.path}
                className="font-mono text-[10.5px] text-sky-400 hover:text-sky-300 underline underline-offset-2"
              >
                {ev.path}
              </a>
            </div>
            {ev.steps?.length ? (
              <ol className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px] text-[var(--color-ink-muted)]">
                {ev.steps.map((step, i) => (
                  <li key={step} className="inline-flex items-center gap-1.5">
                    {i > 0 ? <span className="text-[var(--color-border)]">&rsaquo;</span> : null}
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function Entry({
  entry,
  index,
  userEmail,
}: {
  entry: BuildLogEntry
  index: CommentIndex
  userEmail: string
}) {
  const entryId = buildLogEntryId(entry)
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
              <span className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-[10.5px] text-[var(--color-ink-muted)] whitespace-nowrap">
                {inferArea(item)}
              </span>
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
            {item.evidence?.length ? <Evidence evidence={item.evidence} /> : null}
            <CommentThread
              entryId={entryId}
              itemId={buildLogItemId(entry, item)}
              targetLabel={item.title}
              comments={index.byItem.get(buildLogItemId(entry, item)) ?? []}
              currentUserEmail={userEmail}
            />
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

/**
 * Load every comment for the log in one query and group it in memory.
 *
 * The log is a fixed-size list of entries in code, so one read is cheaper and
 * simpler than a query per item, and it means a comment whose item has since
 * been renamed can still be found and shown as an orphan rather than silently
 * dropped.
 */
async function loadComments(): Promise<CommentIndex> {
  const byItem = new Map<string, BuildLogComment[]>()
  const byEntry = new Map<string, BuildLogComment[]>()
  let openTotal = 0

  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'buildlog-comments',
      limit: 1000,
      sort: 'createdAt',
      depth: 0,
      overrideAccess: true,
    })

    const knownItemIds = new Set<string>()
    for (const entry of ENTRIES) {
      for (const item of entry.items) knownItemIds.add(buildLogItemId(entry, item))
    }

    for (const doc of res.docs as unknown as Array<Record<string, unknown>>) {
      const itemId = doc.item_id ? String(doc.item_id) : ''
      const comment: BuildLogComment = {
        id: String(doc.id),
        body: String(doc.body ?? ''),
        status: doc.status === 'resolved' ? 'resolved' : 'open',
        authorEmail: String(doc.author_email ?? ''),
        createdAt: String(doc.createdAt ?? ''),
        // A comment written against a title that no longer exists is shown with
        // the title it was written against, rather than disappearing.
        orphanOf: itemId && !knownItemIds.has(itemId) ? String(doc.target_label ?? 'a renamed item') : null,
      }
      if (comment.status === 'open') openTotal += 1

      if (itemId) {
        const list = byItem.get(itemId) ?? []
        list.push(comment)
        byItem.set(itemId, list)
      } else {
        const key = String(doc.entry_id ?? '')
        const list = byEntry.get(key) ?? []
        list.push(comment)
        byEntry.set(key, list)
      }
    }
  } catch {
    // The table does not exist until the migration has run. An empty board is a
    // better failure than a 500 on a page whose whole job is reporting state.
  }

  return { byItem, byEntry, openTotal }
}

export default async function BuildLogPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/sign-in?next=/admin/buildlog')

  const index = await loadComments()
  const userEmail = me.email ?? ''

  const allItems: BuildLogItem[] = ENTRIES.flatMap((e) => e.items)
  const notShipped = allItems.filter((i) => isOutstanding(i.status)).length
  const notRun = ENTRIES.flatMap((e) => e.verification).filter((v) => v.state === 'not-run').length

  return (
    <div className="p-10 max-w-[1100px]">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-white">Build log</h1>
        <p className="text-[var(--color-ink-muted)] text-[15px] mt-1 max-w-[75ch]">
          What shipped, what is only partly done, and what was actually checked rather than assumed. Comment on
          any item and it stays attached to that decision. Newest first.
        </p>
      </header>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] border border-[#3b0208] rounded-xl overflow-hidden mb-8">
        {[
          { label: 'Entries', value: ENTRIES.length, tone: '' },
          { label: 'Items', value: allItems.length, tone: '' },
          { label: 'Not shipped', value: notShipped, tone: notShipped > 0 ? 'text-amber-400' : '' },
          { label: 'Open comments', value: index.openTotal, tone: index.openTotal > 0 ? 'text-amber-400' : '' },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--color-surface-1)] px-4 py-3">
            <dt className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
              {s.label}
            </dt>
            <dd className={`text-[22px] font-semibold tabular-nums mt-0.5 ${s.tone || 'text-white'}`}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {notRun > 0 ? (
        <p className="text-[12.5px] text-amber-300/90 mb-8 leading-relaxed max-w-[75ch]">
          {notRun} verification {notRun === 1 ? 'check has' : 'checks have'} not been run. They are listed
          against the entries below rather than summarised away, because an unrun check is not a passing one.
        </p>
      ) : null}

      {ENTRIES.map((entry, i) => (
        <Entry key={`${entry.date}-${i}`} entry={entry} index={index} userEmail={userEmail} />
      ))}
    </div>
  )
}

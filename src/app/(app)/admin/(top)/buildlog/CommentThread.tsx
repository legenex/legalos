'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Check, Trash2, Undo2, Loader2 } from 'lucide-react'
import {
  addBuildLogComment,
  setBuildLogCommentStatus,
  deleteBuildLogComment,
} from './actions'

export type BuildLogComment = {
  id: string
  body: string
  status: 'open' | 'resolved'
  authorEmail: string
  createdAt: string
  /** True when the comment's item title has since been renamed. */
  orphanOf?: string | null
}

/**
 * A comment thread against one build-log item.
 *
 * Collapsed to a single count until opened, because the board's job is still to
 * be scannable. An item with open comments shows the count in the accent colour
 * so unanswered feedback is visible without expanding anything.
 *
 * Resolving is the normal way to close a thread; deleting is restricted to the
 * author. A record of the exchange is usually worth more than a tidy list.
 */
export function CommentThread({
  entryId,
  itemId,
  targetLabel,
  comments,
  currentUserEmail,
}: {
  entryId: string
  itemId?: string
  targetLabel: string
  comments: BuildLogComment[]
  currentUserEmail: string
}) {
  const openCount = comments.filter((c) => c.status === 'open').length
  const [expanded, setExpanded] = useState(openCount > 0)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    const body = draft.trim()
    if (!body) return
    setError(null)
    startTransition(async () => {
      const res = await addBuildLogComment({ entryId, itemId, targetLabel, body })
      if (res.ok) setDraft('')
      else setError(res.error)
    })
  }

  const toggle = (id: string, status: 'open' | 'resolved') => {
    startTransition(async () => {
      const res = await setBuildLogCommentStatus({ id, status })
      if (!res.ok) setError(res.error)
    })
  }

  const remove = (id: string) => {
    startTransition(async () => {
      const res = await deleteBuildLogComment({ id })
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-ink-muted)] hover:text-white transition-colors"
      >
        <MessageSquare className="w-3 h-3" />
        {comments.length === 0
          ? 'Comment'
          : `${comments.length} comment${comments.length > 1 ? 's' : ''}`}
        {openCount > 0 ? (
          <span className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-400/15 text-amber-300">
            {openCount} open
          </span>
        ) : null}
      </button>

      {expanded ? (
        <div className="mt-3 flex flex-col gap-2.5">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border p-3 ${
                c.status === 'resolved'
                  ? 'border-[var(--color-border)] bg-black/20 opacity-70'
                  : 'border-amber-400/25 bg-amber-400/[0.04]'
              }`}
            >
              {c.orphanOf ? (
                <p className="text-[10.5px] text-amber-300 mb-1.5">
                  Written against &ldquo;{c.orphanOf}&rdquo;, which has since been renamed.
                </p>
              ) : null}
              <p className="text-[13px] text-white leading-relaxed whitespace-pre-wrap">{c.body}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10.5px] text-[var(--color-ink-muted)] font-mono">
                <span>{c.authorEmail || 'unknown'}</span>
                <span>{new Date(c.createdAt).toLocaleString('en-GB')}</span>
                {c.status === 'resolved' ? <span className="text-emerald-400">resolved</span> : null}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => toggle(c.id, c.status === 'open' ? 'resolved' : 'open')}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors disabled:opacity-50"
                >
                  {c.status === 'open' ? <Check className="w-3 h-3" /> : <Undo2 className="w-3 h-3" />}
                  {c.status === 'open' ? 'Resolve' : 'Reopen'}
                </button>
                {c.authorEmail === currentUserEmail ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(c.id)}
                    className="inline-flex items-center gap-1 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit()
              }}
              rows={2}
              placeholder="What should change here?"
              className="w-full rounded-lg border border-[var(--color-border)] bg-black/25 px-3 py-2 text-[13px] text-white placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:border-white/25 resize-y"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={pending || !draft.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-white/15 disabled:opacity-40 transition-colors"
              >
                {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Add comment
              </button>
              <span className="text-[10.5px] text-[var(--color-ink-muted)]">Cmd/Ctrl + Enter</span>
              {error ? <span className="text-[11.5px] text-red-400">{error}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

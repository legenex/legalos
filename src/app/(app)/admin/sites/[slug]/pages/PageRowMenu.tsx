'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { MoreHorizontal, Pencil, ExternalLink, Copy, Trash2 } from 'lucide-react'
import { duplicatePage, deletePage } from './actions'

type Props = {
  pageId: number | string
  pageSlug: string
  pageTitle: string
  siteSlug: string
}

export function PageRowMenu({ pageId, pageSlug, pageTitle, siteSlug }: Props) {
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

  const openMenu = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const isHome = pageSlug === '/'
  const previewHref = `/${pageSlug.replace(/^\//, '')}?site=${encodeURIComponent(siteSlug)}`

  const onDuplicate = () => {
    setOpen(false)
    start(async () => {
      const res = await duplicatePage({ pageId, siteSlug })
      if (!res.ok) alert(`Duplicate failed: ${res.error}`)
    })
  }

  const onDelete = () => {
    setOpen(false)
    if (isHome) return
    if (!confirm(`Delete "${pageTitle}"?\nThis cannot be undone.`)) return
    start(async () => {
      const res = await deletePage({ pageId, siteSlug })
      if (!res.ok) alert(`Delete failed: ${res.error}`)
    })
  }

  return (
    <div className="justify-self-end">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        disabled={pending}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--color-ink-muted)] hover:text-white hover:bg-[var(--color-surface-3)] transition-colors disabled:opacity-50"
        aria-label="Page options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && menuPos ? (
        <div
          style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 50 }}
          className="min-w-[200px] rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] shadow-2xl overflow-hidden"
        >
          <Link
            href={`/cms/collections/pages/${pageId}`}
            onClick={() => setOpen(false)}
            className="w-full px-4 py-2.5 text-left text-[13px] text-white hover:bg-[var(--color-surface-3)] inline-flex items-center gap-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="w-full px-4 py-2.5 text-left text-[13px] text-white hover:bg-[var(--color-surface-3)] inline-flex items-center gap-2 border-t border-[var(--color-border)]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview page
          </a>
          <button
            type="button"
            onClick={onDuplicate}
            disabled={pending}
            className="w-full px-4 py-2.5 text-left text-[13px] text-white hover:bg-[var(--color-surface-3)] inline-flex items-center gap-2 border-t border-[var(--color-border)] disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending || isHome}
            title={isHome ? 'Home page cannot be deleted' : undefined}
            className="w-full px-4 py-2.5 text-left text-[13px] text-[var(--color-neg)] hover:bg-[var(--color-neg)]/10 inline-flex items-center gap-2 border-t border-[var(--color-border)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}

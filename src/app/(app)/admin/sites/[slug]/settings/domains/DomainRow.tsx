'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { MoreHorizontal, Lock, ExternalLink, Trash2, ShieldCheck, RefreshCw } from 'lucide-react'
import { setPrimary, removeDomain, verifyAndPromoteDomain } from './actions'

type Domain = {
  id: number
  host: string
  kind: 'preview' | 'custom'
  status: string
  ssl_status: string
  primary: boolean
  createdAt: string
  last_checked_at?: string | null
}

const formatRelativeTime = (iso: string): string => {
  const diffSec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

export function DomainRow({
  domain,
  siteId,
  siteSlug,
  devSkipAllowed,
}: {
  domain: Domain
  siteId: number
  siteSlug: string
  devSkipAllowed: boolean
}) {
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

  const togglePrimary = () => {
    if (domain.primary) return
    start(async () => {
      await setPrimary({ domainId: domain.id, siteId, siteSlug })
    })
  }

  const onRemove = () => {
    setOpen(false)
    if (!confirm(`Remove ${domain.host}?`)) return
    start(async () => {
      await removeDomain({ domainId: domain.id, siteSlug })
    })
  }

  const onReverify = () => {
    setOpen(false)
    start(async () => {
      await verifyAndPromoteDomain({ domainId: domain.id, siteSlug })
    })
  }

  return (
    <li className="grid grid-cols-[2fr_120px_110px_110px_110px_60px] px-5 py-4 items-center border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)]/40 transition-colors">
      <div className="flex flex-col min-w-0 gap-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {domain.kind === 'preview' ? (
            <Lock className="w-3.5 h-3.5 text-[var(--color-ink-dim)] shrink-0" aria-label="Preview" />
          ) : null}
          <code className="text-white font-mono text-[14px] truncate">{domain.host}</code>
          {domain.kind === 'custom' ? (
            <a
              href={`https://${domain.host}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-info)] shrink-0"
              aria-label="Open"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>
        {domain.kind === 'custom' && (domain.status === 'pending' || domain.status === 'error') && domain.last_checked_at ? (
          <span className="text-[11px] text-[var(--color-ink-dim)]">Last checked {formatRelativeTime(domain.last_checked_at)}</span>
        ) : null}
      </div>
      <span>
        <KindBadge kind={domain.kind} />
      </span>
      <span className="flex items-center gap-1.5">
        <StatusPill status={domain.status} />
        {domain.kind === 'custom' && domain.status === 'active' ? <SslDot status={domain.ssl_status} /> : null}
      </span>
      <span>
        <button
          type="button"
          onClick={togglePrimary}
          disabled={pending || domain.primary || (domain.kind === 'custom' && domain.status !== 'active' && domain.status !== 'verified')}
          aria-pressed={domain.primary}
          title={domain.primary ? 'Primary' : 'Set as primary'}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            domain.primary ? 'brand-gradient' : 'bg-[var(--color-surface-3)]'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              domain.primary ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </span>
      <span className="text-[13px] text-[var(--color-ink-muted)]">{new Date(domain.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      <div className="justify-self-end">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => (open ? setOpen(false) : openMenu())}
          disabled={pending}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--color-ink-muted)] hover:text-white hover:bg-[var(--color-surface-3)] transition-colors disabled:opacity-50"
          aria-label="Domain options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {open && menuPos ? (
          <div
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 50 }}
            className="min-w-[200px] rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] shadow-2xl overflow-hidden"
          >
            {domain.kind === 'custom' ? (
              <button
                type="button"
                onClick={onReverify}
                className="w-full px-4 py-2.5 text-left text-[13px] text-white hover:bg-[var(--color-surface-3)] inline-flex items-center gap-2"
              >
                {domain.status === 'active' ? <RefreshCw className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {domain.status === 'active' ? 'Re-check DNS' : 'Verify DNS now'}
              </button>
            ) : null}
            {domain.kind === 'custom' ? (
              <button
                type="button"
                onClick={onRemove}
                className="w-full px-4 py-2.5 text-left text-[13px] text-[var(--color-neg)] hover:bg-[var(--color-neg)]/10 inline-flex items-center gap-2 border-t border-[var(--color-border)]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove domain
              </button>
            ) : (
              <div className="px-4 py-2.5 text-[12px] text-[var(--color-ink-dim)]">
                Preview domains are managed by LegalOS.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </li>
  )
}

function KindBadge({ kind }: { kind: 'preview' | 'custom' }) {
  if (kind === 'preview') {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/25">
        Preview
      </span>
    )
  }
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-brand-strong)]/10 text-[var(--color-brand-strong)] border border-[var(--color-brand-strong)]/25">
      Custom
    </span>
  )
}

function SslDot({ status }: { status: string }) {
  const map: Record<string, { color: string; title: string }> = {
    pending: { color: 'var(--color-warn)', title: 'SSL: provisioning (Let’s Encrypt cert in flight)' },
    active: { color: 'var(--color-pos)', title: 'SSL: live and serving HTTPS' },
    error: { color: 'var(--color-neg)', title: 'SSL: failed to provision — check DNS + server reachability' },
    unknown: { color: 'var(--color-ink-dim)', title: 'SSL: unknown' },
  }
  const v = map[status] ?? map.unknown
  return (
    <span
      title={v.title}
      aria-label={v.title}
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: v.color }}
    />
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    pending: { label: 'Pending', bg: 'rgba(232,177,75,0.12)', fg: '#F4C97F' },
    verified: { label: 'Verified', bg: 'rgba(92,193,225,0.12)', fg: '#9FD8EE' },
    active: { label: 'Linked', bg: 'rgba(45,190,108,0.12)', fg: '#7FE3A8' },
    error: { label: 'Error', bg: 'rgba(192,58,43,0.18)', fg: '#F1A39B' },
  }
  const v = map[status] ?? map.pending
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-md" style={{ background: v.bg, color: v.fg }}>
      {v.label}
    </span>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Globe } from 'lucide-react'
import { createPoolDomain } from './actions'

export function AddDomainButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="brand-gradient text-white text-[13px] font-semibold px-4 py-2 rounded-md inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Add Domain
      </button>
      {open ? <AddDomainModal onClose={() => setOpen(false)} /> : null}
    </>
  )
}

function AddDomainModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [host, setHost] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = (): void => {
    if (!host.trim()) {
      setError('Enter a hostname (e.g. example.com)')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createPoolDomain({ host })
      if (!result.ok) {
        setError(result.error)
        return
      }
      onClose()
      router.refresh()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-semibold text-white">Add Domain</h2>
            <p className="text-[13px] text-[var(--color-ink-muted)] mt-1">
              The domain joins the unassigned pool. Attach it to a brand from the brand&apos;s settings.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-ink-muted)] hover:text-white p-1 rounded-md hover:bg-[var(--color-surface-2)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <label className="block text-[12px] font-medium uppercase tracking-wider text-[var(--color-ink-muted)] mb-2">
          Hostname
        </label>
        <div className="relative">
          <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="example.com"
            autoFocus
            className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md pl-9 pr-3 py-2 text-[14px] text-white placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-brand-from)]"
          />
        </div>
        <p className="text-[11px] text-[var(--color-ink-dim)] mt-2">
          Hostname only — no protocol, no path. Subdomains are supported.
        </p>

        {error ? <p className="text-[13px] text-[var(--color-neg)] mt-3">{error}</p> : null}

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-[var(--color-ink-muted)] px-4 py-2 rounded-md hover:bg-[var(--color-surface-2)] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="brand-gradient text-white text-[13px] font-semibold px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? 'Adding…' : 'Add to pool'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2, CheckCircle2, AlertTriangle, Copy } from 'lucide-react'
import { addCustomDomain, verifyAndPromoteDomain } from './actions'

type DnsRecord = { type: string; name: string; value: string; note?: string }

export function ConnectDomainButton({
  siteId,
  siteSlug,
  devSkipAllowed,
}: {
  siteId: number
  siteSlug: string
  devSkipAllowed: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="brand-gradient text-white font-medium text-[14px] px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 hover:opacity-90"
      >
        <Plus className="w-4 h-4" /> Connect Domain
      </button>
      {open ? <ConnectDomainModal siteId={siteId} siteSlug={siteSlug} devSkipAllowed={devSkipAllowed} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

type Stage = 'enter-host' | 'show-records' | 'verifying' | 'verified' | 'failed'

function ConnectDomainModal({
  siteId,
  siteSlug,
  devSkipAllowed,
  onClose,
}: {
  siteId: number
  siteSlug: string
  devSkipAllowed: boolean
  onClose: () => void
}) {
  const [stage, setStage] = useState<Stage>('enter-host')
  const [host, setHost] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [domainId, setDomainId] = useState<number | null>(null)
  const [records, setRecords] = useState<DnsRecord[]>([])
  const [token, setToken] = useState<string | null>(null)
  const [verifyDetail, setVerifyDetail] = useState<{
    matched: 'cname' | 'a' | 'txt' | null
    observed: { cname: string[]; a: string[]; txt: string[] }
    expected: { cname_target: string | null; a_target: string | null; txt_token_at: string | null }
  } | null>(null)
  const [pending, start] = useTransition()

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await addCustomDomain({ siteId, siteSlug, host })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setDomainId(res.domain_id)
      setRecords(res.dns_records)
      setToken(res.verification_token)
      setStage('show-records')
    })
  }

  const onCheck = (skipDns = false) => {
    if (!domainId) return
    setError(null)
    setStage('verifying')
    start(async () => {
      const res = await verifyAndPromoteDomain({ domainId, siteSlug, skipDns })
      if (!res.ok) {
        setError(res.error)
        setStage('failed')
        return
      }
      setVerifyDetail(res.dns)
      if (!res.verified) {
        setStage('failed')
        return
      }
      // DNS verified, but the Plesk provisioning step may still have failed
      // (bad creds, unreachable API, placeholder URL, etc). Don't claim the
      // domain is connected when nginx has no vhost — surface the Plesk error
      // so the operator can fix the underlying config and retry.
      if (!res.provisioned) {
        setError(
          `DNS verified, but server provisioning failed: ${res.plesk_error ?? 'unknown error'}. The domain is marked as error — fix the underlying issue and click Retry.`,
        )
        setStage('failed')
        return
      }
      setStage('verified')
    })
  }

  const copy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(text)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-[680px] rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface-1)] shadow-2xl shadow-black/50 max-h-[90vh] flex flex-col">
        <header className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-white">Connect Domain</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[var(--color-ink-muted)] hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {stage === 'enter-host' ? (
            <form onSubmit={onAdd} className="px-6 py-5">
              <label className="block">
                <span className="block text-[12px] font-semibold text-[var(--color-ink-muted)] mb-2">Hostname</span>
                <input
                  autoFocus
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="claim-checker.co"
                  required
                  className="w-full bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-md px-3 py-2.5 text-[14px] text-white placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-border-strong)]"
                />
                <p className="text-[12px] text-[var(--color-ink-dim)] mt-2">
                  Hostname only — no protocol, no path. Apex (claim-checker.co) and subdomains (www.claim-checker.co) both work.
                </p>
              </label>
              {error ? (
                <p className="text-[13px] text-[var(--color-neg)] bg-[var(--color-neg)]/10 border border-[var(--color-neg)]/30 rounded-md px-3 py-2 mt-3">
                  {error}
                </p>
              ) : null}
              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[13px] font-medium px-4 py-2 rounded-md text-[var(--color-ink-muted)] hover:text-white hover:bg-[var(--color-surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || !host}
                  className="brand-gradient text-white font-semibold text-[13px] px-5 py-2 rounded-md disabled:opacity-50 hover:opacity-90 inline-flex items-center gap-2"
                >
                  {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {pending ? 'Adding…' : 'Continue'}
                </button>
              </div>
            </form>
          ) : null}

          {(stage === 'show-records' || stage === 'verifying' || stage === 'failed') ? (
            <div className="px-6 py-5">
              <p className="text-[13px] text-[var(--color-ink-muted)] mb-3">
                Add these records at your DNS provider, then click <strong>Check DNS</strong>. Verification typically takes 1–10 minutes after DNS propagates.
              </p>
              <code className="block text-[13px] text-white bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md px-3 py-2 font-mono mb-4">
                {host}
              </code>

              <div className="space-y-2 mb-5">
                {records.map((r, i) => (
                  <DnsRecordRow key={i} record={r} onCopy={copy} />
                ))}
              </div>

              {/* Only show the DNS expected-vs-observed report when DNS itself failed.
                  When DNS matched but a later step (Plesk) failed, the red error
                  box below is the actionable message — re-showing 'DNS records
                  not detected yet' is misleading. */}
              {stage === 'failed' && verifyDetail && !verifyDetail.matched ? <FailureReport detail={verifyDetail} /> : null}
              {error ? (
                <p className="text-[13px] text-[var(--color-neg)] bg-[var(--color-neg)]/10 border border-[var(--color-neg)]/30 rounded-md px-3 py-2 mb-3">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                {devSkipAllowed ? (
                  <button
                    type="button"
                    onClick={() => onCheck(true)}
                    disabled={pending}
                    className="text-[12px] font-medium px-3 py-1.5 rounded-md text-[var(--color-warn)] border border-[var(--color-warn)]/30 hover:bg-[var(--color-warn)]/10"
                    title="Marks verified without checking DNS. Dev only."
                  >
                    Skip DNS (dev)
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onCheck(false)}
                  disabled={pending}
                  className="brand-gradient text-white font-semibold text-[13px] px-5 py-2 rounded-md disabled:opacity-50 hover:opacity-90 inline-flex items-center gap-2"
                >
                  {pending || stage === 'verifying' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {pending || stage === 'verifying' ? 'Checking…' : stage === 'failed' ? 'Retry check' : 'Check DNS'}
                </button>
              </div>
            </div>
          ) : null}

          {stage === 'verified' ? (
            <div className="px-6 py-8 text-center">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-pos)]/15 text-[var(--color-pos)] mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </span>
              <h3 className="text-[18px] font-semibold text-white">Domain verified</h3>
              <p className="text-[13px] text-[var(--color-ink-muted)] mt-2 max-w-[420px] mx-auto">
                <code className="text-white font-mono">{host}</code> is live and promoted to primary. The Site&apos;s preview URL still works as an alias.
              </p>
              {verifyDetail?.matched ? (
                <p className="text-[12px] text-[var(--color-ink-dim)] mt-3">Matched via {verifyDetail.matched.toUpperCase()} record</p>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="brand-gradient mt-6 text-white font-semibold text-[13px] px-5 py-2 rounded-md hover:opacity-90"
              >
                Done
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function DnsRecordRow({ record, onCopy }: { record: DnsRecord; onCopy: (text: string) => void }) {
  // Most registrars (Cloudflare, GoDaddy, Namecheap, Route 53) want the subdomain part
  // RELATIVE to the parent zone. e.g. for "os.claim-checker.co" inside claim-checker.co's DNS,
  // the user types "os" in the Name field. Compute the relative name to show as a hint.
  const parts = record.name.split('.')
  // Heuristic: assume last 2 parts are the registrable domain (best-effort for .com/.co/.io etc.).
  // Won't be perfect for SLDs like .co.uk but covers the common case for this product.
  const relativeName = parts.length > 2 ? parts.slice(0, parts.length - 2).join('.') : '@'
  const showRelativeHint = relativeName !== '@'

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-3">
      <div className="grid grid-cols-[60px_1fr_1fr_36px] gap-3 items-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-info)] bg-[var(--color-info)]/10 px-2 py-1 rounded text-center">
          {record.type}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-0.5">Name / Host</p>
          <code className="block text-[12px] text-white font-mono truncate">{record.name}</code>
          {showRelativeHint ? (
            <p className="text-[10px] text-[var(--color-ink-dim)] mt-1">
              Most registrars want just <code className="text-[var(--color-info)] font-mono">{relativeName}</code>
            </p>
          ) : (
            <p className="text-[10px] text-[var(--color-ink-dim)] mt-1">
              Apex / root domain — some registrars use <code className="text-[var(--color-info)] font-mono">@</code>
            </p>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-0.5">Value</p>
          <code className="block text-[12px] text-white font-mono truncate">{record.value}</code>
          {record.type === 'TXT' ? (
            <p className="text-[10px] text-[var(--color-ink-dim)] mt-1">
              Paste without quotes — most registrars wrap it for you
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onCopy(`${showRelativeHint ? relativeName : record.name}\n${record.value}`)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--color-ink-muted)] hover:text-white hover:bg-[var(--color-surface-3)]"
          title="Copy relative name + value"
          aria-label="Copy DNS record"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      {record.note ? <p className="text-[11px] text-[var(--color-ink-dim)] mt-2 pl-[72px]">{record.note}</p> : null}
    </div>
  )
}

function FailureReport({
  detail,
}: {
  detail: {
    matched: 'cname' | 'a' | 'txt' | null
    observed: { cname: string[]; a: string[]; txt: string[] }
    expected: { cname_target: string | null; a_target: string | null; txt_token_at: string | null }
  }
}) {
  return (
    <div className="rounded-md border border-[var(--color-warn)]/30 bg-[var(--color-warn)]/10 px-3 py-3 mb-4">
      <p className="text-[13px] font-semibold text-[var(--color-warn)] inline-flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5" />
        DNS records not detected yet
      </p>
      <ul className="text-[12px] text-[var(--color-ink)] mt-2 space-y-1">
        {detail.expected.cname_target ? (
          <li>
            CNAME → expected <code className="text-white font-mono">{detail.expected.cname_target}</code>, observed{' '}
            <code className="text-[var(--color-ink-muted)] font-mono">
              {detail.observed.cname.length ? detail.observed.cname.join(', ') : '(none)'}
            </code>
          </li>
        ) : null}
        {detail.expected.a_target ? (
          <li>
            A → expected <code className="text-white font-mono">{detail.expected.a_target}</code>, observed{' '}
            <code className="text-[var(--color-ink-muted)] font-mono">
              {detail.observed.a.length ? detail.observed.a.join(', ') : '(none)'}
            </code>
          </li>
        ) : null}
        {detail.expected.txt_token_at ? (
          <li>
            TXT at <code className="text-white font-mono">{detail.expected.txt_token_at}</code>, observed{' '}
            <code className="text-[var(--color-ink-muted)] font-mono">
              {detail.observed.txt.length ? detail.observed.txt.join(', ') : '(none)'}
            </code>
          </li>
        ) : null}
      </ul>
      <p className="text-[12px] text-[var(--color-ink-dim)] mt-2">
        DNS changes can take up to an hour to propagate. Refresh and re-check.
      </p>
    </div>
  )
}

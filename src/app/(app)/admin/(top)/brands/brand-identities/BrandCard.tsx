'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Pencil } from 'lucide-react'
import { updateSiteBrand } from './actions'

type BrandFields = {
  display_name: string
  short_name: string
  tagline_brand: string
  logo_url: string
  logo_url_dark: string
  favicon_url: string
  primary: string
  accent: string
  surface: string
  ink: string
  muted: string
  success: string
  warning: string
  danger: string
}

type LegalFields = {
  copyright: string
  tcpa_text: string
  privacy_url: string
  terms_url: string
  default_disclaimer: string
}

type TypographyFields = {
  headline_font: string
  body_font: string
  base_size: 'sm' | 'md' | 'lg'
}

export type BrandData = {
  id: number
  name: string
  slug: string
  status: string
  domainCount: number
  brand: BrandFields
  legal: LegalFields
  typography: TypographyFields
}

const COLOR_FIELDS: Array<{ key: keyof BrandFields; label: string }> = [
  { key: 'primary', label: 'Primary' },
  { key: 'accent', label: 'Accent' },
  { key: 'surface', label: 'Surface' },
  { key: 'ink', label: 'Ink' },
  { key: 'muted', label: 'Muted' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'danger', label: 'Danger' },
]

const initialsOf = (s: string): string =>
  s
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join('')
    .toUpperCase()

type Tab = 'identity' | 'colors' | 'typography' | 'legal'

export function BrandCard({ data }: { data: BrandData }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('identity')

  const [name, setName] = useState(data.name)
  const [brand, setBrand] = useState<BrandFields>(data.brand)
  const [legal, setLegal] = useState<LegalFields>(data.legal)
  const [typo, setTypo] = useState<TypographyFields>(data.typography)

  const displayName = data.brand.display_name || data.name
  const mark = data.brand.short_name || initialsOf(data.brand.display_name || data.name) || '?'

  const setBrandField = (k: keyof BrandFields, v: string) => setBrand((p) => ({ ...p, [k]: v }))
  const setLegalField = (k: keyof LegalFields, v: string) => setLegal((p) => ({ ...p, [k]: v }))

  const openModal = () => {
    // Reset working copy to the latest server values each time the modal opens.
    setName(data.name)
    setBrand(data.brand)
    setLegal(data.legal)
    setTypo(data.typography)
    setError(null)
    setTab('identity')
    setOpen(true)
  }

  const save = () => {
    if (!name.trim()) {
      setError('Brand name is required.')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await updateSiteBrand({ siteId: data.id, name, brand, legal, typography: typo })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-[13px] font-bold text-white shrink-0"
            style={{ background: data.brand.primary || '#0B1F3A' }}
          >
            {mark}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[15px] text-white truncate">{displayName}</div>
            <div className="text-[12px] font-mono text-[var(--color-ink-dim)] truncate">{data.slug}</div>
          </div>
          <StatusPill status={data.status} />
        </div>

        <div className="flex gap-1.5">
          {(['primary', 'accent', 'surface', 'ink'] as const).map((k) => (
            <span
              key={k}
              className="h-6 flex-1 rounded-md border border-[var(--color-border)]"
              style={{ background: data.brand[k] }}
              title={`${k}: ${data.brand[k]}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] border border-[var(--color-border)]">
            {data.domainCount} {data.domainCount === 1 ? 'domain' : 'domains'}
          </span>
          <button
            onClick={openModal}
            className="text-[13px] font-medium px-3 py-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-white hover:border-[var(--color-border-strong)] inline-flex items-center gap-1.5 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 p-6 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-[12px] font-bold text-white shrink-0"
                  style={{ background: brand.primary || '#0B1F3A' }}
                >
                  {brand.short_name || initialsOf(brand.display_name || name) || '?'}
                </span>
                <div className="min-w-0">
                  <h2 className="text-[18px] font-semibold text-white truncate">{brand.display_name || name}</h2>
                  <p className="text-[12px] font-mono text-[var(--color-ink-dim)] truncate">{data.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--color-ink-muted)] hover:text-white p-1 rounded-md hover:bg-[var(--color-surface-2)]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex gap-1 px-6 border-b border-[var(--color-border)]">
              {(
                [
                  ['identity', 'Identity'],
                  ['colors', 'Colors'],
                  ['typography', 'Typography'],
                  ['legal', 'Legal'],
                ] as Array<[Tab, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-3 py-2 text-[13px] font-medium -mb-px border-b-2 transition-colors ${
                    tab === key
                      ? 'border-[var(--color-brand-from)] text-white'
                      : 'border-transparent text-[var(--color-ink-muted)] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {tab === 'identity' ? (
                <>
                  <Field label="Brand name">
                    <TextInput value={name} onChange={setName} placeholder="Check My Claim" />
                  </Field>
                  <Field label="Display name" hint="Shown across funnels. Defaults to brand name when blank.">
                    <TextInput value={brand.display_name} onChange={(v) => setBrandField('display_name', v)} placeholder={name} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Short name" hint="2-3 letters, e.g. CMC">
                      <TextInput value={brand.short_name} onChange={(v) => setBrandField('short_name', v)} placeholder="CMC" />
                    </Field>
                    <Field label="Brand tagline">
                      <TextInput value={brand.tagline_brand} onChange={(v) => setBrandField('tagline_brand', v)} placeholder="Check your claim in 60 seconds" />
                    </Field>
                  </div>
                  <Field label="Logo URL">
                    <TextInput mono value={brand.logo_url} onChange={(v) => setBrandField('logo_url', v)} placeholder="https://..." />
                  </Field>
                  <Field label="Logo URL (dark backgrounds)">
                    <TextInput mono value={brand.logo_url_dark} onChange={(v) => setBrandField('logo_url_dark', v)} placeholder="https://..." />
                  </Field>
                  <Field label="Favicon URL">
                    <TextInput mono value={brand.favicon_url} onChange={(v) => setBrandField('favicon_url', v)} placeholder="https://..." />
                  </Field>
                </>
              ) : null}

              {tab === 'colors' ? (
                <div className="grid grid-cols-2 gap-4">
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <ColorRow
                      key={key}
                      label={label}
                      value={brand[key]}
                      onChange={(v) => setBrandField(key, v)}
                    />
                  ))}
                </div>
              ) : null}

              {tab === 'typography' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Headline font">
                      <TextInput value={typo.headline_font} onChange={(v) => setTypo((p) => ({ ...p, headline_font: v }))} placeholder="Inter" />
                    </Field>
                    <Field label="Body font">
                      <TextInput value={typo.body_font} onChange={(v) => setTypo((p) => ({ ...p, body_font: v }))} placeholder="Inter" />
                    </Field>
                  </div>
                  <Field label="Base size">
                    <select
                      value={typo.base_size}
                      onChange={(e) => setTypo((p) => ({ ...p, base_size: e.target.value as TypographyFields['base_size'] }))}
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-[var(--color-brand-from)]"
                    >
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                    </select>
                  </Field>
                </>
              ) : null}

              {tab === 'legal' ? (
                <>
                  <Field label="Copyright" hint='e.g. "(c) 2026 Check My Claim"'>
                    <TextInput value={legal.copyright} onChange={(v) => setLegalField('copyright', v)} />
                  </Field>
                  <Field label="TCPA consent text">
                    <TextArea value={legal.tcpa_text} onChange={(v) => setLegalField('tcpa_text', v)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Privacy URL">
                      <TextInput mono value={legal.privacy_url} onChange={(v) => setLegalField('privacy_url', v)} placeholder="https://..." />
                    </Field>
                    <Field label="Terms URL">
                      <TextInput mono value={legal.terms_url} onChange={(v) => setLegalField('terms_url', v)} placeholder="https://..." />
                    </Field>
                  </div>
                  <Field label="Default disclaimer">
                    <TextArea value={legal.default_disclaimer} onChange={(v) => setLegalField('default_disclaimer', v)} />
                  </Field>
                </>
              ) : null}

              {error ? <p className="text-[13px] text-[var(--color-neg)]">{error}</p> : null}
            </div>

            <footer className="flex justify-end gap-2 p-6 pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => setOpen(false)}
                className="text-[13px] font-medium text-[var(--color-ink-muted)] px-4 py-2 rounded-md hover:bg-[var(--color-surface-2)] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={pending}
                className="brand-gradient text-white text-[13px] font-semibold px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {pending ? 'Saving…' : 'Save changes'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-[12px] font-medium uppercase tracking-wider text-[var(--color-ink-muted)]">{label}</label>
        {hint ? <span className="text-[11px] text-[var(--color-ink-dim)]">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] text-white placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-brand-from)] ${
        mono ? 'font-mono text-[13px]' : ''
      }`}
    />
  )
}

function TextArea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] text-white placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-brand-from)] resize-y"
    />
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'
  return (
    <div>
      <label className="block text-[12px] font-medium uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] cursor-pointer shrink-0"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[13px] font-mono text-white focus:outline-none focus:border-[var(--color-brand-from)]"
        />
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    active: { label: 'Active', bg: 'rgba(45,190,108,0.12)', fg: '#7FE3A8', border: 'rgba(45,190,108,0.3)' },
    draft: { label: 'Draft', bg: 'rgba(232,177,75,0.12)', fg: '#F4C97F', border: 'rgba(232,177,75,0.3)' },
    paused: { label: 'Paused', bg: 'rgba(232,177,75,0.12)', fg: '#F4C97F', border: 'rgba(232,177,75,0.3)' },
    archived: { label: 'Archived', bg: 'rgba(140,148,166,0.12)', fg: '#A8AFC0', border: 'rgba(140,148,166,0.3)' },
  }
  const v = map[status] ?? map.draft
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0"
      style={{ background: v.bg, color: v.fg, border: `1px solid ${v.border}` }}
    >
      {v.label}
    </span>
  )
}

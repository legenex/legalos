'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createPage } from '../actions'

type Option = { label: string; value: string }

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeSlug = (s: string): string => {
  const trimmed = s.trim()
  if (!trimmed) return ''
  if (trimmed === '/') return '/'
  return '/' + trimmed.replace(/^\/+/, '').replace(/\/+$/, '')
}

const inputClass =
  'w-full bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-border-strong)] transition-colors'

export function CreatePageForm({
  siteId,
  siteSlug,
  primaryHost,
  templateOptions,
}: {
  siteId: number
  siteSlug: string
  primaryHost: string
  templateOptions: Option[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [status, setStatus] = useState('draft')
  const [templateKey, setTemplateKey] = useState('custom')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const onTitleChange = (v: string) => {
    setTitle(v)
    if (!slugTouched) setSlug(v ? '/' + slugify(v) : '')
  }

  const previewSlug = normalizeSlug(slug)
  const previewUrl = previewSlug ? `https://${primaryHost}${previewSlug === '/' ? '' : previewSlug}` : null

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await createPage({
        siteId,
        siteSlug,
        title,
        slug: previewSlug,
        status,
        template_key: templateKey,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push(`/admin/sites/${siteSlug}/pages`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] card-edge overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          <Field label="Title">
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="About Us"
              required
              disabled={pending}
              className={inputClass}
            />
          </Field>

          <Field label="Slug">
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="/about-us"
              required
              disabled={pending}
              className={`${inputClass} font-mono`}
            />
            <Help>
              Leading slash optional. Use <code className="font-mono text-[var(--color-info)]">/</code> for the home page.
            </Help>
          </Field>

          <Grid2>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={pending}
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <Help>Drafts are visible in the admin but not on the live site.</Help>
            </Field>

            <Field label="Template">
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                disabled={pending}
                className={inputClass}
              >
                {templateOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Help>
                {templateKey === 'custom'
                  ? 'You will author body blocks yourself after creation.'
                  : 'Renders the shared legal template with this Site’s variables substituted in.'}
              </Help>
            </Field>
          </Grid2>

          <PreviewCard title={title} previewUrl={previewUrl} status={status} templateKey={templateKey} />

          {error ? (
            <p className="text-[13px] text-[var(--color-neg)] bg-[var(--color-neg)]/10 border border-[var(--color-neg)]/30 rounded-md px-3 py-2">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3 bg-[var(--color-surface-1)]">
          <button
            type="button"
            onClick={() => router.push(`/admin/sites/${siteSlug}/pages`)}
            disabled={pending}
            className="text-[13px] font-medium px-4 py-2 rounded-md text-[var(--color-ink-muted)] hover:text-white hover:bg-[var(--color-surface-2)] disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || !title.trim() || !slug.trim()}
            className="brand-gradient text-white font-semibold text-[14px] px-5 py-2.5 rounded-lg disabled:opacity-50 hover:opacity-90 inline-flex items-center gap-2 transition-opacity"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {pending ? 'Creating…' : 'Create Page'}
          </button>
        </footer>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-[var(--color-ink-muted)] mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-[var(--color-ink-dim)] mt-1.5">{children}</p>
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
}

function PreviewCard({
  title,
  previewUrl,
  status,
  templateKey,
}: {
  title: string
  previewUrl: string | null
  status: string
  templateKey: string
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-4">
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold mb-2">
        On create
      </p>
      <ul className="space-y-1.5 text-[13px] text-[var(--color-ink)]">
        <li>
          <span className="text-[var(--color-ink-muted)]">URL:</span>{' '}
          {previewUrl ? (
            <code className="text-[var(--color-info)] font-mono">{previewUrl}</code>
          ) : (
            <span className="text-[var(--color-ink-dim)]">—</span>
          )}
        </li>
        <li>
          <span className="text-[var(--color-ink-muted)]">Title:</span>{' '}
          <span className="text-white">{title.trim() || <span className="text-[var(--color-ink-dim)]">—</span>}</span>
        </li>
        <li>
          <span className="text-[var(--color-ink-muted)]">Status:</span>{' '}
          <span className="capitalize">{status}</span>
          {status === 'draft' ? (
            <span className="text-[var(--color-ink-dim)]"> · hidden from the live site until published</span>
          ) : null}
        </li>
        <li>
          <span className="text-[var(--color-ink-muted)]">Template:</span>{' '}
          {templateKey === 'custom' ? 'Custom' : `Shared: ${templateKey}`}
          <span className="text-[var(--color-ink-dim)]">
            {' '}
            ·{' '}
            {templateKey === 'custom'
              ? 'add body blocks after creation'
              : 'Site variables substitute in automatically'}
          </span>
        </li>
      </ul>
    </div>
  )
}

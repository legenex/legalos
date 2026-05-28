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

export function CreatePageForm({
  siteId,
  siteSlug,
  templateOptions,
}: {
  siteId: number
  siteSlug: string
  templateOptions: Option[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [status, setStatus] = useState('draft')
  const [templateKey, setTemplateKey] = useState('custom')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onTitleChange = (v: string) => {
    setTitle(v)
    if (!slugTouched) setSlug(v ? '/' + slugify(v) : '')
  }

  const onSlugChange = (v: string) => {
    setSlugTouched(true)
    setSlug(v)
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createPage({
        siteId,
        siteSlug,
        title,
        slug,
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

  const inputCls =
    'w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3.5 py-2.5 text-[14px] text-white placeholder:text-[var(--color-ink-dim)] focus:border-[var(--color-brand-from)] focus:outline-none transition-colors disabled:opacity-50'
  const labelCls = 'block text-[12px] font-medium text-[var(--color-ink-muted)] mb-1.5 uppercase tracking-wider'
  const helpCls = 'text-[11.5px] text-[var(--color-ink-dim)] mt-1.5'

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] card-edge p-6 space-y-5"
    >
      <fieldset disabled={pending} className="space-y-5">
        <div>
          <label className={labelCls} htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. About Us"
            className={inputCls}
            autoFocus
            required
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="slug">Slug</label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="/about-us"
            className={`${inputCls} font-mono`}
            required
          />
          <div className={helpCls}>Leading slash optional. Use <span className="font-mono">/</span> for the home page.</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls} htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputCls}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="template_key">Template</label>
            <select
              id="template_key"
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className={inputCls}
            >
              {templateOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className={helpCls}>
              {templateKey === 'custom'
                ? 'Author body blocks yourself after creation.'
                : 'Renders the shared legal template with this site’s variables.'}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[var(--color-neg)]/40 bg-[var(--color-neg)]/10 px-3.5 py-2.5 text-[13px] text-[var(--color-neg)]">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => router.push(`/admin/sites/${siteSlug}/pages`)}
            className="px-4 py-2 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || !title.trim() || !slug.trim()}
            className="brand-gradient text-white font-medium text-[14px] px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? 'Creating…' : 'Create Page'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}

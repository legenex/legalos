'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { updateProfile } from './actions'

type Initial = {
  name: string
  email: string
  avatar_url: string
  bio: string
  title: string
  timezone: string
}

export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(initial.avatar_url)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSavedAt(null)
    const formData = new FormData(e.currentTarget)
    start(async () => {
      const res = await updateProfile(formData)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSavedAt(Date.now())
      router.refresh()
    })
  }

  const initial_letter = (initial.name?.trim()?.[0] || initial.email?.[0] || '?').toUpperCase()

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-3xl">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6">
        <h2 className="text-[15px] font-semibold text-white mb-1">Avatar</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)] mb-4">
          Paste an image URL. Shown in the sidebar and on shared content.
        </p>
        <div className="flex items-center gap-5">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt=""
              className="w-16 h-16 rounded-full object-cover border border-[var(--color-border)]"
              onError={() => setAvatarPreview('')}
            />
          ) : (
            <span className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center text-white text-[24px] font-bold">
              {initial_letter}
            </span>
          )}
          <div className="flex-1">
            <Field
              name="avatar_url"
              label="Avatar URL"
              defaultValue={initial.avatar_url}
              placeholder="https://…"
              onChange={(v) => setAvatarPreview(v)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-white">Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field name="name" label="Name" defaultValue={initial.name} required />
          <Field
            name="email"
            label="Email"
            type="email"
            defaultValue={initial.email}
            required
          />
          <Field
            name="title"
            label="Title"
            defaultValue={initial.title}
            placeholder="e.g. Marketing Lead"
          />
          <Field
            name="timezone"
            label="Timezone"
            defaultValue={initial.timezone}
            placeholder="America/Los_Angeles"
          />
        </div>
        <div>
          <label className="block text-[13px] text-[var(--color-ink-muted)] mb-1.5">Bio</label>
          <textarea
            name="bio"
            defaultValue={initial.bio}
            rows={4}
            className="w-full rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-[14px] text-white placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-border-strong)]"
            placeholder="A short bio that may appear on shared content."
          />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6 space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Change password</h2>
          <p className="text-[13px] text-[var(--color-ink-muted)]">
            Leave blank to keep your current password.
          </p>
        </div>
        <Field
          name="password"
          label="New password"
          type="password"
          placeholder="At least 8 characters"
        />
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[var(--color-accent)] text-white text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        {error ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </span>
        ) : null}
        {savedAt && !error ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </span>
        ) : null}
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  type = 'text',
  defaultValue = '',
  placeholder,
  required,
  onChange,
}: {
  name: string
  label: string
  type?: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  onChange?: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[13px] text-[var(--color-ink-muted)] mb-1.5">
        {label}
        {required ? <span className="text-red-400 ml-0.5">*</span> : null}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-[14px] text-white placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-border-strong)]"
      />
    </div>
  )
}

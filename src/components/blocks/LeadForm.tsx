'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

type FormFieldDef = {
  name: string
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'hidden'
  required?: boolean
  half_width?: boolean
  options?: Array<{ value?: string; label?: string }>
  value?: string
}

type LeadFormBlock = {
  eyebrow?: string
  heading?: string
  sub?: string
  submit_label?: string
  consent_md?: string
  funnel_type?: 'quiz' | 'landing-page' | 'contact-form' | 'page' | 'advertorial'
  funnel_id?: string
  success_slug?: string
  form_fields?: FormFieldDef[] | null
}

// Field names that map into the canonical `contact` object the lead pipeline
// expects. Anything else the user puts in form_fields rides along as `extra`.
const CONTACT_KEYS = new Set(['first_name', 'last_name', 'email', 'phone', 'state', 'zip'])

type Site = {
  slug: string
  name?: string | null
}

const captureAttribution = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}
  const out: Record<string, string> = {}
  const params = new URLSearchParams(window.location.search)
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ttclid']) {
    const v = params.get(k)
    if (v) out[k] = v
  }
  if (document.referrer) out.referrer = document.referrer
  out.landing_path = window.location.pathname

  // Session id: stable per tab.
  let sid = sessionStorage.getItem('legalos_session_id')
  if (!sid) {
    sid = `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem('legalos_session_id', sid)
  }
  out.session_id = sid

  // Meta cookies
  const fbc = document.cookie.split('; ').find((c) => c.startsWith('_fbc='))?.split('=')[1]
  const fbp = document.cookie.split('; ').find((c) => c.startsWith('_fbp='))?.split('=')[1]
  if (fbc) out.fbc = fbc
  if (fbp) out.fbp = fbp
  return out
}

// Read the latest TrustedForm cert URL from the auto-injected hidden input.
const readTrustedFormCert = (): string => {
  if (typeof document === 'undefined') return ''
  const el = document.querySelector<HTMLInputElement>('input[name="xxTrustedFormCertUrl"]')
  return el?.value ?? ''
}

const readJornayaLeadId = (): string => {
  if (typeof document === 'undefined') return ''
  const el = document.querySelector<HTMLInputElement>('input[name="universal_leadid"]')
  return el?.value ?? ''
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    ttq?: { track?: (event: string, params: Record<string, unknown>, options?: Record<string, unknown>) => void }
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function LeadForm({ block, site }: { block: LeadFormBlock; site: Site }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hydrate hidden attribution inputs once the form mounts client-side.
  useEffect(() => {
    if (!formRef.current) return
    const attribution = captureAttribution()
    for (const [k, v] of Object.entries(attribution)) {
      const input = formRef.current.querySelector<HTMLInputElement>(`input[name="attr_${k}"]`)
      if (input) input.value = v
    }
  }, [])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!formRef.current) return
    setPending(true)

    const fd = new FormData(formRef.current)

    const attribution: Record<string, string> = {}
    for (const [k, v] of fd.entries()) {
      if (typeof k === 'string' && k.startsWith('attr_') && typeof v === 'string') {
        attribution[k.replace('attr_', '')] = v
      }
    }

    // Walk every form value once. Known contact keys land in `contact`,
    // anything else from a custom form_fields entry rides along as `extra`
    // so we keep the canonical lead-pipeline shape backward-compatible.
    const contact: Record<string, string> = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      state: '',
      zip: '',
    }
    const extra: Record<string, unknown> = {}
    for (const [k, v] of fd.entries()) {
      if (typeof k !== 'string' || k.startsWith('attr_')) continue
      const val = typeof v === 'string' ? v : ''
      if (CONTACT_KEYS.has(k)) {
        contact[k] = val
      } else {
        // Checkboxes that weren't checked won't appear in FormData; presence
        // here means it was checked.
        if (k in extra) {
          // Multiple values for the same name (e.g. checkbox group) — collect.
          const prev = extra[k]
          extra[k] = Array.isArray(prev) ? [...prev, val] : [prev, val]
        } else {
          extra[k] = val
        }
      }
    }

    const payload = {
      site_slug: site.slug,
      funnel_type: (block.funnel_type ?? 'contact-form') as 'contact-form',
      funnel_id: block.funnel_id,
      funnel_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      contact,
      extra: Object.keys(extra).length > 0 ? extra : undefined,
      attribution,
      trustedform_cert_url: readTrustedFormCert() || undefined,
      jornaya_lead_id: readJornayaLeadId() || undefined,
    }

    try {
      const resp = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await resp.json()) as { ok: boolean; lead_id?: number; event_id?: string; error?: string }
      if (!resp.ok || !result.ok) {
        setError(result.error ?? 'Submission failed. Please try again.')
        setPending(false)
        return
      }

      // Fire client-side pixel events with the shared event_id from the server.
      if (result.event_id) {
        try {
          window.fbq?.('track', 'Lead', { content_name: site.name ?? site.slug }, { eventID: result.event_id })
        } catch {}
        try {
          window.ttq?.track?.('SubmitForm', { content_name: site.name ?? site.slug }, { event_id: result.event_id })
        } catch {}
        try {
          window.gtag?.('event', 'generate_lead', { transaction_id: result.event_id, value: 1, currency: 'USD' })
        } catch {}
      }

      // Redirect to the success page.
      const slug = block.success_slug ?? '/submitted'
      window.location.assign(slug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
      setPending(false)
    }
  }

  return (
    <section
      id="quiz"
      style={{
        background: 'var(--site-surface)',
        padding: '64px 0',
      }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 760 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.10)',
            padding: 40,
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          {block.eyebrow ? (
            <p
              style={{
                color: 'var(--site-primary)',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                margin: 0,
              }}
            >
              {block.eyebrow}
            </p>
          ) : null}
          {block.heading ? (
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--site-ink)', margin: '12px 0 0', lineHeight: 1.2 }}>
              {block.heading}
            </h2>
          ) : null}
          {block.sub ? (
            <p style={{ fontSize: 15, color: 'var(--site-muted)', marginTop: 10, lineHeight: 1.55 }}>{block.sub}</p>
          ) : null}

          <form ref={formRef} onSubmit={onSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }} noValidate>
            <FieldsRenderer fields={block.form_fields} />

            {/* Hidden attribution inputs — hydrated client-side after mount */}
            {[
              'utm_source',
              'utm_medium',
              'utm_campaign',
              'utm_term',
              'utm_content',
              'gclid',
              'fbclid',
              'ttclid',
              'referrer',
              'landing_path',
              'session_id',
              'fbc',
              'fbp',
            ].map((k) => (
              <input key={k} type="hidden" name={`attr_${k}`} defaultValue="" />
            ))}

            {block.consent_md ? (
              <p style={{ fontSize: 12, color: 'var(--site-muted)', lineHeight: 1.5, marginTop: 4 }}>{block.consent_md}</p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              style={{
                marginTop: 8,
                background: 'var(--site-primary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 15,
                padding: '16px 22px',
                borderRadius: 8,
                border: 'none',
                cursor: pending ? 'not-allowed' : 'pointer',
                opacity: pending ? 0.7 : 1,
                transition: 'opacity 120ms',
              }}
            >
              {pending ? 'Submitting…' : (block.submit_label ?? 'See if I qualify')}
            </button>

            {error ? (
              <p style={{ color: 'var(--site-danger, #C03A2B)', fontSize: 13, marginTop: 4 }} role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}

function Input({ name, placeholder, type = 'text', required }: { name: string; placeholder: string; type?: string; required?: boolean }) {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      style={{
        width: '100%',
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.15)',
        borderRadius: 8,
        padding: '14px 16px',
        fontSize: 15,
        color: 'var(--site-ink)',
        outline: 'none',
      }}
    />
  )
}

// Default field set: matches the canonical lead pipeline contact{} shape.
// Used when the block doesn't override via form_fields[].
const DEFAULT_FIELDS: FormFieldDef[] = [
  { name: 'first_name', type: 'text', placeholder: 'First name', required: true, half_width: true },
  { name: 'last_name', type: 'text', placeholder: 'Last name', required: true, half_width: true },
  { name: 'email', type: 'email', placeholder: 'Email', required: true },
  { name: 'phone', type: 'tel', placeholder: 'Phone', required: true },
  { name: 'state', type: 'text', placeholder: 'State', half_width: true },
  { name: 'zip', type: 'text', placeholder: 'ZIP', half_width: true },
]

function FieldsRenderer({ fields }: { fields?: FormFieldDef[] | null }) {
  const list = Array.isArray(fields) && fields.length > 0 ? fields : DEFAULT_FIELDS
  // Pair consecutive half_width fields into rows.
  const rows: Array<{ kind: 'full' | 'pair'; items: FormFieldDef[] }> = []
  for (let i = 0; i < list.length; i++) {
    const f = list[i]
    if (f.half_width && list[i + 1]?.half_width) {
      rows.push({ kind: 'pair', items: [f, list[i + 1]!] })
      i++
    } else {
      rows.push({ kind: 'full', items: [f] })
    }
  }
  return (
    <>
      {rows.map((row, i) =>
        row.kind === 'pair' ? (
          <Row key={i}>
            {row.items.map((f) => (
              <FieldEl key={f.name} field={f} />
            ))}
          </Row>
        ) : (
          <FieldEl key={i} field={row.items[0]} />
        ),
      )}
    </>
  )
}

function FieldEl({ field }: { field: FormFieldDef }) {
  const t = field.type ?? 'text'
  if (t === 'hidden') {
    return <input type="hidden" name={field.name} defaultValue={field.value ?? ''} />
  }
  if (t === 'textarea') {
    return (
      <FieldWrap label={field.label}>
        <textarea
          name={field.name}
          required={!!field.required}
          placeholder={field.placeholder ?? ''}
          rows={4}
          style={{
            width: '100%',
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 8,
            padding: '14px 16px',
            fontSize: 15,
            color: 'var(--site-ink)',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </FieldWrap>
    )
  }
  if (t === 'select') {
    return (
      <FieldWrap label={field.label}>
        <select
          name={field.name}
          required={!!field.required}
          style={{
            width: '100%',
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 8,
            padding: '14px 16px',
            fontSize: 15,
            color: 'var(--site-ink)',
            outline: 'none',
          }}
          defaultValue=""
        >
          <option value="" disabled>
            {field.placeholder ?? 'Select…'}
          </option>
          {(field.options ?? []).map((opt, i) => (
            <option key={i} value={opt.value ?? ''}>
              {opt.label || opt.value || ''}
            </option>
          ))}
        </select>
      </FieldWrap>
    )
  }
  if (t === 'checkbox') {
    return (
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--site-ink)', lineHeight: 1.45, padding: '4px 0' }}>
        <input type="checkbox" name={field.name} required={!!field.required} value="1" style={{ marginTop: 4 }} />
        <span>{field.label ?? field.placeholder ?? field.name}</span>
      </label>
    )
  }
  return (
    <FieldWrap label={field.label}>
      <Input name={field.name} type={t} placeholder={field.placeholder ?? ''} required={!!field.required} />
    </FieldWrap>
  )
}

function FieldWrap({ label, children }: { label?: string; children: React.ReactNode }) {
  if (!label) return <>{children}</>
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--site-muted)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

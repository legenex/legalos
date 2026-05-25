'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

type LeadFormBlock = {
  eyebrow?: string
  heading?: string
  sub?: string
  submit_label?: string
  consent_md?: string
  funnel_type?: 'quiz' | 'landing-page' | 'contact-form' | 'page' | 'advertorial'
  funnel_id?: string
  success_slug?: string
}

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

    const payload = {
      site_slug: site.slug,
      funnel_type: (block.funnel_type ?? 'contact-form') as 'contact-form',
      funnel_id: block.funnel_id,
      funnel_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      contact: {
        first_name: String(fd.get('first_name') ?? ''),
        last_name: String(fd.get('last_name') ?? ''),
        email: String(fd.get('email') ?? ''),
        phone: String(fd.get('phone') ?? ''),
        state: String(fd.get('state') ?? ''),
        zip: String(fd.get('zip') ?? ''),
      },
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
            <Row>
              <Input name="first_name" placeholder="First name" required />
              <Input name="last_name" placeholder="Last name" required />
            </Row>
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="phone" type="tel" placeholder="Phone" required />
            <Row>
              <Input name="state" placeholder="State" />
              <Input name="zip" placeholder="ZIP" />
            </Row>

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

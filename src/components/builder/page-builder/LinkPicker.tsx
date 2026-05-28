// @ts-nocheck
/* eslint-disable */
'use client'

// LinkPicker — drop-in replacement for raw href text inputs. Behaves like
// an input but the autocomplete dropdown surfaces the Site's pages by
// slug + status pill. The user can still type freely (external URLs,
// tel:/mailto:, anchor links like #pricing, etc.) — the dropdown only
// suggests the Site's own pages plus a couple of helpers.

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Link2, ExternalLink, Hash, Phone, Mail } from 'lucide-react'
import { T, Input, Pill } from '../ui'

type SitePage = { id: string; title: string; slug: string; status: string }

const HELPER_PREFIXES = [
  { prefix: '#', icon: Hash, label: 'Anchor on this page' },
  { prefix: 'tel:', icon: Phone, label: 'Phone number' },
  { prefix: 'mailto:', icon: Mail, label: 'Email address' },
]

export function LinkPickerField({
  label,
  value,
  onChange,
  sitePages,
  placeholder = '/page-slug or https://…',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  sitePages: SitePage[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const f = filter.trim().toLowerCase()
  const matchingPages = (sitePages || [])
    .filter((p) => !f || p.slug.toLowerCase().includes(f) || p.title.toLowerCase().includes(f))
    .slice(0, 12)

  const isExternal = value && /^https?:\/\//i.test(value)
  const isAnchor = value && value.startsWith('#')
  const isTel = value && value.startsWith('tel:')
  const isMail = value && value.startsWith('mailto:')
  const matchedPage = (sitePages || []).find((p) => p.slug === value)

  const Indicator = isExternal
    ? ExternalLink
    : isAnchor
      ? Hash
      : isTel
        ? Phone
        : isMail
          ? Mail
          : matchedPage
            ? Link2
            : Link2

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Input
            mono
            value={value || ''}
            onChange={(e) => {
              onChange(e.target.value)
              if (!open) setOpen(true)
              setFilter(e.target.value)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            style={{ paddingLeft: 32 }}
          />
          <Indicator
            size={13}
            color={T.textMute}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v)
            setFilter(value || '')
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '0 10px',
            background: T.bgElev,
            border: `1px solid ${T.border}`,
            color: T.text,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
          }}
          title="Browse links"
        >
          <ChevronDown size={13} />
        </button>
      </div>

      {open ? (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: 320,
            overflowY: 'auto',
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
            padding: 6,
          }}
        >
          {matchingPages.length > 0 ? (
            <>
              <div
                style={{
                  padding: '6px 10px 4px',
                  fontSize: 10,
                  color: T.textLow,
                  fontFamily: '"JetBrains Mono", monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Site pages
              </div>
              {matchingPages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.slug)
                    setOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: T.text,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: 6,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = T.bgElev)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <Link2 size={12} color={T.textMute} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontFamily: '"JetBrains Mono", monospace',
                        color: T.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.slug}
                    </span>
                    <span style={{ flex: 1 }} />
                    <span
                      style={{
                        fontSize: 11,
                        color: T.textMute,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.title}
                    </span>
                  </div>
                  <Pill
                    color={p.status === 'published' ? T.success : p.status === 'scheduled' ? T.warning : T.textMute}
                  >
                    {p.status === 'published' ? 'LIVE' : (p.status || 'draft').toUpperCase()}
                  </Pill>
                </button>
              ))}
            </>
          ) : (
            <div style={{ padding: '8px 10px', fontSize: 11, color: T.textMute }}>
              No matching site pages. Type the destination directly.
            </div>
          )}

          <div
            style={{
              marginTop: 4,
              borderTop: `1px solid ${T.border}`,
              padding: '6px 10px 4px',
              fontSize: 10,
              color: T.textLow,
              fontFamily: '"JetBrains Mono", monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Other
          </div>
          {HELPER_PREFIXES.map((h) => {
            const Icon = h.icon
            return (
              <button
                key={h.prefix}
                type="button"
                onClick={() => {
                  onChange(h.prefix)
                  setOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: T.text,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: 6,
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = T.bgElev)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <Icon size={12} color={T.textMute} />
                <span style={{ fontSize: 12, color: T.text }}>{h.label}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: T.textLow }}>
                  {h.prefix}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

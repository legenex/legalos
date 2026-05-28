// @ts-nocheck
/* eslint-disable */
'use client'

// Pages builder, body_blocks edition. Same visual shell as Landing Pages
// (TopBar + 3-pane), but the data model IS body_blocks (the same JSON the
// public BlockRenderer reads), and the center pane is an iframe of the live
// page URL — so what you see in the backend is exactly what visitors see.
//
// Per type, the section editor on the right surfaces only that block type's
// fields (defined in src/collections/Pages.ts). Save writes body_blocks back
// to the row; the iframe is refreshed via a cache-buster querystring so the
// preview reflects the save without a manual reload.

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, MoveUp, MoveDown, Trash2, ChevronLeft, ChevronRight, Eye, EyeOff, Save, X,
  Layers, Rocket, Image as ImageIcon, Megaphone, List, FileText, Code2, Quote,
  HelpCircle, Star, Award, Trophy, ListChecks, ListOrdered, Grid3x3, Shield,
  MousePointerClick, RotateCw, Sparkles, Check, Loader2, Copy, GripVertical,
} from 'lucide-react'
import {
  T, Btn, Input, Textarea, Select, Label, Pill, IconBtn, ConfirmDialog, Toast,
  TopBar,
} from '../ui'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { ImagePickerField } from './ImagePicker'
import { savePageBodyBlocks } from '@/app/(app)/admin/sites/[slug]/pages/[id]/blocks-actions'
import { rewriteSection } from '@/app/(app)/admin/sites/[slug]/pages/[id]/ai-rewrite-action'

const genId = () => `b_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// ============================================================================
// BLOCK TYPE REGISTRY — mirrors Pages.ts blocks config so the Add panel and
// list icons stay in sync. Order here is the recommended insertion order.
// ============================================================================
const BLOCK_TYPES = [
  { id: 'nav_header',    name: 'Navigation Header', icon: Layers,             desc: 'Top nav with links + CTA' },
  { id: 'hero',          name: 'Hero',              icon: Rocket,             desc: 'Headline, sub, CTAs' },
  { id: 'trust_strip',   name: 'Trust Strip',       icon: Award,              desc: 'Inline trust badges' },
  { id: 'services_grid', name: 'Services Grid',     icon: Grid3x3,            desc: 'Practice areas / services' },
  { id: 'how_it_works',  name: 'How It Works',      icon: ListChecks,         desc: 'Step-by-step process' },
  { id: 'cards',         name: 'Cards',             icon: List,               desc: 'Generic 2-up / 3-up cards' },
  { id: 'recent_wins',   name: 'Recent Wins',       icon: Trophy,             desc: 'Past case results' },
  { id: 'testimonials',  name: 'Testimonials',      icon: Quote,              desc: 'Client quotes' },
  { id: 'stats',         name: 'Stats',             icon: ListOrdered,        desc: 'Numbers and labels' },
  { id: 'bullet_list',   name: 'Bullet List',       icon: List,               desc: 'Bulleted points' },
  { id: 'prose',         name: 'Prose',             icon: FileText,           desc: 'Markdown copy' },
  { id: 'image',         name: 'Image',             icon: ImageIcon,          desc: 'Single image + alt' },
  { id: 'cta',           name: 'CTA',               icon: Megaphone,          desc: 'Mid-page CTA' },
  { id: 'final_cta',     name: 'Final CTA',         icon: MousePointerClick,  desc: 'Closing CTA' },
  { id: 'faq',           name: 'FAQ',               icon: HelpCircle,         desc: 'Question / answer accordion' },
  { id: 'disclosure',    name: 'Disclosure',        icon: Shield,             desc: 'Legal disclaimer copy' },
  { id: 'lead_form',     name: 'Lead Form',         icon: Star,               desc: 'Inline capture form' },
  { id: 'custom_html',   name: 'Custom HTML',       icon: Code2,              desc: 'Raw HTML embed' },
  { id: 'embed',         name: 'Embed',             icon: Code2,              desc: 'Iframe / script embed' },
  { id: 'site_footer',   name: 'Site Footer',       icon: Layers,             desc: 'Footer with link columns' },
]
const BLOCK_META = Object.fromEntries(BLOCK_TYPES.map((b) => [b.id, b]))

// Per-type default copy. Keeps additions non-empty so the iframe shows
// something useful immediately.
const SEED_FOR: Record<string, () => Record<string, unknown>> = {
  nav_header: () => ({
    blockType: 'nav_header',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '#services' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contact', href: '#contact' },
    ],
    cta_label: 'Start',
    cta_href: '#hero',
    show_phone: true,
  }),
  hero: () => ({
    blockType: 'hero',
    eyebrow: '100% Free • No Win, No Fee • Fast Results',
    heading: 'Check Your Claim',
    sub: 'Unsure if you have a case after an accident? Our AI tool instantly checks if you may qualify for compensation and matches you with the best-suited attorney, at no upfront cost.',
    primary_cta_label: 'Start Your Free Claim Check',
    primary_cta_href: '#hero',
    secondary_cta_label: '',
    secondary_cta_href: '',
    image_url: '',
  }),
  trust_strip: () => ({
    blockType: 'trust_strip',
    items: [
      { value: '100% Free', label: 'No fees' },
      { value: 'No Win No Fee', label: 'Pay nothing unless we recover' },
    ],
  }),
  services_grid: () => ({
    blockType: 'services_grid',
    eyebrow: 'Specialties',
    heading: 'What we do',
    sub: '',
    items: [
      { title: 'Auto Accidents', description: '', icon: 'Car' },
      { title: 'Commercial Accidents', description: '', icon: 'Truck' },
    ],
  }),
  how_it_works: () => ({
    blockType: 'how_it_works',
    eyebrow: 'Process',
    heading: 'How it works',
    sub: '',
    steps: [
      { title: 'Step 1', description: '' },
      { title: 'Step 2', description: '' },
      { title: 'Step 3', description: '' },
    ],
  }),
  cards: () => ({
    blockType: 'cards',
    heading: 'Two cards',
    items: [
      { title: 'Card 1', body: '', icon: '✓' },
      { title: 'Card 2', body: '', icon: '✓' },
    ],
  }),
  recent_wins: () => ({
    blockType: 'recent_wins',
    eyebrow: 'Recent results',
    heading: 'Past wins',
    sub: '',
    items: [{ amount: '$0', case_type: 'Case type', description: '' }],
    disclaimer: '',
  }),
  testimonials: () => ({
    blockType: 'testimonials',
    heading: 'What clients say',
    items: [{ quote: 'Great service.', attribution: 'Client', avatar_url: '' }],
  }),
  stats: () => ({
    blockType: 'stats',
    heading: 'By the numbers',
    items: [
      { value: '$0', label: 'Recovered' },
      { value: '0', label: 'Clients served' },
    ],
  }),
  bullet_list: () => ({
    blockType: 'bullet_list',
    heading: 'Highlights',
    items: [{ item: 'Point one' }, { item: 'Point two' }],
  }),
  prose: () => ({ blockType: 'prose', markdown: 'Write your copy here.' }),
  image: () => ({ blockType: 'image', url: '', alt: '', caption: '' }),
  cta: () => ({
    blockType: 'cta',
    heading: 'Ready to get started?',
    sub: '',
    label: 'Start',
    href: '#',
  }),
  final_cta: () => ({
    blockType: 'final_cta',
    eyebrow: '',
    heading: 'Talk to us today',
    sub: '',
    primary_cta_label: 'Start',
    primary_cta_href: '#',
    show_phone: true,
  }),
  faq: () => ({
    blockType: 'faq',
    heading: 'Frequently asked',
    items: [{ question: 'A question?', answer: 'An answer.' }],
  }),
  disclosure: () => ({ blockType: 'disclosure', markdown: 'Legal disclaimer copy.' }),
  lead_form: () => ({
    blockType: 'lead_form',
    eyebrow: '',
    heading: 'Start your check',
    sub: '',
    submit_label: 'See if I qualify',
    consent_md: '',
    funnel_type: 'contact-form',
    funnel_id: '',
    success_slug: '/submitted',
  }),
  custom_html: () => ({ blockType: 'custom_html', html: '<div></div>' }),
  embed: () => ({ blockType: 'embed', html: '<iframe></iframe>', note: '' }),
  site_footer: () => ({
    blockType: 'site_footer',
    columns: [{ heading: 'Company', links: [{ label: 'About', href: '/about' }] }],
    legal_md: '',
  }),
}

// ============================================================================
// ARRAY EDITOR — generic repeated-item helper, used by every block editor
// that surfaces an array (links, items, steps, columns, etc.)
// ============================================================================
const ArrayEditor = ({ items, blank, render, onChange, addLabel = 'Add item' }) => {
  const update = (idx, patch) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    onChange(next)
  }
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx))
  const move = (idx, dir) => {
    const next = [...items]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it, idx) => (
        <div key={idx} style={{ padding: 10, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Pill color={T.textMute}>{idx + 1}</Pill>
            <div style={{ flex: 1 }} />
            <IconBtn icon={MoveUp} onClick={() => move(idx, -1)} />
            <IconBtn icon={MoveDown} onClick={() => move(idx, 1)} />
            <IconBtn icon={Trash2} onClick={() => remove(idx)} style={{ color: T.danger }} />
          </div>
          {render(it, (patch) => update(idx, patch))}
        </div>
      ))}
      <Btn variant="secondary" size="sm" icon={Plus} onClick={() => onChange([...items, { ...blank }])}>
        {addLabel}
      </Btn>
    </div>
  )
}

// ============================================================================
// AI REWRITE PANEL — inline "Ask AI" affordance at the top of every section
// editor. The user types an instruction ("make this more urgent / shorten by
// 30% / add a stat about $50M+ recovered"), Claude rewrites the block within
// its blockType's field schema, and the user accepts or rejects the result.
// On accept, the parent block state replaces the current block with the
// rewritten one (id is preserved by the caller).
// ============================================================================
const QUICK_PROMPTS = [
  'Make it more urgent and direct.',
  'Shorten by ~30% without losing meaning.',
  'Add an empathetic, human tone.',
  'Make the CTA copy more action-oriented.',
]

const AIRewritePanel = ({ block, onAccept }) => {
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    // When the user clicks to another section, clear panel state so a
    // pending preview doesn't get applied to the wrong block.
    setOpen(false)
    setInstruction('')
    setBusy(false)
    setError(null)
    setResult(null)
  }, [block?.id])

  const run = async (override) => {
    const text = (override ?? instruction).trim()
    if (!text) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await rewriteSection({ block, instruction: text })
      if (!res.ok) {
        setError(res.error)
      } else {
        setResult(res.block)
      }
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div style={{ marginBottom: 12 }}>
        <Btn variant="secondary" size="sm" icon={Sparkles} onClick={() => setOpen(true)}>
          Ask AI to rewrite this section
        </Btn>
      </div>
    )
  }

  return (
    <div
      style={{
        marginBottom: 14,
        padding: 12,
        background: T.bgElev,
        border: `1px solid ${T.primary}40`,
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Sparkles size={14} color={T.primary} />
        <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>AI rewrite</span>
        <div style={{ flex: 1 }} />
        <IconBtn icon={X} onClick={() => setOpen(false)} />
      </div>

      {!result ? (
        <>
          <Textarea
            rows={2}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="What should change? e.g. shorten by 30%, make more urgent, add a stat"
            disabled={busy}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                disabled={busy}
                onClick={() => {
                  setInstruction(p)
                  run(p)
                }}
                style={{
                  padding: '5px 9px',
                  borderRadius: 999,
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  color: T.textMute,
                  fontSize: 11,
                  cursor: 'pointer',
                  opacity: busy ? 0.5 : 1,
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <Btn
              variant="primary"
              size="sm"
              icon={busy ? Loader2 : Sparkles}
              onClick={() => run()}
              disabled={busy || !instruction.trim()}
            >
              {busy ? 'Rewriting…' : 'Rewrite'}
            </Btn>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, color: T.textMute, marginBottom: 8 }}>
            Preview below — accept to replace the section, or reject to keep editing manually.
          </div>
          <div
            style={{
              padding: 10,
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              maxHeight: 220,
              overflow: 'auto',
              color: T.text,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <Btn
              variant="primary"
              size="sm"
              icon={Check}
              onClick={() => {
                onAccept(result)
                setResult(null)
                setOpen(false)
                setInstruction('')
              }}
            >
              Accept
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => setResult(null)}>
              Try again
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => { setResult(null); setOpen(false) }}>
              Reject
            </Btn>
          </div>
        </>
      )}

      {error ? (
        <div
          style={{
            marginTop: 10,
            padding: 8,
            background: `${T.danger}15`,
            border: `1px solid ${T.danger}40`,
            borderRadius: 6,
            color: T.danger,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  )
}

// ============================================================================
// FORM FIELDS EDITOR — repeated editor for lead_form's custom field list. A
// field is { name, label, placeholder, type, required, half_width, options? }.
// The default empty list signals 'use the legacy first_name/last_name/email/
// phone/state/zip set' to the public LeadForm renderer.
// ============================================================================
const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select (dropdown)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'hidden', label: 'Hidden' },
]

const slugifyName = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')

const FormFieldsEditor = ({ items, onChange }) => {
  const update = (idx, patch) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    onChange(next)
  }
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx))
  const move = (idx, dir) => {
    const next = [...items]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }
  const addField = (type) =>
    onChange([
      ...items,
      {
        name: `field_${items.length + 1}`,
        label: '',
        placeholder: '',
        type,
        required: false,
        half_width: false,
        options: type === 'select' ? [{ value: '', label: '' }] : undefined,
      },
    ])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.length === 0 ? (
        <div style={{ padding: 12, background: T.bgElev, border: `1px dashed ${T.border}`, borderRadius: 7, fontSize: 12, color: T.textMute }}>
          No custom fields. The public form will render: First name, Last name, Email, Phone, State, ZIP.
        </div>
      ) : (
        items.map((it, idx) => (
          <div key={idx} style={{ padding: 10, background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Pill color={T.textMute}>{idx + 1}</Pill>
              <Pill color={T.primary}>{(FIELD_TYPES.find((t) => t.value === it.type) || {}).label || it.type}</Pill>
              <div style={{ flex: 1 }} />
              <IconBtn icon={MoveUp} onClick={() => move(idx, -1)} />
              <IconBtn icon={MoveDown} onClick={() => move(idx, 1)} />
              <IconBtn icon={Trash2} onClick={() => remove(idx)} style={{ color: T.danger }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div>
                <Label>Name (key)</Label>
                <Input
                  mono
                  value={it.name || ''}
                  onChange={(e) => update(idx, { name: slugifyName(e.target.value) })}
                  placeholder="first_name"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={it.type || 'text'}
                  onChange={(e) => {
                    const t = e.target.value
                    update(idx, {
                      type: t,
                      options: t === 'select' && !Array.isArray(it.options) ? [{ value: '', label: '' }] : it.options,
                    })
                  }}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {it.type !== 'hidden' ? (
              <>
                <Label>Label</Label>
                <Input value={it.label || ''} onChange={(e) => update(idx, { label: e.target.value })} placeholder="First name" />
                <Label>Placeholder</Label>
                <Input value={it.placeholder || ''} onChange={(e) => update(idx, { placeholder: e.target.value })} />
              </>
            ) : (
              <>
                <Label>Default value</Label>
                <Input mono value={it.value || ''} onChange={(e) => update(idx, { value: e.target.value })} placeholder="(constant)" />
              </>
            )}
            {it.type === 'select' ? (
              <div style={{ marginTop: 8 }}>
                <Label>Options</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(it.options || []).map((opt, j) => (
                    <div key={j} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
                      <Input
                        mono
                        value={opt.value || ''}
                        onChange={(e) => {
                          const next = [...(it.options || [])]
                          next[j] = { ...next[j], value: e.target.value }
                          update(idx, { options: next })
                        }}
                        placeholder="value"
                      />
                      <Input
                        value={opt.label || ''}
                        onChange={(e) => {
                          const next = [...(it.options || [])]
                          next[j] = { ...next[j], label: e.target.value }
                          update(idx, { options: next })
                        }}
                        placeholder="Label shown to user"
                      />
                      <IconBtn
                        icon={Trash2}
                        onClick={() => update(idx, { options: (it.options || []).filter((_, k) => k !== j) })}
                        style={{ color: T.danger }}
                      />
                    </div>
                  ))}
                  <Btn
                    variant="secondary"
                    size="xs"
                    icon={Plus}
                    onClick={() => update(idx, { options: [...(it.options || []), { value: '', label: '' }] })}
                  >
                    Add option
                  </Btn>
                </div>
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: T.text }}>
                <input
                  type="checkbox"
                  checked={!!it.required}
                  onChange={(e) => update(idx, { required: e.target.checked })}
                />
                Required
              </label>
              {it.type !== 'hidden' && it.type !== 'textarea' && it.type !== 'checkbox' ? (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: T.text }}>
                  <input
                    type="checkbox"
                    checked={!!it.half_width}
                    onChange={(e) => update(idx, { half_width: e.target.checked })}
                  />
                  Half width (pair w/ next field)
                </label>
              ) : null}
            </div>
          </div>
        ))
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FIELD_TYPES.map((t) => (
          <Btn key={t.value} variant="secondary" size="xs" icon={Plus} onClick={() => addField(t.value)}>
            {t.label}
          </Btn>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// PER-BLOCK EDITORS — each takes (block, set) where `set(patch)` shallow-merges
// into the block. They render only the fields that block type owns.
// ============================================================================
const Ed = {
  nav_header: (b, set) => (
    <>
      <Label>Links</Label>
      <ArrayEditor
        items={b.links || []}
        blank={{ label: '', href: '' }}
        onChange={(links) => set({ links })}
        render={(it, u) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div><Label>Label</Label><Input value={it.label || ''} onChange={(e) => u({ label: e.target.value })} /></div>
            <div><Label>Href</Label><Input mono value={it.href || ''} onChange={(e) => u({ href: e.target.value })} /></div>
          </div>
        )}
        addLabel="Add link"
      />
      <Label style={{ marginTop: 12 }}>CTA label</Label>
      <Input value={b.cta_label || ''} onChange={(e) => set({ cta_label: e.target.value })} />
      <Label>CTA href</Label>
      <Input mono value={b.cta_href || ''} onChange={(e) => set({ cta_href: e.target.value })} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <input id="np" type="checkbox" checked={b.show_phone !== false} onChange={(e) => set({ show_phone: e.target.checked })} />
        <label htmlFor="np" style={{ fontSize: 12.5, color: T.text }}>Show phone number</label>
      </div>
    </>
  ),
  hero: (b, set, ctx) => (
    <>
      <Label>Eyebrow (badge)</Label><Input value={b.eyebrow || ''} onChange={(e) => set({ eyebrow: e.target.value })} />
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label>Sub</Label><Textarea rows={3} value={b.sub || ''} onChange={(e) => set({ sub: e.target.value })} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <div><Label>Primary CTA label</Label><Input value={b.primary_cta_label || ''} onChange={(e) => set({ primary_cta_label: e.target.value })} /></div>
        <div><Label>Primary CTA href</Label><Input mono value={b.primary_cta_href || ''} onChange={(e) => set({ primary_cta_href: e.target.value })} /></div>
        <div><Label>Secondary CTA label</Label><Input value={b.secondary_cta_label || ''} onChange={(e) => set({ secondary_cta_label: e.target.value })} /></div>
        <div><Label>Secondary CTA href</Label><Input mono value={b.secondary_cta_href || ''} onChange={(e) => set({ secondary_cta_href: e.target.value })} /></div>
      </div>
      <ImagePickerField
        label="Background image"
        value={b.image_url || ''}
        onChange={(url) => set({ image_url: url })}
        siteSlug={ctx.siteSlug}
        siteId={ctx.siteId}
      />
    </>
  ),
  trust_strip: (b, set) => (
    <>
      <Label>Items</Label>
      <ArrayEditor
        items={b.items || []}
        blank={{ value: '', label: '' }}
        onChange={(items) => set({ items })}
        render={(it, u) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div><Label>Value</Label><Input value={it.value || ''} onChange={(e) => u({ value: e.target.value })} /></div>
            <div><Label>Label</Label><Input value={it.label || ''} onChange={(e) => u({ label: e.target.value })} /></div>
          </div>
        )}
        addLabel="Add item"
      />
    </>
  ),
  services_grid: (b, set) => (
    <>
      <Label>Eyebrow</Label><Input value={b.eyebrow || ''} onChange={(e) => set({ eyebrow: e.target.value })} />
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label>Sub</Label><Textarea rows={2} value={b.sub || ''} onChange={(e) => set({ sub: e.target.value })} />
      <Label style={{ marginTop: 10 }}>Items</Label>
      <ArrayEditor
        items={b.items || []}
        blank={{ title: '', description: '', icon: '' }}
        onChange={(items) => set({ items })}
        render={(it, u) => (
          <>
            <Label>Title</Label><Input value={it.title || ''} onChange={(e) => u({ title: e.target.value })} />
            <Label>Description</Label><Textarea rows={2} value={it.description || ''} onChange={(e) => u({ description: e.target.value })} />
            <Label>Icon (Lucide name)</Label><Input mono value={it.icon || ''} onChange={(e) => u({ icon: e.target.value })} />
          </>
        )}
        addLabel="Add service"
      />
    </>
  ),
  how_it_works: (b, set) => (
    <>
      <Label>Eyebrow</Label><Input value={b.eyebrow || ''} onChange={(e) => set({ eyebrow: e.target.value })} />
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label>Sub</Label><Textarea rows={2} value={b.sub || ''} onChange={(e) => set({ sub: e.target.value })} />
      <Label style={{ marginTop: 10 }}>Steps</Label>
      <ArrayEditor
        items={b.steps || []}
        blank={{ title: '', description: '' }}
        onChange={(steps) => set({ steps })}
        render={(it, u) => (
          <>
            <Label>Title</Label><Input value={it.title || ''} onChange={(e) => u({ title: e.target.value })} />
            <Label>Description</Label><Textarea rows={2} value={it.description || ''} onChange={(e) => u({ description: e.target.value })} />
          </>
        )}
        addLabel="Add step"
      />
    </>
  ),
  cards: (b, set) => (
    <>
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label style={{ marginTop: 10 }}>Items</Label>
      <ArrayEditor
        items={b.items || []}
        blank={{ title: '', body: '', icon: '' }}
        onChange={(items) => set({ items })}
        render={(it, u) => (
          <>
            <Label>Title</Label><Input value={it.title || ''} onChange={(e) => u({ title: e.target.value })} />
            <Label>Body</Label><Textarea rows={2} value={it.body || ''} onChange={(e) => u({ body: e.target.value })} />
            <Label>Icon</Label><Input value={it.icon || ''} onChange={(e) => u({ icon: e.target.value })} />
          </>
        )}
        addLabel="Add card"
      />
    </>
  ),
  recent_wins: (b, set) => (
    <>
      <Label>Eyebrow</Label><Input value={b.eyebrow || ''} onChange={(e) => set({ eyebrow: e.target.value })} />
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label>Sub</Label><Textarea rows={2} value={b.sub || ''} onChange={(e) => set({ sub: e.target.value })} />
      <Label style={{ marginTop: 10 }}>Items</Label>
      <ArrayEditor
        items={b.items || []}
        blank={{ amount: '', case_type: '', description: '' }}
        onChange={(items) => set({ items })}
        render={(it, u) => (
          <>
            <Label>Amount</Label><Input value={it.amount || ''} onChange={(e) => u({ amount: e.target.value })} />
            <Label>Case type</Label><Input value={it.case_type || ''} onChange={(e) => u({ case_type: e.target.value })} />
            <Label>Description</Label><Textarea rows={2} value={it.description || ''} onChange={(e) => u({ description: e.target.value })} />
          </>
        )}
        addLabel="Add win"
      />
      <Label style={{ marginTop: 10 }}>Disclaimer</Label>
      <Textarea rows={2} value={b.disclaimer || ''} onChange={(e) => set({ disclaimer: e.target.value })} />
    </>
  ),
  testimonials: (b, set) => (
    <>
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label style={{ marginTop: 10 }}>Items</Label>
      <ArrayEditor
        items={b.items || []}
        blank={{ quote: '', attribution: '', avatar_url: '' }}
        onChange={(items) => set({ items })}
        render={(it, u) => (
          <>
            <Label>Quote</Label><Textarea rows={3} value={it.quote || ''} onChange={(e) => u({ quote: e.target.value })} />
            <Label>Attribution</Label><Input value={it.attribution || ''} onChange={(e) => u({ attribution: e.target.value })} />
            <Label>Avatar URL</Label><Input mono value={it.avatar_url || ''} onChange={(e) => u({ avatar_url: e.target.value })} />
          </>
        )}
        addLabel="Add testimonial"
      />
    </>
  ),
  stats: (b, set) => (
    <>
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label style={{ marginTop: 10 }}>Items</Label>
      <ArrayEditor
        items={b.items || []}
        blank={{ value: '', label: '' }}
        onChange={(items) => set({ items })}
        render={(it, u) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div><Label>Value</Label><Input value={it.value || ''} onChange={(e) => u({ value: e.target.value })} /></div>
            <div><Label>Label</Label><Input value={it.label || ''} onChange={(e) => u({ label: e.target.value })} /></div>
          </div>
        )}
        addLabel="Add stat"
      />
    </>
  ),
  bullet_list: (b, set) => (
    <>
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label style={{ marginTop: 10 }}>Items</Label>
      <ArrayEditor
        items={b.items || []}
        blank={{ item: '' }}
        onChange={(items) => set({ items })}
        render={(it, u) => (
          <Input value={it.item || ''} onChange={(e) => u({ item: e.target.value })} />
        )}
        addLabel="Add bullet"
      />
    </>
  ),
  prose: (b, set) => (
    <>
      <Label>Markdown</Label>
      <Textarea rows={12} value={b.markdown || ''} onChange={(e) => set({ markdown: e.target.value })} />
    </>
  ),
  image: (b, set, ctx) => (
    <>
      <ImagePickerField
        label="Image"
        value={b.url || ''}
        onChange={(url) => set({ url })}
        siteSlug={ctx.siteSlug}
        siteId={ctx.siteId}
      />
      <Label>Alt</Label><Input value={b.alt || ''} onChange={(e) => set({ alt: e.target.value })} />
      <Label>Caption</Label><Input value={b.caption || ''} onChange={(e) => set({ caption: e.target.value })} />
    </>
  ),
  cta: (b, set) => (
    <>
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label>Sub</Label><Textarea rows={2} value={b.sub || ''} onChange={(e) => set({ sub: e.target.value })} />
      <Label>Button label</Label><Input value={b.label || ''} onChange={(e) => set({ label: e.target.value })} />
      <Label>Button href</Label><Input mono value={b.href || ''} onChange={(e) => set({ href: e.target.value })} />
    </>
  ),
  final_cta: (b, set) => (
    <>
      <Label>Eyebrow</Label><Input value={b.eyebrow || ''} onChange={(e) => set({ eyebrow: e.target.value })} />
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label>Sub</Label><Textarea rows={2} value={b.sub || ''} onChange={(e) => set({ sub: e.target.value })} />
      <Label>Primary CTA label</Label><Input value={b.primary_cta_label || ''} onChange={(e) => set({ primary_cta_label: e.target.value })} />
      <Label>Primary CTA href</Label><Input mono value={b.primary_cta_href || ''} onChange={(e) => set({ primary_cta_href: e.target.value })} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <input id="fcp" type="checkbox" checked={b.show_phone !== false} onChange={(e) => set({ show_phone: e.target.checked })} />
        <label htmlFor="fcp" style={{ fontSize: 12.5, color: T.text }}>Show phone number</label>
      </div>
    </>
  ),
  faq: (b, set) => (
    <>
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label style={{ marginTop: 10 }}>Items</Label>
      <ArrayEditor
        items={b.items || []}
        blank={{ question: '', answer: '' }}
        onChange={(items) => set({ items })}
        render={(it, u) => (
          <>
            <Label>Question</Label><Input value={it.question || ''} onChange={(e) => u({ question: e.target.value })} />
            <Label>Answer</Label><Textarea rows={3} value={it.answer || ''} onChange={(e) => u({ answer: e.target.value })} />
          </>
        )}
        addLabel="Add Q&A"
      />
    </>
  ),
  disclosure: (b, set) => (
    <>
      <Label>Markdown</Label>
      <Textarea rows={10} value={b.markdown || ''} onChange={(e) => set({ markdown: e.target.value })} />
    </>
  ),
  lead_form: (b, set) => (
    <>
      <Label>Eyebrow</Label><Input value={b.eyebrow || ''} onChange={(e) => set({ eyebrow: e.target.value })} />
      <Label>Heading</Label><Input value={b.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
      <Label>Sub</Label><Textarea rows={2} value={b.sub || ''} onChange={(e) => set({ sub: e.target.value })} />
      <Label>Submit label</Label><Input value={b.submit_label || ''} onChange={(e) => set({ submit_label: e.target.value })} />
      <Label>Consent markdown</Label><Textarea rows={4} value={b.consent_md || ''} onChange={(e) => set({ consent_md: e.target.value })} />
      <Label>Success slug</Label><Input mono value={b.success_slug || ''} onChange={(e) => set({ success_slug: e.target.value })} />

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <Label style={{ marginBottom: 0 }}>Form fields</Label>
          <span style={{ fontSize: 10.5, color: T.textLow }}>
            {Array.isArray(b.form_fields) && b.form_fields.length > 0
              ? `${b.form_fields.length} custom field${b.form_fields.length === 1 ? '' : 's'}`
              : 'Using default: name / email / phone / state / zip'}
          </span>
        </div>
        <FormFieldsEditor
          items={Array.isArray(b.form_fields) ? b.form_fields : []}
          onChange={(form_fields) => set({ form_fields })}
        />
      </div>
    </>
  ),
  custom_html: (b, set) => (
    <>
      <Label>HTML</Label>
      <Textarea rows={12} value={b.html || ''} onChange={(e) => set({ html: e.target.value })} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }} />
    </>
  ),
  embed: (b, set) => (
    <>
      <Label>HTML</Label>
      <Textarea rows={10} value={b.html || ''} onChange={(e) => set({ html: e.target.value })} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }} />
      <Label>Admin note</Label>
      <Input value={b.note || ''} onChange={(e) => set({ note: e.target.value })} />
    </>
  ),
  site_footer: (b, set) => (
    <>
      <Label>Columns</Label>
      <ArrayEditor
        items={b.columns || []}
        blank={{ heading: '', links: [] }}
        onChange={(columns) => set({ columns })}
        render={(col, u) => (
          <>
            <Label>Heading</Label><Input value={col.heading || ''} onChange={(e) => u({ heading: e.target.value })} />
            <Label>Links</Label>
            <ArrayEditor
              items={col.links || []}
              blank={{ label: '', href: '' }}
              onChange={(links) => u({ links })}
              render={(it, uu) => (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div><Label>Label</Label><Input value={it.label || ''} onChange={(e) => uu({ label: e.target.value })} /></div>
                  <div><Label>Href</Label><Input mono value={it.href || ''} onChange={(e) => uu({ href: e.target.value })} /></div>
                </div>
              )}
              addLabel="Add link"
            />
          </>
        )}
        addLabel="Add column"
      />
      <Label style={{ marginTop: 10 }}>Legal markdown</Label>
      <Textarea rows={5} value={b.legal_md || ''} onChange={(e) => set({ legal_md: e.target.value })} />
    </>
  ),
}

const BlockEditor = ({ block, onChange, ctx }) => {
  if (!block) return null
  const Editor = Ed[block.blockType]
  if (!Editor) {
    return (
      <div style={{ padding: 12, backgroundColor: T.bgElev, border: `1px solid ${T.warning}`, borderRadius: 8, color: T.warning, fontSize: 12.5 }}>
        No dedicated editor for blockType <strong>{block.blockType}</strong>. Edit raw JSON below.
        <Textarea
          rows={12}
          mono
          value={JSON.stringify(block, null, 2)}
          onChange={(e) => {
            try { onChange(JSON.parse(e.target.value)) } catch { /* ignore parse errors mid-typing */ }
          }}
          style={{ marginTop: 10 }}
        />
      </div>
    )
  }
  return Editor(block, (patch) => onChange({ ...block, ...patch }), ctx)
}

// ============================================================================
// ADD BLOCK MODAL
// ============================================================================
const AddBlockModal = ({ open, onPick, onClose }) => {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, maxHeight: '85vh', overflowY: 'auto', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, color: T.text, fontWeight: 600 }}>Add a block</div>
            <div style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>Pick a block type to insert</div>
          </div>
          <div style={{ flex: 1 }} />
          <IconBtn icon={X} onClick={onClose} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {BLOCK_TYPES.map((bt) => {
            const Icon = bt.icon
            return (
              <button key={bt.id} onClick={() => onPick(bt.id)} style={{ padding: 12, background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', color: T.text, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: T.bgElev2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={T.primary} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{bt.name}</div>
                  <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>{bt.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN APP
// ============================================================================
export function PageBlocksBuilderApp({ pageId, siteSlug, siteId, primaryHost, initial }) {
  const router = useRouter()
  const [title, setTitle] = useState(initial.title || 'Untitled')
  const [slug, setSlug] = useState(initial.slug || '/')
  const [status, setStatus] = useState(initial.status || 'draft')
  const [metaTitle, setMetaTitle] = useState(initial.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(initial.meta_description || '')
  const [ogImageUrl, setOgImageUrl] = useState(initial.og_image_url || '')
  const [blocks, setBlocks] = useState(() =>
    (Array.isArray(initial.body_blocks) ? initial.body_blocks : []).map((b, i) => ({
      ...b,
      id: b.id || `${b.blockType || 'block'}_${i}_${genId()}`,
    })),
  )
  const [hiddenBlocks, setHiddenBlocks] = useState(() =>
    Array.isArray(initial.hidden_blocks) ? initial.hidden_blocks : [],
  )
  const [selectedId, setSelectedId] = useState(blocks[0]?.id || null)
  const [addOpen, setAddOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dragId, setDragId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const saveTimer = useRef(null)

  const selected = blocks.find((b) => b.id === selectedId)

  // Debounced auto-save. body_blocks IS the public render source, so any
  // successful save here is immediately visible to visitors on the next
  // page render — no iframe to refresh.
  const persist = useCallback((next) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      const res = await savePageBodyBlocks({
        pageId,
        siteSlug,
        title: next.title,
        slug: next.slug,
        status: next.status,
        meta_title: next.metaTitle,
        meta_description: next.metaDescription,
        og_image_url: next.ogImageUrl,
        body_blocks: next.blocks.map(({ id, ...rest }) => ({ id, ...rest })),
        hidden_blocks: next.hiddenBlocks,
      })
      setSaving(false)
      if (!res.ok) setToast({ message: res.error || 'Save failed', type: 'error' })
    }, 600)
  }, [pageId, siteSlug])

  const bump = (patch = {}) => {
    persist({
      title, slug, status, metaTitle, metaDescription, ogImageUrl, blocks, hiddenBlocks,
      ...patch,
    })
  }

  // Wrap setters so any update fires a debounced save.
  const setTitleX = (v) => { setTitle(v); bump({ title: v }) }
  const setSlugX = (v) => { setSlug(v); bump({ slug: v }) }
  const setStatusX = (v) => { setStatus(v); bump({ status: v }) }
  const setMetaTitleX = (v) => { setMetaTitle(v); bump({ metaTitle: v }) }
  const setMetaDescX = (v) => { setMetaDescription(v); bump({ metaDescription: v }) }
  const setOgUrlX = (v) => { setOgImageUrl(v); bump({ ogImageUrl: v }) }

  const updateBlock = (id, patch) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, ...patch } : b))
    setBlocks(next)
    bump({ blocks: next })
  }

  const addBlock = (type) => {
    const seed = SEED_FOR[type]?.() ?? { blockType: type }
    const newBlock = { id: `${type}_${genId()}`, ...seed }
    const next = [...blocks, newBlock]
    setBlocks(next)
    setSelectedId(newBlock.id)
    setAddOpen(false)
    bump({ blocks: next })
  }

  const deleteBlock = (id) => {
    const next = blocks.filter((b) => b.id !== id)
    setBlocks(next)
    if (selectedId === id) setSelectedId(next[0]?.id || null)
    bump({ blocks: next })
  }

  const moveBlock = (id, dir) => {
    const idx = blocks.findIndex((b) => b.id === id)
    if (idx === -1) return
    const swap = idx + dir
    if (swap < 0 || swap >= blocks.length) return
    const next = [...blocks]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setBlocks(next)
    bump({ blocks: next })
  }

  const duplicateBlock = (id) => {
    const idx = blocks.findIndex((b) => b.id === id)
    if (idx === -1) return
    const src = blocks[idx]
    // Deep clone + rebrand id so sibling ids stay distinct. Arrays inside
    // (links/items/steps/etc.) get JSON-cloned too so editing the copy
    // doesn't mutate the original.
    const clone = JSON.parse(JSON.stringify(src))
    clone.id = `${src.blockType || 'block'}_${genId()}`
    const next = [...blocks.slice(0, idx + 1), clone, ...blocks.slice(idx + 1)]
    setBlocks(next)
    setSelectedId(clone.id)
    bump({ blocks: next })
  }

  const toggleHidden = (id) => {
    const next = hiddenBlocks.includes(id)
      ? hiddenBlocks.filter((x) => x !== id)
      : [...hiddenBlocks, id]
    setHiddenBlocks(next)
    bump({ hiddenBlocks: next })
  }

  // Drag-drop reorder. dragId is the block being dragged; dragOverId is the
  // block currently under the pointer (used to highlight the drop target).
  // On drop, we insert the dragged block in front of the over-block. Dropping
  // onto self or onto the empty trailing area is a no-op.
  const handleDragStart = (e, id) => {
    setDragId(id)
    try { e.dataTransfer.effectAllowed = 'move' } catch {}
  }
  const handleDragOver = (e, id) => {
    e.preventDefault()
    if (id !== dragOverId) setDragOverId(id)
    try { e.dataTransfer.dropEffect = 'move' } catch {}
  }
  const handleDragEnd = () => {
    setDragId(null)
    setDragOverId(null)
  }
  const handleDrop = (e, targetId) => {
    e.preventDefault()
    const sourceId = dragId
    setDragId(null)
    setDragOverId(null)
    if (!sourceId || sourceId === targetId) return
    const fromIdx = blocks.findIndex((b) => b.id === sourceId)
    const toIdx = blocks.findIndex((b) => b.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return
    const next = [...blocks]
    const [moved] = next.splice(fromIdx, 1)
    // If we removed an earlier block, the target index shifts down by 1.
    const insertAt = fromIdx < toIdx ? toIdx - 1 : toIdx
    next.splice(insertAt, 0, moved)
    setBlocks(next)
    bump({ blocks: next })
  }

  const handleBack = () => router.push(`/admin/sites/${siteSlug}/pages`)
  const handlePreview = () => {
    const path = slug.startsWith('/') ? slug : `/${slug}`
    window.open(`https://${primaryHost}${path}`, '_blank', 'noopener,noreferrer')
  }
  const handlePublishToggle = () => {
    const next = status === 'published' ? 'draft' : 'published'
    setStatus(next)
    bump({ status: next })
  }

  const previewPath = slug.startsWith('/') ? slug : `/${slug}`
  const livePath = `https://${primaryHost}${previewPath}`

  // The preview is the SAME React tree the public route uses (BlockRenderer)
  // — rendered directly here so click-to-edit and instant updates work. We
  // synthesize a minimal RenderContext from props because the builder doesn't
  // yet have direct access to the Site doc / resolved phone.
  const renderCtx = {
    site: {
      id: 0,
      slug: siteSlug,
      name: title || siteSlug,
      default_phone: null,
      default_phone_tel: null,
      org_name: title || siteSlug,
      org_address: null,
      support_email: null,
      default_disclaimer_md: null,
    },
    phone: { display: '', tel: '' },
    isPreview: true,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.bg, color: T.text, fontFamily: '"Inter", system-ui, sans-serif' }}>
      <TopBar
        crumbs={`ADMIN / SITES / ${siteSlug.toUpperCase()} / PAGES`}
        title={title || 'Untitled'}
        isPublished={status === 'published'}
        onBack={handleBack}
        onPreview={handlePreview}
        onPublish={handlePublishToggle}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving && <Pill color={T.warning}>SAVING…</Pill>}
          </div>
        }
      />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 360px', overflow: 'hidden' }}>
        {/* Left: blocks list */}
        <div style={{ borderRight: `1px solid ${T.border}`, overflowY: 'auto', backgroundColor: T.bg, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Label>Sections · {blocks.length}</Label>
            <Btn variant="primary" size="xs" icon={Plus} onClick={() => setAddOpen(true)}>Add</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {blocks.length === 0 && (
              <div style={{ padding: 14, border: `1px dashed ${T.border}`, borderRadius: 8, color: T.textMute, fontSize: 12, textAlign: 'center' }}>
                No blocks yet. Click Add to insert one.
              </div>
            )}
            {blocks.map((b) => {
              const meta = BLOCK_META[b.blockType] || { name: b.blockType, icon: Layers }
              const Icon = meta.icon
              const active = b.id === selectedId
              const hidden = hiddenBlocks.includes(b.id)
              const isDragging = dragId === b.id
              const isDropTarget = dragOverId === b.id && dragId && dragId !== b.id
              const summary =
                b.heading ||
                b.title ||
                b.eyebrow ||
                (typeof b.markdown === 'string' ? b.markdown.slice(0, 40) : '') ||
                ''
              return (
                <div
                  key={b.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, b.id)}
                  onDragOver={(e) => handleDragOver(e, b.id)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, b.id)}
                  style={{
                    padding: '8px 8px 8px 4px',
                    backgroundColor: active ? T.bgElev2 : T.bgElev,
                    border: `1px solid ${isDropTarget ? T.primary : active ? T.primary : T.border}`,
                    borderRadius: 7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    opacity: isDragging ? 0.5 : hidden ? 0.55 : 1,
                    boxShadow: isDropTarget ? `0 -2px 0 ${T.primary}` : 'none',
                    transition: 'box-shadow 0.12s ease, border-color 0.12s ease',
                  }}
                >
                  <span
                    title="Drag to reorder"
                    style={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: T.textLow, padding: '0 2px' }}
                  >
                    <GripVertical size={12} />
                  </span>
                  <Icon size={13} color={active ? T.primary : T.textMute} />
                  <button
                    onClick={() => setSelectedId(b.id)}
                    style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: T.text, minWidth: 0, overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {meta.name}
                      </div>
                      {hidden ? (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: `${T.textMute}30`,
                            color: T.textMute,
                            letterSpacing: '0.05em',
                          }}
                        >
                          HIDDEN
                        </span>
                      ) : null}
                    </div>
                    {summary && (
                      <div style={{ fontSize: 10.5, color: T.textMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</div>
                    )}
                  </button>
                  <IconBtn
                    icon={hidden ? EyeOff : Eye}
                    onClick={() => toggleHidden(b.id)}
                    style={{ padding: 3, color: hidden ? T.textMute : T.text }}
                    title={hidden ? 'Show on public site' : 'Hide on public site'}
                  />
                  <IconBtn icon={Copy} onClick={() => duplicateBlock(b.id)} style={{ padding: 3 }} title="Duplicate" />
                  <IconBtn icon={Trash2} onClick={() => deleteBlock(b.id)} style={{ padding: 3, color: T.danger }} title="Delete" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Center: live page rendered inline. Each block is wrapped in a
            click-to-select overlay; selecting opens that block's editor in
            the right panel. The user is literally editing the same JSX the
            public site renders. */}
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0c1118', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: T.textMute }}>
            <Pill color={T.success}>{status === 'published' ? 'PUBLISHED' : 'DRAFT'}</Pill>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{livePath}</span>
            <div style={{ flex: 1 }} />
            <span>Click any section to edit ›</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
            {blocks.length === 0 ? (
              <div style={{ padding: '120px 40px', textAlign: 'center', color: '#94a3b8', fontSize: 14, fontFamily: '"Inter", system-ui, sans-serif' }}>
                No sections yet. Click <strong>Add</strong> in the left panel to insert one.
              </div>
            ) : (
              <div className="legalos-builder-canvas">
                {blocks.map((b) => {
                  const active = b.id === selectedId
                  const hidden = hiddenBlocks.includes(b.id)
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedId(b.id)}
                      style={{
                        position: 'relative',
                        outline: active ? `2px solid ${T.primary}` : '2px solid transparent',
                        outlineOffset: -2,
                        cursor: 'pointer',
                        opacity: hidden ? 0.4 : 1,
                        filter: hidden ? 'grayscale(0.6)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) (e.currentTarget as HTMLElement).style.outline = `2px dashed ${T.primary}80`
                      }}
                      onMouseLeave={(e) => {
                        if (!active) (e.currentTarget as HTMLElement).style.outline = '2px solid transparent'
                      }}
                    >
                      {hidden ? (
                        <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 20, padding: '4px 10px', background: '#000a', color: '#fff', fontSize: 10.5, fontFamily: '"JetBrains Mono", monospace', borderRadius: 4, fontWeight: 600, letterSpacing: '0.05em' }}>
                          HIDDEN ON PUBLIC SITE
                        </div>
                      ) : null}
                      {active && (
                        <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 20, padding: '4px 10px', background: T.primary, color: '#fff', fontSize: 10.5, fontFamily: '"JetBrains Mono", monospace', borderRadius: 4, fontWeight: 600 }}>
                          EDITING · {(BLOCK_META[b.blockType] || {}).name || b.blockType}
                        </div>
                      )}
                      <BlockRenderer blocks={[b as unknown as Record<string, unknown> & { blockType: string }]} ctx={renderCtx as never} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: section editor OR page settings */}
        <div style={{ borderLeft: `1px solid ${T.border}`, overflowY: 'auto', backgroundColor: T.bg, padding: 16 }}>
          {selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Pill color={T.primary}>{(BLOCK_META[selected.blockType] || {}).name || selected.blockType}</Pill>
                <div style={{ flex: 1 }} />
                <Btn variant="ghost" size="xs" onClick={() => setSelectedId(null)}>Page settings ›</Btn>
              </div>
              <AIRewritePanel
                block={selected}
                onAccept={(next) => updateBlock(selected.id, { ...next, id: selected.id })}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <BlockEditor block={selected} onChange={(next) => updateBlock(selected.id, next)} ctx={{ siteSlug, siteId }} />
              </div>
            </>
          ) : (
            <>
              <Label>Page</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                <div><Label>Title</Label><Input value={title} onChange={(e) => setTitleX(e.target.value)} /></div>
                <div><Label>Slug</Label><Input mono value={slug} onChange={(e) => setSlugX(e.target.value)} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onChange={(e) => setStatusX(e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </Select>
                </div>
              </div>
              <Label>SEO</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div><Label>Meta title</Label><Input value={metaTitle} onChange={(e) => setMetaTitleX(e.target.value)} /></div>
                <div><Label>Meta description</Label><Textarea rows={3} value={metaDescription} onChange={(e) => setMetaDescX(e.target.value)} /></div>
                <div>
                  <ImagePickerField
                    label="OG image"
                    value={ogImageUrl}
                    onChange={(url) => setOgUrlX(url)}
                    siteSlug={siteSlug}
                    siteId={siteId}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AddBlockModal open={addOpen} onClose={() => setAddOpen(false)} onPick={addBlock} />
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}

// @ts-nocheck
/* eslint-disable */
'use client'

// LP-style builder for the per-Site Pages collection. Operates on the existing
// body_blocks array (no data migration); applies one of the 4 LP visual
// templates for the live preview canvas. Wired to a single
// `savePageFromBuilder` server action that writes the whole page state on save.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlignLeft, ArrowRight, Award, Check, ChevronLeft, ChevronRight, Code2,
  Copy, Edit3, Eye, FileText, GripVertical, HelpCircle, Image as ImageIcon,
  LayoutGrid, Layers, ListChecks, Loader2, MessageSquare, MousePointer,
  Plus, Quote, Rocket, Save, Settings, Sparkles, Star, Trash2, Trophy, X,
} from 'lucide-react'
import { T, Btn, Input, Textarea, Select, Label, Pill, IconBtn, Modal, Toast } from '../ui'
import { TEMPLATES } from '../lp/render'
import { savePageFromBuilder } from '@/app/(app)/admin/sites/[slug]/pages/[id]/builder-actions'

const genId = () => `b_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// ============================================================================
// BLOCK TYPE REGISTRY
// ============================================================================
// One entry per Payload body_blocks type. icon + label drive the section list,
// `make()` seeds a new block with defaults.

const BLOCK_TYPES = [
  { id: 'hero',         label: 'Hero',         icon: Rocket,        desc: 'Headline + subhead + CTAs',                 make: () => ({ id: genId(), blockType: 'hero', eyebrow: '', heading: 'Your headline here', sub: '', primary_cta_label: 'Get started', primary_cta_href: '#', secondary_cta_label: '', secondary_cta_href: '', image_url: '' }) },
  { id: 'prose',        label: 'Prose',        icon: AlignLeft,     desc: 'Long-form markdown',                         make: () => ({ id: genId(), blockType: 'prose', markdown: 'Type your content here…' }) },
  { id: 'image',        label: 'Image',        icon: ImageIcon,     desc: 'Hosted image + caption',                     make: () => ({ id: genId(), blockType: 'image', url: '', alt: '', caption: '' }) },
  { id: 'cta',          label: 'CTA',          icon: MousePointer,  desc: 'Conversion card with single button',         make: () => ({ id: genId(), blockType: 'cta', heading: 'Ready to start?', sub: '', label: 'Get started', href: '#' }) },
  { id: 'bullet_list',  label: 'Bullet list',  icon: ListChecks,    desc: 'Heading + bullet points',                    make: () => ({ id: genId(), blockType: 'bullet_list', heading: '', items: [{ id: genId(), item: 'First point' }, { id: genId(), item: 'Second point' }] }) },
  { id: 'cards',        label: 'Cards',        icon: LayoutGrid,    desc: 'Grid of titled cards',                       make: () => ({ id: genId(), blockType: 'cards', heading: '', items: [{ id: genId(), title: 'Card title', body: '', icon: '' }] }) },
  { id: 'stats',        label: 'Stats',        icon: Trophy,        desc: 'Big numbers + labels',                       make: () => ({ id: genId(), blockType: 'stats', heading: '', items: [{ id: genId(), value: '100+', label: 'Clients served' }] }) },
  { id: 'testimonials', label: 'Testimonials', icon: Quote,         desc: 'Quotes from clients',                        make: () => ({ id: genId(), blockType: 'testimonials', heading: '', items: [{ id: genId(), quote: 'Great service.', attribution: 'Jane D.', avatar_url: '' }] }) },
  { id: 'faq',          label: 'FAQ',          icon: HelpCircle,    desc: 'Question + answer list',                     make: () => ({ id: genId(), blockType: 'faq', heading: '', items: [{ id: genId(), question: 'Question?', answer: 'Answer.' }] }) },
  { id: 'embed',        label: 'Custom HTML',  icon: Code2,         desc: 'Raw HTML (use sparingly)',                   make: () => ({ id: genId(), blockType: 'embed', html: '<p>Custom HTML here…</p>', note: '' }) },
]

const findBlockMeta = (id) => BLOCK_TYPES.find((b) => b.id === id) || BLOCK_TYPES[0]

// ============================================================================
// LIVE PREVIEW BLOCK RENDERERS
// ============================================================================
// Each takes (block, tk, accent) — tk is the visual template's tokens; accent
// is the brand-ish color we use for primary actions / highlights in the preview.

const BlockHero = ({ block, tk, accent }) => (
  <section style={{ background: tk.heroBg || tk.canvas, padding: '64px 32px', color: tk.text, fontFamily: tk.bodyFont }}>
    <div style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
      {block.eyebrow ? <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, backgroundColor: `${accent}22`, color: accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>{block.eyebrow}</div> : null}
      <h1 style={{ fontFamily: tk.headlineFont, fontWeight: tk.headlineWeight, fontSize: 'clamp(28px, 4.5vw, 52px)', color: tk.text, letterSpacing: '-0.02em', lineHeight: 1.12, margin: '0 0 16px' }}>{block.heading || 'Headline'}</h1>
      {block.sub ? <p style={{ fontSize: 17, color: tk.textMute, lineHeight: 1.55, maxWidth: 640, margin: '0 auto 28px' }}>{block.sub}</p> : null}
      <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {block.primary_cta_label ? <a href="#" onClick={(e) => e.preventDefault()} style={{ padding: '12px 22px', backgroundColor: accent, color: '#fff', borderRadius: tk.radius || 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{block.primary_cta_label} <ArrowRight size={14} /></a> : null}
        {block.secondary_cta_label ? <a href="#" onClick={(e) => e.preventDefault()} style={{ padding: '12px 22px', border: `1px solid ${tk.textMute}55`, color: tk.text, borderRadius: tk.radius || 10, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>{block.secondary_cta_label}</a> : null}
      </div>
      {block.image_url ? <div style={{ marginTop: 30 }}><img loading="lazy" src={block.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 12, display: 'block', margin: '0 auto' }} /></div> : null}
    </div>
  </section>
)

const BlockProse = ({ block, tk }) => (
  <section style={{ backgroundColor: tk.canvas, padding: '40px 32px', color: tk.text, fontFamily: tk.bodyFont }}>
    <div style={{ maxWidth: 720, margin: '0 auto', fontSize: 16, lineHeight: 1.7, color: tk.text, whiteSpace: 'pre-wrap' }}>{block.markdown || 'Empty prose block.'}</div>
  </section>
)

const BlockImage = ({ block, tk }) => (
  <section style={{ backgroundColor: tk.canvas, padding: '32px', textAlign: 'center', fontFamily: tk.bodyFont }}>
    {block.url ? <img loading="lazy" src={block.url} alt={block.alt || ''} style={{ maxWidth: '100%', borderRadius: 12 }} /> : <div style={{ padding: 60, border: `1px dashed ${tk.textMute}55`, borderRadius: 10, color: tk.textMute, fontSize: 13 }}>No image URL set</div>}
    {block.caption ? <p style={{ fontSize: 13, color: tk.textMute, fontStyle: 'italic', marginTop: 10 }}>{block.caption}</p> : null}
  </section>
)

const BlockCTA = ({ block, tk, accent }) => (
  <section style={{ backgroundColor: tk.canvas, padding: '48px 32px', fontFamily: tk.bodyFont }}>
    <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(24px, 4vw, 40px)', borderRadius: 14, background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`, color: '#fff', textAlign: 'center', boxShadow: `0 18px 40px -16px ${accent}88` }}>
      <h2 style={{ fontFamily: tk.headlineFont, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, margin: '0 0 10px' }}>{block.heading || 'Heading'}</h2>
      {block.sub ? <p style={{ fontSize: 15, opacity: 0.92, lineHeight: 1.55, margin: '0 0 22px' }}>{block.sub}</p> : null}
      <a href="#" onClick={(e) => e.preventDefault()} style={{ padding: '12px 24px', backgroundColor: '#fff', color: accent, borderRadius: tk.radius || 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{block.label || 'Get started'} <ArrowRight size={14} /></a>
    </div>
  </section>
)

const BlockBulletList = ({ block, tk, accent }) => (
  <section style={{ backgroundColor: tk.canvas, padding: '40px 32px', color: tk.text, fontFamily: tk.bodyFont }}>
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {block.heading ? <h2 style={{ fontFamily: tk.headlineFont, fontWeight: tk.headlineWeight, fontSize: 26, color: tk.text, margin: '0 0 18px', textAlign: 'center' }}>{block.heading}</h2> : null}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(block.items || []).map((it, i) => (
          <li key={it.id || i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', backgroundColor: tk.surface || `${tk.text}05`, border: `1px solid ${tk.textMute}22`, borderRadius: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} strokeWidth={3} /></div>
            <span style={{ fontSize: 15, color: tk.text }}>{it.item}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
)

const BlockCards = ({ block, tk, accent }) => (
  <section style={{ backgroundColor: tk.canvas, padding: '48px 32px', color: tk.text, fontFamily: tk.bodyFont }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {block.heading ? <h2 style={{ fontFamily: tk.headlineFont, fontWeight: tk.headlineWeight, fontSize: 28, textAlign: 'center', margin: '0 0 28px', color: tk.text }}>{block.heading}</h2> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {(block.items || []).map((it, i) => (
          <div key={it.id || i} style={{ padding: 22, backgroundColor: tk.surface || `${tk.text}05`, border: `1px solid ${tk.textMute}22`, borderRadius: 12 }}>
            {it.icon ? <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{it.icon.slice(0, 3).toUpperCase()}</div> : null}
            <div style={{ fontSize: 16, fontWeight: 700, color: tk.text, marginBottom: 6 }}>{it.title}</div>
            {it.body ? <div style={{ fontSize: 13, color: tk.textMute, lineHeight: 1.55 }}>{it.body}</div> : null}
          </div>
        ))}
      </div>
    </div>
  </section>
)

const BlockStats = ({ block, tk, accent }) => (
  <section style={{ backgroundColor: tk.canvas, padding: '48px 32px', color: tk.text, fontFamily: tk.bodyFont }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {block.heading ? <h2 style={{ fontFamily: tk.headlineFont, fontWeight: tk.headlineWeight, fontSize: 26, textAlign: 'center', margin: '0 0 24px', color: tk.text }}>{block.heading}</h2> : null}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`, gap: 18, justifyContent: 'center' }}>
        {(block.items || []).map((it, i) => (
          <div key={it.id || i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: accent, letterSpacing: '-0.02em', fontFamily: tk.headlineFont, lineHeight: 1 }}>{it.value}</div>
            <div style={{ fontSize: 13, color: tk.textMute, marginTop: 8 }}>{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

const BlockTestimonials = ({ block, tk, accent }) => (
  <section style={{ backgroundColor: tk.canvas, padding: '48px 32px', color: tk.text, fontFamily: tk.bodyFont }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {block.heading ? <h2 style={{ fontFamily: tk.headlineFont, fontWeight: tk.headlineWeight, fontSize: 28, textAlign: 'center', margin: '0 0 28px', color: tk.text }}>{block.heading}</h2> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {(block.items || []).map((it, i) => (
          <div key={it.id || i} style={{ padding: 22, backgroundColor: tk.surface || `${tk.text}05`, border: `1px solid ${tk.textMute}22`, borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
              {[0, 1, 2, 3, 4].map((s) => <Star key={s} size={13} fill={accent} color={accent} />)}
            </div>
            <p style={{ fontSize: 14, color: tk.text, lineHeight: 1.6, margin: '0 0 14px' }}>{'“'}{it.quote}{'”'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {it.avatar_url ? <img loading="lazy" src={it.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} /> : null}
              {it.attribution ? <div style={{ fontSize: 12, fontWeight: 700, color: tk.text }}>{it.attribution}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

const BlockFAQ = ({ block, tk }) => (
  <section style={{ backgroundColor: tk.canvas, padding: '48px 32px', color: tk.text, fontFamily: tk.bodyFont }}>
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {block.heading ? <h2 style={{ fontFamily: tk.headlineFont, fontWeight: tk.headlineWeight, fontSize: 28, textAlign: 'center', margin: '0 0 28px', color: tk.text }}>{block.heading}</h2> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(block.items || []).map((it, i) => (
          <div key={it.id || i} style={{ padding: '14px 18px', backgroundColor: tk.surface || `${tk.text}05`, border: `1px solid ${tk.textMute}22`, borderRadius: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: tk.text, marginBottom: 6 }}>{it.question}</div>
            <div style={{ fontSize: 13.5, color: tk.textMute, lineHeight: 1.55 }}>{it.answer}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

const BlockEmbed = ({ block, tk }) => (
  <section style={{ backgroundColor: tk.canvas, padding: '32px', color: tk.text, fontFamily: tk.bodyFont }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: block.html || '' }} />
  </section>
)

const RENDERERS = {
  hero: BlockHero, prose: BlockProse, image: BlockImage, cta: BlockCTA,
  bullet_list: BlockBulletList, cards: BlockCards, stats: BlockStats,
  testimonials: BlockTestimonials, faq: BlockFAQ, embed: BlockEmbed,
}

// ============================================================================
// SECTION ROW (left list entry)
// ============================================================================

const SectionRow = ({ block, idx, isSelected, isDragSrc, onSelect, onDelete, onDuplicate, setDragSrc, onDrop }) => {
  const meta = findBlockMeta(block.blockType)
  const Icon = meta.icon
  const summary =
    block.heading || block.markdown?.slice(0, 60) || block.label || block.url ||
    block.items?.[0]?.title || block.items?.[0]?.question || block.items?.[0]?.item ||
    meta.desc
  return (
    <div
      draggable
      onDragStart={() => setDragSrc(idx)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDrop(idx) }}
      onClick={onSelect}
      style={{
        padding: '9px 10px',
        backgroundColor: isSelected ? T.primarySoft : T.bgElev,
        border: `1px solid ${isSelected ? T.primary : T.border}`,
        borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        opacity: isDragSrc ? 0.5 : 1, transition: 'all 0.12s',
      }}
    >
      <GripVertical size={12} color={T.textLow} style={{ cursor: 'grab', flexShrink: 0 }} />
      <div style={{ width: 24, height: 24, borderRadius: 5, backgroundColor: `${T.primary}22`, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={12} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: T.text, fontWeight: 500 }}>{meta.label}</div>
        <div style={{ fontSize: 10.5, color: T.textMute, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{summary}</div>
      </div>
      <IconBtn icon={Copy} onClick={(e) => { e.stopPropagation(); onDuplicate() }} style={{ flexShrink: 0 }} />
      <IconBtn icon={Trash2} onClick={(e) => { e.stopPropagation(); onDelete() }} style={{ color: T.danger, flexShrink: 0 }} />
    </div>
  )
}

// ============================================================================
// PER-BLOCK EDITORS
// ============================================================================

const ArrayEditor = ({ items = [], onChange, blank, render }) => {
  const upd = (i, patch) => onChange(items.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  const add = () => onChange([...items, { id: genId(), ...blank }])
  const rm = (i) => onChange(items.filter((_, idx) => idx !== i))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it, i) => (
        <div key={it.id || i} style={{ padding: 10, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Pill color={T.textLow}>#{i + 1}</Pill>
            <IconBtn icon={X} onClick={() => rm(i)} style={{ color: T.danger }} />
          </div>
          {render(it, (patch) => upd(i, patch))}
        </div>
      ))}
      <Btn variant="ghost" size="sm" icon={Plus} onClick={add} style={{ alignSelf: 'flex-start' }}>Add item</Btn>
    </div>
  )
}

const BlockEditor = ({ block, onChange }) => {
  const upd = (patch) => onChange({ ...block, ...patch })

  if (block.blockType === 'hero') return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div><Label>Eyebrow</Label><Input value={block.eyebrow || ''} onChange={(e) => upd({ eyebrow: e.target.value })} placeholder="PERSONAL FINANCE" /></div>
      <div><Label>Heading</Label><Textarea value={block.heading || ''} onChange={(e) => upd({ heading: e.target.value })} rows={2} /></div>
      <div><Label>Subhead</Label><Textarea value={block.sub || ''} onChange={(e) => upd({ sub: e.target.value })} rows={3} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><Label>Primary CTA label</Label><Input value={block.primary_cta_label || ''} onChange={(e) => upd({ primary_cta_label: e.target.value })} /></div>
        <div><Label>Primary CTA href</Label><Input mono value={block.primary_cta_href || ''} onChange={(e) => upd({ primary_cta_href: e.target.value })} /></div>
        <div><Label>Secondary CTA label</Label><Input value={block.secondary_cta_label || ''} onChange={(e) => upd({ secondary_cta_label: e.target.value })} /></div>
        <div><Label>Secondary CTA href</Label><Input mono value={block.secondary_cta_href || ''} onChange={(e) => upd({ secondary_cta_href: e.target.value })} /></div>
      </div>
      <div><Label>Image URL</Label><Input mono value={block.image_url || ''} onChange={(e) => upd({ image_url: e.target.value })} placeholder="https://…" /></div>
    </div>
  )

  if (block.blockType === 'prose') return (
    <div>
      <Label>Markdown</Label>
      <Textarea value={block.markdown || ''} onChange={(e) => upd({ markdown: e.target.value })} rows={12} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5 }} />
    </div>
  )

  if (block.blockType === 'image') return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div><Label>URL</Label><Input mono value={block.url || ''} onChange={(e) => upd({ url: e.target.value })} placeholder="https://…" /></div>
      <div><Label>Alt text</Label><Input value={block.alt || ''} onChange={(e) => upd({ alt: e.target.value })} /></div>
      <div><Label>Caption</Label><Input value={block.caption || ''} onChange={(e) => upd({ caption: e.target.value })} /></div>
    </div>
  )

  if (block.blockType === 'cta') return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div><Label>Heading</Label><Input value={block.heading || ''} onChange={(e) => upd({ heading: e.target.value })} /></div>
      <div><Label>Subhead</Label><Textarea value={block.sub || ''} onChange={(e) => upd({ sub: e.target.value })} rows={2} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><Label>Button label</Label><Input value={block.label || ''} onChange={(e) => upd({ label: e.target.value })} /></div>
        <div><Label>Button href</Label><Input mono value={block.href || ''} onChange={(e) => upd({ href: e.target.value })} /></div>
      </div>
    </div>
  )

  if (block.blockType === 'bullet_list') return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div><Label>Heading (optional)</Label><Input value={block.heading || ''} onChange={(e) => upd({ heading: e.target.value })} /></div>
      <div>
        <Label>Items · {(block.items || []).length}</Label>
        <ArrayEditor items={block.items} blank={{ item: '' }} onChange={(items) => upd({ items })} render={(it, ch) => <Input value={it.item || ''} onChange={(e) => ch({ item: e.target.value })} />} />
      </div>
    </div>
  )

  if (block.blockType === 'cards') return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div><Label>Heading (optional)</Label><Input value={block.heading || ''} onChange={(e) => upd({ heading: e.target.value })} /></div>
      <div>
        <Label>Cards · {(block.items || []).length}</Label>
        <ArrayEditor items={block.items} blank={{ title: '', body: '', icon: '' }} onChange={(items) => upd({ items })} render={(it, ch) => (
          <div style={{ display: 'grid', gap: 6 }}>
            <Input value={it.title || ''} onChange={(e) => ch({ title: e.target.value })} placeholder="Card title" />
            <Textarea rows={2} value={it.body || ''} onChange={(e) => ch({ body: e.target.value })} placeholder="Card body" />
            <Input value={it.icon || ''} onChange={(e) => ch({ icon: e.target.value })} placeholder="Lucide icon name (Car, Truck, …)" />
          </div>
        )} />
      </div>
    </div>
  )

  if (block.blockType === 'stats') return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div><Label>Heading (optional)</Label><Input value={block.heading || ''} onChange={(e) => upd({ heading: e.target.value })} /></div>
      <div>
        <Label>Stats · {(block.items || []).length}</Label>
        <ArrayEditor items={block.items} blank={{ value: '', label: '' }} onChange={(items) => upd({ items })} render={(it, ch) => (
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 6 }}>
            <Input mono value={it.value || ''} onChange={(e) => ch({ value: e.target.value })} placeholder="$2.4M" />
            <Input value={it.label || ''} onChange={(e) => ch({ label: e.target.value })} placeholder="Recovered for clients" />
          </div>
        )} />
      </div>
    </div>
  )

  if (block.blockType === 'testimonials') return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div><Label>Heading (optional)</Label><Input value={block.heading || ''} onChange={(e) => upd({ heading: e.target.value })} /></div>
      <div>
        <Label>Testimonials · {(block.items || []).length}</Label>
        <ArrayEditor items={block.items} blank={{ quote: '', attribution: '', avatar_url: '' }} onChange={(items) => upd({ items })} render={(it, ch) => (
          <div style={{ display: 'grid', gap: 6 }}>
            <Textarea rows={3} value={it.quote || ''} onChange={(e) => ch({ quote: e.target.value })} placeholder="Quote" />
            <Input value={it.attribution || ''} onChange={(e) => ch({ attribution: e.target.value })} placeholder="Attribution (name)" />
            <Input mono value={it.avatar_url || ''} onChange={(e) => ch({ avatar_url: e.target.value })} placeholder="Avatar URL (optional)" />
          </div>
        )} />
      </div>
    </div>
  )

  if (block.blockType === 'faq') return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div><Label>Heading (optional)</Label><Input value={block.heading || ''} onChange={(e) => upd({ heading: e.target.value })} /></div>
      <div>
        <Label>Questions · {(block.items || []).length}</Label>
        <ArrayEditor items={block.items} blank={{ question: '', answer: '' }} onChange={(items) => upd({ items })} render={(it, ch) => (
          <div style={{ display: 'grid', gap: 6 }}>
            <Input value={it.question || ''} onChange={(e) => ch({ question: e.target.value })} placeholder="Question" />
            <Textarea rows={3} value={it.answer || ''} onChange={(e) => ch({ answer: e.target.value })} placeholder="Answer" />
          </div>
        )} />
      </div>
    </div>
  )

  if (block.blockType === 'embed') return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div><Label>HTML</Label><Textarea value={block.html || ''} onChange={(e) => upd({ html: e.target.value })} rows={10} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }} /></div>
      <div><Label>Note (internal, not rendered)</Label><Input value={block.note || ''} onChange={(e) => upd({ note: e.target.value })} /></div>
    </div>
  )

  return <div style={{ color: T.textMute, fontSize: 12 }}>No editor for blockType: {block.blockType}</div>
}

// ============================================================================
// LIVE PREVIEW
// ============================================================================

const LivePreview = ({ blocks, visualTemplate }) => {
  const tpl = TEMPLATES.find((t) => t.id === visualTemplate) || TEMPLATES[0]
  const tk = tpl.tokens
  // Use the LP primary accent as the brand accent for the preview.
  const accent = T.primary
  return (
    <div style={{ backgroundColor: tk.canvas, color: tk.text, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 8px 32px -12px rgba(0,0,0,0.4)' }}>
      {blocks.length === 0 ? (
        <div style={{ padding: 80, textAlign: 'center', color: tk.textMute, fontFamily: tk.bodyFont }}>
          No blocks yet. Add one from the left panel to start.
        </div>
      ) : blocks.map((block) => {
        const R = RENDERERS[block.blockType]
        if (!R) return <div key={block.id} style={{ padding: 16, color: T.textMute, fontSize: 12 }}>Unknown block: {block.blockType}</div>
        return <R key={block.id} block={block} tk={tk} accent={accent} />
      })}
    </div>
  )
}

// ============================================================================
// MAIN APP
// ============================================================================

export function PageBuilderApp({
  pageId,
  siteSlug,
  primaryHost,
  initial,
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initial.title || '')
  const [slug, setSlug] = useState(initial.slug || '')
  const [status, setStatus] = useState(initial.status || 'draft')
  const [templateKey, setTemplateKey] = useState(initial.template_key || 'custom')
  const [visualTemplate, setVisualTemplate] = useState(initial.visual_template || 'bold_modern')
  const [metaTitle, setMetaTitle] = useState(initial.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(initial.meta_description || '')
  const [ogImageUrl, setOgImageUrl] = useState(initial.og_image_url || '')
  const [blocks, setBlocks] = useState(() => (initial.body_blocks || []).map((b) => ({ ...b, id: b.id || genId() })))
  const [selectedId, setSelectedId] = useState(blocks[0]?.id || null)
  const [dragSrc, setDragSrc] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [dirty, setDirty] = useState(false)
  const isHome = initial.slug === '/'

  // mark dirty on any state change
  useEffect(() => { setDirty(true) }, [title, slug, status, templateKey, visualTemplate, metaTitle, metaDescription, ogImageUrl, blocks])
  // initial mount shouldn't mark dirty
  const initialRender = useRef(true)
  useEffect(() => { if (initialRender.current) { initialRender.current = false; setDirty(false) } }, [])

  const selected = blocks.find((b) => b.id === selectedId)

  const updateBlock = (next) => {
    setBlocks((prev) => prev.map((b) => (b.id === next.id ? next : b)))
  }

  const handleAdd = (type) => {
    const meta = findBlockMeta(type)
    const blk = meta.make()
    setBlocks((prev) => [...prev, blk])
    setSelectedId(blk.id)
    setShowAdd(false)
  }

  const handleDelete = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const handleDuplicate = (id) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx === -1) return prev
      const dup = { ...prev[idx], id: genId() }
      const next = [...prev]
      next.splice(idx + 1, 0, dup)
      return next
    })
  }

  const handleDrop = (targetIdx) => {
    if (dragSrc === null || dragSrc === targetIdx) { setDragSrc(null); return }
    setBlocks((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragSrc, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
    setDragSrc(null)
  }

  const save = async () => {
    if (saving) return
    setSaving(true)
    const res = await savePageFromBuilder({
      pageId, siteSlug, title, slug, status,
      template_key: templateKey, visual_template: visualTemplate,
      meta_title: metaTitle, meta_description: metaDescription, og_image_url: ogImageUrl,
      body_blocks: blocks.map(({ id, ...rest }) => ({ ...rest, id })),
    })
    setSaving(false)
    if (!res.ok) { setToast({ message: res.error, type: 'error' }); return }
    setDirty(false)
    setToast({ message: 'Saved.', type: 'success' })
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: T.bg, color: T.text, fontFamily: '"Inter", system-ui, sans-serif' }}>
      {/* Top bar */}
      <div style={{ height: 56, padding: '0 20px', backgroundColor: 'rgba(37,46,57,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'sticky', top: 0, zIndex: 30 }}>
        <Btn variant="ghost" size="sm" icon={ChevronLeft} onClick={() => router.push(`/admin/sites/${siteSlug}/pages`)}>Back</Btn>
        <div style={{ width: 1, height: 26, backgroundColor: T.border }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 360 }}>{title || 'Untitled'}</span>
          <Pill color={status === 'published' ? T.success : status === 'archived' ? T.textMute : T.warning}>{status.toUpperCase()}</Pill>
          {dirty ? <Pill color={T.warning}>UNSAVED</Pill> : null}
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" size="sm" icon={Settings} onClick={() => setShowSettings(true)}>Page settings</Btn>
        <Btn variant="primary" size="sm" icon={saving ? Loader2 : Save} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
      </div>

      {/* 3-pane body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Left: section list */}
        <aside style={{ width: 320, backgroundColor: T.bg, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Label style={{ marginBottom: 0 }}>Sections · {blocks.length}</Label>
            </div>
            <Btn variant="primary" size="sm" icon={Plus} onClick={() => setShowAdd(true)} style={{ width: '100%', justifyContent: 'center' }}>Add section</Btn>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'grid', gap: 6 }}>
            {blocks.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 11.5, color: T.textMute }}>No sections yet. Click “Add section”.</div>
            ) : blocks.map((b, i) => (
              <SectionRow
                key={b.id}
                block={b}
                idx={i}
                isSelected={selectedId === b.id}
                isDragSrc={dragSrc === i}
                onSelect={() => setSelectedId(b.id)}
                onDelete={() => handleDelete(b.id)}
                onDuplicate={() => handleDuplicate(b.id)}
                setDragSrc={setDragSrc}
                onDrop={handleDrop}
              />
            ))}
          </div>
          <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Visual template</Label>
            <Select value={visualTemplate} onChange={(e) => setVisualTemplate(e.target.value)}>
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
        </aside>

        {/* Center: preview */}
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0c1118', padding: 20 }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <LivePreview blocks={blocks} visualTemplate={visualTemplate} />
          </div>
        </main>

        {/* Right: section editor */}
        <aside style={{ width: 380, backgroundColor: T.bg, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {selected ? (
            <>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Label style={{ marginBottom: 0, flex: 1 }}>Editing · {findBlockMeta(selected.blockType).label}</Label>
                <IconBtn icon={X} onClick={() => setSelectedId(null)} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                <BlockEditor block={selected} onChange={updateBlock} />
              </div>
            </>
          ) : (
            <div style={{ padding: 24, color: T.textMute, fontSize: 13, textAlign: 'center' }}>
              Select a section on the left to edit it.
            </div>
          )}
        </aside>
      </div>

      {/* Add Section Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add a section" maxWidth={680}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {BLOCK_TYPES.map((b) => {
            const Icon = b.icon
            return (
              <button key={b.id} onClick={() => handleAdd(b.id)} style={{ padding: 12, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', transition: 'all 0.12s', color: T.text, fontFamily: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = T.primary} onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}>
                <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: `${T.primary}22`, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>{b.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </Modal>

      {/* Page Settings Modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Page settings" maxWidth={640}
        footer={<>
          <Btn variant="ghost" size="md" onClick={() => setShowSettings(false)}>Close</Btn>
        </>}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div>
            <Label>Slug</Label>
            <Input mono value={slug} onChange={(e) => setSlug(e.target.value)} disabled={isHome} />
            <div style={{ fontSize: 11, color: T.textLow, marginTop: 4 }}>
              {isHome ? 'Home page (/) slug cannot change.' : `Live URL: https://${primaryHost}${slug === '/' ? '' : slug}`}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <div>
              <Label>Visual template</Label>
              <Select value={visualTemplate} onChange={(e) => setVisualTemplate(e.target.value)}>
                {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
          </div>
          <div style={{ paddingTop: 6, borderTop: `1px solid ${T.border}` }}>
            <Label>SEO</Label>
          </div>
          <div><Label>Meta title</Label><Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder={title || 'Falls back to page title'} /></div>
          <div><Label>Meta description</Label><Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} /></div>
          <div><Label>OG image URL</Label><Input mono value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="https://…" /></div>
        </div>
      </Modal>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}

'use client'

/**
 * How each kind of node draws itself.
 *
 * One component per element TYPE, and nothing here knows what section it is in
 * or what the page is about. A `step` looks like a step whether it is the third
 * of three in a how-it-works band or the only one in a hero. That separation is
 * what lets four templates share a renderer and still differ in structure: the
 * skeleton decides which nodes exist and in what order, and these decide what
 * each one looks like.
 *
 * Colour is never chosen here. Every value comes off the `Surface` the section
 * built, which was derived and verified against the ground the element actually
 * sits on. A literal `#fff` in this file would be a bug, not a shortcut.
 */

import { useState, type CSSProperties, type ReactNode } from 'react'
import { Check, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { QuizRuntime } from '@/components/public/quiz/QuizRuntime'
import type { LpIdentity } from '@/lib/lp-identities'
import { elementSpec, isEmptyElement, type LpElement } from '@/lib/lp-nodes/model'
import { deriveSurface, type Look, type Surface } from '@/lib/lp-nodes/surface'
import { markColors, type Palette } from '@/lib/lp-nodes/palette'
import { quizBrandForPage } from '@/lib/lp-nodes/quiz-brand'
import { iconFor } from './icons'

export type NodeCtx = {
  surface: Surface
  look: Look
  /** Colours, resolved from the brand with the identity as a fallback. */
  palette: Palette
  /** Shape only: faces, radii, and the geometry of the mark. */
  identity: LpIdentity
  brand: Record<string, unknown>
  align: 'left' | 'center'
  editable: boolean
  selectedId?: string | null
  onSelect?: (elementId: string) => void
  /** Cards drop their border and sit flat on the ground. */
  flat?: boolean
  /** Steps show their position rather than an icon. */
  numbered?: boolean
  /** Everything the embedded quiz needs. */
  quiz?: unknown
  quizCtx?: { brand?: unknown; deployment?: unknown; site?: unknown; preview?: boolean } | null
  quizDepLabel?: string
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/** Split a headline around its accent phrase so one run can take the accent colour. */
const twoTone = (text: string, accent: string, color: string): ReactNode => {
  if (!accent || !text.includes(accent)) return text
  const [head, ...rest] = text.split(accent)
  return (
    <>
      {head}
      <span style={{ color }}>{accent}</span>
      {rest.join(accent)}
    </>
  )
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

/**
 * The click target and selection ring around every node in the builder.
 *
 * Present only when `editable`. On a public page the shell renders its child
 * and nothing else, so a visitor never receives a click handler, an outline, or
 * a cursor that suggests the page can be edited.
 */
const Shell = ({ el, ctx, children, inline }: { el: LpElement; ctx: NodeCtx; children: ReactNode; inline?: boolean }) => {
  if (!ctx.editable) return <>{children}</>
  const selected = ctx.selectedId === el.id
  const style: CSSProperties = {
    position: 'relative',
    display: inline ? 'inline-flex' : 'block',
    cursor: 'pointer',
    borderRadius: 4,
    outline: selected ? `2px solid ${ctx.surface.accent}` : '2px solid transparent',
    outlineOffset: 2,
  }
  return (
    <div
      className="lp-node"
      data-node-id={el.id}
      style={style}
      onClick={(e) => { e.stopPropagation(); ctx.onSelect?.(el.id) }}
    >
      {children}
    </div>
  )
}

/**
 * What an unfilled node looks like while it is being built.
 *
 * A template is a skeleton with no copy in it, so empty is the starting state
 * of every page rather than a fault. It has to be visible and clickable in the
 * builder, and it must not reach a visitor: the section renderers drop empty
 * nodes entirely when `editable` is false.
 */
const Placeholder = ({ el, ctx, inline }: { el: LpElement; ctx: NodeCtx; inline?: boolean }) => {
  const spec = elementSpec(el.type)
  return (
    <Shell el={el} ctx={ctx} inline={inline}>
      <div
        style={{
          // Always inline-flex: a full-width box cannot show whether the
          // section it is in is centred or left-aligned, which is most of what
          // an operator is looking at while a page is still empty.
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: inline ? '5px 10px' : '10px 12px',
          border: `1px dashed ${ctx.surface.muted}`,
          borderRadius: ctx.look.radius,
          color: ctx.surface.muted,
          fontSize: 12,
          fontFamily: ctx.look.utility,
          opacity: 0.85,
        }}
      >
        {spec?.name ?? el.type}
      </div>
    </Shell>
  )
}

// ---------------------------------------------------------------------------
// Leaves
// ---------------------------------------------------------------------------

const Eyebrow = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const text = str(el.text)
  const { surface: s, look } = ctx
  const style = look.eyebrowStyle
  const common: CSSProperties = { fontFamily: look.utility, fontWeight: 600 }

  if (style === 'flame_tag') {
    return (
      <Shell el={el} ctx={ctx} inline>
        <span style={{ ...common, display: 'inline-flex', alignItems: 'center', padding: '4px 10px', backgroundColor: s.accentFill, color: s.onAccentFill, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: Math.min(4, look.radius) }}>
          {text.toUpperCase()}
        </span>
      </Shell>
    )
  }
  if (style === 'rule_line') {
    return (
      <Shell el={el} ctx={ctx} inline>
        <span style={{ ...common, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 26, height: 1, backgroundColor: s.accent }} />
          <span style={{ fontSize: 10.5, color: s.accent, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{text}</span>
        </span>
      </Shell>
    )
  }
  if (style === 'uppercase_caps') {
    return (
      <Shell el={el} ctx={ctx} inline>
        <span style={{ ...common, fontSize: 11, fontWeight: 700, color: s.accent, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{text}</span>
      </Shell>
    )
  }
  return (
    <Shell el={el} ctx={ctx} inline>
      <span style={{ ...common, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: look.radiusPill, border: `1px solid ${s.line}`, color: s.accent, fontSize: 11, letterSpacing: '0.04em' }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.accentFill }} />
        {text.toUpperCase()}
      </span>
    </Shell>
  )
}

const HEADING_SIZE: Record<string, number> = { '1': 46, '2': 30, '3': 20 }

const Heading = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const { surface: s, look } = ctx
  const level = str(el.level) || '2'
  const size = HEADING_SIZE[level] ?? 30
  const Tag = (level === '1' ? 'h1' : level === '3' ? 'h3' : 'h2') as 'h1' | 'h2' | 'h3'
  return (
    <Shell el={el} ctx={ctx}>
      <Tag
        style={{
          margin: 0,
          fontFamily: look.display,
          fontWeight: look.displayWeight,
          fontSize: size,
          lineHeight: level === '1' ? 1.08 : 1.2,
          color: s.text,
          letterSpacing: look.headingTracking,
          textTransform: (level === '1' ? look.headingTransform : 'none') as CSSProperties['textTransform'],
        }}
      >
        {twoTone(str(el.text), str(el.accent), s.accent)}
      </Tag>
    </Shell>
  )
}

const Paragraph = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => (
  <Shell el={el} ctx={ctx}>
    <p style={{ margin: 0, fontFamily: ctx.look.body, fontSize: 15.5, lineHeight: 1.6, color: ctx.surface.muted, maxWidth: ctx.align === 'center' ? 640 : 560, marginLeft: ctx.align === 'center' ? 'auto' : undefined, marginRight: ctx.align === 'center' ? 'auto' : undefined }}>
      {str(el.text)}
    </p>
  </Shell>
)

const Note = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => (
  <Shell el={el} ctx={ctx}>
    <div style={{ fontFamily: ctx.look.body, fontSize: 12.5, color: ctx.surface.muted, lineHeight: 1.5 }}>{str(el.text)}</div>
  </Shell>
)

const Disclaimer = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => (
  <Shell el={el} ctx={ctx}>
    <div style={{ fontFamily: ctx.look.body, fontSize: 10.5, color: ctx.surface.muted, lineHeight: 1.65 }}>{str(el.text)}</div>
  </Shell>
)

const Divider = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => (
  <Shell el={el} ctx={ctx}>
    <div style={{ height: ctx.look.borderWidth, backgroundColor: ctx.surface.line, width: '100%' }} />
  </Shell>
)

const Pill = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const Icon = iconFor(el.icon, Check)
  return (
    <Shell el={el} ctx={ctx} inline>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: ctx.look.radiusPill, border: `${ctx.look.borderWidth} solid ${ctx.surface.line}`, backgroundColor: ctx.surface.card, color: ctx.surface.cardText, fontFamily: ctx.look.utility, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {Icon ? <Icon size={12} color={ctx.surface.accent} /> : null}
        {str(el.text)}
      </span>
    </Shell>
  )
}

const Badge = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const Icon = iconFor(el.icon)
  return (
    <Shell el={el} ctx={ctx} inline>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: ctx.look.radiusPill, border: `${ctx.look.borderWidth} solid ${ctx.surface.line}`, color: ctx.surface.text, fontFamily: ctx.look.utility, fontSize: 12, fontWeight: 600 }}>
        {Icon ? <Icon size={13} color={ctx.surface.accent} /> : null}
        {str(el.text)}
      </span>
    </Shell>
  )
}

const Button = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const { surface: s, look } = ctx
  const kind = str(el.kind) || 'primary'
  const Icon = iconFor(el.icon)
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px',
    borderRadius: look.radiusPill === '999px' ? 999 : look.radius,
    fontFamily: look.utility, fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
    border: `${look.borderWidth} solid transparent`, textDecoration: 'none', minHeight: 46,
  }
  const skin: CSSProperties =
    kind === 'secondary'
      ? { backgroundColor: 'transparent', color: s.accent, borderColor: s.accent }
      : kind === 'ghost'
        ? { backgroundColor: 'transparent', color: s.accent, padding: '10px 4px' }
        : { backgroundColor: s.accentFill, color: s.onAccentFill }
  const href = str(el.href)
  return (
    <Shell el={el} ctx={ctx} inline>
      <a href={href || '#lp-form'} style={{ ...base, ...skin }} onClick={(e) => { if (!href) e.preventDefault() }}>
        {str(el.label)}
        {Icon ? <Icon size={15} /> : null}
      </a>
    </Shell>
  )
}

/**
 * The brand's phone number, read from the brand rather than typed into copy.
 *
 * Numbers are resolved per Site and per path elsewhere in the system and are
 * never denormalised onto a page. This node holds a label and a size; the
 * digits come from the brand at render, so one landing page deployed under four
 * brands shows four different numbers without four copies of the page.
 */
const PhoneNode = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const contact = (ctx.brand?.contact ?? {}) as Record<string, unknown>
  const number = str(contact.callNumber)
  const large = str(el.kind) === 'large'
  const { surface: s, look } = ctx
  if (!number && !ctx.editable) return null
  const shown = number || 'No number on this brand'
  const PhoneIcon = iconFor('Phone')
  return (
    <Shell el={el} ctx={ctx} inline={!large}>
      <div style={{ textAlign: ctx.align === 'center' ? 'center' : 'left' }}>
        {str(el.label) ? <div style={{ fontFamily: look.utility, fontSize: 13, fontWeight: 600, color: s.muted, marginBottom: 6 }}>{str(el.label)}</div> : null}
        <a
          href={number ? `tel:${number.replace(/[^\d+]/g, '')}` : '#'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: look.display, fontWeight: look.displayWeight, fontSize: large ? 34 : 17, color: number ? s.accent : s.muted, textDecoration: 'none', letterSpacing: look.headingTracking }}
        >
          {PhoneIcon ? <PhoneIcon size={large ? 26 : 16} /> : null}
          {shown}
        </a>
        {str(el.note) ? <div style={{ fontFamily: look.body, fontSize: 12.5, color: s.muted, marginTop: 8 }}>{str(el.note)}</div> : null}
      </div>
    </Shell>
  )
}

const Stat = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => (
  <Shell el={el} ctx={ctx}>
    <div style={{ textAlign: ctx.align === 'center' ? 'center' : 'left' }}>
      <div style={{ fontFamily: ctx.look.display, fontWeight: ctx.look.displayWeight, fontSize: 30, lineHeight: 1.05, color: ctx.surface.accent, letterSpacing: ctx.look.headingTracking, overflowWrap: 'anywhere' }}>{str(el.value)}</div>
      <div style={{ fontFamily: ctx.look.utility, fontSize: 12, color: ctx.surface.muted, marginTop: 6, fontWeight: 500 }}>{str(el.label)}</div>
    </div>
  </Shell>
)

const cardSkin = (ctx: NodeCtx): CSSProperties =>
  ctx.flat
    ? { backgroundColor: 'transparent', border: 'none', padding: 0 }
    : { backgroundColor: ctx.surface.card, border: `${ctx.look.borderWidth} solid ${ctx.surface.line}`, borderRadius: ctx.look.radiusLg, padding: 22 }

/** Copy inside a card is derived against the CARD, not the page behind it. */
const cardInk = (ctx: NodeCtx) => (ctx.flat ? { text: ctx.surface.text, muted: ctx.surface.muted } : { text: ctx.surface.cardText, muted: ctx.surface.cardMuted })

const Figure = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const ink = cardInk(ctx)
  return (
    <Shell el={el} ctx={ctx}>
      <div style={{ ...cardSkin(ctx), height: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: ctx.look.utility, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: ctx.surface.accent, fontWeight: 700 }}>{str(el.meta)}</div>
        <div style={{ fontFamily: ctx.look.display, fontWeight: ctx.look.displayWeight, fontSize: 34, color: ink.text, margin: '10px 0 6px', letterSpacing: ctx.look.headingTracking }}>{str(el.value)}</div>
        <div style={{ fontFamily: ctx.look.body, fontSize: 13, color: ink.muted }}>{str(el.title)}</div>
      </div>
    </Shell>
  )
}

const CheckLine = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => (
  <Shell el={el} ctx={ctx}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontFamily: ctx.look.body, fontSize: 14.5, color: ctx.surface.text, lineHeight: 1.5 }}>
      <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 10, marginTop: 1, backgroundColor: ctx.surface.accentFill, color: ctx.surface.onAccentFill, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={12} strokeWidth={3} />
      </span>
      <span>{str(el.text)}</span>
    </div>
  </Shell>
)

const BulletLine = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const Icon = iconFor(el.icon, Check)
  return (
    <Shell el={el} ctx={ctx}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
        <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: ctx.look.radius, border: `${ctx.look.borderWidth} solid ${ctx.surface.line}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon ? <Icon size={16} color={ctx.surface.accent} /> : null}
        </span>
        <div>
          <div style={{ fontFamily: ctx.look.body, fontSize: 15, fontWeight: 600, color: ctx.surface.text, lineHeight: 1.45 }}>{str(el.text)}</div>
          {str(el.body) ? <div style={{ fontFamily: ctx.look.body, fontSize: 13.5, color: ctx.surface.muted, marginTop: 4, lineHeight: 1.55 }}>{str(el.body)}</div> : null}
        </div>
      </div>
    </Shell>
  )
}

const Step = ({ el, ctx, index }: { el: LpElement; ctx: NodeCtx; index: number }) => {
  const Icon = iconFor(el.icon)
  const showNumber = ctx.numbered || !Icon
  const centred = ctx.align === 'center'
  return (
    <Shell el={el} ctx={ctx}>
      <div style={{ textAlign: centred ? 'center' : 'left' }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: ctx.look.radiusPill === '999px' ? 22 : ctx.look.radius,
            backgroundColor: showNumber ? ctx.surface.accentFill : 'transparent',
            border: showNumber ? 'none' : `${ctx.look.borderWidth} solid ${ctx.surface.accent}`,
            color: showNumber ? ctx.surface.onAccentFill : ctx.surface.accent,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: ctx.look.utility, fontWeight: 700, fontSize: 16, marginBottom: 14,
          }}
        >
          {showNumber ? index + 1 : Icon ? <Icon size={20} /> : null}
        </div>
        <div style={{ fontFamily: ctx.look.display, fontWeight: ctx.look.displayWeight, fontSize: 18, color: ctx.surface.text, marginBottom: 7, letterSpacing: ctx.look.headingTracking }}>{str(el.title)}</div>
        <div style={{ fontFamily: ctx.look.body, fontSize: 14, color: ctx.surface.muted, lineHeight: 1.6, maxWidth: centred ? 300 : undefined, marginLeft: centred ? 'auto' : undefined, marginRight: centred ? 'auto' : undefined }}>{str(el.body)}</div>
      </div>
    </Shell>
  )
}

const Card = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const Icon = iconFor(el.icon)
  const ink = cardInk(ctx)
  return (
    <Shell el={el} ctx={ctx}>
      <div style={{ ...cardSkin(ctx), height: '100%' }}>
        {Icon ? (
          <div style={{ width: 38, height: 38, borderRadius: ctx.look.radius, backgroundColor: ctx.surface.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon size={18} color={ctx.surface.accent} />
          </div>
        ) : null}
        <div style={{ fontFamily: ctx.look.display, fontWeight: ctx.look.displayWeight, fontSize: 17, color: ink.text, marginBottom: 8, letterSpacing: ctx.look.headingTracking }}>{str(el.title)}</div>
        <div style={{ fontFamily: ctx.look.body, fontSize: 14, color: ink.muted, lineHeight: 1.6 }}>{str(el.body)}</div>
      </div>
    </Shell>
  )
}

const Panel = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => (
  <Shell el={el} ctx={ctx}>
    <div style={{ backgroundColor: ctx.surface.card, border: `${ctx.look.borderWidth} solid ${ctx.surface.line}`, borderRadius: ctx.look.radiusLg, padding: 26 }}>
      {str(el.meta) ? <div style={{ fontFamily: ctx.look.utility, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: ctx.surface.accent, fontWeight: 700, marginBottom: 12 }}>{str(el.meta)}</div> : null}
      <div style={{ fontFamily: ctx.look.display, fontWeight: ctx.look.displayWeight, fontSize: 22, color: ctx.surface.cardText, letterSpacing: ctx.look.headingTracking }}>{str(el.title)}</div>
      <div style={{ fontFamily: ctx.look.body, fontSize: 14.5, color: ctx.surface.cardMuted, lineHeight: 1.6, marginTop: 10 }}>{str(el.body)}</div>
    </div>
  </Shell>
)

const Testimonial = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const rating = Number(el.rating)
  const stars = Number.isFinite(rating) ? Math.max(0, Math.min(5, Math.round(rating))) : 5
  const ink = cardInk(ctx)
  const author = str(el.author)
  return (
    <Shell el={el} ctx={ctx}>
      <div style={{ ...cardSkin(ctx), height: '100%', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
        {stars > 0 ? (
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: stars }).map((_, i) => <Star key={i} size={13} fill={ctx.surface.accentFill} color={ctx.surface.accentFill} />)}
          </div>
        ) : null}
        <p style={{ margin: 0, fontFamily: ctx.look.body, fontSize: 14, lineHeight: 1.65, color: ink.text }}>{str(el.quote)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
          <span style={{ width: 30, height: 30, borderRadius: 15, flexShrink: 0, backgroundColor: ctx.surface.accentFill, color: ctx.surface.onAccentFill, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: ctx.look.utility, fontSize: 12, fontWeight: 700 }}>
            {author ? author.trim()[0].toUpperCase() : '?'}
          </span>
          <span>
            <span style={{ display: 'block', fontFamily: ctx.look.utility, fontSize: 12.5, fontWeight: 700, color: ink.text }}>{author}</span>
            {str(el.meta) ? <span style={{ display: 'block', fontFamily: ctx.look.body, fontSize: 11.5, color: ink.muted }}>{str(el.meta)}</span> : null}
          </span>
        </div>
      </div>
    </Shell>
  )
}

/**
 * One question, open or shut.
 *
 * State per item rather than per section: an accordion that closes the previous
 * answer when a new one opens is a choice, and the wrong one for a page whose
 * job is to answer objections. Two questions may need reading together.
 */
const FaqItem = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const [open, setOpen] = useState(false)
  const ink = cardInk(ctx)
  return (
    <Shell el={el} ctx={ctx}>
      <div style={{ backgroundColor: ctx.surface.card, border: `${ctx.look.borderWidth} solid ${ctx.surface.line}`, borderRadius: ctx.look.radius, overflow: 'hidden', textAlign: 'left' }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); if (ctx.editable) ctx.onSelect?.(el.id) }}
          style={{ width: '100%', padding: '16px 18px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, textAlign: 'left', fontFamily: ctx.look.utility, fontSize: 14.5, fontWeight: 600, color: ink.text, minHeight: 48 }}
        >
          {str(el.q)}
          {open ? <ChevronUp size={16} color={ink.muted} /> : <ChevronDown size={16} color={ink.muted} />}
        </button>
        {open ? <div style={{ padding: '0 18px 16px', fontFamily: ctx.look.body, fontSize: 14, color: ink.muted, lineHeight: 1.6 }}>{str(el.a)}</div> : null}
      </div>
    </Shell>
  )
}

const LinkNode = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => (
  <Shell el={el} ctx={ctx} inline>
    <a href={str(el.href) || '#'} style={{ fontFamily: ctx.look.body, fontSize: 13, color: ctx.surface.muted, textDecoration: 'none' }}>{str(el.label)}</a>
  </Shell>
)

const TickerItem = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => (
  <Shell el={el} ctx={ctx} inline>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: ctx.look.body, fontSize: 12.5, color: ctx.surface.muted, whiteSpace: 'nowrap' }}>
      {str(el.text)}
      <span style={{ fontFamily: ctx.look.utility, fontWeight: 700, color: ctx.surface.accent }}>{str(el.value)}</span>
    </span>
  </Shell>
)

const ImageNode = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const src = str(el.src)
  if (!src) return <Placeholder el={el} ctx={ctx} />
  return (
    <Shell el={el} ctx={ctx}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={str(el.alt)} loading="lazy" decoding="async" style={{ maxWidth: '100%', height: 'auto', borderRadius: ctx.look.radiusLg, display: 'block' }} />
    </Shell>
  )
}

/**
 * The lockup: the identity's mark beside the brand's name.
 *
 * The four identities each ship a two-path mark with a light and a dark variant,
 * and until now nothing drew them. The split is deliberate: the MARK and the
 * typography belong to the template's identity, the NAME belongs to whichever
 * brand the page is deployed under. A brand that has uploaded its own logo wins
 * outright, because that is a decision it has already made.
 */
const Logo = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const { identity, surface: s, look } = ctx
  const brandLogo = str(ctx.brand?.logoUrl)
  const brandDarkLogo = str(ctx.brand?.logoUrlDark)
  const chosenLogo = s.isDark ? brandDarkLogo || brandLogo : brandLogo
  const name = str(el.text) || str(ctx.brand?.displayName) || str(ctx.brand?.name) || identity.wordmark
  // The shape is the identity's. The colours are the brand's, remapped by the
  // role each path was playing rather than by its position in the file.
  const mark = markColors(identity, ctx.palette, s.isDark)

  return (
    <Shell el={el} ctx={ctx} inline>
      {chosenLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={chosenLogo} alt={name} style={{ height: 32, width: 'auto', display: 'block' }} />
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 40 40" width={30} height={30} aria-hidden="true" style={{ flexShrink: 0 }}>
            <path
              d={identity.mark.d}
              fill={mark.fill}
              stroke={mark.stroke}
              strokeWidth={mark.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d={identity.mark.d2} fill={mark.fill2} />
          </svg>
          <span style={{ fontFamily: look.display, fontWeight: look.displayWeight, fontSize: 19, color: s.text, textTransform: look.wordmarkTransform as CSSProperties['textTransform'], letterSpacing: look.wordmarkTracking, whiteSpace: 'nowrap' }}>
            {name}
          </span>
        </span>
      )}
    </Shell>
  )
}

/**
 * The quiz, running for real inside the page.
 *
 * This is the actual quiz runtime in inline mode, not a drawing of one: the
 * same flow, routing and lead delivery a standalone deployment would run. It
 * takes the LANDING PAGE's colours rather than its own, and is handed the card
 * colour it will sit on so its text is derived against the real backdrop.
 *
 * `preview` defaults to true so a caller that forgets to declare itself live
 * gets the safe behaviour - no lead written, no redirect followed - rather than
 * the dangerous one.
 */
/**
 * Whether a quiz has anything a visitor would actually be asked.
 *
 * Node types differ in whether they are visible by default - a webhook or a
 * decision never is - so "has steps" is not the same question as "has steps
 * someone will see". A quiz built entirely of hidden nodes would otherwise
 * render as an empty runtime rather than as the placeholder that says a quiz
 * still needs attaching.
 */
const VISIBLE_BY_DEFAULT: Record<string, boolean> = {
  question: true, form: true, transition: true, endpoint: true, custom: true,
  webhook: false, decision: false, verification: false,
}

const quizHasVisibleSteps = (quiz: unknown): boolean => {
  const q = quiz as { steps?: Array<{ key?: string }>; nodes?: Array<Record<string, unknown>> } | null | undefined
  if (!q || !Array.isArray(q.steps) || q.steps.length === 0) return false
  const nodes = Array.isArray(q.nodes) ? q.nodes : []
  return q.steps.some((step) => {
    const forStep = nodes.filter((n) => n.stepKey === step.key)
    const shared = forStep.find((n) => !Array.isArray(n.tiers) || (n.tiers as unknown[]).length === 0)
    const n = shared || forStep[0]
    if (!n) return false
    return (n.isVisible !== false && VISIBLE_BY_DEFAULT[String(n.type)] !== false) || n.isVisible === true
  })
}

const FormNode = ({ el, ctx }: { el: LpElement; ctx: NodeCtx }) => {
  const { surface: s, look } = ctx
  const quiz = ctx.quiz
  const hasQuiz = quizHasVisibleSteps(quiz)
  const label = str(el.label) || ctx.quizDepLabel || ''

  // A card asked to contrast with its section gets a full surface of its own,
  // derived from the identity's opposite ground and verified there, rather than
  // an inverted colour picked by hand. Both sides therefore read, and the quiz
  // is handed the opaque colour it will actually sit on so its own text is
  // derived against the card rather than against the section behind it.
  const contrasted = str(el.ground) === 'contrast'
  const card = contrasted
    ? deriveSurface(s.isDark ? ctx.palette.surface : ctx.palette.surfaceDark, ctx.palette)
    : { bg: s.card, text: s.cardText, muted: s.cardMuted, line: s.line, isDark: s.isDark }

  // The form draws in the TEMPLATE's colours like everything else on the page.
  // It kept the brand's until now, which is right for a quiz on its own URL and
  // wrong inside a host that has already chosen a palette: a blue page with a
  // red form in the middle of it. The brand it belongs to is unchanged, so the
  // number it shows and the place the lead goes are still the brand's.
  const quizBrand = quizBrandForPage(
    (ctx.quizCtx?.brand ?? ctx.brand) as Record<string, unknown>,
    ctx.palette,
    ctx.identity,
    card.bg,
    Boolean(card.isDark),
  )

  return (
    <Shell el={el} ctx={ctx}>
      <div
        id="lp-form"
        onClick={(e) => { if (!ctx.editable) return; e.stopPropagation(); ctx.onSelect?.(el.id) }}
        style={{ backgroundColor: card.bg, border: `${look.borderWidth} solid ${card.line}`, borderRadius: look.radiusLg, padding: 26, boxShadow: s.isDark ? '0 24px 64px -20px rgba(0,0,0,0.6)' : '0 18px 44px -20px rgba(0,0,0,0.24)', textAlign: 'left' }}
      >
        {label ? (
          <div style={{ fontFamily: look.utility, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: card.muted, marginBottom: 14 }}>{label}</div>
        ) : null}
        <div onClick={(e) => e.stopPropagation()}>
          {hasQuiz ? (
            <QuizRuntime
              quiz={quiz as never}
              brand={quizBrand as never}
              deployment={(ctx.quizCtx?.deployment ?? null) as never}
              site={(ctx.quizCtx?.site ?? null) as never}
              inline
              // QuizRuntime is ported and untyped, so its optional props infer
              // from their `null` defaults rather than being declared.
              surfaceColor={card.bg as never}
              previewMode={ctx.quizCtx ? ctx.quizCtx.preview !== false : true}
            />
          ) : (
            <div style={{ fontFamily: look.body, fontSize: 13.5, color: card.muted, lineHeight: 1.6 }}>
              Attach a quiz to this deployment and it runs here.
            </div>
          )}
        </div>
        {str(el.note) ? <div style={{ fontFamily: look.body, fontSize: 11.5, color: card.muted, marginTop: 14, textAlign: 'center' }}>{str(el.note)}</div> : null}
      </div>
    </Shell>
  )
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export const ElementNode = ({ el, ctx, index = 0 }: { el: LpElement; ctx: NodeCtx; index?: number }) => {
  const spec = elementSpec(el.type)
  // An element of a type this build does not know renders as nothing on a
  // public page and as a named placeholder in the builder, so an operator can
  // see and delete it rather than wondering why a gap is there.
  if (!spec) return ctx.editable ? <Placeholder el={el} ctx={ctx} /> : null

  if (isEmptyElement(el)) {
    if (!ctx.editable) return null
    return <Placeholder el={el} ctx={ctx} inline={spec.flow === 'flow'} />
  }

  switch (el.type) {
    case 'eyebrow': return <Eyebrow el={el} ctx={ctx} />
    case 'heading': return <Heading el={el} ctx={ctx} />
    case 'text': return <Paragraph el={el} ctx={ctx} />
    case 'note': return <Note el={el} ctx={ctx} />
    case 'disclaimer': return <Disclaimer el={el} ctx={ctx} />
    case 'divider': return <Divider el={el} ctx={ctx} />
    case 'pill': return <Pill el={el} ctx={ctx} />
    case 'badge': return <Badge el={el} ctx={ctx} />
    case 'button': return <Button el={el} ctx={ctx} />
    case 'phone': return <PhoneNode el={el} ctx={ctx} />
    case 'stat': return <Stat el={el} ctx={ctx} />
    case 'figure': return <Figure el={el} ctx={ctx} />
    case 'check': return <CheckLine el={el} ctx={ctx} />
    case 'bullet': return <BulletLine el={el} ctx={ctx} />
    case 'step': return <Step el={el} ctx={ctx} index={index} />
    case 'card': return <Card el={el} ctx={ctx} />
    case 'panel': return <Panel el={el} ctx={ctx} />
    case 'testimonial': return <Testimonial el={el} ctx={ctx} />
    case 'faq_item': return <FaqItem el={el} ctx={ctx} />
    case 'link': return <LinkNode el={el} ctx={ctx} />
    case 'ticker_item': return <TickerItem el={el} ctx={ctx} />
    case 'image': return <ImageNode el={el} ctx={ctx} />
    case 'logo': return <Logo el={el} ctx={ctx} />
    case 'form': return <FormNode el={el} ctx={ctx} />
    default: return ctx.editable ? <Placeholder el={el} ctx={ctx} /> : null
  }
}

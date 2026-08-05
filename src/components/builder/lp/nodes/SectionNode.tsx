'use client'

/**
 * How a section arranges whatever is in it.
 *
 * There are six of these and none of them is about a subject. There is no
 * "how it works" section any more, and no "testimonials" section: there is a
 * BAND, and a band that happens to contain three `step` elements draws a
 * three-step row. Put four in and it draws four. Put cards in instead and it
 * draws cards. The shape follows the contents.
 *
 * That is the mechanism that lets four templates differ structurally while
 * sharing one renderer. A skeleton is a list of section types with layout props
 * and a list of element types inside them, carrying no copy at all; the same
 * code below draws all four, and a fifth would need no new component.
 *
 * The one thing a section decides for itself is its GROUND, and everything
 * drawn on it takes its colours from the surface derived for that ground.
 */

import type { CSSProperties, ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import type { LpIdentity } from '@/lib/lp-identities'
import {
  groupElements,
  sectionSpec,
  willDraw,
  type LpElement,
  type LpSection,
  type RenderGroup,
} from '@/lib/lp-nodes/model'
import { lookOf, surfaceForSection, type Surface } from '@/lib/lp-nodes/surface'
import { ElementNode, type NodeCtx } from './ElementNode'

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const yes = (v: unknown): boolean => v === true || v === 'yes'

const CONTAINER = 1140

const sectionSpecName = (type: string): string => (sectionSpec(type)?.name ?? type).toLowerCase()

export type SectionNodeProps = {
  section: LpSection
  identity: LpIdentity
  brand: Record<string, unknown>
  editable: boolean
  selectedId?: string | null
  onSelect?: (id: string) => void
  quiz?: unknown
  quizCtx?: NodeCtx['quizCtx']
  quizDepLabel?: string
}

/**
 * The elements a slot will actually draw.
 *
 * Hidden nodes are gone from both views, because hiding is an editorial
 * decision rather than a preview toggle. Empty nodes survive into the builder
 * and are dropped from the public page: a skeleton starts empty, so an operator
 * needs to see the shape they are filling, and a visitor must never meet it.
 */
const slotElements = (section: LpSection, slot: 'lead' | 'aside', editable: boolean): LpElement[] =>
  section.elements.filter((el) => (el.slot === 'aside' ? 'aside' : 'lead') === slot && willDraw(el, editable))

/** Render one grouped run: a stacked block, a column grid, or a wrapping row. */
const Group = ({ group, ctx, connector }: { group: RenderGroup; ctx: NodeCtx; connector?: boolean }) => {
  if (group.kind === 'single') return <ElementNode el={group.element} ctx={ctx} />

  if (group.kind === 'flow') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: ctx.align === 'center' ? 'center' : 'flex-start' }}>
        {group.elements.map((el, i) => <ElementNode key={el.id} el={el} ctx={ctx} index={i} />)}
      </div>
    )
  }

  const grid = (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.columns}, minmax(0, 1fr))`, gap: group.type === 'check' || group.type === 'bullet' || group.type === 'faq_item' ? 12 : 20, position: 'relative', zIndex: 1 }}>
      {group.elements.map((el, i) => <ElementNode key={el.id} el={el} ctx={ctx} index={i} />)}
    </div>
  )

  // The rule that joins a three-step row. Drawn behind the step markers and
  // inset to the centre of the first and last column so it starts and ends
  // under them rather than running off the edge of the section.
  if (connector && group.type === 'step' && group.columns > 1) {
    const inset = `${100 / group.columns / 2}%`
    return (
      <div style={{ position: 'relative' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: 22, left: inset, right: inset, height: 1, backgroundColor: ctx.surface.line, zIndex: 0 }} />
        {grid}
      </div>
    )
  }
  return grid
}

const Stack = ({ groups, ctx, gap = 22, connector }: { groups: RenderGroup[]; ctx: NodeCtx; gap?: number; connector?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap, alignItems: ctx.align === 'center' ? 'center' : 'stretch' }}>
    {groups.map((g, i) => (
      <div key={i} style={{ width: '100%', textAlign: ctx.align === 'center' ? 'center' : 'left' }}>
        <Group group={g} ctx={ctx} connector={connector} />
      </div>
    ))}
  </div>
)

/**
 * The frame every section sits in: its ground, its padding, and in the builder
 * a click target and a hover affordance for editing the section itself.
 */
const Frame = ({
  section, surface, editable, selected, onSelect, padding, children,
}: {
  section: LpSection
  surface: Surface
  editable: boolean
  selected: boolean
  onSelect?: (id: string) => void
  padding: string
  children: ReactNode
}) => {
  const style: CSSProperties = {
    position: 'relative',
    backgroundColor: surface.bg,
    color: surface.text,
    padding,
    outline: editable && selected ? `2px solid ${surface.accent}` : undefined,
    outlineOffset: -2,
    cursor: editable ? 'pointer' : undefined,
  }
  return (
    <section data-section-id={section.id} style={style} onClick={editable ? () => onSelect?.(section.id) : undefined}>
      {editable ? (
        <div className="lp-section-overlay" style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, opacity: 0, transition: 'opacity 0.15s', pointerEvents: 'none' }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect?.(section.id) }}
            style={{ pointerEvents: 'auto', padding: '6px 10px', borderRadius: 6, backgroundColor: surface.isDark ? 'rgba(255,255,255,0.96)' : 'rgba(15,23,42,0.92)', color: surface.isDark ? '#0f172a' : '#ffffff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: '"Inter", system-ui, sans-serif' }}
          >
            <Pencil size={11} /> Edit section
          </button>
        </div>
      ) : null}
      <div style={{ maxWidth: CONTAINER, margin: '0 auto' }}>{children}</div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------

/** Logo on the left, links in the middle, calls to action on the right. */
const HeaderLayout = ({ section, ctx }: { section: LpSection; ctx: NodeCtx }) => {
  const els = slotElements(section, 'lead', ctx.editable).concat(slotElements(section, 'aside', ctx.editable))
  const logos = els.filter((e) => e.type === 'logo')
  const links = els.filter((e) => e.type === 'link')
  const rest = els.filter((e) => e.type !== 'logo' && e.type !== 'link')
  const leftCtx = { ...ctx, align: 'left' as const }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {logos.map((el) => <ElementNode key={el.id} el={el} ctx={leftCtx} />)}
      </div>
      {links.length > 0 ? (
        <nav style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          {links.map((el) => <ElementNode key={el.id} el={el} ctx={leftCtx} />)}
        </nav>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {rest.map((el, i) => <ElementNode key={el.id} el={el} ctx={leftCtx} index={i} />)}
      </div>
    </div>
  )
}

/**
 * The hero, in three shapes.
 *
 * `split` is the familiar one: argument on the left, form on the right.
 * `centered` puts the form under the copy in the middle of the fold, which is
 * the layout that made this rewrite necessary - the old renderer had exactly
 * one hero and no way to express it. `stacked` runs the form full width beneath.
 */
const HeroLayout = ({ section, ctx }: { section: LpSection; ctx: NodeCtx }) => {
  const variant = str(section.props?.variant) || 'split'
  const lead = slotElements(section, 'lead', ctx.editable)
  const aside = slotElements(section, 'aside', ctx.editable)

  if (variant === 'split' && aside.length > 0) {
    const leftCtx = { ...ctx, align: 'left' as const }
    return (
      <div className="lp-split" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 48, alignItems: 'center' }}>
        <div><Stack groups={groupElements(lead)} ctx={leftCtx} /></div>
        <div><Stack groups={groupElements(aside)} ctx={leftCtx} /></div>
      </div>
    )
  }

  // Centred and stacked both run one column; they differ in how wide the form
  // is allowed to get and whether the copy is centred over it.
  const centred = variant !== 'stacked'
  const inner = { ...ctx, align: centred ? ('center' as const) : ('left' as const) }
  const all = lead.concat(aside)
  const formIdx = all.findIndex((e) => e.type === 'form')
  const above = formIdx === -1 ? all : all.slice(0, formIdx)
  const form = formIdx === -1 ? null : all[formIdx]
  const below = formIdx === -1 ? [] : all.slice(formIdx + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: centred ? 'center' : 'stretch' }}>
      {above.length > 0 ? <div style={{ width: '100%', maxWidth: centred ? 800 : undefined }}><Stack groups={groupElements(above)} ctx={inner} gap={18} /></div> : null}
      {form ? (
        <div style={{ width: '100%', maxWidth: variant === 'stacked' ? undefined : 720 }}>
          <ElementNode el={form} ctx={inner} />
        </div>
      ) : null}
      {below.length > 0 ? <div style={{ width: '100%', maxWidth: centred ? 800 : undefined }}><Stack groups={groupElements(below)} ctx={inner} gap={18} /></div> : null}
    </div>
  )
}

/** The workhorse: one column, or two when anything is tagged into the aside. */
const BandLayout = ({ section, ctx }: { section: LpSection; ctx: NodeCtx }) => {
  const columns = Number(section.props?.columns) || undefined
  const connector = yes(section.props?.connector)
  const lead = slotElements(section, 'lead', ctx.editable)
  const aside = slotElements(section, 'aside', ctx.editable)

  if (aside.length === 0) {
    return <Stack groups={groupElements(lead, columns)} ctx={ctx} connector={connector} />
  }

  // A split band aligns left in both columns whatever the section says: centred
  // copy in a narrow column beside another column reads as a mistake.
  const colCtx = { ...ctx, align: 'left' as const }
  const leadCol = <div><Stack groups={groupElements(lead, columns)} ctx={colCtx} connector={connector} /></div>
  const asideCol = <div><Stack groups={groupElements(aside, columns)} ctx={colCtx} /></div>
  const reversed = yes(section.props?.reverse)
  return (
    <div className="lp-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
      {reversed ? asideCol : leadCol}
      {reversed ? leadCol : asideCol}
    </div>
  )
}

/** A thin full-width bar: pills, a trust row, a ticker, a phone band. */
const StripLayout = ({ section, ctx }: { section: LpSection; ctx: NodeCtx }) => {
  const els = slotElements(section, 'lead', ctx.editable).concat(slotElements(section, 'aside', ctx.editable))
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, justifyContent: ctx.align === 'center' ? 'center' : 'flex-start' }}>
      {groupElements(els).map((g, i) => <Group key={i} group={g} ctx={ctx} />)}
    </div>
  )
}

const CtaLayout = ({ section, ctx }: { section: LpSection; ctx: NodeCtx }) => {
  const els = slotElements(section, 'lead', ctx.editable).concat(slotElements(section, 'aside', ctx.editable))
  const body = <Stack groups={groupElements(els)} ctx={ctx} gap={22} />
  if (!yes(section.props?.boxed)) return body
  return (
    <div style={{ backgroundColor: ctx.surface.card, border: `${ctx.look.borderWidth} solid ${ctx.surface.line}`, borderRadius: ctx.look.radiusLg, padding: '52px 40px' }}>
      {body}
    </div>
  )
}

/** Lockup and links on one row, then the legal text under a rule. */
const FooterLayout = ({ section, ctx }: { section: LpSection; ctx: NodeCtx }) => {
  const els = slotElements(section, 'lead', ctx.editable).concat(slotElements(section, 'aside', ctx.editable))
  const top = els.filter((e) => e.type === 'logo' || e.type === 'link' || e.type === 'phone' || e.type === 'button')
  const rest = els.filter((e) => !top.includes(e))
  const leftCtx = { ...ctx, align: 'left' as const }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {top.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {top.filter((e) => e.type === 'logo').map((el) => <ElementNode key={el.id} el={el} ctx={leftCtx} />)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            {top.filter((e) => e.type !== 'logo').map((el, i) => <ElementNode key={el.id} el={el} ctx={leftCtx} index={i} />)}
          </div>
        </div>
      ) : null}
      {rest.length > 0 ? (
        <div style={{ borderTop: `${ctx.look.borderWidth} solid ${ctx.surface.line}`, paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupElements(rest).map((g, i) => <Group key={i} group={g} ctx={leftCtx} />)}
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------

const PADDING: Record<string, string> = {
  header: '16px 32px',
  hero: '64px 32px 76px',
  band: '76px 32px',
  strip: '18px 32px',
  cta: '80px 32px',
  footer: '36px 32px 30px',
}

export const SectionNode = ({
  section, identity, brand, editable, selectedId, onSelect, quiz, quizCtx, quizDepLabel,
}: SectionNodeProps) => {
  const surface = surfaceForSection(section, identity)
  const look = lookOf(identity)
  const ctx: NodeCtx = {
    surface,
    look,
    identity,
    brand,
    align: (str(section.props?.align) as 'left' | 'center') || (section.type === 'band' ? 'left' : 'left'),
    editable,
    selectedId,
    onSelect,
    flat: yes(section.props?.flat),
    numbered: yes(section.props?.numbered),
    quiz,
    quizCtx,
    quizDepLabel,
  }

  // Asked with the SAME predicate the layouts use to pick what goes in a
  // column, so the two cannot disagree about what "empty" means. They did: this
  // counted visible elements, the layouts counted drawable ones, and a skeleton
  // is full of elements that are visible and unwritten. A visitor got a stack of
  // bare coloured bands; in the builder it reads as the section having failed
  // to appear rather than as an empty one waiting to be filled.
  const empty = section.elements.every((el) => !willDraw(el, editable))
  if (empty && !editable) return null

  let body: ReactNode = null
  switch (section.type) {
    case 'header': body = <HeaderLayout section={section} ctx={ctx} />; break
    case 'hero': body = <HeroLayout section={section} ctx={ctx} />; break
    case 'strip': body = <StripLayout section={section} ctx={{ ...ctx, align: (str(section.props?.align) as 'left' | 'center') || 'center' }} />; break
    case 'cta': body = <CtaLayout section={section} ctx={{ ...ctx, align: (str(section.props?.align) as 'left' | 'center') || 'center' }} />; break
    case 'footer': body = <FooterLayout section={section} ctx={ctx} />; break
    default: body = <BandLayout section={section} ctx={ctx} />
  }

  return (
    <Frame
      section={section}
      surface={surface}
      editable={editable}
      selected={selectedId === section.id}
      onSelect={onSelect}
      padding={PADDING[section.type] || PADDING.band}
    >
      {empty ? (
        <div style={{ padding: '18px 20px', border: `1px dashed ${surface.muted}`, borderRadius: look.radius, color: surface.muted, fontFamily: look.utility, fontSize: 12.5, textAlign: 'center' }}>
          Empty {sectionSpecName(section.type)}. Add an element to it in the tree on the left.
        </div>
      ) : (
        body
      )}
    </Frame>
  )
}

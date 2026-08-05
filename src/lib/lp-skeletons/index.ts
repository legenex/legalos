/**
 * The structural skeletons behind the four templates.
 *
 * A skeleton is a list of section types with their layout props, and inside
 * each a list of element types. It contains NO COPY. Not a placeholder
 * headline, not a sample step title, nothing that would have to be deleted
 * before the page could be written. What it does contain is the page's SHAPE:
 * whether the form sits beside the argument or centred above the fold, whether
 * the process row is three cards or three numbered steps joined by a rule,
 * which bands are dark and which are not.
 *
 * That is the whole point of the exercise. Before this, all four templates drew
 * the same thirteen hard-coded sections and could differ only in colour, so
 * "pick a template" meant "pick a palette". A skeleton makes structure the
 * thing a template chooses, and the node renderer draws whatever it names
 * without a component being written per template.
 *
 * The fields that survive into a skeleton are the ones that are structural
 * rather than editorial: a heading's LEVEL, a button's ROLE, a hero's VARIANT.
 * An icon is content, so no skeleton names one; a step with no icon numbers
 * itself, which is the right default for an empty page.
 */

import {
  newNodeId,
  type ElementType,
  type LpSection,
  type SectionType,
  type Slot,
  type ToneId,
} from '@/lib/lp-nodes/model'

export type SkeletonElement = {
  type: ElementType
  slot?: Slot
  /** Structural values only. Never copy. */
  fields?: Record<string, unknown>
}

export type SkeletonSection = {
  type: SectionType
  tone?: ToneId
  props?: Record<string, unknown>
  elements: SkeletonElement[]
}

export type LpSkeleton = {
  id: string
  name: string
  /** One line describing the shape, shown in the template gallery. */
  summary: string
  sections: SkeletonSection[]
}

/** Shorthand so a skeleton reads as a list of shapes rather than a wall of objects. */
const e = (type: ElementType, fields?: Record<string, unknown>, slot?: Slot): SkeletonElement => ({ type, fields, slot })
const rep = (type: ElementType, count: number, fields?: Record<string, unknown>, slot?: Slot): SkeletonElement[] =>
  Array.from({ length: count }, () => e(type, fields, slot))

// ---------------------------------------------------------------------------
// B - Plainpath: the form is the first thing, centred above the fold
// ---------------------------------------------------------------------------

/**
 * Skeleton B.
 *
 * The departure that made the node model necessary: the form sits CENTRED above
 * the fold rather than in a column beside the argument, so the first thing on
 * the page is the thing the page wants. The old renderer had exactly one hero
 * and no way to say this.
 *
 * What follows it is a proof stack, in the order the reference lays it out:
 * how it works, then the size of the operation, then individual results, then
 * the money question answered on a filled band, then people, then objections.
 */
const SKELETON_B: LpSkeleton = {
  id: 'b',
  name: 'Form first',
  summary: 'The form centred above the fold, then a three-step row, a scale claim, result cards, a filled cost band, testimonials and questions.',
  sections: [
    {
      type: 'header',
      tone: 'default',
      elements: [e('logo'), ...rep('link', 4), e('button', { kind: 'primary' })],
    },
    {
      // The fold. Dark ground so the white form card carries the eye.
      type: 'hero',
      tone: 'dark',
      props: { variant: 'centered', align: 'center' },
      elements: [e('note'), e('heading', { level: '1' }), e('text'), e('form'), e('note')],
    },
    {
      type: 'band',
      tone: 'default',
      props: { align: 'center' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), e('text'), ...rep('step', 3)],
    },
    {
      // Scale, argued on the left and stated on the right.
      type: 'band',
      tone: 'dark',
      props: { align: 'left' },
      elements: [
        e('heading', { level: '2' }),
        e('text'),
        ...rep('check', 4),
        e('button', { kind: 'primary' }),
        e('panel', undefined, 'aside'),
      ],
    },
    {
      type: 'band',
      tone: 'surface',
      props: { align: 'center' },
      elements: [e('heading', { level: '2' }), e('text'), ...rep('figure', 3), e('button', { kind: 'primary' })],
    },
    {
      // The cost question, on the brand colour, with the reassurance panel
      // leading rather than following.
      type: 'band',
      tone: 'brand',
      props: { align: 'left', reverse: 'yes' },
      elements: [
        e('eyebrow'),
        e('heading', { level: '2' }),
        e('text'),
        ...rep('check', 4),
        e('button', { kind: 'primary' }),
        e('panel', undefined, 'aside'),
      ],
    },
    {
      type: 'band',
      tone: 'default',
      props: { align: 'center', columns: '4' },
      elements: [e('heading', { level: '2' }), e('text'), ...rep('testimonial', 4)],
    },
    {
      type: 'band',
      tone: 'surface',
      props: { align: 'center' },
      elements: [e('heading', { level: '2' }), e('text'), ...rep('faq_item', 6)],
    },
    {
      type: 'footer',
      tone: 'dark',
      elements: [e('logo'), ...rep('link', 5), e('disclaimer'), e('note')],
    },
  ],
}

// ---------------------------------------------------------------------------

/**
 * Skeletons by template id.
 *
 * A, C and D are deliberately absent rather than filled with a copy of B. A
 * template with no skeleton keeps its identity - its palette, faces and shapes
 * still apply to whatever sections a page already has - and the gallery says
 * plainly that its structure has not been built. Seeding three lookalikes and
 * calling the job done is the failure this whole change exists to fix.
 */
export const SKELETONS: Record<string, LpSkeleton | undefined> = {
  b: SKELETON_B,
}

export const skeletonFor = (templateId: string | undefined | null): LpSkeleton | null =>
  (templateId && SKELETONS[templateId]) || null

/**
 * Turn a skeleton into real sections.
 *
 * Ids are minted here rather than stored in the skeleton, because a skeleton is
 * a description and two pages built from it must not share node ids. This runs
 * on an operator action, never during a render, which is why fresh ids are
 * correct here and would be a bug in the legacy converter.
 */
export const instantiateSkeleton = (skeleton: LpSkeleton): LpSection[] =>
  skeleton.sections.map((s) => ({
    id: newNodeId('sec'),
    type: s.type,
    tone: s.tone,
    props: s.props ? { ...s.props } : {},
    elements: s.elements.map((el) => ({
      ...(el.fields ?? {}),
      id: newNodeId('el'),
      type: el.type,
      ...(el.slot ? { slot: el.slot } : {}),
    })),
  }))

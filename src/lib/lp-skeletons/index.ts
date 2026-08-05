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
 *
 * The four are deliberately unalike. The form sits in a different place in each
 * of B, A and D and on a band of its own in C; A and D split in opposite
 * directions; A alternates dark and light the whole way down where C never
 * repeats a ground twice running. No two share a section list.
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
      elements: [e('note'), e('heading', { level: '1' }), e('text'), e('form', { ground: 'contrast' }), e('note')],
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
// A - Counterweight: the argument on the left, the form on the right
// ---------------------------------------------------------------------------

/**
 * Skeleton A.
 *
 * The long-form argument. The form sits beside the copy rather than above it,
 * because this page wants to have said something before it asks, and the bands
 * below it alternate dark and light so a reader can tell where one argument
 * ends and the next begins.
 *
 * Two things here exist nowhere else in the four: an icon-bulleted list, which
 * is a run of `bullet` nodes rather than the tick lines the others use, and a
 * split whose second column is an image, which is how the "matched in your
 * state" map is expressed without a section type being invented for maps.
 */
const SKELETON_A: LpSkeleton = {
  id: 'a',
  name: 'The long argument',
  summary: 'A dark hero with the form beside the copy, an icon-bulleted list, a map split, dark and light bands alternating, a testimonial grid, questions, and a boxed closing ask.',
  sections: [
    {
      type: 'header',
      tone: 'dark',
      elements: [e('logo'), ...rep('link', 4), e('phone'), e('button', { kind: 'primary' })],
    },
    {
      type: 'hero',
      tone: 'dark',
      props: { variant: 'split', align: 'left' },
      elements: [
        e('eyebrow'),
        e('heading', { level: '1' }),
        e('text'),
        e('button', { kind: 'primary' }),
        e('button', { kind: 'ghost' }),
        e('form', undefined, 'aside'),
      ],
    },
    {
      // The list the page is named for. Bullets, not ticks: each one carries an
      // icon and a line of its own rather than reading as a qualifying list.
      type: 'band',
      tone: 'dark',
      props: { align: 'left' },
      elements: [
        e('eyebrow'),
        e('heading', { level: '2' }),
        e('text'),
        ...rep('bullet', 6),
        e('button', { kind: 'primary' }),
      ],
    },
    {
      // The map split. An image in the second column, which is all "matched to
      // an attorney in your state" needs to be.
      type: 'band',
      tone: 'surface',
      props: { align: 'left' },
      elements: [
        e('eyebrow'),
        e('heading', { level: '2' }),
        e('text'),
        e('button', { kind: 'primary' }),
        e('image', undefined, 'aside'),
      ],
    },
    {
      type: 'band',
      tone: 'default',
      props: { align: 'center' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), e('text'), ...rep('card', 3)],
    },
    {
      type: 'band',
      tone: 'dark',
      props: { align: 'center' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), e('text'), ...rep('step', 3)],
    },
    {
      type: 'band',
      tone: 'surface',
      props: { align: 'left', columns: '2' },
      elements: [
        e('eyebrow'),
        e('heading', { level: '2' }),
        e('text'),
        ...rep('check', 6),
        e('button', { kind: 'primary' }),
      ],
    },
    {
      type: 'band',
      tone: 'brand',
      props: { align: 'center' },
      elements: [e('heading', { level: '2' }), e('text'), ...rep('card', 3)],
    },
    {
      type: 'band',
      tone: 'default',
      props: { align: 'center' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), e('text'), ...rep('testimonial', 3), e('note')],
    },
    {
      type: 'band',
      tone: 'surface',
      props: { align: 'center' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), ...rep('faq_item', 6)],
    },
    {
      type: 'cta',
      tone: 'dark',
      props: { align: 'center', boxed: 'yes' },
      elements: [e('heading', { level: '2' }), e('text'), e('button', { kind: 'primary' }), e('note')],
    },
    {
      type: 'footer',
      tone: 'dark',
      elements: [e('logo'), ...rep('link', 5), e('disclaimer'), e('note')],
    },
  ],
}

// ---------------------------------------------------------------------------
// C - Meridian: state the terms, then ask
// ---------------------------------------------------------------------------

/**
 * Skeleton C.
 *
 * The measured one. It opens on a dark ground with a pill row and a two-tone
 * headline, then drops the form onto a light band of its own rather than into
 * the hero, which is what gives the fold its break. Everything after that is
 * disclosure in order: what the process is, who to call, what it costs, the
 * questions, and a footer that carries the long attorney-advertising text
 * rather than hiding it.
 *
 * Its three-step row is the one with a rule drawn through it, and its card row
 * is flat: no borders, no shadows, just three columns of type.
 */
const SKELETON_C: LpSkeleton = {
  id: 'c',
  name: 'Terms first',
  summary: 'A pill row and a two-tone headline on dark, the form on a light band of its own, a dark trust bar, a three-step row joined by a rule, a full-width phone band, a flat card row, questions, and a long-disclaimer footer.',
  sections: [
    {
      type: 'header',
      tone: 'default',
      elements: [e('logo'), e('phone')],
    },
    {
      type: 'hero',
      tone: 'dark',
      props: { variant: 'centered', align: 'center' },
      elements: [...rep('pill', 3), e('heading', { level: '1' }), e('text')],
    },
    {
      // The form on light, in its own band rather than in the hero. That break
      // is the whole shape of this page's fold.
      type: 'band',
      tone: 'default',
      props: { align: 'center', width: 'narrow' },
      elements: [e('form')],
    },
    {
      type: 'strip',
      tone: 'dark',
      props: { align: 'center' },
      elements: [...rep('check', 3)],
    },
    {
      type: 'band',
      tone: 'default',
      props: { align: 'center', connector: 'yes' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), e('text'), ...rep('step', 3)],
    },
    {
      type: 'strip',
      tone: 'brand',
      props: { align: 'center' },
      elements: [e('phone', { kind: 'large' })],
    },
    {
      type: 'band',
      tone: 'surface',
      props: { align: 'center', flat: 'yes' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), e('text'), ...rep('card', 3), e('note')],
    },
    {
      type: 'band',
      tone: 'default',
      props: { align: 'center' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), ...rep('faq_item', 4)],
    },
    {
      type: 'footer',
      tone: 'dark',
      elements: [e('logo'), ...rep('link', 4), e('disclaimer'), e('note')],
    },
  ],
}

// ---------------------------------------------------------------------------
// D - Matchline: short, counted, and quick to the point
// ---------------------------------------------------------------------------

/**
 * Skeleton D.
 *
 * The fastest of the four and the busiest structurally. It opens like C, with
 * pills and a two-tone headline, but keeps the form in the fold and follows it
 * immediately with a trust bar. What distinguishes it is that it splits twice,
 * in opposite directions: once with a dark inset panel beside the copy, and
 * once with a single figure beside a checklist, which is how "the attorneys
 * only get paid if you do" is said with a number rather than a paragraph.
 */
const SKELETON_D: LpSkeleton = {
  id: 'd',
  name: 'Counted',
  summary: 'Pills and a two-tone headline over the form, a trust bar, a dark card row, a phone band, copy beside an inset panel, a numbered three-step, a figure beside a checklist, testimonials with faces, and questions.',
  sections: [
    {
      type: 'header',
      tone: 'dark',
      elements: [e('logo'), e('phone')],
    },
    {
      type: 'hero',
      tone: 'dark',
      props: { variant: 'centered', align: 'center' },
      elements: [...rep('pill', 3), e('heading', { level: '1' }), e('text'), e('form', { ground: 'contrast' })],
    },
    {
      type: 'strip',
      tone: 'brand',
      props: { align: 'center' },
      elements: [...rep('check', 4)],
    },
    {
      // Cards on a dark ground, which the card renderer handles by deriving its
      // own copy against the card rather than the band behind it.
      type: 'band',
      tone: 'dark',
      props: { align: 'center' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), e('text'), ...rep('card', 3)],
    },
    {
      type: 'strip',
      tone: 'brand',
      props: { align: 'center' },
      elements: [e('phone', { kind: 'large' })],
    },
    {
      // Copy on the left, a dark panel quoting the other side on the right.
      type: 'band',
      tone: 'surface',
      props: { align: 'left' },
      elements: [
        e('eyebrow'),
        e('heading', { level: '2' }),
        e('text'),
        ...rep('check', 3),
        e('panel', undefined, 'aside'),
      ],
    },
    {
      type: 'band',
      tone: 'default',
      props: { align: 'center', numbered: 'yes' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), e('text'), ...rep('step', 3)],
    },
    {
      // The figure leads and the checklist answers it, so the second column
      // comes first here.
      type: 'band',
      tone: 'dark',
      props: { align: 'left', reverse: 'yes' },
      elements: [
        e('heading', { level: '2' }),
        e('text'),
        ...rep('check', 4),
        e('figure', undefined, 'aside'),
      ],
    },
    {
      type: 'band',
      tone: 'default',
      props: { align: 'center', columns: '4' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), e('text'), ...rep('testimonial', 4), e('note')],
    },
    {
      type: 'band',
      tone: 'surface',
      props: { align: 'center' },
      elements: [e('eyebrow'), e('heading', { level: '2' }), ...rep('faq_item', 5)],
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
 * Four shapes that do not overlap. The form sits in a different place in three
 * of them and on its own band in the fourth; two split left and two split
 * right; one alternates dark and light the whole way down and one never
 * repeats a ground twice running. None of them shares a section list with
 * another, which was the point: before this, picking a template picked a
 * palette and nothing else.
 */
export const SKELETONS: Record<string, LpSkeleton | undefined> = {
  a: SKELETON_A,
  b: SKELETON_B,
  c: SKELETON_C,
  d: SKELETON_D,
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

/**
 * The landing-page node model.
 *
 * A landing page used to be a list of sections, each holding a fixed bag of
 * named copy keys - `c.eyebrow`, `c.headline`, `c.steps` - that one hard-coded
 * renderer read back by name. The consequence was that a section could only be
 * deleted whole: there was no such thing as "the third step" or "that button"
 * as far as the page was concerned, because those things were properties of a
 * section rather than things in their own right.
 *
 * Here every visible thing is a node with its own id, type and visibility, so
 * anything on the page can be hidden, reordered, removed or added. Two levels
 * only - section, then element - because a third would buy nesting nobody has
 * asked for and cost a tree editor to manage it. Splits, which are the one
 * layout that genuinely wants two containers, are done with a `slot` tag on the
 * element instead: `aside` elements form the second column. That keeps the tree
 * flat and still draws a two-column section.
 *
 * The other half of the change is that a SECTION no longer knows what it is
 * about. There is no `how_it_works` renderer any more; there is a `band` that
 * groups consecutive elements of the same type into a row. Three `step`
 * elements make a three-step row, and a fourth makes it a four-step row,
 * without a renderer being told. That is what lets four templates differ in
 * structure rather than only in colour.
 *
 * Server-safe on purpose (no React, no 'use client'): the skeletons, the seed
 * script and the public resolver all need this vocabulary.
 */

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

/** Which column of a split section an element belongs to. */
export type Slot = 'lead' | 'aside'

export type LpElement = {
  id: string
  type: ElementType
  /** Absent means visible. Matches the section convention already in the data. */
  isVisible?: boolean
  slot?: Slot
  /** Content fields, per the element's spec. Everything not reserved above. */
  [field: string]: unknown
}

export type LpSection = {
  id: string
  type: SectionType
  isVisible?: boolean
  /** Role-based recolour. See TONES. */
  tone?: ToneId
  /** Free per-section colour overrides, layered over the tone. */
  colors?: { bg?: string; surface?: string; text?: string; accent?: string }
  /** Layout knobs, per the section's spec. */
  props?: Record<string, unknown>
  elements: LpElement[]
}

/** A section is in the node model when it carries an element list. */
export const isNodeSection = (s: unknown): s is LpSection =>
  Boolean(s) && typeof s === 'object' && Array.isArray((s as { elements?: unknown }).elements)

export const isVisible = (n: { isVisible?: boolean } | null | undefined): boolean =>
  Boolean(n) && n!.isVisible !== false

// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------

/**
 * Ids for nodes created by converting existing copy.
 *
 * Deterministic rather than random, because the conversion runs on every read
 * of a page that has not been re-saved yet. A random id would mint a new node
 * on every render, which breaks React reconciliation, breaks "the element I
 * had selected" in the builder, and would silently rewrite every id the first
 * time the page was saved.
 */
export const derivedId = (sectionId: string, key: string, index?: number): string =>
  index === undefined ? `${sectionId}~${key}` : `${sectionId}~${key}~${index}`

/**
 * Ids for nodes created by a person, in the builder.
 *
 * Random here is correct: two elements added a millisecond apart must not
 * collide, and there is no prior identity to preserve.
 */
export const newNodeId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// ---------------------------------------------------------------------------
// Tones
// ---------------------------------------------------------------------------

export type ToneId = 'default' | 'surface' | 'dark' | 'brand' | 'inverse'

/**
 * A section's ground, chosen by ROLE rather than by hex.
 *
 * Every one of these resolves to a colour out of the template's identity and
 * every text colour is then derived against whichever ground it produced, so
 * re-toning a section cannot make its copy unreadable. `dark` is what the
 * alternating dark and light bands in skeletons A, C and D are built from.
 */
export const TONES: Array<{ id: ToneId; label: string; desc: string }> = [
  { id: 'default', label: 'Page', desc: 'The page ground' },
  { id: 'surface', label: 'Card', desc: 'One step off the page' },
  { id: 'dark', label: 'Dark', desc: "The identity's dark ground" },
  { id: 'brand', label: 'Brand', desc: 'Filled with the brand colour' },
  { id: 'inverse', label: 'Inverted', desc: 'Flipped light or dark' },
]

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

export type ElementType =
  | 'eyebrow'
  | 'heading'
  | 'text'
  | 'note'
  | 'pill'
  | 'button'
  | 'phone'
  | 'form'
  | 'stat'
  | 'figure'
  | 'check'
  | 'bullet'
  | 'step'
  | 'card'
  | 'panel'
  | 'testimonial'
  | 'faq_item'
  | 'badge'
  | 'logo'
  | 'link'
  | 'ticker_item'
  | 'disclaimer'
  | 'divider'
  | 'image'

export type FieldKind = 'text' | 'textarea' | 'icon' | 'select' | 'number'

export type ElementField = {
  key: string
  label: string
  kind: FieldKind
  options?: Array<{ id: string; label: string }>
  placeholder?: string
}

/**
 * How several of the same element behave when they sit next to each other.
 *
 * `block` stacks full width. `grid` collects a run into a column grid, which is
 * what turns three `step` elements into a three-step row. `flow` wraps them
 * inline, which is what a pill row or a set of footer links is.
 */
export type ElementFlow = 'block' | 'grid' | 'flow'

export type ElementSpec = {
  type: ElementType
  name: string
  desc: string
  /** Lucide icon name for the builder tree. */
  icon: string
  flow: ElementFlow
  /** Columns for a run of these, when the section does not override it. */
  columns?: number
  fields: ElementField[]
  /** The field shown as the node's label in the builder tree. */
  titleField?: string
}

const ICON_FIELD: ElementField = { key: 'icon', label: 'Icon', kind: 'icon' }

export const ELEMENT_SPECS: Record<ElementType, ElementSpec> = {
  eyebrow: {
    type: 'eyebrow', name: 'Eyebrow', desc: 'Small label above a heading', icon: 'Tag',
    flow: 'block', titleField: 'text',
    fields: [{ key: 'text', label: 'Text', kind: 'text' }],
  },
  heading: {
    type: 'heading', name: 'Heading', desc: 'A headline, optionally two-tone', icon: 'Heading',
    flow: 'block', titleField: 'text',
    fields: [
      { key: 'text', label: 'Text', kind: 'textarea' },
      { key: 'accent', label: 'Accent phrase', kind: 'text', placeholder: 'A run inside the text, coloured' },
      {
        key: 'level', label: 'Size', kind: 'select',
        options: [{ id: '1', label: 'Page headline' }, { id: '2', label: 'Section heading' }, { id: '3', label: 'Sub heading' }],
      },
    ],
  },
  text: {
    type: 'text', name: 'Paragraph', desc: 'A block of copy', icon: 'AlignLeft',
    flow: 'block', titleField: 'text',
    fields: [{ key: 'text', label: 'Text', kind: 'textarea' }],
  },
  note: {
    type: 'note', name: 'Small print', desc: 'One quiet line', icon: 'Minus',
    flow: 'block', titleField: 'text',
    fields: [{ key: 'text', label: 'Text', kind: 'text' }],
  },
  pill: {
    type: 'pill', name: 'Pill', desc: 'A chip in a row of chips', icon: 'Circle',
    flow: 'flow', titleField: 'text',
    fields: [{ key: 'text', label: 'Text', kind: 'text' }, ICON_FIELD],
  },
  button: {
    type: 'button', name: 'Button', desc: 'A call to action', icon: 'MousePointerClick',
    flow: 'flow', titleField: 'label',
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'href', label: 'Link', kind: 'text', placeholder: 'Leave blank to scroll to the form' },
      {
        key: 'kind', label: 'Style', kind: 'select',
        options: [{ id: 'primary', label: 'Filled' }, { id: 'secondary', label: 'Outlined' }, { id: 'ghost', label: 'Text only' }],
      },
      ICON_FIELD,
    ],
  },
  phone: {
    type: 'phone', name: 'Phone', desc: "The brand's number, never typed in", icon: 'Phone',
    flow: 'flow', titleField: 'label',
    fields: [
      { key: 'label', label: 'Label above', kind: 'text' },
      { key: 'note', label: 'Note below', kind: 'text' },
      { key: 'kind', label: 'Size', kind: 'select', options: [{ id: 'inline', label: 'Inline' }, { id: 'large', label: 'Large' }] },
    ],
  },
  form: {
    type: 'form', name: 'Form', desc: 'The quiz that runs on the page', icon: 'ClipboardList',
    flow: 'block', titleField: 'label',
    fields: [
      { key: 'label', label: 'Card label', kind: 'text' },
      { key: 'note', label: 'Note under the form', kind: 'text' },
      {
        // Figure and ground. A form card that contrasts with its section is a
        // structural choice rather than a colour one, which is why a skeleton
        // can state it: it is what makes a pale card carry the eye on a dark
        // fold. Both sides are derived and verified, so neither can go unread.
        key: 'ground', label: 'Card ground', kind: 'select',
        options: [
          { id: 'match', label: 'Match the section' },
          { id: 'contrast', label: 'Opposite of the section' },
        ],
      },
    ],
  },
  stat: {
    type: 'stat', name: 'Stat', desc: 'A figure with a label', icon: 'Hash',
    flow: 'grid', columns: 3, titleField: 'value',
    fields: [{ key: 'value', label: 'Figure', kind: 'text' }, { key: 'label', label: 'Label', kind: 'text' }],
  },
  figure: {
    type: 'figure', name: 'Result card', desc: 'An amount with a name and place', icon: 'Trophy',
    flow: 'grid', columns: 3, titleField: 'value',
    fields: [
      { key: 'value', label: 'Amount', kind: 'text' },
      { key: 'title', label: 'Name', kind: 'text' },
      { key: 'meta', label: 'Place or case type', kind: 'text' },
    ],
  },
  check: {
    type: 'check', name: 'Tick line', desc: 'One line of a checklist', icon: 'Check',
    flow: 'grid', columns: 1, titleField: 'text',
    fields: [{ key: 'text', label: 'Text', kind: 'text' }],
  },
  bullet: {
    type: 'bullet', name: 'Icon bullet', desc: 'An icon, a line, a note', icon: 'Dot',
    flow: 'grid', columns: 1, titleField: 'text',
    fields: [
      { key: 'text', label: 'Text', kind: 'text' },
      { key: 'body', label: 'Note', kind: 'textarea' },
      ICON_FIELD,
    ],
  },
  step: {
    type: 'step', name: 'Step', desc: 'One step of a process, numbered by position', icon: 'ListOrdered',
    flow: 'grid', columns: 3, titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'body', label: 'Description', kind: 'textarea' },
      ICON_FIELD,
    ],
  },
  card: {
    type: 'card', name: 'Card', desc: 'A titled block in a row of them', icon: 'Square',
    flow: 'grid', columns: 3, titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'body', label: 'Body', kind: 'textarea' },
      ICON_FIELD,
    ],
  },
  panel: {
    type: 'panel', name: 'Inset panel', desc: 'A card that sits inside a section', icon: 'Frame',
    flow: 'block', titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'body', label: 'Body', kind: 'textarea' },
      { key: 'meta', label: 'Label above', kind: 'text' },
    ],
  },
  testimonial: {
    type: 'testimonial', name: 'Testimonial', desc: 'A quote with a name', icon: 'Quote',
    flow: 'grid', columns: 3, titleField: 'author',
    fields: [
      { key: 'quote', label: 'Quote', kind: 'textarea' },
      { key: 'author', label: 'Name', kind: 'text' },
      { key: 'meta', label: 'Place or date', kind: 'text' },
      { key: 'rating', label: 'Stars', kind: 'number', placeholder: '0 to 5' },
    ],
  },
  faq_item: {
    type: 'faq_item', name: 'Question', desc: 'One question and its answer', icon: 'HelpCircle',
    flow: 'grid', columns: 1, titleField: 'q',
    fields: [
      { key: 'q', label: 'Question', kind: 'text' },
      { key: 'a', label: 'Answer', kind: 'textarea' },
    ],
  },
  badge: {
    type: 'badge', name: 'Badge', desc: 'A credential chip', icon: 'Award',
    flow: 'flow', titleField: 'text',
    fields: [{ key: 'text', label: 'Text', kind: 'text' }, ICON_FIELD],
  },
  logo: {
    type: 'logo', name: 'Logo', desc: "The brand mark and name", icon: 'Gem',
    flow: 'flow', titleField: 'text',
    fields: [{ key: 'text', label: 'Override the name', kind: 'text', placeholder: 'Blank uses the brand' }],
  },
  link: {
    type: 'link', name: 'Link', desc: 'One link in a row of them', icon: 'Link',
    flow: 'flow', titleField: 'label',
    fields: [{ key: 'label', label: 'Label', kind: 'text' }, { key: 'href', label: 'Link', kind: 'text' }],
  },
  ticker_item: {
    type: 'ticker_item', name: 'Ticker item', desc: 'A place and an amount', icon: 'Activity',
    flow: 'flow', titleField: 'text',
    fields: [{ key: 'text', label: 'Place', kind: 'text' }, { key: 'value', label: 'Amount', kind: 'text' }],
  },
  disclaimer: {
    type: 'disclaimer', name: 'Disclaimer', desc: 'The long legal paragraph', icon: 'FileText',
    flow: 'block', titleField: 'text',
    fields: [{ key: 'text', label: 'Text', kind: 'textarea' }],
  },
  divider: {
    type: 'divider', name: 'Rule', desc: 'A hairline across the section', icon: 'SeparatorHorizontal',
    flow: 'block',
    fields: [],
  },
  image: {
    type: 'image', name: 'Image', desc: 'A picture', icon: 'Image',
    flow: 'block', titleField: 'alt',
    fields: [
      { key: 'src', label: 'Image URL', kind: 'text' },
      { key: 'alt', label: 'Alt text', kind: 'text' },
    ],
  },
}

export const ELEMENT_TYPES = Object.keys(ELEMENT_SPECS) as ElementType[]

export const elementSpec = (type: string): ElementSpec | null =>
  (ELEMENT_SPECS as Record<string, ElementSpec | undefined>)[type] ?? null

// ---------------------------------------------------------------------------
// Section vocabulary
// ---------------------------------------------------------------------------

export type SectionType = 'header' | 'hero' | 'band' | 'strip' | 'cta' | 'footer'

export type SectionSpec = {
  type: SectionType
  name: string
  desc: string
  icon: string
  /** Layout knobs offered in the section editor. */
  props: ElementField[]
  /** Element types offered first when adding to this section. */
  suggests: ElementType[]
  /** Whether the aside slot draws a second column here. */
  splits: boolean
}

const TONE_FIELD: ElementField = {
  key: 'tone', label: 'Ground', kind: 'select',
  options: TONES.map((t) => ({ id: t.id, label: t.label })),
}

const ALIGN_FIELD: ElementField = {
  key: 'align', label: 'Alignment', kind: 'select',
  options: [{ id: 'left', label: 'Left' }, { id: 'center', label: 'Centred' }],
}

export const SECTION_SPECS: Record<SectionType, SectionSpec> = {
  header: {
    type: 'header', name: 'Header', desc: 'The bar across the top', icon: 'Layers', splits: false,
    props: [
      { key: 'sticky', label: 'Sticks to the top', kind: 'select', options: [{ id: 'no', label: 'No' }, { id: 'yes', label: 'Yes' }] },
    ],
    suggests: ['logo', 'link', 'phone', 'button'],
  },
  hero: {
    type: 'hero', name: 'Hero', desc: 'The first screen, with the form', icon: 'Rocket', splits: true,
    props: [
      {
        key: 'variant', label: 'Layout', kind: 'select',
        options: [
          { id: 'split', label: 'Copy left, form right' },
          { id: 'centered', label: 'Copy above a centred form' },
          { id: 'stacked', label: 'Copy above a full-width form' },
        ],
      },
      ALIGN_FIELD,
    ],
    suggests: ['eyebrow', 'heading', 'text', 'form', 'pill', 'stat', 'check', 'button'],
  },
  band: {
    type: 'band', name: 'Band', desc: 'A section of the page. Its shape follows what is in it.', icon: 'Rows3', splits: true,
    props: [
      ALIGN_FIELD,
      { key: 'columns', label: 'Columns', kind: 'select', options: [{ id: '', label: 'Automatic' }, { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }, { id: '4', label: '4' }] },
      { key: 'connector', label: 'Rule between steps', kind: 'select', options: [{ id: 'no', label: 'No' }, { id: 'yes', label: 'Yes' }] },
      { key: 'reverse', label: 'Second column first', kind: 'select', options: [{ id: 'no', label: 'No' }, { id: 'yes', label: 'Yes' }] },
      { key: 'flat', label: 'Cards without a border', kind: 'select', options: [{ id: 'no', label: 'No' }, { id: 'yes', label: 'Yes' }] },
    ],
    suggests: ['heading', 'text', 'step', 'card', 'figure', 'check', 'bullet', 'testimonial', 'faq_item', 'stat', 'panel', 'button'],
  },
  strip: {
    type: 'strip', name: 'Strip', desc: 'A thin full-width bar', icon: 'Minus', splits: false,
    props: [ALIGN_FIELD],
    suggests: ['pill', 'badge', 'ticker_item', 'text', 'phone', 'check'],
  },
  cta: {
    type: 'cta', name: 'Closing CTA', desc: 'The last ask', icon: 'Megaphone', splits: false,
    props: [
      ALIGN_FIELD,
      { key: 'boxed', label: 'Inside a box', kind: 'select', options: [{ id: 'no', label: 'No' }, { id: 'yes', label: 'Yes' }] },
    ],
    suggests: ['heading', 'text', 'button', 'phone', 'note'],
  },
  footer: {
    type: 'footer', name: 'Footer', desc: 'Links, legal text, copyright', icon: 'FileText', splits: false,
    props: [],
    suggests: ['logo', 'link', 'disclaimer', 'note', 'phone'],
  },
}

/** The tone selector belongs to every section, so it is appended rather than repeated. */
export const sectionPropFields = (type: string): ElementField[] => {
  const spec = (SECTION_SPECS as Record<string, SectionSpec | undefined>)[type]
  return spec ? [TONE_FIELD, ...spec.props] : [TONE_FIELD]
}

export const SECTION_TYPES = Object.keys(SECTION_SPECS) as SectionType[]

export const sectionSpec = (type: string): SectionSpec | null =>
  (SECTION_SPECS as Record<string, SectionSpec | undefined>)[type] ?? null

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

export type RenderGroup =
  | { kind: 'single'; element: LpElement }
  | { kind: 'grid'; type: ElementType; columns: number; elements: LpElement[] }
  | { kind: 'flow'; type: ElementType; elements: LpElement[] }

/**
 * Collect a slot's elements into the rows the section will actually draw.
 *
 * This is the whole reason a section does not need to know what it is about. A
 * run of the same repeating type becomes one row; anything else stands alone.
 * Adding a fourth card to a three-card row is therefore a data change, not a
 * renderer change, and a section can hold two different rows without a new
 * section type being invented for the combination.
 */
export const groupElements = (elements: LpElement[], columnsOverride?: number): RenderGroup[] => {
  const out: RenderGroup[] = []
  for (const el of elements) {
    const spec = elementSpec(el.type)
    if (!spec || spec.flow === 'block') {
      out.push({ kind: 'single', element: el })
      continue
    }
    const last = out[out.length - 1]
    if (spec.flow === 'grid') {
      if (last && last.kind === 'grid' && last.type === el.type) last.elements.push(el)
      else out.push({ kind: 'grid', type: el.type, columns: columnsOverride || spec.columns || 3, elements: [el] })
      continue
    }
    if (last && last.kind === 'flow' && last.type === el.type) last.elements.push(el)
    else out.push({ kind: 'flow', type: el.type, elements: [el] })
  }
  // A run shorter than its default column count should fill the row it has,
  // not leave a gap where the missing cards would be.
  for (const g of out) if (g.kind === 'grid') g.columns = Math.min(g.columns, g.elements.length)
  return out
}

// ---------------------------------------------------------------------------
// Emptiness
// ---------------------------------------------------------------------------

/**
 * Whether an element has anything to say.
 *
 * A skeleton ships with no copy at all, which means an unfilled element is the
 * normal state rather than an error. The builder draws those as placeholders so
 * they can be seen and clicked; the public page skips them, because a visitor
 * seeing an empty card is a bug and an operator seeing one is the point.
 */
export const isEmptyElement = (el: LpElement): boolean => {
  const spec = elementSpec(el.type)
  if (!spec) return true
  // These draw something regardless: a rule is a rule, a form is a form, and a
  // logo and a phone number both come from the brand rather than from copy.
  if (el.type === 'divider' || el.type === 'form' || el.type === 'logo' || el.type === 'phone') return false
  // Only COPY fields count. A skeleton sets structural values - a heading's
  // level, a button's role - and counting those as content made every empty
  // node in a fresh skeleton look filled, so it rendered as an invisible
  // heading and a button with no label instead of as a placeholder.
  const copy = spec.fields.filter((f) => f.kind === 'text' || f.kind === 'textarea')
  if (copy.length === 0) return false
  return !copy.some((f) => {
    const v = el[f.key]
    return typeof v === 'string' && v.trim().length > 0
  })
}

/** The label a node shows in the builder tree. */
export const elementLabel = (el: LpElement): string => {
  const spec = elementSpec(el.type)
  if (!spec) return el.type
  const raw = spec.titleField ? el[spec.titleField] : undefined
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (!text) return spec.name
  return text.length > 34 ? `${text.slice(0, 34)}...` : text
}

export const sectionLabel = (section: LpSection): string => {
  const spec = sectionSpec(section.type)
  const base = spec ? spec.name : section.type
  // A page can hold several bands, so the band names itself after its heading
  // rather than reading "Band, Band, Band" down the tree.
  const heading = section.elements.find((e) => e.type === 'heading' && typeof e.text === 'string' && (e.text as string).trim())
  if (!heading) return base
  const text = (heading.text as string).trim()
  return text.length > 30 ? `${base}: ${text.slice(0, 30)}...` : `${base}: ${text}`
}

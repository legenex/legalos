/**
 * Convert a landing page written in the old copy-keyed shape into nodes.
 *
 * Landing pages and deployments already exist in the database, holding sections
 * like `{ type: 'how_it_works', copy: { headline, steps: [...] } }`. Those must
 * keep rendering, so nothing is rewritten in place: the conversion runs on read,
 * every time, and the page is only stored as nodes once someone saves it. A page
 * nobody touches keeps working forever without a migration having run.
 *
 * That makes determinism a correctness requirement rather than a nicety. Ids are
 * derived from the section id and the field they came from, so the same stored
 * page produces byte-identical nodes on every render. A random id here would
 * remount every node on each pass, lose the builder's selection, and rewrite the
 * whole tree the first time the page was saved.
 *
 * The mapping also has to decide what the old renderers were doing implicitly.
 * They alternated ground colours by section type - authority on the card
 * colour, story on the page colour - which was baked into thirteen components.
 * Those grounds are now explicit tones, so a converted page looks like it did
 * and can then be re-toned like any other.
 */

import {
  derivedId,
  type LpElement,
  type LpSection,
  type ToneId,
} from './model'

type LegacySection = {
  id?: unknown
  type?: unknown
  isVisible?: unknown
  tone?: unknown
  colors?: unknown
  copy?: unknown
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const rec = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})

/** The ground each old section type painted itself, now stated rather than implied. */
const LEGACY_TONE: Record<string, ToneId> = {
  header: 'default',
  hero: 'default',
  ticker: 'surface',
  authority: 'surface',
  story: 'default',
  eligibility: 'surface',
  how_it_works: 'default',
  settlements: 'surface',
  testimonials: 'default',
  guarantee: 'brand',
  faq: 'surface',
  final_cta: 'default',
  footer: 'surface',
}

/**
 * Build one element, dropping it when the source field was empty.
 *
 * Returning null rather than an empty node matters: a converted page should
 * carry the nodes it has copy for, not thirteen sections of blank placeholders
 * that an operator then has to delete one at a time.
 */
const el = (
  sectionId: string,
  key: string,
  type: LpElement['type'],
  fields: Record<string, unknown>,
  index?: number,
): LpElement | null => {
  const hasContent = Object.values(fields).some((v) => (typeof v === 'string' ? v.trim() !== '' : v != null))
  if (!hasContent) return null
  // Explicit keys last: `fields` carries an index signature, so spreading it
  // over `id` and `type` would widen them and let a stray key overwrite an id.
  return { ...fields, id: derivedId(sectionId, key, index), type }
}

const compact = (items: Array<LpElement | null>): LpElement[] => items.filter((x): x is LpElement => x !== null)

/** Eyebrow, heading, subhead - the opening three that nearly every old section had. */
const headBlock = (id: string, c: Record<string, unknown>, subKey = 'subhead'): Array<LpElement | null> => [
  el(id, 'eyebrow', 'eyebrow', { text: str(c.eyebrow) }),
  el(id, 'heading', 'heading', { text: str(c.headline), accent: str(c.accent_phrase), level: '2' }),
  el(id, 'sub', 'text', { text: str(c[subKey]) }),
]

const convertOne = (legacy: LegacySection): LpSection => {
  const id = str(legacy.id) || derivedId('sec', String(legacy.type ?? 'unknown'))
  const type = str(legacy.type)
  const c = rec(legacy.copy)
  const base = {
    id,
    isVisible: legacy.isVisible === false ? false : undefined,
    tone: (str(legacy.tone) || LEGACY_TONE[type] || 'default') as ToneId,
    colors: legacy.colors as LpSection['colors'],
  }

  switch (type) {
    case 'header':
      return {
        ...base, type: 'header', props: {},
        elements: compact([
          el(id, 'logo', 'logo', { text: str(c.logoText) }) ?? { id: derivedId(id, 'logo'), type: 'logo' },
          el(id, 'cta', 'button', { label: str(c.ctaLabel), kind: 'primary', icon: 'Phone' }),
        ]),
      }

    case 'hero':
      return {
        ...base, type: 'hero', props: { variant: 'split' },
        elements: compact([
          el(id, 'eyebrow', 'eyebrow', { text: str(c.eyebrow) }),
          el(id, 'heading', 'heading', { text: str(c.headline), accent: str(c.accent_phrase), level: '1' }),
          el(id, 'sub', 'text', { text: str(c.subheadline) }),
          ...['1', '2', '3'].map((n, i) =>
            el(id, 'stat', 'stat', { value: str(c[`stat${n}_num`]), label: str(c[`stat${n}_label`]) }, i),
          ),
          el(id, 'trust', 'bullet', { text: str(c.trust_line), icon: 'ShieldCheck' }),
          { id: derivedId(id, 'form'), type: 'form', slot: 'aside', label: '' },
        ]),
      }

    case 'ticker':
      return {
        ...base, type: 'strip', props: { align: 'left' },
        elements: compact([
          el(id, 'eyebrow', 'eyebrow', { text: str(c.eyebrow) }),
          ...arr(c.items).map((raw, i) => {
            const it = rec(raw)
            return el(id, 'item', 'ticker_item', { text: str(it.location), value: str(it.amount) }, i)
          }),
        ]),
      }

    case 'authority':
      return {
        ...base, type: 'band', props: { align: 'center' },
        elements: compact([
          ...headBlock(id, c),
          ...arr(c.badges).map((b, i) => el(id, 'badge', 'badge', { text: str(b), icon: 'Scale' }, i)),
        ]),
      }

    case 'story':
      return {
        ...base, type: 'band', props: { align: 'left' },
        elements: compact([
          el(id, 'eyebrow', 'eyebrow', { text: str(c.eyebrow) }),
          el(id, 'heading', 'heading', { text: str(c.headline), level: '2' }),
          ...arr(c.paragraphs).map((p, i) => el(id, 'para', 'text', { text: str(p) }, i)),
        ]),
      }

    case 'eligibility':
      return {
        ...base, type: 'band', props: { align: 'center' },
        elements: compact([
          el(id, 'eyebrow', 'eyebrow', { text: str(c.eyebrow) }),
          el(id, 'heading', 'heading', { text: str(c.headline), level: '2' }),
          ...arr(c.criteria).map((cr, i) => el(id, 'check', 'check', { text: str(cr) }, i)),
        ]),
      }

    case 'how_it_works':
      return {
        ...base, type: 'band', props: { align: 'center' },
        elements: compact([
          el(id, 'eyebrow', 'eyebrow', { text: str(c.eyebrow) }),
          el(id, 'heading', 'heading', { text: str(c.headline), level: '2' }),
          ...arr(c.steps).map((raw, i) => {
            const it = rec(raw)
            return el(id, 'step', 'step', { title: str(it.title), body: str(it.desc) }, i)
          }),
        ]),
      }

    case 'settlements':
      return {
        ...base, type: 'band', props: { align: 'center' },
        elements: compact([
          el(id, 'eyebrow', 'eyebrow', { text: str(c.eyebrow) }),
          el(id, 'heading', 'heading', { text: str(c.headline), level: '2' }),
          ...arr(c.items).map((raw, i) => {
            const it = rec(raw)
            return el(id, 'figure', 'figure', { value: str(it.amount), title: str(it.case_type), meta: str(it.location) }, i)
          }),
        ]),
      }

    case 'testimonials':
      return {
        ...base, type: 'band', props: { align: 'center' },
        elements: compact([
          el(id, 'eyebrow', 'eyebrow', { text: str(c.eyebrow) }),
          el(id, 'heading', 'heading', { text: str(c.headline), level: '2' }),
          ...arr(c.items).map((raw, i) => {
            const it = rec(raw)
            return el(id, 'quote', 'testimonial', { quote: str(it.quote), author: str(it.author), meta: str(it.location), rating: 5 }, i)
          }),
        ]),
      }

    case 'guarantee':
      // The only old section that was genuinely two columns: copy on the left,
      // the risk-reversal lines on the right. That is what the aside slot is.
      return {
        ...base, type: 'band', props: { align: 'left' },
        elements: compact([
          el(id, 'heading', 'heading', { text: str(c.headline), level: '2', icon: 'ShieldCheck' }),
          el(id, 'sub', 'text', { text: str(c.subhead) }),
          ...arr(c.lines).map((l, i) => el(id, 'line', 'check', { text: str(l) }, i)),
        ]).map((e) => (e.type === 'check' ? { ...e, slot: 'aside' as const } : e)),
      }

    case 'faq':
      return {
        ...base, type: 'band', props: { align: 'center' },
        elements: compact([
          el(id, 'eyebrow', 'eyebrow', { text: str(c.eyebrow) }),
          el(id, 'heading', 'heading', { text: str(c.headline), level: '2' }),
          ...arr(c.items).map((raw, i) => {
            const it = rec(raw)
            return el(id, 'faq', 'faq_item', { q: str(it.q), a: str(it.a) }, i)
          }),
        ]),
      }

    case 'final_cta':
      return {
        ...base, type: 'cta', props: { align: 'center', boxed: 'no' },
        elements: compact([
          el(id, 'heading', 'heading', { text: str(c.headline), level: '2' }),
          el(id, 'cta', 'button', { label: str(c.cta_label), kind: 'primary', icon: 'ArrowRight' }),
          el(id, 'note', 'note', { text: str(c.secondary_line) }),
        ]),
      }

    case 'footer':
      return {
        ...base, type: 'footer', props: {},
        elements: compact([
          el(id, 'tagline', 'text', { text: str(c.tagline) }),
          ...arr(c.links).map((l, i) => el(id, 'link', 'link', { label: str(l), href: '' }, i)),
          el(id, 'tcpa', 'disclaimer', { text: str(c.tcpa_text) }),
        ]),
      }

    default:
      // An unknown type still becomes a section rather than disappearing. Every
      // string in its copy is preserved as a paragraph, so nothing an operator
      // wrote is lost to a type this build does not recognise.
      return {
        ...base, type: 'band', props: { align: 'left' },
        elements: compact(
          Object.entries(c)
            .filter(([, v]) => typeof v === 'string' && v.trim())
            .map(([k, v], i) => el(id, `f-${k}`, 'text', { text: str(v) }, i)),
        ),
      }
  }
}

/**
 * Normalise a stored sections array to nodes.
 *
 * Mixed input is expected and fine: a page half-edited in the new builder has
 * node sections next to converted ones, and both go through here.
 */
export const toNodeSections = (sections: unknown): LpSection[] => {
  if (!Array.isArray(sections)) return []
  return sections.map((s) => {
    const legacy = (s ?? {}) as LegacySection
    if (Array.isArray(legacy && (legacy as { elements?: unknown }).elements)) {
      const node = legacy as unknown as LpSection
      // Trust but tidy: elements missing an id would collide as React keys and
      // could not be selected in the builder.
      return {
        ...node,
        elements: node.elements
          .filter(Boolean)
          .map((e, i) => (e.id ? e : { ...e, id: derivedId(node.id, 'el', i) })),
      }
    }
    return convertOne(legacy)
  })
}

// Best-effort mapper from Payload `body_blocks` (the legacy Pages content
// shape) into the Landing-Page builder `sections` shape. Used the first time
// a Page is opened in the LP-style builder so the editor isn't empty.
//
// The two schemas overlap but aren't identical: LP has tighter copy fields
// (hero.headline + accent_phrase, etc.) while body_blocks has a wider set of
// block types (cta, image, embed, lead_form, ...). Where overlap is clear,
// we map the fields directly. Block types without a clean LP equivalent are
// dropped and reported via the second return value so the caller can warn
// the user. Nothing is mutated — body_blocks stays intact on the row.

type Block = Record<string, unknown> & { blockType?: string }
type LPSection = { id: string; type: string; isVisible: boolean; copy: Record<string, unknown> }

const genId = (p: string): string =>
  `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)

const paragraphsFromMarkdown = (md: string): string[] => {
  const trimmed = (md || '').trim()
  if (!trimmed) return []
  return trimmed
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

const mapHero = (b: Block): LPSection => ({
  id: genId('sec'),
  type: 'hero',
  isVisible: true,
  copy: {
    eyebrow: str(b.eyebrow),
    headline: str(b.heading),
    accent_phrase: '',
    subheadline: str(b.sub),
    stat1_num: '', stat1_label: '',
    stat2_num: '', stat2_label: '',
    stat3_num: '', stat3_label: '',
    trust_line: '',
  },
})

const mapNavHeader = (b: Block): LPSection => {
  const ctaLabel = str(b.cta_label, 'Call {{brand.callNumber}}')
  return {
    id: genId('sec'),
    type: 'header',
    isVisible: true,
    copy: { logoText: '{{brand.logoText}}', ctaLabel },
  }
}

const mapTrustStrip = (b: Block): LPSection => {
  const items = Array.isArray(b.items) ? (b.items as Array<Record<string, unknown>>) : []
  return {
    id: genId('sec'),
    type: 'authority',
    isVisible: true,
    copy: {
      eyebrow: '',
      headline: '',
      subhead: '',
      badges: items.map((it) => str(it.value) || str(it.label)).filter(Boolean),
    },
  }
}

const mapProse = (b: Block): LPSection => ({
  id: genId('sec'),
  type: 'story',
  isVisible: true,
  copy: {
    eyebrow: '',
    headline: '',
    paragraphs: paragraphsFromMarkdown(str(b.markdown)),
  },
})

const mapBulletList = (b: Block): LPSection => {
  const items = Array.isArray(b.items) ? (b.items as Array<Record<string, unknown>>) : []
  return {
    id: genId('sec'),
    type: 'eligibility',
    isVisible: true,
    copy: {
      eyebrow: '',
      headline: str(b.heading),
      criteria: items.map((it) => str(it.item)).filter(Boolean),
    },
  }
}

const mapHowItWorks = (b: Block): LPSection => {
  const steps = Array.isArray(b.steps) ? (b.steps as Array<Record<string, unknown>>) : []
  return {
    id: genId('sec'),
    type: 'how_it_works',
    isVisible: true,
    copy: {
      eyebrow: str(b.eyebrow),
      headline: str(b.heading),
      steps: steps.map((s) => ({ title: str(s.title), desc: str(s.description) })),
    },
  }
}

const mapRecentWins = (b: Block): LPSection => {
  const items = Array.isArray(b.items) ? (b.items as Array<Record<string, unknown>>) : []
  return {
    id: genId('sec'),
    type: 'settlements',
    isVisible: true,
    copy: {
      eyebrow: str(b.eyebrow),
      headline: str(b.heading),
      items: items.map((it) => ({
        case_type: str(it.case_type),
        amount: str(it.amount),
        location: '',
      })),
    },
  }
}

const mapTestimonials = (b: Block): LPSection => {
  const items = Array.isArray(b.items) ? (b.items as Array<Record<string, unknown>>) : []
  return {
    id: genId('sec'),
    type: 'testimonials',
    isVisible: true,
    copy: {
      eyebrow: '',
      headline: str(b.heading),
      items: items.map((it) => ({
        quote: str(it.quote),
        author: str(it.attribution),
        location: '',
      })),
    },
  }
}

const mapDisclosure = (b: Block): LPSection => {
  const lines = paragraphsFromMarkdown(str(b.markdown))
  return {
    id: genId('sec'),
    type: 'guarantee',
    isVisible: true,
    copy: {
      headline: lines[0] || 'Disclosure',
      subhead: '',
      lines: lines.slice(1),
    },
  }
}

const mapFaq = (b: Block): LPSection => {
  const items = Array.isArray(b.items) ? (b.items as Array<Record<string, unknown>>) : []
  return {
    id: genId('sec'),
    type: 'faq',
    isVisible: true,
    copy: {
      eyebrow: '',
      headline: str(b.heading),
      items: items.map((it) => ({ q: str(it.question), a: str(it.answer) })),
    },
  }
}

const mapFinalCta = (b: Block): LPSection => ({
  id: genId('sec'),
  type: 'final_cta',
  isVisible: true,
  copy: {
    headline: str(b.heading),
    cta_label: str(b.primary_cta_label, 'Get started'),
    secondary_line: b.show_phone === false ? '' : 'Or call {{brand.callNumber}} · Available 24/7',
  },
})

const mapSiteFooter = (b: Block): LPSection => {
  const columns = Array.isArray(b.columns) ? (b.columns as Array<Record<string, unknown>>) : []
  const links: string[] = []
  for (const col of columns) {
    const colLinks = Array.isArray(col.links) ? (col.links as Array<Record<string, unknown>>) : []
    for (const l of colLinks) {
      const label = str(l.label)
      if (label) links.push(label)
    }
  }
  return {
    id: genId('sec'),
    type: 'footer',
    isVisible: true,
    copy: {
      tagline: '{{brand.logoText}}',
      links,
      tcpa_text: str(b.legal_md, '{{brand.disclaimer}}'),
    },
  }
}

const MAPPERS: Record<string, (b: Block) => LPSection> = {
  hero: mapHero,
  nav_header: mapNavHeader,
  trust_strip: mapTrustStrip,
  prose: mapProse,
  bullet_list: mapBulletList,
  how_it_works: mapHowItWorks,
  recent_wins: mapRecentWins,
  testimonials: mapTestimonials,
  disclosure: mapDisclosure,
  faq: mapFaq,
  final_cta: mapFinalCta,
  site_footer: mapSiteFooter,
}

export type ImportResult = {
  sections: LPSection[]
  // blockTypes the import did not know how to translate. Surface this to the
  // user so they can re-add equivalents manually if they cared about them.
  droppedTypes: string[]
}

export function bodyBlocksToLPSections(blocks: Block[] | undefined | null): ImportResult {
  if (!Array.isArray(blocks) || blocks.length === 0) return { sections: [], droppedTypes: [] }
  const sections: LPSection[] = []
  const dropped: string[] = []
  for (const b of blocks) {
    const t = str(b.blockType)
    const map = MAPPERS[t]
    if (map) sections.push(map(b))
    else if (t) dropped.push(t)
  }
  return { sections, droppedTypes: dropped }
}

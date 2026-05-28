import { z } from 'zod'

// Per-blockType Zod schemas used by every AI call that emits a body_blocks
// payload (page clone from URL, per-section rewrite, generate-from-prompt).
// Centralised so the model contract stays in sync with src/collections/Pages.ts
// block schemas and src/components/blocks/BlockRenderer.tsx field reads. When
// a renderer learns a new field, add it here AND in Pages.ts at the same time.

export const HeroSchema = z.object({
  blockType: z.literal('hero'),
  eyebrow: z.string().optional(),
  heading: z.string().default(''),
  sub: z.string().optional(),
  primary_cta_label: z.string().optional(),
  primary_cta_href: z.string().optional(),
  secondary_cta_label: z.string().optional(),
  secondary_cta_href: z.string().optional(),
  image_url: z.string().optional(),
})

export const NavHeaderSchema = z.object({
  blockType: z.literal('nav_header'),
  links: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
  cta_label: z.string().optional(),
  cta_href: z.string().optional(),
  show_phone: z.boolean().optional(),
})

// trust_strip items: accept either a {value, label?} object OR a bare string
// (the model often returns a flat string list for short badge text). The
// preprocess step normalises strings into the canonical {value} shape so the
// rest of the system always sees objects.
const trustStripItem = z.preprocess(
  (v) => (typeof v === 'string' ? { value: v } : v),
  z.object({ value: z.string().default(''), label: z.string().optional() }),
)
export const TrustStripSchema = z.object({
  blockType: z.literal('trust_strip'),
  items: z.array(trustStripItem),
})

export const ProseSchema = z.object({
  blockType: z.literal('prose'),
  // markdown is required by the Pages collection but the model often omits
  // it for sections that don't fit the other block types. Default to '' here
  // so the discriminated union accepts the response; the action drops empty
  // prose blocks before persisting.
  markdown: z.string().default(''),
})

export const CtaSchema = z.object({
  blockType: z.literal('cta'),
  heading: z.string().default(''),
  sub: z.string().optional(),
  label: z.string().default(''),
  href: z.string().default('#'),
})

// Bullet items: accept {item} OR a bare string. Same coerce pattern as
// trust_strip — keeps the model honest while letting the natural string-list
// shape land cleanly.
const bulletItem = z.preprocess(
  (v) => (typeof v === 'string' ? { item: v } : v),
  z.object({ item: z.string().default('') }),
)
export const BulletListSchema = z.object({
  blockType: z.literal('bullet_list'),
  heading: z.string().optional(),
  items: z.array(bulletItem),
})

// Every per-item canonical string field defaults to '' instead of being
// hard-required; normalizeAIBlocks() below drops items where the canonical
// text content is empty so the renderer doesn't have to handle them. The
// alternative — failing the whole AI call — was deleting the user's import.
export const CardsSchema = z.object({
  blockType: z.literal('cards'),
  heading: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string().default(''),
      body: z.string().optional(),
      icon: z.string().optional(),
    }),
  ),
})

export const StatsSchema = z.object({
  blockType: z.literal('stats'),
  heading: z.string().optional(),
  items: z.array(
    z.object({
      value: z.string().default(''),
      label: z.string().default(''),
    }),
  ),
})

export const TestimonialsSchema = z.object({
  blockType: z.literal('testimonials'),
  heading: z.string().optional(),
  items: z.array(
    z.object({
      quote: z.string().default(''),
      attribution: z.string().optional(),
      avatar_url: z.string().optional(),
    }),
  ),
})

export const FaqSchema = z.object({
  blockType: z.literal('faq'),
  heading: z.string().optional(),
  items: z.array(
    z.object({
      question: z.string().default(''),
      answer: z.string().default(''),
    }),
  ),
})

export const ServicesGridSchema = z.object({
  blockType: z.literal('services_grid'),
  eyebrow: z.string().optional(),
  heading: z.string().default(''),
  sub: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string().default(''),
      description: z.string().optional(),
      icon: z.string().optional(),
    }),
  ),
})

export const HowItWorksSchema = z.object({
  blockType: z.literal('how_it_works'),
  eyebrow: z.string().optional(),
  heading: z.string().default(''),
  sub: z.string().optional(),
  steps: z.array(
    z.object({
      title: z.string().default(''),
      description: z.string().optional(),
    }),
  ),
})

export const RecentWinsSchema = z.object({
  blockType: z.literal('recent_wins'),
  eyebrow: z.string().optional(),
  heading: z.string().default(''),
  sub: z.string().optional(),
  items: z.array(
    z.object({
      amount: z.string().default(''),
      case_type: z.string().default(''),
      description: z.string().optional(),
    }),
  ),
  disclaimer: z.string().optional(),
})

export const FinalCtaSchema = z.object({
  blockType: z.literal('final_cta'),
  eyebrow: z.string().optional(),
  heading: z.string().default(''),
  sub: z.string().optional(),
  primary_cta_label: z.string().optional(),
  primary_cta_href: z.string().optional(),
  show_phone: z.boolean().optional(),
})

export const SiteFooterSchema = z.object({
  blockType: z.literal('site_footer'),
  columns: z
    .array(
      z.object({
        // Models routinely emit unlabelled footer columns (just a links
        // list). Default to '' here; the action below promotes a missing
        // heading to the first link's label so the footer still renders
        // sensibly.
        heading: z.string().default(''),
        links: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
      }),
    )
    .optional(),
  legal_md: z.string().optional(),
})

export const BlockSchema = z.discriminatedUnion('blockType', [
  HeroSchema,
  NavHeaderSchema,
  TrustStripSchema,
  ProseSchema,
  CtaSchema,
  BulletListSchema,
  CardsSchema,
  StatsSchema,
  TestimonialsSchema,
  FaqSchema,
  ServicesGridSchema,
  HowItWorksSchema,
  RecentWinsSchema,
  FinalCtaSchema,
  SiteFooterSchema,
])

// Schemas keyed by blockType so AI helpers can look up the constraint for a
// single block without re-deriving it from the discriminated union.
export const SCHEMA_FOR_BLOCK: Record<string, z.ZodTypeAny> = {
  hero: HeroSchema,
  nav_header: NavHeaderSchema,
  trust_strip: TrustStripSchema,
  prose: ProseSchema,
  cta: CtaSchema,
  bullet_list: BulletListSchema,
  cards: CardsSchema,
  stats: StatsSchema,
  testimonials: TestimonialsSchema,
  faq: FaqSchema,
  services_grid: ServicesGridSchema,
  how_it_works: HowItWorksSchema,
  recent_wins: RecentWinsSchema,
  final_cta: FinalCtaSchema,
  site_footer: SiteFooterSchema,
}

// Post-validation cleanup for AI-emitted body_blocks. The schemas above
// default every previously-required text field to '' so Zod doesn't reject
// the model's output mid-import. This pass turns those soft passes into
// rendered-quality data:
//
//  - prose with empty markdown -> drop
//  - site_footer columns with no heading -> synthesise from first link
//  - items / steps with empty canonical text -> drop
//  - blocks that end up with zero usable items after the drop -> drop
//
// The renderer then never has to defend against the empty cases.
const dropIfEmpty = <T extends Record<string, unknown>>(
  items: T[] | undefined,
  keyFor: (it: T) => string,
): T[] => (items ?? []).filter((it) => keyFor(it).trim() !== '')

export function normalizeAIBlocks(
  blocks: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  const dropEmptyItemsBlock = (b: Record<string, unknown>, items: unknown[]) => {
    if (items.length === 0) return // drop the whole block
    out.push({ ...b, ...(b.steps !== undefined ? { steps: items } : { items }) })
  }
  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue
    const t = b.blockType as string
    if (t === 'prose') {
      const md = String((b as { markdown?: string }).markdown ?? '').trim()
      if (!md) continue
      out.push({ ...b, markdown: md })
      continue
    }
    if (t === 'site_footer') {
      const cols = ((b as { columns?: Array<Record<string, unknown>> }).columns ?? []).map((c) => {
        const heading = String((c as { heading?: string }).heading ?? '').trim()
        if (heading) return c
        const links = (c.links as Array<{ label?: string }> | undefined) ?? []
        const fallback = links[0]?.label?.trim() || 'Links'
        return { ...c, heading: fallback }
      })
      out.push({ ...b, columns: cols })
      continue
    }
    if (t === 'trust_strip') {
      dropEmptyItemsBlock(b, dropIfEmpty(b.items as Array<{ value?: string }> | undefined, (it) => String(it.value ?? '')))
      continue
    }
    if (t === 'bullet_list') {
      dropEmptyItemsBlock(b, dropIfEmpty(b.items as Array<{ item?: string }> | undefined, (it) => String(it.item ?? '')))
      continue
    }
    if (t === 'testimonials') {
      dropEmptyItemsBlock(b, dropIfEmpty(b.items as Array<{ quote?: string }> | undefined, (it) => String(it.quote ?? '')))
      continue
    }
    if (t === 'faq') {
      dropEmptyItemsBlock(
        b,
        dropIfEmpty(
          b.items as Array<{ question?: string; answer?: string }> | undefined,
          (it) => `${it.question ?? ''}${it.answer ?? ''}`,
        ),
      )
      continue
    }
    if (t === 'cards' || t === 'services_grid') {
      dropEmptyItemsBlock(
        b,
        dropIfEmpty(
          b.items as Array<{ title?: string }> | undefined,
          (it) => String(it.title ?? ''),
        ),
      )
      continue
    }
    if (t === 'how_it_works') {
      dropEmptyItemsBlock(
        b,
        dropIfEmpty(
          b.steps as Array<{ title?: string }> | undefined,
          (it) => String(it.title ?? ''),
        ),
      )
      continue
    }
    if (t === 'recent_wins') {
      dropEmptyItemsBlock(
        b,
        dropIfEmpty(
          b.items as Array<{ amount?: string; case_type?: string }> | undefined,
          (it) => `${it.amount ?? ''}${it.case_type ?? ''}`,
        ),
      )
      continue
    }
    if (t === 'stats') {
      dropEmptyItemsBlock(
        b,
        dropIfEmpty(
          b.items as Array<{ value?: string; label?: string }> | undefined,
          (it) => `${it.value ?? ''}${it.label ?? ''}`,
        ),
      )
      continue
    }
    out.push(b)
  }
  return out
}

// One-line human-readable description per block type. Used to brief the model
// during generate-from-prompt and to render Pill labels in the builder.
export const BLOCK_HUMAN_DESC: Record<string, string> = {
  hero: 'Above-the-fold hero. Eyebrow pill, headline, sub, primary/secondary CTAs.',
  nav_header: 'Top nav bar with link list and primary CTA button.',
  trust_strip: 'Inline bar of short trust badges under the hero.',
  prose: 'Free-form markdown copy.',
  cta: 'Mid-page CTA box with heading, sub, and a single button.',
  bullet_list: 'Bulleted list of short items, e.g. eligibility criteria.',
  cards: 'Generic 2-up or 3-up cards with title, body, optional icon glyph.',
  stats: 'Row of stat values with labels.',
  testimonials: 'Client quotes with attribution. Multiple in a grid.',
  faq: 'Question/answer accordions.',
  services_grid: 'Practice areas / services as a card grid.',
  how_it_works: 'Numbered step-by-step process explainer.',
  recent_wins: 'Past case results — amount, case type, optional description.',
  final_cta: 'Closing CTA block at the end of the page.',
  site_footer: 'Footer with multiple link columns and legal markdown.',
}

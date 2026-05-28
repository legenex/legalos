import { z } from 'zod'

// Per-blockType Zod schemas used by every AI call that emits a body_blocks
// payload (page clone from URL, per-section rewrite, generate-from-prompt).
// Centralised so the model contract stays in sync with src/collections/Pages.ts
// block schemas and src/components/blocks/BlockRenderer.tsx field reads. When
// a renderer learns a new field, add it here AND in Pages.ts at the same time.

export const HeroSchema = z.object({
  blockType: z.literal('hero'),
  eyebrow: z.string().optional(),
  heading: z.string(),
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

export const TrustStripSchema = z.object({
  blockType: z.literal('trust_strip'),
  items: z.array(z.object({ value: z.string(), label: z.string().optional() })),
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
  heading: z.string(),
  sub: z.string().optional(),
  label: z.string(),
  href: z.string(),
})

export const BulletListSchema = z.object({
  blockType: z.literal('bullet_list'),
  heading: z.string().optional(),
  items: z.array(z.object({ item: z.string() })),
})

export const CardsSchema = z.object({
  blockType: z.literal('cards'),
  heading: z.string().optional(),
  items: z.array(z.object({ title: z.string(), body: z.string().optional(), icon: z.string().optional() })),
})

export const StatsSchema = z.object({
  blockType: z.literal('stats'),
  heading: z.string().optional(),
  items: z.array(z.object({ value: z.string(), label: z.string() })),
})

export const TestimonialsSchema = z.object({
  blockType: z.literal('testimonials'),
  heading: z.string().optional(),
  items: z.array(z.object({ quote: z.string(), attribution: z.string().optional(), avatar_url: z.string().optional() })),
})

export const FaqSchema = z.object({
  blockType: z.literal('faq'),
  heading: z.string().optional(),
  items: z.array(z.object({ question: z.string(), answer: z.string() })),
})

export const ServicesGridSchema = z.object({
  blockType: z.literal('services_grid'),
  eyebrow: z.string().optional(),
  heading: z.string(),
  sub: z.string().optional(),
  items: z.array(z.object({ title: z.string(), description: z.string().optional(), icon: z.string().optional() })),
})

export const HowItWorksSchema = z.object({
  blockType: z.literal('how_it_works'),
  eyebrow: z.string().optional(),
  heading: z.string(),
  sub: z.string().optional(),
  steps: z.array(z.object({ title: z.string(), description: z.string().optional() })),
})

export const RecentWinsSchema = z.object({
  blockType: z.literal('recent_wins'),
  eyebrow: z.string().optional(),
  heading: z.string(),
  sub: z.string().optional(),
  items: z.array(z.object({ amount: z.string(), case_type: z.string(), description: z.string().optional() })),
  disclaimer: z.string().optional(),
})

export const FinalCtaSchema = z.object({
  blockType: z.literal('final_cta'),
  eyebrow: z.string().optional(),
  heading: z.string(),
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

// Post-validation cleanup for AI-emitted body_blocks. The model routinely
// returns prose blocks with empty markdown (after the schema default kicks
// in) and site_footer columns with no heading. Drop the empty prose blocks
// outright and synthesise a column heading from its first link's label so
// the page renders sensibly. Other block types pass through unchanged.
export function normalizeAIBlocks(
  blocks: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
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

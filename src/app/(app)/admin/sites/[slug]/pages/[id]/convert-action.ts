'use server'

import { getCurrentUser } from '@/lib/auth'
import { detectBlockFromSectionHtml } from '@/lib/builder/html-to-structured-blocks'
import { normalizeAIBlocks } from '@/lib/builder/block-schemas'

// Run the same structural detectors used by the structured-fields import
// against a single custom_html block's HTML so the author can convert it
// to a field-editable structured block (hero, faq, services_grid, etc.)
// without re-importing the whole page.
//
// The conversion is pure detection — no AI, no schema validation surprises —
// and goes through the same normalizeAIBlocks() post-process that the
// import pipeline uses, so the returned block is safe to drop into
// body_blocks.
type Result =
  | { ok: true; detected: string; block: Record<string, unknown> }
  | { ok: false; error: string }

export async function detectStructuredFromHtml(args: { html: string }): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  if (!args.html || args.html.trim().length === 0) {
    return { ok: false, error: 'No HTML to analyse.' }
  }

  const result = detectBlockFromSectionHtml(args.html)
  if (!result.detected || !result.block) {
    return {
      ok: false,
      error:
        "Couldn't recognise this section as a known structured type (hero / nav_header / services_grid / how_it_works / cards / testimonials / faq / final_cta / site_footer / trust_strip). Leave it as custom_html or edit the markup so the structural cues are clearer.",
    }
  }

  // Pipe through the same normalize pass the AI import uses — drops empty
  // array items, synthesises footer column headings from their first link,
  // etc. — so the returned block lands cleanly in Payload's per-field
  // validation.
  const normalised = normalizeAIBlocks([result.block])[0] ?? result.block
  return { ok: true, detected: result.detected, block: normalised }
}

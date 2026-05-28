'use server'

import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { invokeLLM } from '@/lib/ai/invoke'
import { SCHEMA_FOR_BLOCK, BLOCK_HUMAN_DESC, BlockSchema } from '@/lib/builder/block-schemas'

// Per-section AI rewrite. The model is constrained to return the exact same
// blockType — so a hero rewrite stays a hero and can't smuggle in fields
// that don't belong. The retry + banned-vocab guards in invokeLLM apply.
//
// Stripping fields that aren't part of the canonical schema is intentional:
// the field list is the contract every renderer reads, and letting the
// model invent keys would create save errors downstream (Payload drops
// unknown columns silently, so the user would just lose their edits).
const RewriteResult = z.object({
  block: BlockSchema,
})

type Result = { ok: true; block: Record<string, unknown> } | { ok: false; error: string }

export async function rewriteSection(args: {
  block: Record<string, unknown> & { blockType?: string }
  instruction: string
}): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const blockType = (args.block?.blockType || '') as string
  if (!blockType) return { ok: false, error: 'block has no blockType' }
  const schemaForType = SCHEMA_FOR_BLOCK[blockType]
  if (!schemaForType) {
    return { ok: false, error: `No AI rewrite available for blockType "${blockType}" yet.` }
  }

  const instruction = (args.instruction || '').trim()
  if (!instruction) return { ok: false, error: 'Tell the AI what you want changed.' }

  // We carry the keys we DON'T want the model to touch separately and
  // re-attach them after generation — currently just `id` (used by the
  // builder for selection) and anything starting with an underscore.
  const carryKeys = ['id']
  const carry: Record<string, unknown> = {}
  for (const k of carryKeys) if (k in args.block) carry[k] = args.block[k]

  // Build a single-block schema response — easier than asking the model to
  // wrap in { block: ... }.
  try {
    const result = await invokeLLM({
      system: [
        `You rewrite one section of a marketing/legal landing page.`,
        `Return the SAME blockType you receive — do not change it.`,
        `Section description: ${BLOCK_HUMAN_DESC[blockType] ?? blockType}`,
        '',
        `Rules:`,
        `- Apply the user's instruction to the current copy. Keep everything that wasn't asked to change.`,
        `- Don't invent statistics, settlement amounts, attorney credentials, testimonial quotes, or law-firm names that aren't already in the source block.`,
        `- Stay within the same blockType's field set. Do not output unrelated fields.`,
        `- Don't use em-dashes, "vibes", "leverage", "synergy", or marketing fluff.`,
        `- If the instruction is impossible (e.g. "translate to Klingon") return the input block unchanged.`,
      ].join('\n'),
      user: [
        `Current block (JSON):`,
        JSON.stringify(args.block, null, 2),
        '',
        `Instruction: ${instruction}`,
      ].join('\n'),
      schema: schemaForType as never,
      schemaName: `${blockType}_rewrite`,
      maxTokens: 4096,
      enforceNoBannedVocab: true,
    })

    return { ok: true, block: { ...(result as Record<string, unknown>), ...carry } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'AI rewrite failed' }
  }
}

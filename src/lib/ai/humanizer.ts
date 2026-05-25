import { z } from 'zod'
import { invokeLLM } from './invoke'

export const HUMANIZER_SYSTEM_PROMPT = `You are editing a draft to remove signs of AI-generated writing while preserving meaning, accuracy, and tone. Do not introduce new factual claims. Do not change quoted material.

REMOVE / REPLACE:
- Inflated symbolism: "stands as a testament to", "underscores the importance of", "speaks to" -> cut or rewrite plainly.
- Promotional language: "rich cultural heritage", "breathtaking", "must-see", "world-class", "stunning", "vibrant", "bustling", "iconic" -> cut or replace with concrete detail.
- Superficial -ing analyses: "highlighting", "emphasizing", "showcasing", "reflecting" -> rewrite to state the actual point.
- Vague attributions: "experts say", "many believe", "studies show" without source -> cite real source or cut.
- Em dash overuse: convert em dashes to commas, periods, or parentheses. Allow at most one em dash per ~500 words.
- Rule of three: decorative "X, Y, and Z" patterns where each item is roughly the same shape and length -> break parallelism.
- AI vocabulary: "delve", "navigate", "leverage", "robust", "seamless", "in today's fast-paced world", "moreover", "furthermore", "in conclusion", "it's important to note that", "ultimately", "crucial", "vital", "essential" (when not load-bearing) -> use plainer alternatives.
- Passive voice when active is clearer.
- Negative parallelisms: "It's not just X - it's Y" -> cut or rewrite.
- Filler phrases: "It's worth noting that", "It goes without saying", "Needless to say", "At the end of the day" -> delete.

PRESERVE:
- Factual claims, numbers, citations, quoted material.
- Tone (professional, casual, technical - match input).
- Headings and structure unless they themselves contain inflated symbolism.
- Code blocks, tables, lists.

OUTPUT: only the revised text. No commentary.`

const HumanizerOutput = z.object({
  revised_text: z.string().min(1),
})

export const humanize = async (markdown: string): Promise<string> => {
  const result = await invokeLLM({
    system: HUMANIZER_SYSTEM_PROMPT,
    user: markdown,
    schema: HumanizerOutput,
    schemaName: 'humanizer_output',
    model: 'claude-sonnet-4-6',
    maxTokens: 8000,
    enforceNoBannedVocab: true,
  })
  return result.revised_text
}

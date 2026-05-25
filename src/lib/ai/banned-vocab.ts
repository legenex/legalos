// Banned AI vocabulary per the humanizer spec. Detector is run after every AI generation.
// Returns the list of matches found so callers can decide whether to retry or surface.

const BANNED_PHRASES = [
  'delve',
  'navigate',
  'leverage',
  'robust',
  'seamless',
  "in today's fast-paced world",
  'moreover',
  'furthermore',
  'in conclusion',
  "it's important to note that",
  'ultimately',
  'crucial',
  'vital',
  'essential',
  'rich cultural heritage',
  'breathtaking',
  'must-see',
  'world-class',
  'stunning',
  'vibrant',
  'bustling',
  'iconic',
  'stands as a testament to',
  'underscores the importance of',
  'speaks to',
  'highlighting',
  'emphasizing',
  'showcasing',
  'reflecting',
  "it's worth noting that",
  'it goes without saying',
  'needless to say',
  'at the end of the day',
]

const EM_DASH = '—'

export type BannedHit = { phrase: string; index: number }

export const findBannedVocab = (text: string): BannedHit[] => {
  const lower = text.toLowerCase()
  const hits: BannedHit[] = []
  for (const phrase of BANNED_PHRASES) {
    let from = 0
    while (true) {
      const i = lower.indexOf(phrase, from)
      if (i === -1) break
      const before = i > 0 ? lower[i - 1] : ' '
      const after = lower[i + phrase.length] ?? ' '
      const wordBefore = /[a-z0-9]/i.test(before)
      const wordAfter = /[a-z0-9]/i.test(after)
      if (!wordBefore && !wordAfter) hits.push({ phrase, index: i })
      from = i + phrase.length
    }
  }
  return hits
}

export const countEmDashes = (text: string): number => {
  let count = 0
  for (const ch of text) if (ch === EM_DASH) count += 1
  return count
}

export const hasBannedSignals = (text: string): { ok: boolean; reasons: string[] } => {
  const banned = findBannedVocab(text)
  const dashes = countEmDashes(text)
  const reasons: string[] = []
  if (banned.length > 0) reasons.push(`banned phrases: ${[...new Set(banned.map((b) => b.phrase))].join(', ')}`)
  if (dashes > Math.max(1, Math.floor(text.length / 2500))) reasons.push(`em dash overuse (${dashes})`)
  return { ok: reasons.length === 0, reasons }
}

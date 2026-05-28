// Page-builder lint. Pure functions, no React, no server. Used by the
// builder to render the 'Page health' card + section-row warning badges.
// Intentionally cheap so it can re-run on every blocks-state change without
// throttling.

export type LintSeverity = 'warning' | 'error'

export type LintIssue = {
  blockId?: string
  severity: LintSeverity
  category: 'a11y' | 'seo' | 'hierarchy' | 'contrast'
  message: string
}

type Block = Record<string, unknown> & {
  id?: string
  blockType?: string
}

// Maps each blockType to the heading level its main `heading` field renders
// as on the public site. Used by the heading-hierarchy lint. Blocks not in
// this map don't emit a top-level heading, or emit one only at the item
// level (which we treat as h3 below the section).
const BLOCK_HEADING_LEVEL: Record<string, 1 | 2 | 3> = {
  hero: 1,
  services_grid: 2,
  how_it_works: 2,
  cards: 2,
  recent_wins: 2,
  testimonials: 2,
  stats: 2,
  bullet_list: 2,
  cta: 2,
  final_cta: 2,
  faq: 2,
  video: 2,
  gallery: 2,
  logo_cloud: 2,
  trust_strip: 3,
}

const hasText = (v: unknown): boolean => typeof v === 'string' && v.trim() !== ''

const altLintForArrayItems = (items: unknown, blockId: string | undefined, label: string): LintIssue[] => {
  if (!Array.isArray(items)) return []
  const issues: LintIssue[] = []
  items.forEach((it, idx) => {
    if (!it || typeof it !== 'object') return
    const url = (it as { image_url?: string }).image_url
    const alt = (it as { alt?: string }).alt
    if (hasText(url) && !hasText(alt)) {
      issues.push({
        blockId,
        severity: 'warning',
        category: 'a11y',
        message: `${label} #${idx + 1} has no alt text. Screen readers will skip it; SEO won’t index it.`,
      })
    }
  })
  return issues
}

export function lintBlocks(blocks: Block[]): LintIssue[] {
  const issues: LintIssue[] = []
  const seenIds = new Set<string>()

  // -------- alt text --------
  for (const b of blocks) {
    if (!b) continue
    if (b.blockType === 'image') {
      if (hasText(b.url) && !hasText(b.alt as string)) {
        issues.push({
          blockId: b.id,
          severity: 'warning',
          category: 'a11y',
          message: 'Image has no alt text. Add a short description so screen readers can announce it.',
        })
      }
    }
    if (b.blockType === 'gallery') {
      issues.push(...altLintForArrayItems(b.images, b.id, 'Gallery image'))
    }
    if (b.blockType === 'logo_cloud') {
      issues.push(...altLintForArrayItems(b.logos, b.id, 'Logo'))
    }
    if (b.blockType === 'hero') {
      const url = b.image_url as string | undefined
      // Hero bg is decorative — no alt warning. We do flag if there's an
      // image_url AND a heading missing, because that means the page has no
      // accessible h1.
      if (hasText(url) && !hasText(b.heading as string)) {
        issues.push({
          blockId: b.id,
          severity: 'error',
          category: 'a11y',
          message: 'Hero has a background image but no heading. Add an h1 so the page has a clear title.',
        })
      }
    }
  }

  // -------- heading hierarchy --------
  const headingsInOrder: Array<{ level: 1 | 2 | 3; blockId?: string; blockType: string; text: string }> = []
  for (const b of blocks) {
    if (!b?.blockType) continue
    const lvl = BLOCK_HEADING_LEVEL[b.blockType]
    if (!lvl) continue
    const text = (b.heading as string) || ''
    if (!hasText(text)) continue
    headingsInOrder.push({ level: lvl, blockId: b.id, blockType: b.blockType, text })
  }
  const h1Count = headingsInOrder.filter((h) => h.level === 1).length
  if (h1Count === 0 && blocks.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'hierarchy',
      message:
        'No h1 on this page. Add a Hero block with a heading so search engines and screen readers can identify the page topic.',
    })
  }
  if (h1Count > 1) {
    const extras = headingsInOrder.filter((h) => h.level === 1).slice(1)
    extras.forEach((h) =>
      issues.push({
        blockId: h.blockId,
        severity: 'warning',
        category: 'hierarchy',
        message: 'Multiple h1 headings on this page. Pick one Hero as the page topic; convert the others to h2-level sections.',
      }),
    )
  }
  // Level skips (e.g. h1 followed by h3 with no h2 in between).
  let prev = 0
  for (const h of headingsInOrder) {
    if (h.level > prev + 1 && prev > 0) {
      issues.push({
        blockId: h.blockId,
        severity: 'warning',
        category: 'hierarchy',
        message: `Heading jumps from h${prev} to h${h.level}. Don’t skip levels — pick a block that emits h${prev + 1}, or restructure.`,
      })
    }
    prev = h.level
  }

  // -------- duplicate ids (defensive — shouldn't happen, but safe to flag) --
  for (const b of blocks) {
    if (!b.id) continue
    if (seenIds.has(b.id)) {
      issues.push({
        blockId: b.id,
        severity: 'error',
        category: 'a11y',
        message: 'Duplicate block id detected. Each block needs a unique id; duplicate sections won’t render reliably.',
      })
    }
    seenIds.add(b.id)
  }

  return issues
}

// -------- contrast --------
const parseHex = (input: string | undefined | null): { r: number; g: number; b: number } | null => {
  if (!input) return null
  const s = input.trim().replace(/^#/, '')
  if (![3, 6].includes(s.length)) return null
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return null
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}

const channelLuminance = (c: number): number => {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export const relativeLuminance = (hex: string): number | null => {
  const rgb = parseHex(hex)
  if (!rgb) return null
  return 0.2126 * channelLuminance(rgb.r) + 0.7152 * channelLuminance(rgb.g) + 0.0722 * channelLuminance(rgb.b)
}

export const contrastRatio = (fgHex: string, bgHex: string): number | null => {
  const L1 = relativeLuminance(fgHex)
  const L2 = relativeLuminance(bgHex)
  if (L1 == null || L2 == null) return null
  const [lighter, darker] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (lighter + 0.05) / (darker + 0.05)
}

export type ContrastVerdict = {
  ratio: number | null
  AA: 'pass' | 'fail' | 'large-only' | 'unknown'
  AAA: 'pass' | 'fail' | 'large-only' | 'unknown'
}

export function judgeContrast(fg: string, bg: string): ContrastVerdict {
  const ratio = contrastRatio(fg, bg)
  if (ratio == null) {
    return { ratio: null, AA: 'unknown', AAA: 'unknown' }
  }
  return {
    ratio,
    AA: ratio >= 4.5 ? 'pass' : ratio >= 3 ? 'large-only' : 'fail',
    AAA: ratio >= 7 ? 'pass' : ratio >= 4.5 ? 'large-only' : 'fail',
  }
}

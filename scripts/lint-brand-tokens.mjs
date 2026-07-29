#!/usr/bin/env node
/**
 * Fails when a public-render component hardcodes a colour.
 *
 * The brand token contract only holds if components ask for colour rather than
 * deciding it. One `#1d8df6` inside a template is a second owner of that value,
 * and a second owner is what made "Don't Settle colours are completely wrong"
 * possible.
 *
 * This is a standalone script rather than an ESLint rule on purpose: `pnpm lint`
 * in this repo is `next lint` with no committed config, so it prompts for setup
 * and is not a usable gate. A script that exits non-zero is.
 *
 *   pnpm lint:tokens            report violations, exit 1 if above the baseline
 *   pnpm lint:tokens --report   print the full breakdown, always exit 0
 *   pnpm lint:tokens --baseline rewrite the baseline to the current count
 *
 * The baseline exists so this can land today without a 430-file rewrite: the
 * count may never go UP, and every migrated component ratchets it down. A gate
 * that cannot be turned on is not a gate.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const BASELINE_FILE = join(ROOT, 'scripts', 'brand-token-baseline.json')

/** Components whose output reaches a public visitor. */
const SCANNED = [
  'src/components/blocks',
  'src/components/public',
  'src/components/builder/quiz',
  'src/components/builder/lp',
  'src/components/builder/advertorial',
  'src/templates',
]

/**
 * Files exempt with a stated reason. Anything added here needs one, so the list
 * stays an argued set of exceptions rather than a place to hide violations.
 */
const EXEMPT = {
  'src/components/builder/ui.tsx': 'Admin chrome, never rendered to a visitor.',
  'src/lib/builder/color-system.ts': 'The colour maths itself. Its job is to produce hex.',
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g
const RGB_HSL = /\b(?:rgba?|hsla?)\s*\(/g
const TW_COLOR =
  /\b(?:bg|text|border|ring|from|via|to|fill|stroke|decoration|outline|shadow|accent|caret|divide|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|\d{3})\b/g

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full)
  }
  return out
}

const countIn = (text) => {
  // Strip comments so prose describing a colour is not a violation.
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  const hex = (code.match(HEX) || []).length
  const fn = (code.match(RGB_HSL) || []).length
  const tw = (code.match(TW_COLOR) || []).length
  return { hex, fn, tw, total: hex + fn + tw }
}

const results = []
for (const dir of SCANNED) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file)
    if (EXEMPT[rel]) continue
    const counts = countIn(readFileSync(file, 'utf8'))
    if (counts.total > 0) results.push({ file: rel, ...counts })
  }
}

results.sort((a, b) => b.total - a.total)
const total = results.reduce((n, r) => n + r.total, 0)

const args = process.argv.slice(2)
const mode = args.includes('--baseline') ? 'baseline' : args.includes('--report') ? 'report' : 'gate'

if (mode === 'baseline') {
  writeFileSync(BASELINE_FILE, `${JSON.stringify({ total, files: results.length }, null, 2)}\n`)
  console.log(`Baseline written: ${total} violations across ${results.length} files.`)
  process.exit(0)
}

if (mode === 'report') {
  console.log(`\nHardcoded colour in public-render components: ${total} across ${results.length} files\n`)
  for (const r of results) {
    console.log(`  ${String(r.total).padStart(4)}  ${r.file}   (hex ${r.hex}, rgb/hsl ${r.fn}, tailwind ${r.tw})`)
  }
  console.log('\nEvery one of these is a second owner of a colour the brand should decide.')
  process.exit(0)
}

const baseline = existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : { total: Infinity }

if (total > baseline.total) {
  console.error(
    `\nBrand token lint FAILED: ${total} hardcoded colours, baseline is ${baseline.total}.\n` +
      `New hardcoded colour was added to a public-render component. Use a --site-* token instead.\n` +
      `Run "pnpm lint:tokens --report" to see where.\n`,
  )
  process.exit(1)
}

const moved = baseline.total - total
console.log(
  `Brand token lint OK: ${total} hardcoded colours (baseline ${baseline.total}${moved > 0 ? `, down ${moved}` : ''}).` +
    (moved > 0 ? '\nRun "pnpm lint:tokens --baseline" to lock in the improvement.' : ''),
)

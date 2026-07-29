#!/usr/bin/env node
/**
 * Fails when code that paints a PUBLIC page hardcodes a colour.
 *
 * The brand token contract only holds if public output asks for colour rather
 * than deciding it. One `#1d8df6` inside a renderer is a second owner of that
 * value, and a second owner is what made "Don't Settle colours are completely
 * wrong" possible.
 *
 * Standalone script rather than an ESLint rule on purpose: `pnpm lint` in this
 * repo is `next lint` with no committed config, so it prompts for setup and is
 * not a usable gate. A script that exits non-zero is.
 *
 *   pnpm lint:tokens            enforce every scope against its budget
 *   pnpm lint:tokens --report   full breakdown by scope and file
 *   pnpm lint:tokens --baseline rewrite budgets to the current counts
 *
 * THREE SCOPES, because a single number hid three different problems:
 *
 *   render  Code whose output reaches a visitor. Target is ZERO. Every value
 *           here should come from a --site-* token. This is the real debt.
 *
 *   tenant  One tenant's pages living as source code. Target is also zero, but
 *           the fix is migrating the content into the CMS and deleting the
 *           files, not tokenising them. Tracked separately so it cannot be
 *           mistaken for progress on `render`.
 *
 *   admin   Builder and dashboard chrome. NOT counted. Admin UI is fixed
 *           product surface, not brand-painted output; its dark theme is
 *           supposed to be the same for every tenant. Counting it inflated the
 *           number and would have made the gate nag about correct code.
 *
 * Budgets ratchet: a scope may never go up, and every migrated file lowers it.
 * A gate that cannot be switched on today is not a gate.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const BUDGET_FILE = join(ROOT, 'scripts', 'brand-token-baseline.json')

const SCAN_ROOTS = [
  'src/components/blocks',
  'src/components/public',
  'src/components/builder',
  'src/templates',
]

/** Admin-only chrome. Fixed product UI, identical for every tenant, not brand-painted. */
const ADMIN = [
  /\/builder\/[^/]+\/[A-Za-z]*BuilderApp\.tsx$/,
  /\/builder\/lp\/LandingPagesApp\.tsx$/,
  /\/builder\/quiz\/(editors|config|seed-data)\.tsx?$/,
  /\/builder\/(ui|body-sections)\.tsx$/,
  /\/builder\/brand\/BrandModule\.tsx$/,
]

/** One tenant's content living as source. Fixed by migrating to the CMS, then deleting. */
const TENANT = [/\/public\/check-my-claim\//]

/** Files exempt outright, each with a stated reason so the list stays argued. */
const EXEMPT = {
  'src/lib/builder/color-system.ts': 'The colour maths itself. Producing hex is its job.',
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g
const RGB_HSL = /\b(?:rgba?|hsla?)\s*\(/g
const TW_COLOR =
  /\b(?:bg|text|border|ring|from|via|to|fill|stroke|decoration|outline|shadow|accent|caret|divide|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|\d{3})\b/g

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full)
  }
  return out
}

const countIn = (text) => {
  // Strip comments: prose describing a colour is not a violation.
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  const hex = (code.match(HEX) || []).length
  const fn = (code.match(RGB_HSL) || []).length
  const tw = (code.match(TW_COLOR) || []).length
  return { hex, fn, tw, total: hex + fn + tw }
}

const scopeOf = (rel) => {
  if (TENANT.some((r) => r.test(rel))) return 'tenant'
  if (ADMIN.some((r) => r.test(rel))) return 'admin'
  return 'render'
}

const results = { render: [], tenant: [], admin: [] }
for (const dir of SCAN_ROOTS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file).split('\\').join('/')
    if (EXEMPT[rel]) continue
    const counts = countIn(readFileSync(file, 'utf8'))
    if (counts.total > 0) results[scopeOf(rel)].push({ file: rel, ...counts })
  }
}

for (const k of Object.keys(results)) results[k].sort((a, b) => b.total - a.total)
const totals = {
  render: results.render.reduce((n, r) => n + r.total, 0),
  tenant: results.tenant.reduce((n, r) => n + r.total, 0),
}

const args = process.argv.slice(2)
const mode = args.includes('--baseline') ? 'baseline' : args.includes('--report') ? 'report' : 'gate'

if (mode === 'baseline') {
  writeFileSync(BUDGET_FILE, `${JSON.stringify(totals, null, 2)}\n`)
  console.log(`Budgets written: render ${totals.render}, tenant ${totals.tenant}.`)
  process.exit(0)
}

if (mode === 'report') {
  const show = (scope, note) => {
    const rows = results[scope]
    const sum = rows.reduce((n, r) => n + r.total, 0)
    console.log(`\n${scope.toUpperCase()}  ${sum} across ${rows.length} files  ${note}`)
    for (const r of rows) {
      console.log(`  ${String(r.total).padStart(4)}  ${r.file}   (hex ${r.hex}, rgb/hsl ${r.fn}, tailwind ${r.tw})`)
    }
  }
  show('render', '<- real debt. Target zero. Replace with --site-* tokens.')
  show('tenant', '<- one tenant as source. Fix by migrating content to the CMS, then delete.')
  show('admin', '<- not counted. Fixed product chrome, same for every tenant.')
  console.log('')
  process.exit(0)
}

const budget = existsSync(BUDGET_FILE)
  ? JSON.parse(readFileSync(BUDGET_FILE, 'utf8'))
  : { render: Infinity, tenant: Infinity }

const over = ['render', 'tenant'].filter((s) => totals[s] > (budget[s] ?? Infinity))
if (over.length > 0) {
  console.error('\nBrand token lint FAILED')
  for (const s of over) {
    console.error(`  ${s}: ${totals[s]} hardcoded colours, budget is ${budget[s]}`)
  }
  console.error('\nRun "pnpm lint:tokens --report" to see where. Public output must use --site-* tokens.\n')
  process.exit(1)
}

const line = (s) => {
  const moved = (budget[s] ?? 0) - totals[s]
  return `${s} ${totals[s]}/${budget[s]}${moved > 0 ? ` (down ${moved})` : ''}`
}
console.log(`Brand token lint OK: ${line('render')}, ${line('tenant')}.`)
if (totals.render < (budget.render ?? 0) || totals.tenant < (budget.tenant ?? 0)) {
  console.log('Run "pnpm lint:tokens --baseline" to lock in the improvement.')
}

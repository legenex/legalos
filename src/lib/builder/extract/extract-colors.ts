// Brand COLOR + FONT extraction by ROLE, not by variable name. Collects every
// color signal (CSS rules, inline styles, :root vars, meta theme-color,
// Tailwind config, gradient stops), clusters near-duplicates in HSL space,
// and scores each cluster for the roles primary / accent / ink / surface /
// darkBackdrop / muted by WHERE it appears — so it works on sites that don't
// name their variables conventionally (Tailwind, utility CSS, inline styles).
//
// A named-var / Tailwind fast-path takes precedence when present (explicit
// author intent); the multi-signal scorer is the resilient fallback.

import { parseHex, rgbToHsl } from '../color-system'
import { pickFontToken, fallbackFontFromCss, cleanFontFamilyName } from '../extract-brand-tokens'

export type ExtractedColors = {
  primary?: string
  accent?: string
  ink?: string
  surface?: string
  darkBackdrop?: string
  muted?: string
  success?: string
  warning?: string
  danger?: string
  fontHeading?: string
  fontBody?: string
  confidence: number // 0..1 — how much real signal we found
}

const NAMED: Record<string, string> = {
  white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000', blue: '#0000ff',
  navy: '#000080', gray: '#808080', grey: '#808080', orange: '#ffa500', gold: '#ffd700',
  yellow: '#ffff00', purple: '#800080', teal: '#008080',
}

// Normalize any CSS color token to #rrggbb, or null.
function toHex(token: string): string | null {
  const t = token.trim().toLowerCase()
  if (!t || t === 'transparent' || t === 'currentcolor' || t === 'inherit') return null
  if (NAMED[t]) return NAMED[t]
  if (t.startsWith('#')) {
    const rgb = parseHex(t)
    return rgb ? rgbToHexLocal(rgb) : null
  }
  const rgb = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i.exec(t)
  if (rgb) {
    const a = /rgba?\([^)]*[,/]\s*([\d.]+)\s*\)/.exec(t)
    if (a && parseFloat(a[1]) < 0.5) return null // mostly-transparent, ignore
    return rgbToHexLocal({ r: +rgb[1], g: +rgb[2], b: +rgb[3] })
  }
  const hsl = /hsla?\(\s*([\d.]+)[ ,]+([\d.]+)%[ ,]+([\d.]+)%/i.exec(t)
  if (hsl) return hslToHexLocal(+hsl[1] / 360, +hsl[2] / 100, +hsl[3] / 100)
  return null
}
const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
const rgbToHexLocal = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('')}`
function hslToHexLocal(h: number, s: number, l: number): string {
  if (s === 0) { const v = clamp255(l * 255); return rgbToHexLocal({ r: v, g: v, b: v }) }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q-p)*6*t; if (t < 1/2) return q; if (t < 2/3) return p + (q-p)*(2/3-t)*6; return p }
  return rgbToHexLocal({ r: f(h + 1/3) * 255, g: f(h) * 255, b: f(h - 1/3) * 255 })
}

type Ctx = 'cta' | 'heading' | 'body' | 'card' | 'nav' | 'badge' | 'muted' | 'area' | 'other'
type Occ = { hex: string; ctx: Ctx; weight: number }

function selectorContext(sel: string): Ctx {
  const s = sel.toLowerCase()
  if (/\.btn|\.button|\.cta|\[role=.?button|button\b/.test(s)) return 'cta'
  if (/h1|h2|h3|h4|h5|h6|\.title|\.heading|\.headline/.test(s)) return 'heading'
  if (/\bnav\b|header|\.navbar|\.topbar/.test(s)) return 'nav'
  if (/\.badge|\.label|\.tag|\.pill|\.chip/.test(s)) return 'badge'
  if (/\.card|\.box|\.panel|\.tile/.test(s)) return 'card'
  if (/\.muted|\.subtle|\.dim|\.secondary|\.text-gray|\.text-muted/.test(s)) return 'muted'
  if (/body|html|section|\.hero|footer|main|\.container|\.section/.test(s)) return 'area'
  if (/\bp\b|\.text|\.body|\.copy|article/.test(s)) return 'body'
  return 'other'
}

// Pull occurrences from CSS rule blocks + inline styles + theme-color meta.
function collect(css: string, html?: string): Occ[] {
  const occ: Occ[] = []
  const add = (raw: string, ctx: Ctx, weight: number) => {
    // Try the whole value, then the first color token within it (handles
    // shorthand like `background: #fff url(...) no-repeat`).
    let hex = toHex(raw)
    if (!hex) {
      const tok = raw.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/i)
      if (tok) hex = toHex(tok[0])
    }
    if (hex) occ.push({ hex, ctx, weight })
  }
  // Rule blocks: selector { decls }
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = ruleRe.exec(css)) !== null) {
    const sel = m[1]
    const decls = m[2]
    const ctx = selectorContext(sel)
    // background / background-color
    for (const bm of decls.matchAll(/background(?:-color)?\s*:\s*([^;]+)/gi)) {
      const val = bm[1]
      // gradient stops
      const stops = val.match(/#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)/gi)
      if (stops && /gradient/i.test(val)) stops.forEach((s) => add(s, ctx === 'other' ? 'area' : ctx, 1.5))
      else add(val, ctx === 'other' ? 'area' : ctx, 2)
    }
    for (const cm of decls.matchAll(/(?:^|[;{])\s*color\s*:\s*([^;]+)/gi)) add(cm[1], ctx === 'other' ? 'body' : ctx, 2)
    for (const fm of decls.matchAll(/(?:border(?:-[a-z]+)?-color|fill|stroke)\s*:\s*([^;]+)/gi)) add(fm[1], ctx, 1)
  }
  // Inline styles in HTML.
  if (html) {
    for (const sm of html.matchAll(/style\s*=\s*["']([^"']+)["']/gi)) {
      const decls = sm[1]
      for (const bm of decls.matchAll(/background(?:-color)?\s*:\s*([^;]+)/gi)) add(bm[1], 'area', 1)
      for (const cm of decls.matchAll(/(?:^|;)\s*color\s*:\s*([^;]+)/gi)) add(cm[1], 'body', 1)
    }
    const tc = /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i.exec(html)
    if (tc) add(tc[1], 'nav', 4)
  }
  return occ
}

type Cluster = { hex: string; ctx: Record<Ctx, number>; total: number; h: number; s: number; l: number }

function cluster(occ: Occ[]): Cluster[] {
  const clusters: Cluster[] = []
  for (const o of occ) {
    const rgb = parseHex(o.hex)
    if (!rgb) continue
    const [h, s, l] = rgbToHsl(rgb)
    let found: Cluster | undefined
    for (const c of clusters) {
      const dh = Math.min(Math.abs(h - c.h), 1 - Math.abs(h - c.h))
      const dist = Math.sqrt((2.5 * dh) ** 2 + (s - c.s) ** 2 + (l - c.l) ** 2)
      const thr = s < 0.1 && c.s < 0.1 ? 0.08 : s > 0.5 ? 0.12 : 0.1
      if (dist < thr) { found = c; break }
    }
    if (found) {
      found.ctx[o.ctx] = (found.ctx[o.ctx] || 0) + o.weight
      found.total += o.weight
      if (o.weight >= 2) { found.hex = o.hex; found.h = h; found.s = s; found.l = l } // prefer strong-signal representative
    } else {
      clusters.push({
        hex: o.hex,
        ctx: { [o.ctx]: o.weight } as Record<Ctx, number>,
        total: o.weight,
        h, s, l,
      })
    }
  }
  return clusters
}

const CTX_W: Record<string, Partial<Record<Ctx, number>>> = {
  primary: { cta: 10, nav: 5, badge: 3, card: 2 },
  accent: { badge: 10, cta: 2 },
  ink: { heading: 10, body: 8 },
  surface: { card: 8, area: 6 },
  darkBackdrop: { area: 10, nav: 6 },
  muted: { muted: 10, body: 2 },
}

function score(c: Cluster, role: keyof typeof CTX_W): number {
  // HARD GATES first — a color in the wrong luminance/saturation band cannot
  // hold the role no matter how often it appears. Without these, a high-traffic
  // light area color wins 'darkBackdrop' and a zero-saturation white wins
  // 'accent'. Returning -1 makes best() fall through to undefined when nothing
  // legitimately qualifies (the LLM then fills that single gap).
  if (role === 'primary' && c.s < 0.12) return -1 // near-gray can't be the brand primary
  if (role === 'accent' && (c.s < 0.28 || c.l < 0.2 || c.l > 0.82)) return -1 // accent must be a saturated mid-tone
  if (role === 'ink' && c.l > 0.5) return -1 // ink is dark text
  if (role === 'surface' && c.l < 0.6) return -1 // surface is a light page/card bg
  if (role === 'darkBackdrop' && c.l > 0.35) return -1 // backdrop must actually be dark

  let s = 0
  const w = CTX_W[role]
  for (const k of Object.keys(w) as Ctx[]) s += (w[k] || 0) * (c.ctx[k] || 0)
  s += Math.log(c.total + 1) / 2
  if (role === 'primary') s += (c.s > 0.5 ? 5 : 0) + (c.l > 0.25 && c.l < 0.7 ? 3 : 0)
  if (role === 'accent') s += c.s > 0.4 ? 3 : 0
  if (role === 'ink') s += c.l < 0.3 ? 5 : 0
  if (role === 'surface') s += c.l > 0.85 ? 5 : 0
  if (role === 'darkBackdrop') s += c.l < 0.2 ? 6 : 0
  if (role === 'muted') s += c.s < 0.15 ? 4 : 0
  return s
}

const best = (clusters: Cluster[], role: keyof typeof CTX_W, exclude: string[] = []): string | undefined => {
  let top: Cluster | undefined
  let topScore = -Infinity
  for (const c of clusters) {
    if (exclude.includes(c.hex)) continue
    const sc = score(c, role)
    if (sc > topScore) { topScore = sc; top = c }
  }
  return topScore > 0 ? top?.hex : undefined
}

// ---- named-var / tailwind fast-path ----
// Collect color custom-properties from any var-bearing block: :root, Tailwind
// v4 `@theme` / `@theme inline`, `html`, and `[data-theme=...]`. The trailing
// `;` is OPTIONAL so the LAST declaration before `}` is not dropped.
function parseRootVars(css: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const block of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const sel = block[1]
    if (!/:root|@theme|\[data-theme|html\b/i.test(sel)) continue
    for (const v of block[2].matchAll(/--([a-z0-9-]+)\s*:\s*([^;}]+)/gi)) {
      const hex = toHex(v[2])
      if (hex) out[v[1].toLowerCase()] = hex
    }
  }
  return out
}
const pickVar = (vars: Record<string, string>, names: string[]): string | undefined => {
  for (const n of names) for (const k of Object.keys(vars)) if (k === n || k.includes(n)) return vars[k]
  return undefined
}

// Extract the {...} block that follows `keyword:` using brace matching, so we
// isolate (e.g.) the colors object from sibling keys like theme / fontFamily /
// extend. Returns the inner body (without the outer braces), or null.
function extractBraceBlock(src: string, keyword: string): string | null {
  const re = new RegExp(`['"]?${keyword}['"]?\\s*:\\s*\\{`, 'g')
  const m = re.exec(src)
  if (!m) return null
  let depth = 0
  const start = m.index + m[0].length // just past the opening {
  for (let i = start; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      if (depth === 0) return src.slice(start, i)
      depth--
    }
  }
  return null
}

// Parse a tailwind.config.* source for theme(.extend).colors and fontFamily.
export function parseTailwindConfig(src: string): { colors: Record<string, string>; fonts: { heading?: string; body?: string } } {
  const colors: Record<string, string> = {}
  // Scope to the colors block (handles `colors: {` under theme or extend); fall
  // back to the whole source if no colors block is found.
  const colorBlock = extractBraceBlock(src, 'colors') ?? src
  // Nested scales FIRST (so a scale's DEFAULT wins over a stray sibling hex):
  // `key: { DEFAULT: '#hex', 500: '#hex', ... }`.
  for (const m of colorBlock.matchAll(/['"]?([a-zA-Z][a-zA-Z0-9_-]+)['"]?\s*:\s*\{([^{}]*)\}/g)) {
    const key = m[1].toLowerCase()
    const def = /(?:DEFAULT|['"]?(?:500|600)['"]?)\s*:\s*['"](#[0-9a-fA-F]{3,8})['"]/.exec(m[2])
    if (def) colors[key] = def[1]
  }
  // Then flat `key: '#hex'` pairs (don't overwrite a scale we already captured).
  for (const m of colorBlock.matchAll(/['"]?([a-zA-Z][a-zA-Z0-9_-]+)['"]?\s*:\s*['"](#[0-9a-fA-F]{3,8})['"]/g)) {
    const key = m[1].toLowerCase()
    if (!colors[key]) colors[key] = m[2]
  }
  const fonts: { heading?: string; body?: string } = {}
  const ff = /fontFamily\s*:\s*\{([\s\S]*?)\}/.exec(src)
  if (ff) {
    const h = /(?:heading|display|serif)\s*:\s*\[?\s*['"]([^'"]+)['"]/.exec(ff[1])
    const b = /(?:sans|body|base)\s*:\s*\[?\s*['"]([^'"]+)['"]/.exec(ff[1])
    if (h) fonts.heading = h[1]
    if (b) fonts.body = b[1]
  }
  return { colors, fonts }
}

const pickName = (obj: Record<string, string>, names: string[]): string | undefined => {
  for (const n of names) for (const k of Object.keys(obj)) if (k === n || k.includes(n)) return obj[k]
  return undefined
}

export type ColorInput = {
  css?: string
  html?: string
  tailwind?: { colors: Record<string, string>; fonts: { heading?: string; body?: string } }
  googleFontFamilies?: string[]
}

export function extractColors(input: ColorInput): ExtractedColors {
  const css = input.css || ''
  const out: ExtractedColors = { confidence: 0 }
  let signals = 0

  // Fast-path 1: tailwind config (GitHub).
  const tw = input.tailwind?.colors || {}
  const twHas = Object.keys(tw).length > 0
  // Fast-path 2: :root vars.
  const vars = parseRootVars(css)
  const varsHas = Object.keys(vars).length > 0

  const fromNamed = (names: string[]): string | undefined =>
    (twHas ? pickName(tw, names) : undefined) || (varsHas ? pickVar(vars, names) : undefined)

  out.primary = fromNamed(['primary', 'brand', 'action', 'cta'])
  out.accent = fromNamed(['accent', 'secondary', 'highlight', 'gold'])
  out.ink = fromNamed(['ink', 'foreground', 'text', 'dark', 'navy'])
  out.surface = fromNamed(['surface', 'background', 'bg', 'light', 'paper'])
  out.muted = fromNamed(['muted', 'gray', 'grey', 'subtle'])
  out.success = fromNamed(['success', 'green', 'positive'])
  out.warning = fromNamed(['warning', 'amber'])
  out.danger = fromNamed(['danger', 'error', 'negative'])
  if (out.primary) signals++

  // Multi-signal scoring fallback for whatever the fast-path didn't fill.
  const clusters = cluster(collect(css, input.html))
  if (clusters.length) {
    signals++
    if (!out.primary) out.primary = best(clusters, 'primary')
    if (!out.accent) out.accent = best(clusters, 'accent', [out.primary || ''])
    if (!out.ink) out.ink = best(clusters, 'ink')
    if (!out.surface) out.surface = best(clusters, 'surface')
    if (!out.muted) out.muted = best(clusters, 'muted')
    out.darkBackdrop = best(clusters, 'darkBackdrop')
  }

  // Final fallbacks from the cluster set.
  const byLum = [...clusters].sort((a, b) => a.l - b.l)
  if (!out.ink && byLum[0]) out.ink = byLum[0].hex
  if (!out.surface && byLum.length) out.surface = byLum[byLum.length - 1].hex
  if (!out.darkBackdrop) {
    // darkest large-area bg, else derive a dark from primary.
    out.darkBackdrop = byLum.find((c) => c.l < 0.25)?.hex
  }

  // accent ≈ primary → rotate hue for separation.
  if (out.primary && out.accent) {
    const p = parseHex(out.primary)
    const a = parseHex(out.accent)
    if (p && a) {
      const [ph] = rgbToHsl(p)
      const [ah, as, al] = rgbToHsl(a)
      const dh = Math.min(Math.abs(ph - ah), 1 - Math.abs(ph - ah))
      if (dh < 0.04 && Math.abs(rgbToHsl(p)[2] - al) < 0.1) {
        out.accent = hslToHexLocal((ah + 0.08) % 1, Math.max(as, 0.5), al)
      }
    }
  }

  // Fonts.
  const twFonts = input.tailwind?.fonts || {}
  out.fontHeading =
    twFonts.heading ||
    cleanFontFamilyName(pickFontToken(vars, ['font-heading', 'heading-font', 'font-head'])) ||
    cleanFontFamilyName(fallbackFontFromCss(css, /(h1|h2|h3|h4|h5|h6)[^{}]*\{[^}]*font-family\s*:[^;}]*/i)) ||
    input.googleFontFamilies?.[0]
  out.fontBody =
    twFonts.body ||
    cleanFontFamilyName(pickFontToken(vars, ['font-body', 'body-font', 'font'])) ||
    cleanFontFamilyName(fallbackFontFromCss(css, /(?:body|html)[^{}]*\{[^}]*font-family\s*:[^;}]*/i)) ||
    input.googleFontFamilies?.[input.googleFontFamilies.length - 1]

  // Validate hex; drop invalid.
  for (const k of ['primary', 'accent', 'ink', 'surface', 'darkBackdrop', 'muted', 'success', 'warning', 'danger'] as const) {
    if (out[k] && !parseHex(out[k] as string)) out[k] = undefined
  }
  // ink must be darker than surface; swap if inverted.
  if (out.ink && out.surface) {
    const li = rgbToHsl(parseHex(out.ink)!)[2]
    const ls = rgbToHsl(parseHex(out.surface)!)[2]
    if (li > ls) { const t = out.ink; out.ink = out.surface; out.surface = t }
  }

  const filled = ['primary', 'accent', 'ink', 'surface', 'darkBackdrop'].filter((k) => out[k as keyof ExtractedColors]).length
  out.confidence = Math.min(1, (signals * 0.3) + filled * 0.12)
  return out
}

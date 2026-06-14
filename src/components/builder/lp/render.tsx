// @ts-nocheck
/* eslint-disable */
'use client'

// Ported verbatim from the artifact: landing-page templates, section types +
// default copy, the {{token}} resolver, all 13 section renderers, and LivePreview.

import { useState, useEffect } from 'react'
import {
  Flame, Phone, ChevronRight, ShieldCheck, Scale, Check, Trophy, Star, ChevronUp,
  ChevronDown, ArrowRight, Pencil, Layers, Rocket, ListOrdered, Award, Quote,
  CheckCircle2, ListChecks, HelpCircle, Megaphone, FileText,
} from 'lucide-react'
import { T, genId, brandShortName } from '../ui'
import { relativeLuminance } from '@/lib/builder/page-lint'
import { onPrimaryText } from '@/lib/builder/color-system'

// A template's canvas is "dark" when its luminance is below the midpoint.
// Replaces the brittle canvas === '#0f172a' string-equality that only
// recognised one specific hex and broke for any brand-driven canvas.
const tokensAreDark = (tokens) => (relativeLuminance(tokens?.canvas) ?? 1) < 0.5

// ============================================================================
// LANDING PAGE TEMPLATES
// ============================================================================
export const TEMPLATES = [
  {
    id: 'bold_modern',
    name: 'Bold Modern',
    angleDefault: 'pain',
    blurb: 'Quiz above the fold in a dark gradient hero. Results-led, big stats. Best for cold PPC traffic.',
    hookExample: '$50M+ recovered. Was your accident worth more?',
    tokens: {
      canvas: '#0f172a', surface: '#1e293b', text: '#f8fafc', textMute: '#94a3b8',
      headlineFont: '"Inter", system-ui, sans-serif',
      bodyFont: '"Inter", system-ui, sans-serif',
      headlineWeight: 800,
      eyebrowStyle: 'pill_dot',
      radius: 10,
      heroBg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
    },
  },
  {
    id: 'classic_authority',
    name: 'Classic Authority',
    angleDefault: 'authority',
    blurb: 'Navy + serif. Trust badges, scale-of-justice motifs. Built to feel like a real firm.',
    hookExample: 'Trusted by 50,000 accident victims since 2018.',
    tokens: {
      canvas: '#f8f7f4', surface: '#ffffff', text: '#1c2231', textMute: '#566075',
      headlineFont: 'Georgia, "Times New Roman", serif',
      bodyFont: '"Inter", system-ui, sans-serif',
      headlineWeight: 700,
      eyebrowStyle: 'uppercase_caps',
      radius: 4,
      heroBg: 'linear-gradient(180deg, #f8f7f4 0%, #f0ede5 100%)',
    },
  },
  {
    id: 'editorial_investigation',
    name: 'Editorial Investigation',
    angleDefault: 'community',
    blurb: 'Paper cream canvas, Lora serif, rule-line eyebrows. Reads like an investigative article.',
    hookExample: 'Most accident victims never learn they qualified.',
    tokens: {
      canvas: '#f4ede0', surface: '#fbf6ec', text: '#2a1f0f', textMute: '#7a6f5a',
      headlineFont: '"Lora", Georgia, serif',
      bodyFont: '"Lora", Georgia, serif',
      headlineWeight: 600,
      eyebrowStyle: 'rule_line',
      radius: 2,
      heroBg: '#f4ede0',
    },
  },
  {
    id: 'urgent_streamlined',
    name: 'Urgent Streamlined',
    angleDefault: 'urgency',
    blurb: 'White canvas. Flame-tag eyebrows. Statute-of-limitations urgency.',
    hookExample: 'Deadlines vary by state. Some are as short as one year.',
    tokens: {
      canvas: '#ffffff', surface: '#f8fafc', text: '#0f172a', textMute: '#64748b',
      headlineFont: '"Inter", system-ui, sans-serif',
      bodyFont: '"Inter", system-ui, sans-serif',
      headlineWeight: 900,
      eyebrowStyle: 'flame_tag',
      radius: 8,
      heroBg: '#ffffff',
    },
  },
]

export const ANGLES = [
  { id: 'pain', label: 'Pain First', desc: 'Acknowledge what happened. Lean into emotion and consequences.' },
  { id: 'authority', label: 'Authority', desc: 'Lead with credentials, network size, settlement track record.' },
  { id: 'urgency', label: 'Urgency', desc: 'Statute of limitations. Time is running out. Act now.' },
  { id: 'community', label: 'Community', desc: 'You are not alone. Many people in your situation got help.' },
]

// ============================================================================
// SECTION TYPES + DEFAULT COPY
// ============================================================================
export const SECTION_TYPES = [
  { id: 'header', name: 'Header', icon: Layers, desc: 'Logo and call button bar' },
  { id: 'hero', name: 'Hero + Quiz', icon: Rocket, desc: 'Headline, subheadline, stats, embedded quiz' },
  { id: 'ticker', name: 'Recovery Ticker', icon: ListOrdered, desc: 'Rolling list of recent recoveries' },
  { id: 'authority', name: 'Authority Bar', icon: Award, desc: 'Trust logos, accreditations, network size' },
  { id: 'story', name: 'Story Section', icon: Quote, desc: 'Narrative about who you help' },
  { id: 'eligibility', name: 'Eligibility Checklist', icon: CheckCircle2, desc: 'Bulleted list of who qualifies' },
  { id: 'how_it_works', name: 'How It Works', icon: ListChecks, desc: '3 to 4 step process explainer' },
  { id: 'settlements', name: 'Settlement Wins', icon: Trophy, desc: 'Past payouts with case type and amount' },
  { id: 'testimonials', name: 'Testimonials', icon: Star, desc: 'Star-rated client quotes' },
  { id: 'guarantee', name: 'No Win No Fee', icon: ShieldCheck, desc: 'Risk reversal' },
  { id: 'faq', name: 'FAQ', icon: HelpCircle, desc: 'Common questions with collapsible answers' },
  { id: 'final_cta', name: 'Final CTA', icon: Megaphone, desc: 'Closing call to action' },
  { id: 'footer', name: 'Footer', icon: FileText, desc: 'Legal links, copyright, TCPA' },
]
export const SECTION_TYPE_META = Object.fromEntries(SECTION_TYPES.map((s) => [s.id, s]))

// Section default copy + helpers live in a server-safe module so the seed
// script can share them (single source of truth).
export { SEED_SECTION_COPY, DEFAULT_SECTION_ORDER, buildSeedSections } from './section-copy'

// ============================================================================
// TOKEN SUBSTITUTION
// ============================================================================
export const resolveTokens = (str, ctx = {}) => {
  if (typeof str !== 'string') return str
  const { brand, quiz, site } = ctx
  const year = new Date().getFullYear()
  const lookup = {
    'brand.displayName': brand?.displayName || (brand ? brand.name : 'Your Brand'),
    'brand.name': brand?.name || 'Your Brand',
    'brand.shortName': brand ? brandShortName(brand) : 'YB',
    'brand.tagline': brand?.tagline || '',
    'brand.primaryDomain': brand?.primaryDomain || '',
    'brand.callNumber': brand?.contact?.callNumber || '',
    'brand.callNumberRaw': (brand?.contact?.callNumber || '').replace(/[^\d+]/g, ''),
    'brand.copyright': brand?.legal?.copyright || `(c) ${year} ${brand?.displayName || 'Your Brand'}`,
    'brand.disclaimer': brand?.legal?.defaultDisclaimer || '',
    'brand.tcpaText': brand?.legal?.tcpaText || '',
    'brand.privacyUrl': brand?.legal?.privacyUrl || '',
    'brand.termsUrl': brand?.legal?.termsUrl || '',
    'brand.logoUrl': brand?.logoUrl || '',
    'brand.logoUrlDark': brand?.logoUrlDark || '',
    'brand.faviconUrl': brand?.faviconUrl || '',
    'brand.primary': brand?.colors?.primary || '',
    'brand.accent': brand?.colors?.accent || '',
    'brand.logoText': brand?.displayName || (brand ? brand.name : 'Your Brand'),
    'brand.logoMark': brand ? brandShortName(brand) : 'YB',
    'quiz.fullUrl': quiz?.fullUrl || (quiz?.domain ? `https://${quiz.domain}${quiz.path || ''}` : ''),
    'quiz.path': quiz?.path || '',
    'quiz.name': quiz?.name || '',
    'site.currentYear': String(year),
    'site.year': String(year),
  }
  return str.replace(/\{\{([\w.]+)\}\}/g, (m, key) => {
    if (key in lookup) {
      const v = lookup[key]
      return v === undefined || v === null ? '' : String(v)
    }
    return m
  })
}

export const fillPlaceholders = (str, brand) => resolveTokens(str, { brand })

export const fillAll = (obj, brand) => {
  if (typeof obj === 'string') return fillPlaceholders(obj, brand)
  if (Array.isArray(obj)) return obj.map((v) => fillAll(v, brand))
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const k of Object.keys(obj)) out[k] = fillAll(obj[k], brand)
    return out
  }
  return obj
}

// ============================================================================
// QUIZ EMBED HELPERS (subset; the Quiz builder ships the full set in Phase 7)
// ============================================================================
const VISIBLE_BY_DEFAULT = {
  question: true, form: true, transition: true, endpoint: true, custom: true,
  webhook: false, decision: false, verification: false,
}
const tierIsShared = (n) => !n.tiers || n.tiers.length === 0
const nodesForStep = (q, k) => q.nodes.filter((n) => n.stepKey === k)
const sharedNodeForStep = (q, k) => nodesForStep(q, k).find((v) => tierIsShared(v))
const isNodeVisible = (n) => (n.isVisible !== false && VISIBLE_BY_DEFAULT[n.type] !== false) || n.isVisible === true

const visibleStepsOf = (quiz) => {
  if (!quiz?.steps) return []
  return quiz.steps.filter((s) => {
    const shared = sharedNodeForStep(quiz, s.key)
    const anyNode = nodesForStep(quiz, s.key)[0]
    const n = shared || anyNode
    return n && isNodeVisible(n)
  })
}

// ============================================================================
// RENDER HELPERS
// ============================================================================
const renderAccent = (headline, accent, color) => {
  if (!headline) return ''
  if (!accent || !headline.includes(accent)) return headline
  const parts = headline.split(accent)
  return (
    <>
      {parts[0]}
      <span style={{ color }}>{accent}</span>
      {parts.slice(1).join(accent)}
    </>
  )
}

const Eyebrow = ({ text, tokens, brandColor }) => {
  if (!text) return null
  const style = tokens.eyebrowStyle
  if (style === 'pill_dot')
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, backgroundColor: `${brandColor}22`, color: brandColor, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: brandColor }} />
        {text.toUpperCase()}
      </div>
    )
  if (style === 'uppercase_caps') return <div style={{ fontSize: 11, fontWeight: 700, color: brandColor, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{text}</div>
  if (style === 'rule_line')
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 1, backgroundColor: brandColor }} />
        <span style={{ fontSize: 10, color: brandColor, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>{text}</span>
        <div style={{ width: 32, height: 1, backgroundColor: brandColor }} />
      </div>
    )
  if (style === 'flame_tag')
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', backgroundColor: brandColor, color: onPrimaryText(brandColor), fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 4 }}>
        <Flame size={11} /> {text}
      </div>
    )
  return <div style={{ fontSize: 11, color: brandColor, textTransform: 'uppercase' }}>{text}</div>
}

const SectionEditOverlay = ({ onEdit, dark }) => (
  <div className="lp-section-overlay" style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, opacity: 0, transition: 'opacity 0.15s', pointerEvents: 'none' }}>
    <button
      onClick={(e) => { e.stopPropagation(); onEdit?.() }}
      style={{ pointerEvents: 'auto', padding: '6px 10px', borderRadius: 6, backgroundColor: dark ? 'rgba(255,255,255,0.96)' : 'rgba(15,23,42,0.92)', color: dark ? '#0f172a' : '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <Pencil size={11} /> Edit section
    </button>
  </div>
)

const TemplateHeader = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <header onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '14px 32px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, backgroundColor: tokens.canvas, color: tokens.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.background})`, color: onPrimaryText(brand.colors.primary), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{brandShortName(brand)}</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: tokens.text }}>{c.logoText}</div>
      </div>
      <button style={{ backgroundColor: brand.colors.primary, color: onPrimaryText(brand.colors.primary), border: 'none', padding: '8px 16px', borderRadius: tokens.radius, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Phone size={13} /> {c.ctaLabel}
      </button>
    </header>
  )
}

const LPQuizEmbed = ({ quiz, brand, tokens, isDark, radius }) => {
  const visibleSteps = visibleStepsOf(quiz)
  const [stepIdx, setStepIdx] = useState(0)
  useEffect(() => { setStepIdx(0) }, [quiz?.id])

  if (!quiz || visibleSteps.length === 0) {
    return (
      <>
        <div style={{ fontSize: 18, fontWeight: 700, color: tokens.text, marginBottom: 16, fontFamily: tokens.headlineFont }}>Start your case review</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ padding: 11, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 6, fontSize: 13, color: tokens.text }}>Were you in a car accident in the last 2 years?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: 8, border: `1px solid ${brand.colors.primary}`, borderRadius: 6, color: brand.colors.primary, fontWeight: 600, fontSize: 13 }}>Yes</div>
            <div style={{ flex: 1, textAlign: 'center', padding: 8, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`, borderRadius: 6, color: tokens.textMute, fontSize: 13 }}>No</div>
          </div>
        </div>
        <button style={{ width: '100%', padding: 12, backgroundColor: brand.colors.primary, color: onPrimaryText(brand.colors.primary), border: 'none', borderRadius: radius, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Continue {'→'}</button>
        <div style={{ textAlign: 'center', fontSize: 11, color: tokens.textMute, marginTop: 10 }}>Takes 60 seconds {'·'} 100% Free {'·'} No obligation</div>
      </>
    )
  }

  const currentStep = visibleSteps[stepIdx]
  const shared = sharedNodeForStep(quiz, currentStep.key)
  const nodes = nodesForStep(quiz, currentStep.key)
  const node = shared || nodes[0]
  const advance = (e) => { if (e) e.stopPropagation(); setStepIdx((i) => Math.min(i + 1, visibleSteps.length - 1)) }
  const isFormNode = node.type === 'form'
  const isEndpointNode = node.type === 'endpoint'
  const isLast = stepIdx === visibleSteps.length - 1
  const total = visibleSteps.length
  const stepNum = stepIdx + 1
  const progress = (stepNum / total) * 100

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: tokens.textMute, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono", monospace' }}>Step {stepNum} of {total}</div>
        <div style={{ fontSize: 10.5, color: tokens.textMute, fontFamily: '"JetBrains Mono", monospace' }}>{Math.round(progress)}%</div>
      </div>
      <div style={{ width: '100%', height: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 2, marginBottom: 18, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: brand.colors.primary, transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: tokens.text, marginBottom: 6, fontFamily: tokens.headlineFont, lineHeight: 1.25 }}>{node.headline || node.question || currentStep.label}</div>
      {node.subheadline && <div style={{ fontSize: 12.5, color: tokens.textMute, marginBottom: 14, lineHeight: 1.45 }}>{node.subheadline}</div>}
      {!node.subheadline && <div style={{ height: 14 }} />}

      {isFormNode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {(node.formFields || []).slice(0, 3).map((f, i) => (
            <div key={i} style={{ padding: '10px 12px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`, borderRadius: 6, fontSize: 12, color: tokens.textMute, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>{f.placeholder || f.label}</div>
          ))}
        </div>
      ) : isEndpointNode ? (
        <div style={{ padding: 16, marginBottom: 14, backgroundColor: `${brand.colors.primary}14`, border: `1px solid ${brand.colors.primary}44`, borderRadius: 8, fontSize: 13, color: tokens.text, lineHeight: 1.5 }}>{node.endpointText || 'Your case has been submitted. An attorney will contact you shortly.'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {((node.answers && node.answers.length > 0) ? node.answers : [{ label: 'Continue' }]).slice(0, 5).map((a, i) => (
            <button key={i} onClick={advance} style={{ width: '100%', textAlign: 'left', padding: '11px 14px', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 6, color: tokens.text, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: tokens.bodyFont, display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
              <span style={{ flex: 1 }}>{a.label}</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      )}

      <button onClick={advance} style={{ width: '100%', padding: 12, backgroundColor: brand.colors.primary, color: onPrimaryText(brand.colors.primary), border: 'none', borderRadius: radius, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: isLast ? 0.6 : 1 }} disabled={isLast}>
        {isLast ? 'End of preview' : `Continue ${'→'}`}
      </button>
      <div style={{ textAlign: 'center', fontSize: 11, color: tokens.textMute, marginTop: 10 }}>Takes 60 seconds {'·'} 100% Free {'·'} No obligation</div>
    </>
  )
}

const TemplateHero = ({ section, tokens, brand, quizDepLabel, quiz, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '48px 32px 56px', background: tokens.heroBg, color: tokens.text, cursor: 'pointer', fontFamily: tokens.bodyFont }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'center' }}>
        <div>
          <Eyebrow text={c.eyebrow} tokens={tokens} brandColor={brand.colors.primary} />
          <h1 style={{ fontFamily: tokens.headlineFont, fontWeight: tokens.headlineWeight, fontSize: 44, lineHeight: 1.1, color: tokens.text, letterSpacing: '-0.02em', margin: '14px 0 16px' }}>{renderAccent(c.headline, c.accent_phrase, brand.colors.primary)}</h1>
          <p style={{ fontSize: 16, color: tokens.textMute, lineHeight: 1.5, marginBottom: 24, maxWidth: 540 }}>{c.subheadline}</p>
          <div style={{ display: 'flex', gap: 24, marginBottom: 22, flexWrap: 'wrap' }}>
            {['1', '2', '3'].map((n) => c[`stat${n}_num`] && (
              <div key={n}>
                <div style={{ fontSize: 24, fontWeight: 800, color: brand.colors.primary, fontFamily: tokens.headlineFont }}>{c[`stat${n}_num`]}</div>
                <div style={{ fontSize: 11, color: tokens.textMute, marginTop: 2, fontWeight: 500 }}>{c[`stat${n}_label`]}</div>
              </div>
            ))}
          </div>
          {c.trust_line && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: tokens.textMute }}>
              <ShieldCheck size={14} color={brand.colors.primary} /> {c.trust_line}
            </div>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: tokens.radius + 4, padding: 24, boxShadow: isDark ? '0 24px 64px -16px rgba(0,0,0,0.5)' : '0 12px 32px -8px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: T.success }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.text, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{quizDepLabel || 'Free Case Check'}</div>
          </div>
          <LPQuizEmbed quiz={quiz} brand={brand} tokens={tokens} isDark={isDark} radius={tokens.radius} />
        </div>
      </div>
    </section>
  )
}

const TemplateTicker = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '20px 32px', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, cursor: 'pointer', overflow: 'hidden' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ display: 'flex', gap: 28, alignItems: 'center', maxWidth: 1180, margin: '0 auto', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: brand.colors.primary, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c.eyebrow}</div>
        {(c.items || []).map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: tokens.textMute, whiteSpace: 'nowrap' }}>
            <span>{it.location}</span>
            <span style={{ color: brand.colors.primary, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>{it.amount}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

const TemplateAuthority = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '48px 32px', backgroundColor: tokens.surface, color: tokens.text, cursor: 'pointer' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        <Eyebrow text={c.eyebrow} tokens={tokens} brandColor={brand.colors.primary} />
        <h2 style={{ fontFamily: tokens.headlineFont, fontWeight: tokens.headlineWeight, fontSize: 28, color: tokens.text, margin: '14px 0 12px', letterSpacing: '-0.01em' }}>{c.headline}</h2>
        <p style={{ fontSize: 14, color: tokens.textMute, lineHeight: 1.6, maxWidth: 680, margin: '0 auto 24px' }}>{c.subhead}</p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {(c.badges || []).map((b, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`, borderRadius: 999, fontSize: 12, fontWeight: 600, color: tokens.text }}>
              <Scale size={13} color={brand.colors.primary} /> {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TemplateStory = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '56px 32px', backgroundColor: tokens.canvas, color: tokens.text, cursor: 'pointer' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <Eyebrow text={c.eyebrow} tokens={tokens} brandColor={brand.colors.primary} />
        <h2 style={{ fontFamily: tokens.headlineFont, fontWeight: tokens.headlineWeight, fontSize: 32, color: tokens.text, margin: '14px 0 22px', letterSpacing: '-0.01em' }}>{c.headline}</h2>
        {(c.paragraphs || []).map((p, i) => (
          <p key={i} style={{ fontSize: 15, color: tokens.textMute, lineHeight: 1.65, marginBottom: 14 }}>{p}</p>
        ))}
      </div>
    </section>
  )
}

const TemplateEligibility = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '56px 32px', backgroundColor: tokens.surface, color: tokens.text, cursor: 'pointer' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Eyebrow text={c.eyebrow} tokens={tokens} brandColor={brand.colors.primary} />
          <h2 style={{ fontFamily: tokens.headlineFont, fontWeight: tokens.headlineWeight, fontSize: 28, color: tokens.text, margin: '14px 0 0', letterSpacing: '-0.01em' }}>{c.headline}</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(c.criteria || []).map((cr, i) => (
            <div key={i} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: tokens.canvas, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: tokens.radius }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: `${brand.colors.primary}26`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={13} color={brand.colors.primary} strokeWidth={3} />
              </div>
              <span style={{ fontSize: 14, color: tokens.text }}>{cr}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TemplateHowItWorks = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '56px 32px', backgroundColor: tokens.canvas, color: tokens.text, cursor: 'pointer' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Eyebrow text={c.eyebrow} tokens={tokens} brandColor={brand.colors.primary} />
          <h2 style={{ fontFamily: tokens.headlineFont, fontWeight: tokens.headlineWeight, fontSize: 30, color: tokens.text, margin: '14px 0 0', letterSpacing: '-0.01em' }}>{c.headline}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, (c.steps || []).length || 1)}, 1fr)`, gap: 18 }}>
          {(c.steps || []).map((st, i) => (
            <div key={i} style={{ padding: 22, backgroundColor: tokens.surface, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: tokens.radius }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: brand.colors.primary, color: onPrimaryText(brand.colors.primary), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 12, fontSize: 14 }}>{i + 1}</div>
              <div style={{ fontWeight: 700, color: tokens.text, marginBottom: 6, fontSize: 15 }}>{st.title}</div>
              <div style={{ fontSize: 13, color: tokens.textMute, lineHeight: 1.55 }}>{st.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TemplateSettlements = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '56px 32px', backgroundColor: tokens.surface, color: tokens.text, cursor: 'pointer' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Eyebrow text={c.eyebrow} tokens={tokens} brandColor={brand.colors.primary} />
          <h2 style={{ fontFamily: tokens.headlineFont, fontWeight: tokens.headlineWeight, fontSize: 28, color: tokens.text, margin: '14px 0 0', letterSpacing: '-0.01em' }}>{c.headline}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {(c.items || []).map((it, i) => (
            <div key={i} style={{ padding: 20, backgroundColor: tokens.canvas, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: tokens.radius }}>
              <Trophy size={20} color={brand.colors.accent} />
              <div style={{ fontSize: 28, fontWeight: 800, color: brand.colors.primary, marginTop: 12, fontFamily: tokens.headlineFont }}>{it.amount}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: tokens.text, marginTop: 6 }}>{it.case_type}</div>
              <div style={{ fontSize: 11, color: tokens.textMute, marginTop: 4 }}>{it.location}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TemplateTestimonials = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '56px 32px', backgroundColor: tokens.canvas, color: tokens.text, cursor: 'pointer' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Eyebrow text={c.eyebrow} tokens={tokens} brandColor={brand.colors.primary} />
          <h2 style={{ fontFamily: tokens.headlineFont, fontWeight: tokens.headlineWeight, fontSize: 28, color: tokens.text, margin: '14px 0 0', letterSpacing: '-0.01em' }}>{c.headline}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {(c.items || []).map((it, i) => (
            <div key={i} style={{ padding: 22, backgroundColor: tokens.surface, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: tokens.radius }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                {[0, 1, 2, 3, 4].map((s) => <Star key={s} size={13} fill={brand.colors.accent} color={brand.colors.accent} />)}
              </div>
              <p style={{ fontSize: 14, color: tokens.text, lineHeight: 1.6, margin: '0 0 14px' }}>{'“'}{it.quote}{'”'}</p>
              <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text }}>{it.author}</div>
              <div style={{ fontSize: 11, color: tokens.textMute, marginTop: 2 }}>{it.location}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TemplateGuarantee = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  // The whole section sits on brand.colors.primary, so all text/icons must use
  // the verified on-primary color (white breaks for a light/yellow primary).
  const onPrimary = onPrimaryText(brand.colors.primary)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '56px 32px', backgroundColor: brand.colors.primary, color: onPrimary, cursor: 'pointer' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={false} />
      <div style={{ maxWidth: 780, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
        <div>
          <ShieldCheck size={36} color={onPrimary} style={{ marginBottom: 14 }} />
          <h2 style={{ fontFamily: tokens.headlineFont, fontWeight: tokens.headlineWeight, fontSize: 32, color: onPrimary, margin: '0 0 10px', letterSpacing: '-0.01em' }}>{c.headline}</h2>
          <p style={{ fontSize: 14, color: onPrimary, opacity: 0.85, lineHeight: 1.5, margin: 0 }}>{c.subhead}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(c.lines || []).map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: onPrimary }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: `${onPrimary}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={13} strokeWidth={3} />
              </div>
              {line}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TemplateFaq = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  const [openIdx, setOpenIdx] = useState(0)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '56px 32px', backgroundColor: tokens.surface, color: tokens.text, cursor: 'pointer' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Eyebrow text={c.eyebrow} tokens={tokens} brandColor={brand.colors.primary} />
          <h2 style={{ fontFamily: tokens.headlineFont, fontWeight: tokens.headlineWeight, fontSize: 28, color: tokens.text, margin: '14px 0 0', letterSpacing: '-0.01em' }}>{c.headline}</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(c.items || []).map((it, i) => (
            <div key={i} style={{ backgroundColor: tokens.canvas, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: tokens.radius, overflow: 'hidden' }}>
              <button onClick={(e) => { e.stopPropagation(); setOpenIdx(openIdx === i ? -1 : i) }} style={{ width: '100%', padding: '14px 18px', backgroundColor: 'transparent', border: 'none', color: tokens.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                {it.q}
                {openIdx === i ? <ChevronUp size={15} color={tokens.textMute} /> : <ChevronDown size={15} color={tokens.textMute} />}
              </button>
              {openIdx === i && <div style={{ padding: '0 18px 16px', fontSize: 13, color: tokens.textMute, lineHeight: 1.55 }}>{it.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TemplateFinalCta = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <section onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '64px 32px', backgroundColor: tokens.canvas, color: tokens.text, cursor: 'pointer', textAlign: 'center' }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h2 style={{ fontFamily: tokens.headlineFont, fontWeight: tokens.headlineWeight, fontSize: 36, color: tokens.text, margin: '0 0 22px', letterSpacing: '-0.01em' }}>{c.headline}</h2>
        <button style={{ padding: '14px 32px', backgroundColor: brand.colors.primary, color: onPrimaryText(brand.colors.primary), border: 'none', borderRadius: tokens.radius, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {c.cta_label} <ArrowRight size={15} />
        </button>
        {c.secondary_line && <div style={{ fontSize: 13, color: tokens.textMute, marginTop: 16 }}>{c.secondary_line}</div>}
      </div>
    </section>
  )
}

const TemplateFooter = ({ section, tokens, brand, onEditSection }) => {
  const c = section.copy || {}
  const isDark = tokensAreDark(tokens)
  return (
    <footer onClick={() => onEditSection?.(section.id)} style={{ position: 'relative', padding: '32px 32px 24px', backgroundColor: tokens.surface, color: tokens.textMute, cursor: 'pointer', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
      <SectionEditOverlay onEdit={() => onEditSection?.(section.id)} dark={isDark} />
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text }}>{c.tagline}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {(c.links || []).map((l, i) => <span key={i} style={{ fontSize: 12, color: tokens.textMute }}>{l}</span>)}
          </div>
        </div>
        <div style={{ fontSize: 10, color: tokens.textMute, lineHeight: 1.6, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>{c.tcpa_text}</div>
        <div style={{ fontSize: 10, color: tokens.textMute, marginTop: 10 }}>{brand.legal.copyright}</div>
      </div>
    </footer>
  )
}

export const SECTION_RENDERERS = {
  header: TemplateHeader, hero: TemplateHero, ticker: TemplateTicker,
  authority: TemplateAuthority, story: TemplateStory, eligibility: TemplateEligibility,
  how_it_works: TemplateHowItWorks, settlements: TemplateSettlements,
  testimonials: TemplateTestimonials, guarantee: TemplateGuarantee,
  faq: TemplateFaq, final_cta: TemplateFinalCta, footer: TemplateFooter,
}

export const PREVIEW_BRAND_DEFAULT = {
  id: 'preview',
  name: 'Preview',
  displayName: 'Your Brand',
  shortName: 'YB',
  tagline: '',
  primaryDomain: '',
  logoUrl: '',
  logoUrlDark: '',
  faviconUrl: '',
  colors: { primary: '#475569', accent: '#64748b', background: '#334155', cardBg: '#1e293b', textOnDark: '#ffffff' },
  typography: { headlineFont: 'Inter', bodyFont: 'Inter', baseSize: 'md' },
  contact: { callNumber: '', callCtaText: 'CLICK HERE TO CALL', callCtaStyle: 'pill' },
  legal: { copyright: '(c) 2026 Your Brand', tcpaText: '', privacyUrl: '', termsUrl: '', defaultDisclaimer: 'Brand disclaimer goes here.' },
}

export const LivePreview = ({ landingPage, brand, quizDepLabel, quiz, onEditSection }) => {
  const tpl = TEMPLATES.find((t) => t.id === landingPage.templateId) || TEMPLATES[0]
  const tk = tpl.tokens
  const previewBrand = brand || PREVIEW_BRAND_DEFAULT
  return (
    <div className="lp-preview-root" style={{ backgroundColor: tk.canvas, color: tk.text, fontFamily: tk.bodyFont, borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px -12px rgba(0,0,0,0.4)', border: `1px solid ${T.border}` }}>
      {(landingPage.sections || []).filter((s) => s.isVisible !== false).map((section) => {
        const Renderer = SECTION_RENDERERS[section.type]
        if (!Renderer) return null
        const filled = { ...section, copy: fillAll(section.copy, previewBrand) }
        return <Renderer key={section.id} section={filled} tokens={tk} brand={previewBrand} quizDepLabel={quizDepLabel} quiz={quiz} onEditSection={onEditSection} />
      })}
      <style>{`
        .lp-preview-root section:hover .lp-section-overlay,
        .lp-preview-root header:hover .lp-section-overlay,
        .lp-preview-root footer:hover .lp-section-overlay { opacity: 1 !important; }
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap');
        @media (max-width: 900px) {
          .lp-preview-root [style*="grid-template-columns: 1.2fr 1fr"],
          .lp-preview-root [style*="gridTemplateColumns: 1.2fr 1fr"],
          .lp-preview-root [style*="grid-template-columns: 1fr 1fr"],
          .lp-preview-root [style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .lp-preview-root section, .lp-preview-root header, .lp-preview-root footer {
            padding-left: 24px !important; padding-right: 24px !important;
          }
        }
        @media (max-width: 640px) {
          .lp-preview-root h1 { font-size: clamp(28px, 8vw, 36px) !important; line-height: 1.15 !important; }
          .lp-preview-root h2 { font-size: clamp(22px, 6.5vw, 28px) !important; line-height: 1.2 !important; }
          .lp-preview-root h3 { font-size: clamp(18px, 5vw, 22px) !important; }
          .lp-preview-root section, .lp-preview-root header, .lp-preview-root footer {
            padding-top: 36px !important; padding-bottom: 36px !important;
            padding-left: 18px !important; padding-right: 18px !important;
          }
          .lp-preview-root [style*="grid-template-columns"], .lp-preview-root [style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important; gap: 16px !important;
          }
          .lp-preview-root a[href^="tel:"], .lp-preview-root button, .lp-preview-root .lp-cta { min-height: 48px; }
          .lp-preview-root [style*="display: flex"][style*="gap"] { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  )
}

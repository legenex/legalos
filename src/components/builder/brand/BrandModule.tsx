// @ts-nocheck
/* eslint-disable */
'use client'

// Ported verbatim from the LegalOS funnel-builder artifact: the entire Brand
// Identities subsystem (card grid, full-screen BrandEditor with 7 tabs,
// CreateBrandModal, AIBrandWizard, body-section editors). Persistence and AI
// are rewired from localStorage / direct Anthropic calls to server actions.

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Phone, ShieldCheck, Trophy, AlertCircle, Code2, CheckCircle2, Sparkles, Award, Star,
  Globe, Zap, ChevronUp, ChevronDown, Trash2, Plus, X, FileText, Palette, Loader2, Save,
  Building2, Edit3,
} from 'lucide-react'
import {
  T, genId, brandShortName, FONT_OPTIONS,
  Btn, Input, Textarea, Select, Label, Pill, IconBtn, ConfirmDialog, Toast, PageHeader, EmptyState,
} from '../ui'
import { saveBrandIdentity, createBrandSite, deleteBrandSite, aiGenerateBrand } from '@/app/(app)/admin/(top)/brands/brand-identities/actions'

// ============================================================================
// SEED BRAND (defaults for new + AI merge)
// ============================================================================
const buildSeedBrand = () => ({
  id: 'brand_cmc',
  name: 'CheckMyClaim',
  displayName: 'Check My Claim',
  tagline: '',
  logoUrl: '',
  logoUrlDark: '',
  faviconUrl: '',
  colors: {
    primary: '#1d8df6',
    accent: '#1d8df6',
    background: '#0a1a3a',
    cardBg: '#0d2447',
    textOnDark: '#ffffff',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  typography: { headlineFont: 'Fredoka', bodyFont: 'Fredoka', baseSize: 'md' },
  contact: { callNumber: '(833) 754-0124', callCtaText: 'CLICK HERE TO CALL', callCtaStyle: 'pill' },
  domains: ['checkmyclaim.co', 'qualify.checkmyclaim.co'],
  legal: {
    copyright: '© 2026 Check My Claim. All rights reserved.',
    tcpaText:
      'By submitting this form, I agree to be contacted by {{brand.displayName}} and its partner attorneys via phone, SMS, and email regarding my claim.',
    privacyUrl: 'https://checkmyclaim.co/privacy',
    termsUrl: 'https://checkmyclaim.co/terms',
    defaultDisclaimer: 'Attorney advertising. Not a law firm.',
  },
  bgPattern: 'plus',
  bgColor: '#0a1a3a',
  defaultBodySections: [
    { id: 's_call', type: 'CallCTA', enabled: true, config: { headline: "If you'd prefer to speak to someone right away, please call:" } },
    {
      id: 's_trust',
      type: 'TrustBlock',
      enabled: true,
      config: {
        headline: "We'll Never Stop Fighting For You",
        subheadline: 'We work with only the best attorneys to get you the compensation you deserve.',
        bullets: [
          { icon: 'Trophy', text: 'Vetted attorneys with proven track records' },
          { icon: 'CheckCircle2', text: 'Thousands of successful claims nationwide' },
          { icon: 'Sparkles', text: 'Personalized legal care for every client' },
          { icon: 'ShieldCheck', text: '100% commitment to your success' },
        ],
        statsCard: { label: 'TOTAL CLIENT WINS', value: '50,000+', badge: '$50M+ Recovered', description: 'Successful claims resolved nationwide, with millions recovered for clients' },
        ctaText: 'Get Your Free Claim Check',
      },
    },
    {
      id: 's_wins',
      type: 'RecentWins',
      enabled: true,
      config: {
        headline: 'Millions Recovered for Clients Just Like You',
        subheadline: 'We connect you with high-performing attorneys who know how to win cases and get you what you deserve.',
        wins: [
          { amount: '$132,700', name: 'Mike P, 31', location: 'Memphis, TN' },
          { amount: '$197,500', name: 'John M, 54', location: 'Tampa, FL' },
          { amount: '$114,600', name: 'Sarah J, 43', location: 'Los Angeles, CA' },
        ],
        ctaText: 'Claim Checker Now',
      },
    },
    { id: 's_disclaimer', type: 'Disclaimer', enabled: true, config: { useDefault: true, customText: '' } },
  ],
})

// ============================================================================
// BODY SECTION DEFS + ICONS
// ============================================================================
const BODY_SECTION_DEFS = {
  CallCTA: { label: 'Call CTA', icon: Phone, color: T.info, desc: 'Phone number callout' },
  TrustBlock: { label: 'Trust Block', icon: ShieldCheck, color: T.success, desc: 'Headline + bullets + stats card' },
  RecentWins: { label: 'Recent Wins', icon: Trophy, color: T.warning, desc: 'Settlement cards with amounts' },
  Disclaimer: { label: 'Disclaimer', icon: AlertCircle, color: T.textMute, desc: 'Legal disclaimer text' },
  CustomHTML: { label: 'Custom HTML', icon: Code2, color: T.pink, desc: 'Raw HTML escape hatch' },
}

const ICON_OPTIONS = { Trophy, CheckCircle2, Sparkles, ShieldCheck, Award, Star, Phone, Globe, Zap }

// ============================================================================
// BODY SECTION EDITOR
// ============================================================================
const BodySectionEditor = ({ section, onUpdate, onDelete, onMoveUp, onMoveDown }) => {
  const def = BODY_SECTION_DEFS[section.type]
  const Icon = def?.icon || FileText
  const cfg = section.config || {}
  const updCfg = (patch) => onUpdate({ ...section, config: { ...cfg, ...patch } })

  return (
    <div style={{ backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: `${def?.color}22`, color: def?.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{def?.label || section.type}</div>
          <div style={{ fontSize: 11, color: T.textMute }}>{def?.desc}</div>
        </div>
        <button onClick={() => onUpdate({ ...section, enabled: !section.enabled })} style={{ padding: '5px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600, backgroundColor: section.enabled ? `${T.success}22` : T.bgElev2, border: `1px solid ${section.enabled ? T.success : T.border}`, color: section.enabled ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{section.enabled ? 'ON' : 'OFF'}</button>
        <IconBtn icon={ChevronUp} onClick={onMoveUp} />
        <IconBtn icon={ChevronDown} onClick={onMoveDown} />
        <IconBtn icon={Trash2} onClick={onDelete} style={{ color: T.danger }} />
      </div>

      {section.type === 'CallCTA' && (
        <div>
          <Label>Headline above phone number</Label>
          <Input value={cfg.headline || ''} onChange={(e) => updCfg({ headline: e.target.value })} placeholder="If you'd prefer to speak to someone right away, please call:" />
          <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 6 }}>Phone number is pulled from the Brand&apos;s contact settings</div>
        </div>
      )}

      {section.type === 'TrustBlock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><Label>Headline</Label><Input value={cfg.headline || ''} onChange={(e) => updCfg({ headline: e.target.value })} /></div>
          <div><Label>Subheadline</Label><Textarea value={cfg.subheadline || ''} onChange={(e) => updCfg({ subheadline: e.target.value })} style={{ minHeight: 50 }} /></div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Label style={{ marginBottom: 0 }}>Bullets · {(cfg.bullets || []).length}</Label>
              <Btn variant="ghost" size="xs" icon={Plus} onClick={() => updCfg({ bullets: [...(cfg.bullets || []), { icon: 'CheckCircle2', text: '' }] })}>Add Bullet</Btn>
            </div>
            {(cfg.bullets || []).map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                <Select value={b.icon} onChange={(e) => { const a = [...cfg.bullets]; a[i] = { ...b, icon: e.target.value }; updCfg({ bullets: a }) }} style={{ width: 140, fontSize: 11 }}>
                  {Object.keys(ICON_OPTIONS).map((k) => <option key={k} value={k}>{k}</option>)}
                </Select>
                <Input value={b.text} onChange={(e) => { const a = [...cfg.bullets]; a[i] = { ...b, text: e.target.value }; updCfg({ bullets: a }) }} placeholder="Bullet text" style={{ flex: 1 }} />
                <IconBtn icon={X} onClick={() => updCfg({ bullets: cfg.bullets.filter((_, j) => j !== i) })} />
              </div>
            ))}
          </div>
          <div style={{ padding: 10, backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 6 }}>
            <Label>Stats Card</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <Input value={(cfg.statsCard || {}).label || ''} onChange={(e) => updCfg({ statsCard: { ...(cfg.statsCard || {}), label: e.target.value } })} placeholder="LABEL (e.g. TOTAL CLIENT WINS)" />
              <Input value={(cfg.statsCard || {}).value || ''} onChange={(e) => updCfg({ statsCard: { ...(cfg.statsCard || {}), value: e.target.value } })} placeholder="VALUE (e.g. 50,000+)" />
              <Input value={(cfg.statsCard || {}).badge || ''} onChange={(e) => updCfg({ statsCard: { ...(cfg.statsCard || {}), badge: e.target.value } })} placeholder="BADGE (e.g. $50M+ Recovered)" />
              <Input value={(cfg.statsCard || {}).description || ''} onChange={(e) => updCfg({ statsCard: { ...(cfg.statsCard || {}), description: e.target.value } })} placeholder="DESCRIPTION" />
            </div>
          </div>
          <div><Label>CTA Button Text (optional)</Label><Input value={cfg.ctaText || ''} onChange={(e) => updCfg({ ctaText: e.target.value })} placeholder="Get Your Free Claim Check" /></div>
        </div>
      )}

      {section.type === 'RecentWins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><Label>Headline</Label><Input value={cfg.headline || ''} onChange={(e) => updCfg({ headline: e.target.value })} /></div>
          <div><Label>Subheadline</Label><Textarea value={cfg.subheadline || ''} onChange={(e) => updCfg({ subheadline: e.target.value })} style={{ minHeight: 50 }} /></div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Label style={{ marginBottom: 0 }}>Wins · {(cfg.wins || []).length}</Label>
              <Btn variant="ghost" size="xs" icon={Plus} onClick={() => updCfg({ wins: [...(cfg.wins || []), { amount: '$0', name: '', location: '' }] })}>Add Win</Btn>
            </div>
            {(cfg.wins || []).map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                <Input value={w.amount} onChange={(e) => { const a = [...cfg.wins]; a[i] = { ...w, amount: e.target.value }; updCfg({ wins: a }) }} placeholder="$132,700" style={{ width: 110 }} />
                <Input value={w.name} onChange={(e) => { const a = [...cfg.wins]; a[i] = { ...w, name: e.target.value }; updCfg({ wins: a }) }} placeholder="Mike P, 31" style={{ flex: 1 }} />
                <Input value={w.location} onChange={(e) => { const a = [...cfg.wins]; a[i] = { ...w, location: e.target.value }; updCfg({ wins: a }) }} placeholder="Memphis, TN" style={{ flex: 1 }} />
                <IconBtn icon={X} onClick={() => updCfg({ wins: cfg.wins.filter((_, j) => j !== i) })} />
              </div>
            ))}
          </div>
          <div><Label>CTA Button Text</Label><Input value={cfg.ctaText || ''} onChange={(e) => updCfg({ ctaText: e.target.value })} /></div>
        </div>
      )}

      {section.type === 'Disclaimer' && (
        <div>
          <button onClick={() => updCfg({ useDefault: !cfg.useDefault })} style={{ marginBottom: 10, padding: '6px 11px', borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: cfg.useDefault ? `${T.info}22` : T.bgElev2, border: `1px solid ${cfg.useDefault ? T.info : T.border}`, color: cfg.useDefault ? T.info : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>
            {cfg.useDefault ? 'USE BRAND DEFAULT' : 'USE CUSTOM TEXT'}
          </button>
          {!cfg.useDefault && <Textarea value={cfg.customText || ''} onChange={(e) => updCfg({ customText: e.target.value })} placeholder="Custom disclaimer text..." />}
        </div>
      )}

      {section.type === 'CustomHTML' && (
        <div>
          <Label>HTML</Label>
          <Textarea value={cfg.html || ''} onChange={(e) => updCfg({ html: e.target.value })} placeholder="<div>...</div>" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, minHeight: 120 }} />
          <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 6 }}>Rendered as-is. Use at your own risk.</div>
        </div>
      )}
    </div>
  )
}

const AddBodySectionPicker = ({ onPick, onClose }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 110, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
      <div style={{ fontSize: 16, color: T.text, fontWeight: 600, marginBottom: 14 }}>Add Body Section</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.entries(BODY_SECTION_DEFS).map(([type, def]) => {
          const Icon = def.icon
          return (
            <button
              key={type}
              onClick={() => onPick(type)}
              style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', color: T.text, display: 'flex', flexDirection: 'column', gap: 6 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = def.color }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: `${def.color}22`, color: def.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={13} /></div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{def.label}</span>
              </div>
              <span style={{ fontSize: 11.5, color: T.textMute, lineHeight: 1.4 }}>{def.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  </div>
)

// ============================================================================
// CREATE BRAND MODAL
// ============================================================================
const CreateBrandModal = ({ onPick, onClose }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 110, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
      <div style={{ fontSize: 17, color: T.text, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 4 }}>Create New Brand</div>
      <div style={{ fontSize: 12.5, color: T.textMute, marginBottom: 18 }}>Pick how you want to get started</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { id: 'blank', icon: Palette, color: T.primary, title: 'Blank Brand', desc: 'Start from scratch and fill in everything manually' },
          { id: 'ai', icon: Sparkles, color: T.purple, title: 'Create with AI (from URL)', desc: 'Paste brand URLs - AI will scrape logos, colors, fonts, copy, legal' },
          { id: 'github', icon: Code2, color: T.info, title: 'Import from GitHub Repo', desc: 'Paste a public repo URL - AI will analyze the codebase for brand assets' },
        ].map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.id}
              onClick={() => onPick(opt.id)}
              style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', color: T.text, display: 'flex', alignItems: 'flex-start', gap: 10 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = opt.color }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: `${opt.color}22`, color: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={15} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{opt.title}</div>
                <div style={{ fontSize: 11.5, color: T.textMute, lineHeight: 1.4 }}>{opt.desc}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  </div>
)

// ============================================================================
// AI BRAND WIZARD (AI from URL / GitHub). AI runs server-side via invokeLLM.
// ============================================================================
const AIBrandWizard = ({ mode, onClose, onComplete }) => {
  const [urls, setUrls] = useState([''])
  const [repoUrl, setRepoUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState(null)

  const run = async () => {
    setBusy(true)
    setError(null)
    setProgress('Asking Claude...')
    try {
      const res = await aiGenerateBrand({ mode, urls: urls.filter(Boolean), repoUrl })
      if (!res.ok) throw new Error(res.error)
      setProgress('Building brand...')
      const parsed = res.brand || {}
      const seed = buildSeedBrand()
      const built = {
        ...seed,
        id: genId('brand'),
        defaultBodySections: [],
        ...parsed,
        colors: { ...seed.colors, ...(parsed.colors || {}) },
        typography: { ...seed.typography, ...(parsed.typography || {}) },
        contact: { ...seed.contact, ...(parsed.contact || {}) },
        legal: { ...seed.legal, ...(parsed.legal || {}) },
      }
      onComplete(built)
    } catch (err) {
      setError(err.message || 'Generation failed')
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 115, backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 7, backgroundColor: `${T.purple}22`, color: T.purple, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={16} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, color: T.text, fontWeight: 700, letterSpacing: '-0.01em' }}>{mode === 'github' ? 'Create Brand from GitHub' : 'Create Brand from URLs'}</div>
            <div style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>Claude will scrape and extract a complete brand identity</div>
          </div>
          <IconBtn icon={X} onClick={onClose} />
        </div>
        {mode === 'github' ? (
          <div>
            <Label>GitHub Repo URL</Label>
            <Input mono value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/legenex/checkmyclaim.co" />
          </div>
        ) : (
          <div>
            <Label>Brand URLs · {urls.filter(Boolean).length}</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {urls.map((u, i) => (
                <div key={i} style={{ display: 'flex', gap: 5 }}>
                  <Input mono value={u} onChange={(e) => { const a = [...urls]; a[i] = e.target.value; setUrls(a) }} placeholder="https://checkmyclaim.co" style={{ flex: 1 }} />
                  <IconBtn icon={X} onClick={() => setUrls(urls.filter((_, j) => j !== i))} />
                </div>
              ))}
            </div>
            <Btn variant="ghost" size="xs" icon={Plus} onClick={() => setUrls([...urls, ''])} style={{ marginTop: 8 }}>Add URL</Btn>
            <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 10 }}>Tip: include both the homepage and the privacy policy / terms pages for the most complete extraction</div>
          </div>
        )}
        {progress && <div style={{ marginTop: 14, padding: 10, backgroundColor: `${T.purple}11`, border: `1px solid ${T.purple}55`, borderRadius: 6, fontSize: 12, color: T.purple, display: 'flex', alignItems: 'center', gap: 8 }}><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> {progress}</div>}
        {error && <div style={{ marginTop: 14, padding: 10, backgroundColor: `${T.danger}11`, border: `1px solid ${T.danger}66`, borderRadius: 6, fontSize: 12, color: T.danger }}>Error: {error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <Btn variant="ghost" size="md" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="md" icon={busy ? Loader2 : Sparkles} onClick={run} disabled={busy || (mode === 'github' ? !repoUrl : !urls.some(Boolean))}>{busy ? 'Analyzing...' : 'Analyze & Create'}</Btn>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

// ============================================================================
// BRAND EDITOR (full screen, 7 tabs)
// ============================================================================
const BrandEditor = ({ brand, isDraft, onSave, onBack }) => {
  const [draft, setDraft] = useState(brand)
  const [dirty, setDirty] = useState(isDraft || false)
  const [tab, setTab] = useState('identity')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [leaveReq, setLeaveReq] = useState(false)
  useEffect(() => { setDraft(brand); setDirty(isDraft || false) }, [brand, isDraft])
  const update = (p) => { setDraft((d) => ({ ...d, ...p })); setDirty(true) }
  const updColors = (p) => update({ colors: { ...draft.colors, ...p } })
  const updTypo = (p) => update({ typography: { ...draft.typography, ...p } })
  const updContact = (p) => update({ contact: { ...draft.contact, ...p } })
  const updLegal = (p) => update({ legal: { ...draft.legal, ...p } })

  const sections = draft.defaultBodySections || []
  const addSection = (type) => { update({ defaultBodySections: [...sections, { id: genId('s'), type, enabled: true, config: {} }] }); setPickerOpen(false) }
  const updSection = (s) => update({ defaultBodySections: sections.map((x) => (x.id === s.id ? s : x)) })
  const delSection = (id) => update({ defaultBodySections: sections.filter((s) => s.id !== id) })
  const moveSection = (idx, dir) => { const a = [...sections]; const ni = idx + dir; if (ni < 0 || ni >= a.length) return;[a[idx], a[ni]] = [a[ni], a[idx]]; update({ defaultBodySections: a }) }

  const handleBack = () => { if (dirty) setLeaveReq(true); else onBack() }
  const handleSave = () => { onSave(draft); setDirty(false) }
  const handleSaveAndExit = () => { onSave(draft); setDirty(false); onBack() }

  const tabs = [
    { id: 'identity', label: 'Identity' }, { id: 'colors', label: 'Colors' },
    { id: 'typography', label: 'Typography' }, { id: 'contact', label: 'Contact' },
    { id: 'domains', label: 'Domains' }, { id: 'legal', label: 'Legal' },
    { id: 'sections', label: `Default Body Sections · ${sections.length}` },
  ]

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: T.bg }}>
        <div style={{ padding: '24px 40px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 24, color: T.text, fontWeight: 700, letterSpacing: '-0.025em' }}>{draft.name}</div>
                {isDraft && <Pill color={T.warning}>NEW · NOT SAVED</Pill>}
              </div>
              <div style={{ fontSize: 12.5, color: T.textMute, marginTop: 4 }}>{isDraft ? 'Brand will be created when you save' : 'Brand identity used by deployments that point to this brand'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {dirty && !isDraft && <Pill color={T.warning} style={{ alignSelf: 'center' }}>UNSAVED</Pill>}
              <Btn variant="ghost" size="md" onClick={handleBack}>Back</Btn>
              <Btn variant="secondary" size="md" icon={Save} onClick={handleSave}>Save</Btn>
              <Btn variant="primary" size="md" icon={Save} onClick={handleSaveAndExit}>Save & Exit</Btn>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 22, overflowX: 'auto' }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '11px 14px', backgroundColor: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? T.primary : 'transparent'}`, color: tab === t.id ? T.text : T.textMute, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap' }}>{t.label}</button>
            ))}
          </div>

          {tab === 'identity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><Label>Brand Name (internal)</Label><Input value={draft.name} onChange={(e) => update({ name: e.target.value })} /></div>
              <div><Label>Display Name (shown to users)</Label><Input value={draft.displayName} onChange={(e) => update({ displayName: e.target.value })} /></div>
              <div><Label>Tagline (optional)</Label><Input value={draft.tagline || ''} onChange={(e) => update({ tagline: e.target.value })} /></div>
              <div><Label>Logo URL (light)</Label><Input mono value={draft.logoUrl || ''} onChange={(e) => update({ logoUrl: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Logo URL (dark variant)</Label><Input mono value={draft.logoUrlDark || ''} onChange={(e) => update({ logoUrlDark: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Favicon URL</Label><Input mono value={draft.faviconUrl || ''} onChange={(e) => update({ faviconUrl: e.target.value })} placeholder="https://.../favicon.ico" /></div>
              <div>
                <Label>Background Pattern</Label>
                <Select value={draft.bgPattern || 'none'} onChange={(e) => update({ bgPattern: e.target.value })}>
                  <option value="none">None</option>
                  <option value="plus">Plus / Crosses (CMC style)</option>
                  <option value="dots">Dots</option>
                  <option value="grid">Grid</option>
                </Select>
              </div>
            </div>
          )}

          {tab === 'colors' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['primary', 'Primary / CTA'], ['accent', 'Accent'], ['background', 'Background'], ['cardBg', 'Card Background'], ['textOnDark', 'Text on dark'], ['success', 'Success'], ['warning', 'Warning'], ['danger', 'Danger']].map(([k, lbl]) => (
                <div key={k}>
                  <Label>{lbl}</Label>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <input type="color" value={draft.colors[k] || '#000000'} onChange={(e) => updColors({ [k]: e.target.value })} style={{ width: 40, height: 32, padding: 2, border: `1px solid ${T.border}`, borderRadius: 6, backgroundColor: T.bg, cursor: 'pointer' }} />
                    <Input mono value={draft.colors[k] || ''} onChange={(e) => updColors({ [k]: e.target.value })} style={{ flex: 1, fontSize: 11.5 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'typography' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><Label>Headline Font</Label><Select value={draft.typography.headlineFont} onChange={(e) => updTypo({ headlineFont: e.target.value })}>{FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></div>
              <div><Label>Body Font</Label><Select value={draft.typography.bodyFont} onChange={(e) => updTypo({ bodyFont: e.target.value })}>{FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></div>
              <div><Label>Base Size</Label><Select value={draft.typography.baseSize} onChange={(e) => updTypo({ baseSize: e.target.value })}><option value="sm">Small (14px)</option><option value="md">Medium (16px) - default</option><option value="lg">Large (18px)</option></Select></div>
              <div style={{ padding: 20, backgroundColor: draft.colors.background, border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: `"${draft.typography.headlineFont}", sans-serif`, color: draft.colors.textOnDark }}>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.015em' }}>Headline Preview</div>
                <div style={{ fontFamily: `"${draft.typography.bodyFont}", sans-serif`, fontSize: 14, opacity: 0.85 }}>This is body text using the body font.</div>
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><Label>Call Number</Label><Input mono value={draft.contact.callNumber || ''} onChange={(e) => updContact({ callNumber: e.target.value })} /></div>
              <div><Label>Call CTA Text</Label><Input value={draft.contact.callCtaText || ''} onChange={(e) => updContact({ callCtaText: e.target.value })} /></div>
              <div><Label>Call CTA Style</Label><Select value={draft.contact.callCtaStyle || 'pill'} onChange={(e) => updContact({ callCtaStyle: e.target.value })}><option value="pill">Pill</option><option value="square">Square</option><option value="text">Text only</option></Select></div>
            </div>
          )}

          {tab === 'domains' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12.5, color: T.textMute }}>
                Domains are attached, verified, and provisioned on the Domains page. This list reflects what is currently attached to this brand.
              </div>
              {draft.siteId == null ? (
                <div style={{ padding: 14, backgroundColor: T.bgElev, border: `1px dashed ${T.border}`, borderRadius: 8, fontSize: 12.5, color: T.textDim }}>
                  Save this brand first. Once it exists you can attach and verify domains for it on the Domains page.
                </div>
              ) : draft.__domains && draft.__domains.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {draft.__domains.map((d, i) => {
                    const tone = d.status === 'active' || d.status === 'verified' ? T.success : d.status === 'error' ? T.danger : T.warning
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                        <Globe size={14} color={T.textMute} />
                        <span style={{ flex: 1, fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: T.text }}>{d.host}</span>
                        {d.primary && <Pill color={T.success}>PRIMARY</Pill>}
                        <Pill color={tone}>{(d.status || 'pending').toUpperCase()}</Pill>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ padding: 14, backgroundColor: T.bgElev, border: `1px dashed ${T.border}`, borderRadius: 8, fontSize: 12.5, color: T.textDim }}>
                  No domains attached to this brand yet.
                </div>
              )}
              <a href="/admin/brands/domains" style={{ color: T.info, fontSize: 12.5, textDecoration: 'none' }}>Manage domains →</a>
            </div>
          )}

          {tab === 'legal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><Label>Copyright</Label><Input value={draft.legal.copyright || ''} onChange={(e) => updLegal({ copyright: e.target.value })} /></div>
              <div><Label>TCPA Consent Text</Label><Textarea value={draft.legal.tcpaText || ''} onChange={(e) => updLegal({ tcpaText: e.target.value })} style={{ minHeight: 80 }} /></div>
              <div><Label>Default Disclaimer</Label><Textarea value={draft.legal.defaultDisclaimer || ''} onChange={(e) => updLegal({ defaultDisclaimer: e.target.value })} style={{ minHeight: 60 }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><Label>Privacy URL</Label><Input mono value={draft.legal.privacyUrl || ''} onChange={(e) => updLegal({ privacyUrl: e.target.value })} /></div>
                <div><Label>Terms URL</Label><Input mono value={draft.legal.termsUrl || ''} onChange={(e) => updLegal({ termsUrl: e.target.value })} /></div>
              </div>
            </div>
          )}

          {tab === 'sections' && (
            <div>
              <div style={{ fontSize: 12.5, color: T.textMute, marginBottom: 14 }}>These body sections render below the quiz card on standalone pages by default. Deployments can override this.</div>
              {sections.map((s, i) => <BodySectionEditor key={s.id} section={s} onUpdate={updSection} onDelete={() => delSection(s.id)} onMoveUp={() => moveSection(i, -1)} onMoveDown={() => moveSection(i, 1)} />)}
              <Btn variant="secondary" size="md" icon={Plus} onClick={() => setPickerOpen(true)} style={{ marginTop: 8 }}>Add Section</Btn>
            </div>
          )}
        </div>
      </div>
      {pickerOpen && <AddBodySectionPicker onPick={addSection} onClose={() => setPickerOpen(false)} />}
      <ConfirmDialog
        open={leaveReq}
        title={isDraft ? 'Discard new brand?' : 'Leave brand editor?'}
        message={isDraft ? 'This brand has not been saved and will be discarded.' : 'You have unsaved changes.'}
        confirmText={isDraft ? 'Discard' : 'Save & Leave'}
        cancelText="Stay"
        tertiaryText={isDraft ? null : 'Discard'}
        onConfirm={() => { if (isDraft) { setLeaveReq(false); onBack() } else { handleSave(); setLeaveReq(false); onBack() } }}
        onCancel={() => setLeaveReq(false)}
        onTertiary={() => { setLeaveReq(false); onBack() }}
      />
    </>
  )
}

// ============================================================================
// BRAND IDENTITIES VIEW (card grid)
// ============================================================================
const BrandIdentitiesView = ({ brands, domains, onCreate, onUpdate, onDelete, onOpenEditor, onAICreate }) => {
  const [createPickerOpen, setCreatePickerOpen] = useState(false)

  const newBlankBrand = () => {
    const b = { ...buildSeedBrand(), id: genId('brand'), name: 'New Brand', displayName: 'New Brand', domains: [], defaultBodySections: [], siteId: null }
    onCreate(b)
    onOpenEditor(b.id, true)
  }

  const pickMode = (mode) => {
    setCreatePickerOpen(false)
    if (mode === 'blank') newBlankBrand()
    else onAICreate?.(mode)
  }

  return (
    <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
      <PageHeader
        title="Brand Identities"
        subtitle="Each brand owns its logo, colors, typography, phone, copyright and TCPA. The same identity drives quizzes, landing pages, and advertorials. Domains are managed separately."
        primaryAction={<Btn variant="primary" size="md" icon={Plus} onClick={() => setCreatePickerOpen(true)}>New Brand</Btn>}
      />
      {brands.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No brand identities yet"
          subtitle="Add your first brand to start deploying landing pages and quizzes."
          action={<Btn variant="primary" size="md" icon={Plus} onClick={newBlankBrand}>New Brand</Btn>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {brands.map((brand) => {
            const brandDomains = domains.filter((d) => d.brandId === brand.id)
            const primary = brand.colors?.primary || T.textMute
            const background = brand.colors?.background || T.bgElev2
            const accent = brand.colors?.accent || T.textMute
            return (
              <div key={brand.id} style={{ padding: 16, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${primary}, ${background})`, color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {brand.faviconUrl ? <img loading="lazy" decoding="async" src={brand.faviconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : brandShortName(brand)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand.displayName}</div>
                    <div style={{ fontSize: 11, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', marginTop: 2 }}>{brand.contact?.callNumber || brand.primaryDomain || ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 22, borderRadius: 4, backgroundColor: primary }} title={primary} />
                  <div style={{ flex: 1, height: 22, borderRadius: 4, backgroundColor: background }} title={background} />
                  <div style={{ flex: 1, height: 22, borderRadius: 4, backgroundColor: accent }} title={accent} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  <Pill color={brandDomains.length > 0 ? T.success : T.textLow}>{brandDomains.length} domains</Pill>
                  {brand.logoUrl && <Pill color={T.info}>logo</Pill>}
                  {brand.faviconUrl && <Pill color={T.purple}>favicon</Pill>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn variant="primary" size="sm" icon={Edit3} onClick={() => onOpenEditor(brand.id, false)} style={{ flex: 1, justifyContent: 'center' }} aria-label="Edit brand">Edit</Btn>
                  <IconBtn icon={Trash2} onClick={() => onDelete(brand.id)} style={{ color: T.danger }} aria-label="Delete brand" />
                </div>
              </div>
            )
          })}
        </div>
      )}
      {createPickerOpen && <CreateBrandModal onPick={pickMode} onClose={() => setCreatePickerOpen(false)} />}
    </div>
  )
}

// ============================================================================
// ORCHESTRATOR - mirrors the artifact App's brand_identities routing, but
// persists to the Site collection via server actions instead of localStorage.
// ============================================================================
export function BrandIdentitiesApp({ initialBrands }) {
  const router = useRouter()
  const [brands, setBrands] = useState(initialBrands)
  const [editingBrandId, setEditingBrandId] = useState(null)
  const [editingBrandIsDraft, setEditingBrandIsDraft] = useState(false)
  const [brandAIWizardMode, setBrandAIWizardMode] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const [, startTransition] = useTransition()

  useEffect(() => { setBrands(initialBrands) }, [initialBrands])

  // Domains for the card counts: synthesize one entry per attached domain so the
  // ported view's `domains.filter(d => d.brandId === brand.id)` keeps working.
  const domains = brands.flatMap((b) => Array.from({ length: b.__domainCount || 0 }, () => ({ brandId: b.id })))

  const createBrand = (b) => setBrands((arr) => [...arr, b])
  const updateBrand = (b) => setBrands((arr) => arr.map((x) => (x.id === b.id ? b : x)))

  const saveBrand = (b) => {
    startTransition(async () => {
      if (b.siteId == null) {
        const res = await createBrandSite({ brand: b })
        if (!res.ok) { setToast({ message: res.error, type: 'error' }); return }
        const newId = `site_${res.siteId}`
        setBrands((arr) => arr.map((x) => (x.id === b.id ? { ...b, id: newId, siteId: res.siteId, siteSlug: res.slug, primaryDomain: res.previewHost } : x)))
        setEditingBrandId((cur) => (cur === b.id ? newId : cur))
        setEditingBrandIsDraft(false)
        setToast({ message: 'Brand created.', type: 'success' })
      } else {
        const res = await saveBrandIdentity({ siteId: b.siteId, brand: b })
        if (!res.ok) { setToast({ message: res.error, type: 'error' }); return }
        setToast({ message: 'Saved.', type: 'success' })
      }
      router.refresh()
    })
  }

  const deleteBrand = (id) => {
    const b = brands.find((x) => x.id === id)
    setConfirm({
      title: 'Delete brand?',
      message: 'This permanently deletes the brand site. Domains and pages attached to it are affected. This cannot be undone.',
      onConfirm: () => {
        if (b?.siteId == null) {
          setBrands((arr) => arr.filter((x) => x.id !== id))
          setConfirm(null)
          return
        }
        startTransition(async () => {
          const res = await deleteBrandSite({ siteId: b.siteId })
          if (!res.ok) { setToast({ message: res.error, type: 'error' }); setConfirm(null); return }
          setBrands((arr) => arr.filter((x) => x.id !== id))
          setConfirm(null)
          router.refresh()
        })
      },
    })
  }

  const editingBrand = brands.find((b) => b.id === editingBrandId)

  return (
    <div style={{ backgroundColor: T.bg, color: T.text, fontFamily: '"Inter", system-ui, sans-serif', minHeight: '100vh' }}>
      {/* Load the builder font families so previews reflect the chosen typography. */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700&display=swap');`}</style>
      {editingBrand ? (
        <BrandEditor
          brand={editingBrand}
          isDraft={editingBrandIsDraft}
          onSave={(b) => { updateBrand(b); saveBrand(b) }}
          onBack={() => { setEditingBrandId(null); setEditingBrandIsDraft(false); router.refresh() }}
        />
      ) : (
        <BrandIdentitiesView
          brands={brands}
          domains={domains}
          onCreate={createBrand}
          onUpdate={updateBrand}
          onDelete={deleteBrand}
          onOpenEditor={(id, isDraft) => { setEditingBrandId(id); setEditingBrandIsDraft(!!isDraft) }}
          onAICreate={(mode) => setBrandAIWizardMode(mode)}
        />
      )}
      {brandAIWizardMode && (
        <AIBrandWizard
          mode={brandAIWizardMode}
          onClose={() => setBrandAIWizardMode(null)}
          onComplete={(brand) => { createBrand({ ...brand, siteId: null }); setBrandAIWizardMode(null); setEditingBrandId(brand.id); setEditingBrandIsDraft(true) }}
        />
      )}
      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} confirmText="Delete" onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}

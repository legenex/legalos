// @ts-nocheck
/* eslint-disable */
'use client'

// Ported verbatim: the 6 quiz visual templates + answer/progress/header render
// helpers used by the preview engine.

import { Check, ShieldCheck } from 'lucide-react'

export const TEMPLATE_CONFIGS = {
  default: {
    pageBg: (brand) => brand.colors.background,
    pageOverlay: () => 'none',
    pagePattern: (brand) => `linear-gradient(0deg, transparent 49.5%, ${brand.colors.primary}10 49.5%, ${brand.colors.primary}10 50.5%, transparent 50.5%), linear-gradient(90deg, transparent 49.5%, ${brand.colors.primary}10 49.5%, ${brand.colors.primary}10 50.5%, transparent 50.5%)`,
    patternSize: '40px 40px',
    cardBg: () => 'transparent',
    cardBorder: (brand) => `2px solid ${brand.colors.primary}`,
    cardRadius: 16,
    cardShadow: (brand) => `0 0 40px ${brand.colors.primary}33, inset 0 0 60px ${brand.colors.primary}08`,
    cardMaxWidth: 920,
    cardPadding: 'clamp(28px, 5vw, 48px) clamp(20px, 4vw, 36px)',
    textColor: (brand) => brand.colors.textOnDark,
    textColorMuted: (brand) => `${brand.colors.textOnDark}cc`,
    headlineSize: 'clamp(26px, 5.5vw, 44px)',
    headlineWeight: 700,
    headlineFamily: (brand) => `"${brand.typography.headlineFont}", "Fredoka", system-ui, sans-serif`,
    bodyFamily: (brand) => `"${brand.typography.bodyFont}", "Fredoka", system-ui, sans-serif`,
    buttonStyle: 'outlined-box',
    buttonRadius: 12,
    progressStyle: 'none',
    showStepBadge: false,
    showLockBadge: false,
    footerTrust: '',
    centered: true,
  },
  minimal: {
    pageBg: (brand) => brand.colors.background,
    pageOverlay: (brand) => `radial-gradient(circle at 50% 0%, ${brand.colors.primary}10 0%, transparent 50%)`,
    pagePattern: (brand) => `radial-gradient(${brand.colors.primary}15 1px, transparent 1px)`,
    patternSize: '24px 24px',
    cardBg: (brand) => brand.colors.cardBg,
    cardBorder: (brand) => `1px solid ${brand.colors.primary}22`,
    cardRadius: 18,
    cardShadow: (brand) => `0 20px 60px -10px ${brand.colors.primary}33, 0 0 0 1px rgba(255,255,255,0.04)`,
    cardMaxWidth: 720,
    cardPadding: 'clamp(20px, 5vw, 36px) clamp(20px, 4vw, 32px)',
    textColor: (brand) => brand.colors.textOnDark,
    textColorMuted: (brand) => `${brand.colors.textOnDark}b3`,
    headlineSize: 'clamp(20px, 4vw, 28px)',
    headlineWeight: 700,
    headlineFamily: (brand) => `"${brand.typography.headlineFont}", system-ui, sans-serif`,
    bodyFamily: (brand) => `"${brand.typography.bodyFont}", system-ui, sans-serif`,
    buttonStyle: 'radio-row',
    buttonRadius: 12,
    progressStyle: 'bar-thin',
    showStepBadge: true,
    stepBadgeFormat: (n, t) => `STEP ${n} OF ${t}`,
    stepBadgeColor: (brand) => brand.colors.primary,
    showLockBadge: true,
    lockText: 'Confidential · 60 seconds',
    footerTrust: '',
    centered: true,
  },
  editorial: {
    pageBg: () => '#f5ecd9',
    pageOverlay: () => 'none',
    pagePattern: () => 'none',
    cardBg: () => 'transparent',
    cardBorder: () => '1px solid rgba(0,0,0,0.1)',
    cardRadius: 4,
    cardShadow: () => 'none',
    cardMaxWidth: 980,
    cardPadding: 'clamp(28px, 5vw, 48px) clamp(20px, 5vw, 56px)',
    textColor: () => '#1a1a1a',
    textColorMuted: () => '#6b6354',
    headlineSize: 'clamp(24px, 5vw, 36px)',
    headlineWeight: 700,
    headlineFamily: () => '"Playfair Display", "Georgia", "Times New Roman", serif',
    bodyFamily: () => '"Inter", "Helvetica Neue", sans-serif',
    buttonStyle: 'square-check',
    buttonRadius: 4,
    buttonBorder: () => '1px solid #c9b88a',
    progressStyle: 'numeric',
    showStepBadge: true,
    stepBadgeFormat: (n, t) => `CASE INTAKE / STEP ${n} OF ${t}`,
    stepBadgeColor: () => '#8b7a4e',
    showLockBadge: false,
    footerTrust: 'CONFIDENTIAL · 60 SECONDS · NO SPAM',
    centered: true,
  },
  gradient: {
    pageBg: (brand) => `linear-gradient(135deg, ${brand.colors.primary} 0%, ${brand.colors.accent} 50%, ${brand.colors.cardBg} 100%)`,
    pageOverlay: () => 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)',
    pagePattern: () => 'none',
    cardBg: () => 'rgba(0,0,0,0.18)',
    cardBackdrop: 'blur(8px)',
    cardBorder: () => '1px solid rgba(255,255,255,0.12)',
    cardRadius: 24,
    cardShadow: () => '0 30px 80px -20px rgba(0,0,0,0.5)',
    cardMaxWidth: 820,
    cardPadding: 'clamp(28px, 6vw, 48px) clamp(20px, 5vw, 40px)',
    textColor: () => '#ffffff',
    textColorMuted: () => 'rgba(255,255,255,0.78)',
    headlineSize: 'clamp(26px, 5.5vw, 40px)',
    headlineWeight: 800,
    headlineFamily: (brand) => `"${brand.typography.headlineFont}", system-ui, sans-serif`,
    bodyFamily: (brand) => `"${brand.typography.bodyFont}", system-ui, sans-serif`,
    buttonStyle: 'radio-glass',
    buttonRadius: 999,
    progressStyle: 'bar-thick',
    showStepBadge: true,
    stepBadgeFormat: (n, t) => `STEP ${n} / ${t}`,
    stepBadgeColor: () => 'rgba(255,255,255,0.9)',
    showLockBadge: true,
    lockText: 'Encrypted',
    footerTrust: '256-bit encryption · TCPA-compliant · No spam, ever',
    centered: true,
  },
  glass: {
    pageBg: (brand) => `linear-gradient(180deg, ${brand.colors.background} 0%, ${brand.colors.cardBg} 100%)`,
    pageOverlay: (brand) => `radial-gradient(circle at 15% 30%, ${brand.colors.primary}25 0%, transparent 40%), radial-gradient(circle at 85% 70%, ${brand.colors.accent}20 0%, transparent 40%)`,
    pagePattern: () => 'none',
    cardBg: () => 'rgba(255,255,255,0.04)',
    cardBackdrop: 'blur(24px) saturate(180%)',
    cardBorder: () => '1px solid rgba(255,255,255,0.08)',
    cardRadius: 20,
    cardShadow: () => '0 25px 70px -15px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
    cardMaxWidth: 760,
    cardPadding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 36px)',
    textColor: (brand) => brand.colors.textOnDark,
    textColorMuted: (brand) => `${brand.colors.textOnDark}a0`,
    headlineSize: 'clamp(22px, 4.5vw, 32px)',
    headlineWeight: 700,
    headlineFamily: (brand) => `"${brand.typography.headlineFont}", system-ui, sans-serif`,
    bodyFamily: (brand) => `"${brand.typography.bodyFont}", system-ui, sans-serif`,
    buttonStyle: 'glass-pill',
    buttonRadius: 14,
    progressStyle: 'orb-dots',
    showStepBadge: true,
    stepBadgeFormat: (n, t) => `${String(n).padStart(2, '0')} / ${String(t).padStart(2, '0')}`,
    stepBadgeColor: (brand) => brand.colors.primary,
    showLockBadge: true,
    lockText: 'Confidential',
    footerTrust: 'No commitment',
    centered: true,
  },
  compact: {
    pageBg: (brand) => brand.colors.background,
    pageOverlay: () => 'none',
    pagePattern: () => 'none',
    cardBg: (brand) => brand.colors.cardBg,
    cardBorder: (brand) => `1px solid ${brand.colors.primary}22`,
    cardRadius: 12,
    cardShadow: (brand) => `0 8px 24px -8px ${brand.colors.primary}22`,
    cardMaxWidth: 560,
    cardPadding: '20px 18px',
    textColor: (brand) => brand.colors.textOnDark,
    textColorMuted: (brand) => `${brand.colors.textOnDark}aa`,
    headlineSize: 'clamp(18px, 4vw, 22px)',
    headlineWeight: 700,
    headlineFamily: (brand) => `"${brand.typography.headlineFont}", system-ui, sans-serif`,
    bodyFamily: (brand) => `"${brand.typography.bodyFont}", system-ui, sans-serif`,
    buttonStyle: 'compact-row',
    buttonRadius: 8,
    progressStyle: 'numeric-inline',
    showStepBadge: true,
    stepBadgeFormat: (n, t) => `${n} / ${t}`,
    stepBadgeColor: (brand) => brand.colors.primary,
    showLockBadge: false,
    footerTrust: '',
    centered: true,
    compactSpacing: true,
  },
}

export const getTemplateConfig = (templateId) => TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS.minimal

export const renderAnswerButton = (a, idx, isSelected, onClick, tc, brand) => {
  const C = brand.colors
  const primary = C.primary
  const fontFamily = tc.bodyFamily(brand)
  const baseStyle = { cursor: 'pointer', fontFamily, textAlign: 'left', width: '100%', transition: 'all 0.18s ease', display: 'flex', alignItems: 'center', gap: 12 }

  if (tc.buttonStyle === 'outlined-box') {
    return <button key={a.id || idx} onClick={onClick} className="quiz-btn quiz-btn-outlined-box" style={{ ...baseStyle, padding: 'clamp(16px, 3vw, 22px) clamp(16px, 3vw, 24px)', borderRadius: tc.buttonRadius, border: `2px solid ${primary}`, backgroundColor: isSelected ? primary : 'transparent', color: isSelected ? '#fff' : C.textOnDark, fontSize: 'clamp(15px, 3vw, 18px)', fontWeight: 600, justifyContent: 'center', textAlign: 'center', fontFamily: tc.headlineFamily(brand) }}>
      <span>{a.label}</span>
    </button>
  }
  if (tc.buttonStyle === 'radio-row') {
    return <button key={a.id || idx} onClick={onClick} className="quiz-btn quiz-btn-radio-row" style={{ ...baseStyle, padding: '16px 18px', borderRadius: tc.buttonRadius, border: `1px solid ${isSelected ? primary : `${primary}33`}`, backgroundColor: isSelected ? `${primary}15` : 'rgba(255,255,255,0.02)', color: tc.textColor(brand), fontSize: 'clamp(14px, 3vw, 15px)', fontWeight: 500 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelected ? primary : `${primary}66`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{isSelected && <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: primary }} />}</div>
      <span style={{ flex: 1 }}>{a.label}</span>
    </button>
  }
  if (tc.buttonStyle === 'square-check') {
    return <button key={a.id || idx} onClick={onClick} className="quiz-btn quiz-btn-square-check" style={{ ...baseStyle, padding: '18px 20px', borderRadius: tc.buttonRadius, border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? primary : '#c9b88a'}`, backgroundColor: isSelected ? `${primary}10` : 'rgba(0,0,0,0.02)', color: tc.textColor(brand), fontSize: 'clamp(15px, 3vw, 17px)', fontWeight: 500, fontFamily: tc.headlineFamily(brand) }}>
      <div style={{ width: 18, height: 18, borderRadius: 3, border: `2px solid ${isSelected ? primary : '#8b7a4e'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: isSelected ? primary : 'transparent' }}>{isSelected && <Check size={11} color="#fff" />}</div>
      <span style={{ flex: 1 }}>{a.label}</span>
    </button>
  }
  if (tc.buttonStyle === 'radio-glass') {
    return <button key={a.id || idx} onClick={onClick} className="quiz-btn quiz-btn-radio-glass" style={{ ...baseStyle, padding: '18px 22px', borderRadius: tc.buttonRadius, border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)'}`, backgroundColor: isSelected ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff' }} />}</div>
      <span style={{ flex: 1 }}>{a.label}</span>
    </button>
  }
  if (tc.buttonStyle === 'glass-pill') {
    return <button key={a.id || idx} onClick={onClick} className="quiz-btn quiz-btn-glass-pill" style={{ ...baseStyle, padding: '14px 18px', borderRadius: tc.buttonRadius, border: `1px solid ${isSelected ? primary : 'rgba(255,255,255,0.1)'}`, backgroundColor: isSelected ? `${primary}1f` : 'rgba(255,255,255,0.03)', color: tc.textColor(brand), fontSize: 'clamp(14px, 3vw, 15px)', fontWeight: 500, backdropFilter: 'blur(8px)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isSelected ? primary : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{a.label}</span>
    </button>
  }
  return <button key={a.id || idx} onClick={onClick} className="quiz-btn quiz-btn-compact-row" style={{ ...baseStyle, padding: '11px 14px', borderRadius: tc.buttonRadius, border: `1px solid ${isSelected ? primary : `${primary}33`}`, backgroundColor: isSelected ? `${primary}15` : 'rgba(255,255,255,0.02)', color: tc.textColor(brand), fontSize: 'clamp(13px, 2.8vw, 14px)', fontWeight: 500 }}>
    <span style={{ flex: 1 }}>{a.label}</span>
    {isSelected && <Check size={14} color={primary} />}
  </button>
}

export const renderProgressIndicator = (stepIdx, totalSteps, tc, brand) => {
  const C = brand.colors
  const pct = ((stepIdx + 1) / totalSteps) * 100
  if (tc.progressStyle === 'bar-thin') {
    return <div style={{ height: 3, backgroundColor: `${C.primary}22`, borderRadius: 999, marginBottom: 'clamp(16px, 3vw, 24px)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`, transition: 'width 0.4s' }} />
    </div>
  }
  if (tc.progressStyle === 'bar-thick') {
    return <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, marginBottom: 'clamp(20px, 4vw, 32px)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#fff', borderRadius: 999, transition: 'width 0.4s' }} />
    </div>
  }
  if (tc.progressStyle === 'orb-dots') {
    return <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
      {Array.from({ length: Math.min(totalSteps, 12) }, (_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i <= stepIdx ? C.primary : `${C.primary}33`, transition: 'all 0.3s', boxShadow: i === stepIdx ? `0 0 12px ${C.primary}` : 'none' }} />)}
    </div>
  }
  if (tc.progressStyle === 'numeric') {
    return <div style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: 24, paddingBottom: 8 }} />
  }
  return null
}

export const renderHeader = (stepIdx, totalSteps, tc, brand) => {
  if (!tc.showStepBadge && !tc.showLockBadge) return null
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(12px, 2.5vw, 20px)', flexWrap: 'wrap', gap: 8 }}>
    {tc.showStepBadge && <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 700, letterSpacing: '0.1em', color: tc.stepBadgeColor(brand) }}>{tc.stepBadgeFormat(stepIdx + 1, totalSteps)}</div>}
    {tc.showLockBadge && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'clamp(10px, 2vw, 12px)', color: tc.textColorMuted(brand), padding: '4px 10px', borderRadius: 999, border: `1px solid ${brand.colors.primary}22` }}><ShieldCheck size={11} /> {tc.lockText}</div>}
  </div>
}

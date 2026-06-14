// @ts-nocheck
/* eslint-disable */
'use client'

// Ported verbatim (adapted): the quiz builder orchestrator + top bar + list views
// + quiz DeploymentEditor + embed modal. Brands come from props (shared Brand
// Identities); persistence is via server actions instead of localStorage.

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, Settings, Eye, Power, PowerOff, ListChecks, Rocket, Edit3, Copy, Trash2,
  Plus, Code2, Save, X,
} from 'lucide-react'
import { T, Btn, Input, Select, Label, Pill, IconBtn, ConfirmDialog, Toast, PageHeader } from '../ui'
import { BodySectionEditor, AddBodySectionPicker, BODY_SECTION_DEFS } from '../body-sections'
import { NODE_TYPE_FOR_QTYPE, QUIZ_TEMPLATES, RENDER_MODES, PIXEL_PROVIDERS } from './config'
import { genId, mkA, defaultLeadFormFields, VISIBLE_BY_DEFAULT } from './seed-data'
import { StepListPanel, TierGridPanel } from './builder'
import { NodeEditorModal, SettingsModal, AddStepModal } from './editors'
import { QuizPreviewView, NodePreviewModal } from './preview'
import { auditQuizTemplateColors } from './templates'
import { brandShortName } from '../ui'
import { createQuiz, saveQuiz, cloneQuiz, deleteQuiz, saveQuizDeployment, deleteQuizDeployment } from '@/app/(app)/admin/(top)/quizzes/actions'

const QuizBuilderTopBar = ({ view, quizName, onBack, onSettings, onPreview, onPublish, isPublished, onBackToBuilder, previewSource }) => (
  <div style={{ position: 'sticky', top: 0, zIndex: 30, height: 56, backgroundColor: 'rgba(37,46,57,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0 }}>
    {view === 'builder' && <>
      <Btn variant="ghost" size="sm" icon={ChevronLeft} onClick={onBack}>Back</Btn>
      <div style={{ width: 1, height: 26, backgroundColor: T.border }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, color: T.text, fontWeight: 600, letterSpacing: '-0.01em' }}>{quizName}</span>
        <Pill color={isPublished ? T.success : T.textMute}>{isPublished ? 'LIVE' : 'DRAFT'}</Pill>
      </div>
    </>}
    {view === 'deploymentEdit' && <>
      <Btn variant="ghost" size="sm" icon={ChevronLeft} onClick={onBack}>Back</Btn>
      <div style={{ width: 1, height: 26, backgroundColor: T.border }} />
      <span style={{ fontSize: 13, color: T.text, fontWeight: 600, letterSpacing: '-0.01em' }}>Deployment</span>
    </>}
    <div style={{ flex: 1 }} />
    {view === 'builder' && <>
      <Btn variant="secondary" size="sm" icon={Settings} onClick={onSettings}>Settings</Btn>
      <Btn variant="secondary" size="sm" icon={Eye} onClick={onPreview}>Preview</Btn>
      <Btn variant={isPublished ? 'danger' : 'primary'} size="sm" icon={isPublished ? PowerOff : Power} onClick={onPublish}>{isPublished ? 'Unpublish' : 'Publish'}</Btn>
    </>}
    {view === 'preview' && <Btn variant="secondary" size="sm" icon={ChevronLeft} onClick={onBackToBuilder}>{previewSource === 'list-deployments' ? 'Back to Deployments' : previewSource === 'list-quizzes' ? 'Back to Quizzes' : 'Back to Builder'}</Btn>}
  </div>
)

const QuizBuilderTabBar = ({ active, onChange }) => {
  const tabs = [{ id: 'quizzes', label: 'Quizzes', icon: ListChecks }, { id: 'deployments', label: 'Deployments', icon: Rocket }]
  return <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px', borderBottom: `1px solid ${T.border}` }}>
    {tabs.map((t) => {
      const isActive = active === t.id
      const Icon = t.icon
      return <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '14px 18px', backgroundColor: 'transparent', border: 'none', borderBottom: `2px solid ${isActive ? T.primary : 'transparent'}`, color: isActive ? T.text : T.textMute, fontSize: 13, fontWeight: 500, fontFamily: '"Inter", sans-serif', cursor: 'pointer', marginBottom: -1, display: 'inline-flex', alignItems: 'center', gap: 7, letterSpacing: '-0.005em' }}>
        <Icon size={14} /> {t.label}
      </button>
    })}
  </div>
}

const QuizListView = ({ quizzes, brands, deployments, onOpen, onClone, onDelete, onTogglePublish, onPreview, onRename }) => {
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const startRename = (q) => { setRenamingId(q.id); setRenameDraft(q.name) }
  const commitRename = () => { if (renamingId && renameDraft.trim()) onRename?.(renamingId, renameDraft.trim()); setRenamingId(null) }
  return <div style={{ display: 'grid', gap: 12 }}>
    {quizzes.length === 0 ? <div style={{ padding: 60, textAlign: 'center', backgroundColor: T.bgElev, border: `1px dashed ${T.border}`, borderRadius: 10, color: T.textMute }}>No quizzes yet.</div> :
      quizzes.map((q) => {
        const quizDeployments = deployments.filter((d) => d.quizId === q.id)
        const usedBrandNames = [...new Set(quizDeployments.map((d) => brands.find((b) => b.id === d.brandId)?.displayName).filter(Boolean))]
        return <div key={q.id} style={{ backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: q.isPublished ? T.primarySoft : T.bgElev2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: q.isPublished ? T.primary : T.textMute }}><ListChecks size={18} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {renamingId === q.id ? (
                <input autoFocus value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} onBlur={commitRename} onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }} style={{ flex: 1, maxWidth: 360, backgroundColor: T.bg, border: `1px solid ${T.primary}`, borderRadius: 4, padding: '3px 8px', color: T.text, fontSize: 15, fontWeight: 600, outline: 'none' }} />
              ) : (
                <div onClick={(e) => { e.stopPropagation(); startRename(q) }} style={{ fontSize: 15, color: T.text, fontWeight: 600, letterSpacing: '-0.01em', cursor: 'text' }} title="Click to rename">{q.name}</div>
              )}
              <Pill color={q.isPublished ? T.success : T.textMute}>{q.isPublished ? 'LIVE' : 'DRAFT'}</Pill>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', flexWrap: 'wrap' }}>
              <span>{q.steps.length} steps</span><span>·</span><span>{q.nodes.length} variants</span><span>·</span><span>{q.tiers.length} tiers</span>
              {quizDeployments.length > 0 && <><span>·</span><span style={{ color: T.info }}>{quizDeployments.length} deployments</span></>}
              {usedBrandNames.length > 0 && <><span>·</span><span style={{ color: T.purple }}>{usedBrandNames.join(', ')}</span></>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="secondary" size="sm" icon={Eye} onClick={() => onPreview(q.id)}>Preview</Btn>
            <Btn variant="primary" size="sm" icon={Edit3} onClick={() => onOpen(q.id)}>Edit</Btn>
            <IconBtn icon={Copy} onClick={() => onClone(q.id)} title="Clone" />
            <IconBtn icon={q.isPublished ? PowerOff : Power} onClick={() => onTogglePublish(q.id)} />
            <IconBtn icon={Trash2} onClick={() => onDelete(q.id)} style={{ color: T.danger }} />
          </div>
        </div>
      })}
  </div>
}

const DeploymentListView = ({ deployments, quizzes, brands, onOpen, onClone, onDelete, onToggleStatus, onCopyEmbed, onPreview, onRename }) => {
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const startRename = (d) => { setRenamingId(d.id); setRenameDraft(d.name || '') }
  const commitRename = () => { if (renamingId) onRename?.(renamingId, renameDraft.trim()); setRenamingId(null) }
  return <div style={{ display: 'grid', gap: 12 }}>
    {deployments.length === 0 ? <div style={{ padding: 60, textAlign: 'center', backgroundColor: T.bgElev, border: `1px dashed ${T.border}`, borderRadius: 10, color: T.textMute }}>No deployments yet. A deployment maps a quiz and brand to a live URL.</div> :
      deployments.map((d) => {
        const q = quizzes.find((x) => x.id === d.quizId)
        const brand = brands.find((x) => x.id === d.brandId)
        const orphaned = !!d.brandId && !brand
        const domainStr = d.domain || ''
        const url = domainStr ? `https://${domainStr}${d.path || ''}` : `https://preview.legenex.com/q/${d.id}`
        const depName = d.name || (q ? `${q.name} · ${brand?.displayName || 'No brand'}` : 'Untitled deployment')
        const primary = brand?.colors?.primary
        const background = brand?.colors?.background
        return <div key={d.id} style={{ backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: primary ? `linear-gradient(135deg, ${primary}, ${background || primary})` : T.bgElev2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, overflow: 'hidden' }}>
            {brand?.faviconUrl ? <img loading="lazy" decoding="async" src={brand.faviconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : brand ? brandShortName(brand) : <Rocket size={18} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {renamingId === d.id ? (
                <input autoFocus value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} onBlur={commitRename} onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }} style={{ flex: 1, maxWidth: 360, backgroundColor: T.bg, border: `1px solid ${T.primary}`, borderRadius: 4, padding: '3px 8px', color: T.text, fontSize: 14, fontWeight: 600, outline: 'none' }} />
              ) : (
                <div onClick={(e) => { e.stopPropagation(); startRename(d) }} style={{ fontSize: 14, color: T.text, fontWeight: 600, cursor: 'text' }} title="Click to rename">{depName}</div>
              )}
              <Pill color={d.status === 'live' ? T.success : d.status === 'paused' ? T.warning : T.textMute}>{(d.status || 'draft').toUpperCase()}</Pill>
              {!domainStr && <Pill color={T.info}>PREVIEW URL</Pill>}
              {orphaned && <Pill color={T.warning}>Brand missing, select a new brand to fix</Pill>}
              {d.renderMode && <Pill color={d.renderMode === 'embed' ? T.info : T.purple}>{(d.renderMode || 'standalone').toUpperCase()}</Pill>}
              {d.templateId && <Pill color={T.textMute}>{(d.templateId || 'default').toUpperCase()}</Pill>}
            </div>
            <div style={{ fontSize: 11, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: T.textLow, fontFamily: '"JetBrains Mono", monospace', flexWrap: 'wrap' }}>
              <span>quiz: {q?.name || '.'}</span><span>·</span>
              <span style={{ color: primary || T.textMute }}>brand: {brand?.displayName || '.'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="secondary" size="sm" icon={Eye} onClick={() => onPreview(d.id)} aria-label="Preview deployment">Preview</Btn>
            {d.renderMode === 'embed' && <Btn variant="secondary" size="sm" icon={Code2} onClick={() => onCopyEmbed(d.id)} aria-label="Copy embed code">Embed Code</Btn>}
            <Btn variant="primary" size="sm" icon={Edit3} onClick={() => onOpen(d.id)} aria-label="Edit deployment">Edit</Btn>
            <IconBtn icon={Copy} onClick={() => onClone(d.id)} aria-label="Duplicate deployment" />
            <IconBtn icon={d.status === 'live' ? PowerOff : Power} onClick={() => onToggleStatus(d.id)} aria-label={d.status === 'live' ? 'Unpublish deployment' : 'Publish deployment'} />
            <IconBtn icon={Trash2} onClick={() => onDelete(d.id)} style={{ color: T.danger }} aria-label="Delete deployment" />
          </div>
        </div>
      })}
  </div>
}

const ListShell = ({ tab, onTabChange, onCreate, children }) => {
  const createLabel = { quizzes: 'New Quiz', deployments: 'New Deployment' }[tab]
  const subheading = { quizzes: 'Flow logic. The questions, routing, tier conditions.', deployments: 'Live URLs. A quiz at a domain and path under a specific brand.' }[tab]
  return <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
    <PageHeader title="Quizzes" subtitle={subheading} primaryAction={<Btn variant="primary" size="md" icon={Plus} onClick={onCreate}>{createLabel}</Btn>} />
    <QuizBuilderTabBar active={tab} onChange={onTabChange} />
    <div style={{ marginTop: 18 }}>{children}</div>
  </div>
}

const TrackingTab = ({ draft, update }) => {
  const pixels = draft.pixels || {}
  const updPixel = (provider, p) => update({ pixels: { ...pixels, [provider]: { ...(pixels[provider] || {}), ...p } } })
  const updUtm = (p) => update({ utm: { ...(draft.utm || {}), ...p } })
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
      <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 10 }}>UTM Defaults</div>
      <div style={{ fontSize: 11, color: T.textMute, marginBottom: 10 }}>Used when no UTM parameters are passed in the URL. Captured params override these.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div><Label>Source</Label><Input mono value={(draft.utm || {}).source || ''} onChange={(e) => updUtm({ source: e.target.value })} placeholder="meta" /></div>
        <div><Label>Medium</Label><Input mono value={(draft.utm || {}).medium || ''} onChange={(e) => updUtm({ medium: e.target.value })} placeholder="cpc" /></div>
        <div><Label>Campaign</Label><Input mono value={(draft.utm || {}).campaign || ''} onChange={(e) => updUtm({ campaign: e.target.value })} placeholder="mva_q1" /></div>
      </div>
    </div>
    <div style={{ fontSize: 10, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 8 }}>Pixels & CAPI Providers</div>
    {PIXEL_PROVIDERS.map((p) => {
      const cfg = pixels[p.id] || { enabled: false }
      return <div key={p.id} style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cfg.enabled ? 12 : 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: `${p.color}22`, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>{p.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{p.label}</div>
            <div style={{ fontSize: 11, color: T.textMute }}>{p.fields.length} configuration field{p.fields.length === 1 ? '' : 's'}</div>
          </div>
          <button onClick={() => updPixel(p.id, { enabled: !cfg.enabled })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: cfg.enabled ? `${T.success}22` : T.bgElev2, border: `1px solid ${cfg.enabled ? T.success : T.border}`, color: cfg.enabled ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{cfg.enabled ? 'ENABLED' : 'DISABLED'}</button>
        </div>
        {cfg.enabled && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {p.fields.map(([fkey, flabel]) => <div key={fkey}><Label>{flabel}</Label><Input mono value={cfg[fkey] || ''} onChange={(e) => updPixel(p.id, { [fkey]: e.target.value })} /></div>)}
        </div>}
      </div>
    })}
  </div>
}

const DeploymentEditor = ({ deployment, isDraft, quizzes, brands, onSave, onBack }) => {
  const [draft, setDraft] = useState(deployment)
  const [dirty, setDirty] = useState(isDraft || false)
  const [tab, setTab] = useState('basics')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [leaveReq, setLeaveReq] = useState(false)
  useEffect(() => { setDraft(deployment); setDirty(isDraft || false) }, [deployment, isDraft])
  const update = (p) => { setDraft((d) => ({ ...d, ...p })); setDirty(true) }
  const updHeader = (p) => update({ headerConfig: { ...draft.headerConfig, ...p } })
  const updHeaderCta = (p) => updHeader({ ctaButton: { ...(draft.headerConfig?.ctaButton || {}), ...p } })
  const updFooter = (p) => update({ footerConfig: { ...draft.footerConfig, ...p } })

  const brand = brands.find((b) => b.id === draft.brandId)
  const isOverriding = draft.bodySectionOverrides !== null && draft.bodySectionOverrides !== undefined
  const effectiveSections = isOverriding ? draft.bodySectionOverrides : (brand?.defaultBodySections || [])
  const toggleOverride = () => { if (isOverriding) update({ bodySectionOverrides: null }); else update({ bodySectionOverrides: JSON.parse(JSON.stringify(brand?.defaultBodySections || [])) }) }
  const updSection = (s) => update({ bodySectionOverrides: effectiveSections.map((x) => x.id === s.id ? s : x) })
  const delSection = (id) => update({ bodySectionOverrides: effectiveSections.filter((s) => s.id !== id) })
  const addSection = (type) => { update({ bodySectionOverrides: [...effectiveSections, { id: genId('s'), type, enabled: true, config: {} }] }); setPickerOpen(false) }
  const moveSection = (idx, dir) => { const a = [...effectiveSections]; const ni = idx + dir; if (ni < 0 || ni >= a.length) return;[a[idx], a[ni]] = [a[ni], a[idx]]; update({ bodySectionOverrides: a }) }

  const handleBack = () => { if (dirty) setLeaveReq(true); else onBack() }
  const handleSave = () => { onSave(draft); setDirty(false) }
  const handleSaveAndExit = () => { onSave(draft); setDirty(false); onBack() }

  const embedCode = `<div id="cmc-quiz-${draft.id}"></div>\n<script async\n  src="https://cdn.legenex.com/q.js"\n  data-deployment="${draft.id}"\n  data-target="cmc-quiz-${draft.id}"></script>`

  const tabs = [
    { id: 'basics', label: 'Basics' },
    { id: 'render', label: 'Render & Embed' },
    { id: 'chrome', label: 'Header / Footer', show: draft.renderMode === 'standalone' },
    { id: 'sections', label: `Body Sections${isOverriding ? ' · OVERRIDE' : ''}`, show: draft.renderMode === 'standalone' },
    { id: 'tracking', label: 'Tracking & Pixels' },
  ].filter((t) => t.show !== false)

  return <>
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: T.bg }}>
      <div style={{ padding: '24px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 24, color: T.text, fontWeight: 700, letterSpacing: '-0.025em', fontFamily: '"JetBrains Mono", monospace' }}>{draft.domain}{draft.path}</div>
              {isDraft && <Pill color={T.warning}>NEW · NOT SAVED</Pill>}
            </div>
            <div style={{ fontSize: 12.5, color: T.textMute, marginTop: 4 }}>{(quizzes.find((q) => q.id === draft.quizId) || {}).name || '-'} · {(brands.find((b) => b.id === draft.brandId) || {}).displayName || '-'} · {draft.renderMode}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {dirty && !isDraft && <Pill color={T.warning} style={{ alignSelf: 'center' }}>UNSAVED</Pill>}
            <Btn variant="ghost" size="md" onClick={handleBack}>Back</Btn>
            <Btn variant="secondary" size="md" icon={Save} onClick={handleSave}>Save</Btn>
            <Btn variant="primary" size="md" icon={Save} onClick={handleSaveAndExit}>Save & Exit</Btn>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 22, overflowX: 'auto' }}>
          {tabs.map((t) => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '11px 14px', backgroundColor: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? T.primary : 'transparent'}`, color: tab === t.id ? T.text : T.textMute, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap' }}>{t.label}</button>)}
        </div>

        {tab === 'basics' && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><Label>Quiz</Label><Select value={draft.quizId} onChange={(e) => update({ quizId: e.target.value })}><option value="">- pick quiz -</option>{quizzes.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}</Select></div>
            <div><Label>Brand</Label><Select value={draft.brandId} onChange={(e) => update({ brandId: e.target.value })}><option value="">- pick brand -</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.displayName}</option>)}</Select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div><Label>Domain</Label><Input mono value={draft.domain} onChange={(e) => update({ domain: e.target.value })} placeholder="qualify.checkmyclaim.co" /></div>
            <div><Label>Path</Label><Input mono value={draft.path} onChange={(e) => update({ path: e.target.value })} placeholder="/s/mva" /></div>
          </div>
          <div><Label>Status</Label><Select value={draft.status} onChange={(e) => update({ status: e.target.value })}><option value="draft">Draft</option><option value="live">Live</option><option value="paused">Paused</option></Select></div>
        </div>}

        {tab === 'render' && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Label>Render Mode</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {RENDER_MODES.map((m) => {
                const active = draft.renderMode === m.id
                return <button key={m.id} onClick={() => update({ renderMode: m.id })} style={{ padding: 14, backgroundColor: active ? T.bgElev2 : T.bgElev, border: `1px solid ${active ? T.primary : T.border}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', color: T.text }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 11.5, color: T.textMute }}>{m.desc}</div>
                </button>
              })}
            </div>
          </div>
          <div>
            <Label>Visual Template</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {QUIZ_TEMPLATES.map((t) => {
                const active = (draft.templateId || 'minimal') === t.id
                // Color-overlap detector: flag any template that would render
                // unreadable text for THIS brand before it ships.
                const violations = brand ? auditQuizTemplateColors(t.id, brand) : []
                const hasError = violations.some((v) => v.severity === 'error')
                const hasWarn = violations.length > 0
                return <button key={t.id} onClick={() => update({ templateId: t.id })} title={hasWarn ? violations.map((v) => v.message).join('\n') : undefined} style={{ padding: 12, backgroundColor: active ? T.bgElev2 : T.bgElev, border: `1px solid ${active ? T.primary : hasError ? T.danger : T.border}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', color: T.text, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${active ? T.primary : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{active && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: T.primary }} />}</div>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t.name}</span>
                    {hasWarn && <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, letterSpacing: '0.04em', backgroundColor: hasError ? `${T.danger}22` : `${T.warning}22`, color: hasError ? T.danger : T.warning }}>{hasError ? 'LOW CONTRAST' : 'CHECK'}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMute, lineHeight: 1.4 }}>{t.desc}</div>
                </button>
              })}
            </div>
            <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 6 }}>Brand colors still apply. The template controls layout, typography, button style, and overall feel. A <span style={{ color: T.warning }}>CHECK</span> / <span style={{ color: T.danger }}>LOW CONTRAST</span> tag means this template + the selected brand has a color overlap that hurts readability.</div>
          </div>
          {draft.renderMode === 'embed' && <>
            <div>
              <Label>Embed Preview Background</Label>
              <div style={{ display: 'flex', gap: 5 }}>
                <input type="color" value={draft.embedPreviewBg || '#0a1a3a'} onChange={(e) => update({ embedPreviewBg: e.target.value })} style={{ width: 40, height: 32, padding: 2, border: `1px solid ${T.border}`, borderRadius: 6, backgroundColor: T.bg, cursor: 'pointer' }} />
                <Input mono value={draft.embedPreviewBg || ''} onChange={(e) => update({ embedPreviewBg: e.target.value })} style={{ flex: 1 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Label style={{ marginBottom: 0 }}>Embed Code</Label>
                <Btn variant="secondary" size="xs" icon={Copy} onClick={() => { navigator.clipboard.writeText(embedCode) }}>Copy</Btn>
              </div>
              <pre style={{ margin: 0, padding: 12, backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, color: T.textDim, overflow: 'auto' }}>{embedCode}</pre>
            </div>
          </>}
        </div>}

        {tab === 'chrome' && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 10 }}>Header</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <button onClick={() => updHeader({ logoEnabled: !draft.headerConfig?.logoEnabled })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: draft.headerConfig?.logoEnabled ? `${T.success}22` : T.bgElev2, border: `1px solid ${draft.headerConfig?.logoEnabled ? T.success : T.border}`, color: draft.headerConfig?.logoEnabled ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{draft.headerConfig?.logoEnabled ? 'ON LOGO' : 'OFF LOGO'}</button>
              <button onClick={() => updHeaderCta({ enabled: !(draft.headerConfig?.ctaButton || {}).enabled })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: (draft.headerConfig?.ctaButton || {}).enabled ? `${T.success}22` : T.bgElev2, border: `1px solid ${(draft.headerConfig?.ctaButton || {}).enabled ? T.success : T.border}`, color: (draft.headerConfig?.ctaButton || {}).enabled ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{(draft.headerConfig?.ctaButton || {}).enabled ? 'ON CTA BUTTON' : 'OFF CTA BUTTON'}</button>
            </div>
            {(draft.headerConfig?.ctaButton || {}).enabled && <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: 8 }}>
              <div><Label>CTA Text</Label><Input value={(draft.headerConfig?.ctaButton || {}).text || ''} onChange={(e) => updHeaderCta({ text: e.target.value })} /></div>
              <div><Label>CTA URL</Label><Input mono value={(draft.headerConfig?.ctaButton || {}).url || ''} onChange={(e) => updHeaderCta({ url: e.target.value })} placeholder="tel:+1..." /></div>
              <div><Label>Font Size</Label><Input type="number" value={(draft.headerConfig?.ctaButton || {}).fontSize || 11} onChange={(e) => updHeaderCta({ fontSize: parseInt(e.target.value) || 11 })} /></div>
            </div>}
          </div>
          <div style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 10 }}>Footer</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <button onClick={() => updFooter({ logoEnabled: !draft.footerConfig?.logoEnabled })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: draft.footerConfig?.logoEnabled ? `${T.success}22` : T.bgElev2, border: `1px solid ${draft.footerConfig?.logoEnabled ? T.success : T.border}`, color: draft.footerConfig?.logoEnabled ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{draft.footerConfig?.logoEnabled ? 'ON LOGO' : 'OFF LOGO'}</button>
              <button onClick={() => updFooter({ showCopyright: !draft.footerConfig?.showCopyright })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: draft.footerConfig?.showCopyright ? `${T.success}22` : T.bgElev2, border: `1px solid ${draft.footerConfig?.showCopyright ? T.success : T.border}`, color: draft.footerConfig?.showCopyright ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{draft.footerConfig?.showCopyright ? 'ON COPYRIGHT' : 'OFF COPYRIGHT'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><Label>Logo Size (px)</Label><Input type="number" value={draft.footerConfig?.logoSize || 32} onChange={(e) => updFooter({ logoSize: parseInt(e.target.value) || 32 })} /></div>
              <div><Label>Font Size (px)</Label><Input type="number" value={draft.footerConfig?.fontSize || 12} onChange={(e) => updFooter({ fontSize: parseInt(e.target.value) || 12 })} /></div>
            </div>
          </div>
        </div>}

        {tab === 'sections' && <div>
          <div style={{ padding: 12, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{isOverriding ? 'Using Custom Sections' : `Inheriting from Brand: ${brand?.displayName || 'none'}`}</div>
              <div style={{ fontSize: 11.5, color: T.textMute, marginTop: 2 }}>{isOverriding ? 'These sections only apply to this deployment' : 'Changes to the brand will reflect here'}</div>
            </div>
            <Btn variant={isOverriding ? 'danger' : 'secondary'} size="md" onClick={toggleOverride}>{isOverriding ? 'Reset to Brand Default' : 'Override for this Deployment'}</Btn>
          </div>
          {effectiveSections.map((s, i) => isOverriding ?
            <BodySectionEditor key={s.id} section={s} onUpdate={updSection} onDelete={() => delSection(s.id)} onMoveUp={() => moveSection(i, -1)} onMoveDown={() => moveSection(i, 1)} /> :
            <div key={s.id} style={{ padding: 12, backgroundColor: T.bgElev, border: `1px dashed ${T.border}`, borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.7 }}>
              <Pill color={s.enabled ? T.success : T.textMute}>{s.enabled ? 'ON' : 'OFF'}</Pill>
              <div style={{ fontSize: 12.5, color: T.text }}>{BODY_SECTION_DEFS[s.type]?.label || s.type}</div>
              <div style={{ flex: 1, fontSize: 11, color: T.textMute }}>read-only · override to edit</div>
            </div>,
          )}
          {isOverriding && <Btn variant="secondary" size="md" icon={Plus} onClick={() => setPickerOpen(true)} style={{ marginTop: 8 }}>Add Section</Btn>}
        </div>}

        {tab === 'tracking' && <TrackingTab draft={draft} update={update} />}
      </div>
    </div>
    {pickerOpen && <AddBodySectionPicker onPick={addSection} onClose={() => setPickerOpen(false)} />}
    <ConfirmDialog open={leaveReq} title={isDraft ? 'Discard new deployment?' : 'Leave deployment editor?'} message={isDraft ? 'This deployment has not been saved and will be discarded.' : 'You have unsaved changes.'} confirmText={isDraft ? 'Discard' : 'Save & Leave'} cancelText="Stay" tertiaryText={isDraft ? null : 'Discard'} onConfirm={() => { if (isDraft) { setLeaveReq(false); onBack() } else { handleSave(); setLeaveReq(false); onBack() } }} onCancel={() => setLeaveReq(false)} onTertiary={() => { setLeaveReq(false); onBack() }} />
  </>
}

const EmbedCodeModal = ({ deployment, onClose }) => {
  if (!deployment) return null
  const code = `<div id="cmc-quiz-${deployment.id}"></div>\n<script async\n  src="https://cdn.legenex.com/q.js"\n  data-deployment="${deployment.id}"\n  data-target="cmc-quiz-${deployment.id}"></script>`
  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 120, backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 620, backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, color: T.text, fontWeight: 600 }}>Embed Code</div>
          <div style={{ fontSize: 12, color: T.textMute, marginTop: 2, fontFamily: '"JetBrains Mono", monospace' }}>{deployment.domain}{deployment.path}</div>
        </div>
        <div style={{ flex: 1 }} />
        <IconBtn icon={X} onClick={onClose} />
      </div>
      <pre style={{ margin: 0, padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: T.textDim, overflow: 'auto' }}>{code}</pre>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, gap: 8 }}>
        <Btn variant="ghost" size="md" onClick={onClose}>Close</Btn>
        <Btn variant="primary" size="md" icon={Copy} onClick={() => navigator.clipboard.writeText(code)}>Copy to Clipboard</Btn>
      </div>
    </div>
  </div>
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================
export function QuizBuilderApp({ initialQuizzes, initialDeployments, brands }) {
  const router = useRouter()
  const [tab, setTab] = useState('quizzes')
  const [view, setView] = useState('list')
  const [quizzes, setQuizzes] = useState(initialQuizzes)
  const [deployments, setDeployments] = useState(initialDeployments)
  const [draftDeployment, setDraftDeployment] = useState(null)
  const [currentQuizId, setCurrentQuizId] = useState(null)
  const [currentDeploymentId, setCurrentDeploymentId] = useState(null)
  const [selectedStepKey, setSelectedStepKey] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [previewNodeId, setPreviewNodeId] = useState(null)
  const [previewSource, setPreviewSource] = useState('builder')
  const [previewDeploymentId, setPreviewDeploymentId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddStep, setShowAddStep] = useState(false)
  const [pendingTiers, setPendingTiers] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingStepDelete, setPendingStepDelete] = useState(null)
  const [showEmbed, setShowEmbed] = useState(null)
  const [leaveBuilderReq, setLeaveBuilderReq] = useState(false)
  const [toast, setToast] = useState(null)
  const saveTimer = useRef(null)

  useEffect(() => { if (view === 'list') { setQuizzes(initialQuizzes); setDeployments(initialDeployments) } }, [initialQuizzes, initialDeployments, view])

  const quizPatch = (q) => ({ name: q.name, slug: q.slug, is_published: q.isPublished, tiers: q.tiers, steps: q.steps, nodes: q.nodes, custom_fields: q.customFields })

  const currentQuiz = quizzes.find((q) => q.id === currentQuizId)
  const currentDeployment = draftDeployment || deployments.find((d) => d.id === currentDeploymentId)
  const selectedNode = currentQuiz?.nodes.find((n) => n.id === selectedNodeId)
  const previewNode = currentQuiz?.nodes.find((n) => n.id === previewNodeId)
  const customFields = currentQuiz?.customFields || []

  const patchQuiz = (id, patch) => {
    let next
    setQuizzes((qs) => qs.map((q) => { if (q.id !== id) return q; next = { ...q, ...patch }; return next }))
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { if (next) saveQuiz({ id, patch: quizPatch(next) }) }, 450)
  }
  const patchNode = (qid, nid, patch) => {
    let next
    setQuizzes((qs) => qs.map((q) => { if (q.id !== qid) return q; next = { ...q, nodes: q.nodes.map((n) => n.id === nid ? { ...n, ...patch } : n) }; return next }))
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { if (next) saveQuiz({ id: qid, patch: quizPatch(next) }) }, 450)
  }

  const openQuiz = (id) => { setCurrentQuizId(id); const q = quizzes.find((x) => x.id === id); if (q?.steps[0]) setSelectedStepKey(q.steps[0].key); setView('builder') }
  const cloneQuizHandler = (id) => { cloneQuiz({ id }).then((res) => { if (res.ok) router.refresh(); else setToast({ message: res.error, type: 'error' }) }) }
  const deleteQuizHandler = (id) => setPendingDelete({ kind: 'quiz', id })
  const togglePublish = (id) => {
    const q = quizzes.find((x) => x.id === id)
    if (!q) return
    setQuizzes((qs) => qs.map((x) => x.id === id ? { ...x, isPublished: !x.isPublished } : x))
    saveQuiz({ id, patch: { is_published: !q.isPublished } }).then(() => router.refresh())
  }
  const createQuizHandler = () => {
    const q = { name: 'New Quiz', slug: `quiz-${Date.now().toString(36)}`, isPublished: false, tiers: [{ id: genId('t'), name: 'Tier 1', color: T.success }], steps: [{ key: 'welcome', label: 'Welcome' }], nodes: [], customFields: JSON.parse(JSON.stringify(currentQuiz?.customFields || [])) }
    createQuiz({ quiz: q }).then((res) => {
      if (!res.ok) { setToast({ message: res.error, type: 'error' }); return }
      setQuizzes((arr) => [...arr, { ...q, id: res.id }])
      openQuiz(res.id)
    })
  }

  const openDeployment = (id) => { setDraftDeployment(null); setCurrentDeploymentId(id); setView('deploymentEdit') }
  const cloneDeploymentHandler = (id) => { const d = deployments.find((x) => x.id === id); if (!d) return; setDraftDeployment({ ...JSON.parse(JSON.stringify(d)), id: '', path: `${d.path}-copy`, status: 'draft' }); setCurrentDeploymentId(null); setView('deploymentEdit') }
  const deleteDeploymentHandler = (id) => setPendingDelete({ kind: 'deployment', id })
  const toggleDeploymentStatus = (id) => {
    const d = deployments.find((x) => x.id === id)
    if (!d) return
    const status = d.status === 'live' ? 'paused' : 'live'
    setDeployments((ds) => ds.map((x) => x.id === id ? { ...x, status } : x))
    saveQuizDeployment({ deployment: { ...d, status } }).then(() => router.refresh())
  }
  const createDeployment = () => {
    const d = { id: '', quizId: quizzes[0]?.id || '', brandId: brands[0]?.id || '', domain: '', path: `/new-${Date.now().toString(36)}`, status: 'draft', renderMode: 'standalone', templateId: 'default', headerConfig: { logoEnabled: true, ctaButton: { enabled: true, text: 'CLICK HERE TO CALL', url: 'tel:', fontSize: 11 } }, footerConfig: { logoEnabled: true, logoSize: 32, showCopyright: true, fontSize: 12 }, bodySectionOverrides: null, embedPreviewBg: '#0a1a3a', utm: { source: '', medium: '', campaign: '' }, pixels: {} }
    setDraftDeployment(d); setCurrentDeploymentId(null); setView('deploymentEdit')
  }
  const persistDeployment = (d) => {
    saveQuizDeployment({ deployment: d }).then((res) => {
      if (!res.ok) { setToast({ message: res.error, type: 'error' }); return }
      setView('list'); setTab('deployments'); setDraftDeployment(null); router.refresh()
    })
  }

  const updateStepOrder = (order) => patchQuiz(currentQuizId, { steps: order.map((k) => currentQuiz.steps.find((s) => s.key === k)) })
  const renameStep = (key, newLabel) => patchQuiz(currentQuizId, { steps: currentQuiz.steps.map((s) => s.key === key ? { ...s, label: newLabel } : s) })
  const baseNewNode = (typeMeta, stepKey, tiers) => {
    const nodeType = NODE_TYPE_FOR_QTYPE[typeMeta.id] || 'question'
    const visibleByDef = VISIBLE_BY_DEFAULT[nodeType]
    return { id: genId('n'), stepKey, tiers, type: nodeType, fieldName: `field_${Date.now().toString(36).slice(-4)}`, questionType: typeMeta.id, headline: 'New Question', question: '', subheadline: '', isVisible: visibleByDef, answers: nodeType === 'question' ? [mkA('Answer 1'), mkA('Answer 2')] : nodeType === 'form' ? [mkA('Submitted')] : [], formFields: nodeType === 'form' ? defaultLeadFormFields() : undefined, conditions: nodeType === 'decision' ? [] : undefined, webhookMethod: (nodeType === 'webhook' || nodeType === 'verification') ? 'POST' : undefined, webhookUrl: '', webhookHeaders: [], webhookPayload: '', responseMappings: [], redirect: nodeType === 'endpoint' ? { mode: 'none', url: '', buttonText: 'Continue' } : undefined, dynamicContent: [], ai: { enabled: false }, enterScript: '', exitScript: '' }
  }
  const handleAddStepPick = (typeMeta) => {
    const newStepKey = `step_${Date.now().toString(36)}`
    const newNode = { ...baseNewNode(typeMeta, newStepKey, []), tiers: [] }
    patchQuiz(currentQuizId, { steps: [...currentQuiz.steps, { key: newStepKey, label: typeMeta.name }], nodes: [...currentQuiz.nodes, newNode] })
    setSelectedStepKey(newStepKey); setSelectedNodeId(newNode.id); setShowAddStep(false)
  }
  const addVariantToCell = (stepKey, tiers) => { setPendingTiers({ stepKey, tiers }); setShowAddStep(true) }
  const addVariantToStep = (stepKey) => addVariantToCell(stepKey, [])
  const handleAddVariantPick = (typeMeta) => {
    if (!pendingTiers) return handleAddStepPick(typeMeta)
    const { stepKey, tiers } = pendingTiers
    const newNode = baseNewNode(typeMeta, stepKey, tiers)
    patchQuiz(currentQuizId, { nodes: [...currentQuiz.nodes, newNode] })
    setSelectedNodeId(newNode.id); setShowAddStep(false); setPendingTiers(null)
  }
  const deleteStepRequest = (key) => setPendingStepDelete(key)
  const confirmDeleteStep = () => { if (!pendingStepDelete) return; patchQuiz(currentQuizId, { steps: currentQuiz.steps.filter((s) => s.key !== pendingStepDelete), nodes: currentQuiz.nodes.filter((n) => n.stepKey !== pendingStepDelete) }); if (selectedStepKey === pendingStepDelete) setSelectedStepKey(null); setPendingStepDelete(null) }
  const saveNode = (node) => patchNode(currentQuizId, node.id, node)
  const deleteNode = (nid) => patchQuiz(currentQuizId, { nodes: currentQuiz.nodes.filter((n) => n.id !== nid) })

  const confirmDelete = () => {
    if (!pendingDelete) return
    const { kind, id } = pendingDelete
    if (kind === 'quiz') { deleteQuiz({ id }).then((res) => { if (res.ok) { setQuizzes((qs) => qs.filter((q) => q.id !== id)); router.refresh() } else setToast({ message: res.error, type: 'error' }) }) }
    if (kind === 'deployment') { deleteQuizDeployment({ id }).then((res) => { if (res.ok) { setDeployments((ds) => ds.filter((d) => d.id !== id)); router.refresh() } else setToast({ message: res.error, type: 'error' }) }) }
    setPendingDelete(null)
  }

  const handleBackFromBuilder = () => setLeaveBuilderReq(true)
  const doLeaveBuilder = () => { clearTimeout(saveTimer.current); if (currentQuiz) saveQuiz({ id: currentQuiz.id, patch: quizPatch(currentQuiz) }).then(() => router.refresh()); setLeaveBuilderReq(false); setView('list'); setCurrentQuizId(null); setSelectedStepKey(null); setSelectedNodeId(null); setTab('quizzes') }

  const previewBrand = (previewDeploymentId ? brands.find((b) => b.id === deployments.find((d) => d.id === previewDeploymentId)?.brandId) : null) || brands.find((b) => deployments.find((d) => d.quizId === currentQuiz?.id && d.brandId === b.id)) || brands[0]
  const previewDep = previewDeploymentId ? deployments.find((d) => d.id === previewDeploymentId) : deployments.find((d) => d.quizId === currentQuiz?.id)

  return <div style={{ minHeight: '100vh', backgroundColor: T.bg, color: T.text, fontFamily: '"Inter", system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

    {view !== 'list' && <QuizBuilderTopBar
      view={view}
      quizName={currentQuiz?.name}
      onBack={view === 'builder' ? handleBackFromBuilder : view === 'deploymentEdit' ? () => { setView('list'); setTab('deployments'); setDraftDeployment(null); setCurrentDeploymentId(null) } : () => setView('list')}
      onSettings={() => setShowSettings(true)}
      onPreview={() => { setPreviewSource('builder'); setPreviewDeploymentId(null); setView('preview') }}
      onPublish={() => togglePublish(currentQuizId)}
      isPublished={currentQuiz?.isPublished}
      onBackToBuilder={() => { if (previewSource === 'list-deployments') { setView('list'); setTab('deployments') } else if (previewSource === 'list-quizzes') { setView('list'); setTab('quizzes') } else { setView('builder') } }}
      previewSource={previewSource}
    />}

    {view === 'list' && <ListShell tab={tab} onTabChange={setTab} onCreate={tab === 'quizzes' ? createQuizHandler : createDeployment}>
      {tab === 'quizzes' && <QuizListView quizzes={quizzes} brands={brands} deployments={deployments} onOpen={openQuiz} onClone={cloneQuizHandler} onDelete={deleteQuizHandler} onTogglePublish={togglePublish} onPreview={(id) => { openQuiz(id); setPreviewSource('list-quizzes'); setPreviewDeploymentId(null); setView('preview') }} onRename={(id, name) => patchQuiz(id, { name })} />}
      {tab === 'deployments' && <DeploymentListView deployments={deployments} quizzes={quizzes} brands={brands} onOpen={openDeployment} onClone={cloneDeploymentHandler} onDelete={deleteDeploymentHandler} onToggleStatus={toggleDeploymentStatus} onCopyEmbed={(id) => setShowEmbed(id)} onPreview={(id) => { const dep = deployments.find((d) => d.id === id); if (!dep) return; openQuiz(dep.quizId); setPreviewSource('list-deployments'); setPreviewDeploymentId(id); setView('preview') }} onRename={(id, name) => { const d = deployments.find((x) => x.id === id); setDeployments((ds) => ds.map((x) => x.id === id ? { ...x, name } : x)); if (d) saveQuizDeployment({ deployment: { ...d, name } }) }} />}
    </ListShell>}

    {view === 'builder' && currentQuiz && <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <StepListPanel quiz={currentQuiz} selectedStepKey={selectedStepKey} selectedNodeId={selectedNodeId} onSelectStep={setSelectedStepKey} onSelectNode={setSelectedNodeId} onUpdateStepOrder={updateStepOrder} onAddStepClick={() => { setPendingTiers(null); setShowAddStep(true) }} onDeleteStepRequest={deleteStepRequest} onAddVariant={addVariantToStep} onRenameStep={renameStep} onPreviewNode={setPreviewNodeId} />
      <TierGridPanel quiz={currentQuiz} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} onAddVariantToCell={addVariantToCell} />
    </div>}

    {view === 'preview' && currentQuiz && <QuizPreviewView quiz={currentQuiz} brand={previewBrand} deployment={previewDep} brands={brands} deployments={deployments} onBackToBuilder={() => setView('builder')} />}

    {view === 'deploymentEdit' && currentDeployment && <DeploymentEditor deployment={currentDeployment} isDraft={!!draftDeployment} quizzes={quizzes} brands={brands} onSave={persistDeployment} onBack={() => { setView('list'); setTab('deployments'); setDraftDeployment(null); setCurrentDeploymentId(null) }} />}

    {selectedNode && <NodeEditorModal node={selectedNode} quiz={currentQuiz} customFields={customFields} onSave={saveNode} onClose={() => setSelectedNodeId(null)} onDelete={deleteNode} onRenameStep={renameStep} />}

    {previewNode && <NodePreviewModal node={previewNode} brand={brands[0]} customFields={customFields} onClose={() => setPreviewNodeId(null)} />}

    {showSettings && currentQuiz && <SettingsModal quiz={currentQuiz} onClose={() => setShowSettings(false)} onSave={(q) => { patchQuiz(currentQuizId, q); setShowSettings(false) }} />}

    {showAddStep && <AddStepModal open={showAddStep} onClose={() => { setShowAddStep(false); setPendingTiers(null) }} onPick={pendingTiers ? handleAddVariantPick : handleAddStepPick} />}

    {showEmbed && <EmbedCodeModal deployment={deployments.find((d) => d.id === showEmbed)} onClose={() => setShowEmbed(null)} />}

    <ConfirmDialog open={!!pendingDelete} title={`Delete this ${pendingDelete?.kind}?`} message="This cannot be undone." confirmText="Delete" onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />
    <ConfirmDialog open={!!pendingStepDelete} title="Delete this step?" message="All variants on this step will be removed." confirmText="Delete step" onConfirm={confirmDeleteStep} onCancel={() => setPendingStepDelete(null)} />
    <ConfirmDialog open={leaveBuilderReq} title="Leave builder?" message="Your work is auto-saved. Save and leave will sync everything." confirmText="Save and Leave" cancelText="Stay" onConfirm={doLeaveBuilder} onCancel={() => setLeaveBuilderReq(false)} />
    <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
  </div>
}

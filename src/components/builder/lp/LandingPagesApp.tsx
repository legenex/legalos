// @ts-nocheck
/* eslint-disable */
'use client'

// Ported verbatim from the artifact: the Landing Pages module (list + Deployments
// tab + 3-pane builder + section/template modals + deployment editor + AI wizard +
// preview). localStorage is replaced by server actions; direct Anthropic calls go
// through invokeLLM server actions.

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Rocket, Eye, Edit3, Copy, Power, PowerOff, Trash2, EyeOff, Layers, Sparkles, Save,
  X, Plus, Check, Loader2, Palette, ChevronRight, MoveUp, MoveDown, Plug,
} from 'lucide-react'
import {
  T, genId, Btn, Input, Textarea, Select, Label, Pill, IconBtn, ConfirmDialog, Toast,
  PageHeader, EmptyState, TabBar, TopBar, brandShortName,
} from '../ui'
import {
  TEMPLATES, ANGLES, SECTION_TYPES, SECTION_TYPE_META, SEED_SECTION_COPY, buildSeedSections,
  LivePreview, PREVIEW_BRAND_DEFAULT,
} from './render'
import { createLP, saveLP, cloneLP, deleteLP, saveDeployment, deleteDeployment, generateLPCopy, aiRewriteSection } from '@/app/(app)/admin/(top)/landing-pages/actions'

// ============================================================================
// LANDING PAGE LIST VIEW
// ============================================================================
const LandingPagesListView = ({ landingPages, lpDeployments, onOpen, onClone, onDelete, onTogglePublish, onPreview, onRename }) => {
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  if (landingPages.length === 0) {
    return <EmptyState icon={Rocket} title="No landing pages yet" subtitle="Build your first brandless landing page. Then deploy it to one or more brand domains." />
  }
  const startRename = (lp) => { setRenamingId(lp.id); setRenameDraft(lp.name) }
  const commitRename = () => { if (renamingId && renameDraft.trim()) onRename(renamingId, renameDraft.trim()); setRenamingId(null) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {landingPages.map((lp) => {
        const template = TEMPLATES.find((t) => t.id === lp.templateId)
        const angle = ANGLES.find((a) => a.id === lp.angle)
        const depCount = lpDeployments.filter((d) => d.landingPageId === lp.id).length
        return (
          <div key={lp.id} style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 9, background: template?.tokens?.heroBg || T.bg, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Rocket size={16} color={T.primary} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {renamingId === lp.id ? (
                  <input autoFocus value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} onBlur={commitRename} onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }} style={{ flex: 1, maxWidth: 300, backgroundColor: T.bg, border: `1px solid ${T.primary}`, borderRadius: 4, padding: '3px 8px', color: T.text, fontSize: 14, fontWeight: 600, outline: 'none' }} />
                ) : (
                  <span onClick={(e) => { e.stopPropagation(); startRename(lp) }} style={{ fontSize: 14, fontWeight: 600, color: T.text, cursor: 'text' }} title="Click to rename">{lp.name}</span>
                )}
                <Pill color={lp.isPublished ? T.success : T.warning}>{lp.isPublished ? 'LIVE' : 'DRAFT'}</Pill>
                <Pill color={T.purple}>{template?.name}</Pill>
                <Pill color={T.info}>{angle?.label}</Pill>
                <Pill color={T.textMute}>{lp.sections.length} sections</Pill>
                <Pill color={depCount > 0 ? T.success : T.textLow}>{depCount} deployments</Pill>
              </div>
              <div style={{ fontSize: 11, color: T.textLow, fontFamily: '"JetBrains Mono", monospace' }}>/{lp.slug}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn variant="ghost" size="sm" icon={Eye} onClick={() => onPreview(lp.id)}>Preview</Btn>
              <Btn variant="primary" size="sm" icon={Edit3} onClick={() => onOpen(lp.id)}>Edit</Btn>
              <IconBtn icon={Copy} onClick={() => onClone(lp)} />
              <IconBtn icon={lp.isPublished ? PowerOff : Power} onClick={() => onTogglePublish(lp.id)} />
              <IconBtn icon={Trash2} onClick={() => onDelete(lp.id)} style={{ color: T.danger }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// LP DEPLOYMENT LIST VIEW
// ============================================================================
const LPDeploymentListView = ({ deployments, landingPages, brands, quizDeployments, quizzes, domains, onOpen, onDelete, onToggleStatus, onPreview, onRename }) => {
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  if (deployments.length === 0) {
    return <EmptyState icon={Plug} title="No deployments yet" subtitle="A deployment maps a landing page to a brand and domain. The same page can be deployed multiple times to different brands." />
  }
  const startRename = (dep) => { setRenamingId(dep.id); setRenameDraft(dep.name || '') }
  const commitRename = () => { if (renamingId) { onRename(renamingId, renameDraft.trim()); setRenamingId(null) } }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {deployments.map((dep) => {
        const lp = landingPages.find((p) => p.id === dep.landingPageId)
        const brand = brands.find((b) => b.id === dep.brandId)
        const orphaned = !!dep.brandId && !brand
        const qdep = quizDeployments.find((q) => q.id === dep.quizDeploymentId)
        const quiz = quizzes.find((q) => q.id === qdep?.quizId)
        const refDomain = dep.domainId ? domains.find((d) => d.id === dep.domainId) : null
        const orphanedDomain = !!dep.domainId && !refDomain
        const domainStr = refDomain?.domain || dep.domain || ''
        const url = domainStr ? `https://${domainStr}${dep.path || ''}` : `https://preview.legenex.com/lp/${dep.id}`
        const depName = dep.name || (lp ? `${lp.name} · ${brand?.displayName || 'No brand'}` : 'Untitled deployment')
        const primary = brand?.colors?.primary
        const background = brand?.colors?.background
        return (
          <div key={dep.id} style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 9, background: primary ? `linear-gradient(135deg, ${primary}, ${background || primary})` : T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0, overflow: 'hidden' }}>
              {brand?.faviconUrl ? <img loading="lazy" decoding="async" src={brand.faviconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : brand ? brandShortName(brand) : <Rocket size={18} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                {renamingId === dep.id ? (
                  <input autoFocus value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} onBlur={commitRename} onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }} style={{ flex: 1, backgroundColor: T.bg, border: `1px solid ${T.primary}`, borderRadius: 4, padding: '3px 8px', color: T.text, fontSize: 13, fontWeight: 600, outline: 'none' }} />
                ) : (
                  <span onClick={(e) => { e.stopPropagation(); startRename(dep) }} style={{ fontSize: 13, fontWeight: 600, color: T.text, cursor: 'text' }} title="Click to rename">{depName}</span>
                )}
                <Pill color={dep.status === 'live' ? T.success : dep.status === 'paused' ? T.warning : T.textLow}>{(dep.status || 'draft').toUpperCase()}</Pill>
                {!domainStr && <Pill color={T.info}>PREVIEW URL</Pill>}
                {orphaned && <Pill color={T.warning}>Brand missing, select a new brand to fix</Pill>}
                {orphanedDomain && <Pill color={T.warning}>Domain missing, falling back to preview URL</Pill>}
              </div>
              <div style={{ fontSize: 11, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
              <div style={{ fontSize: 10, color: T.textLow, marginTop: 3, display: 'flex', gap: 10 }}>
                <span>LP: {lp?.name || 'unknown'}</span>
                <span>{'·'}</span>
                <span>{brand?.displayName || 'No brand'}</span>
                <span>{'·'}</span>
                <span>Quiz: {quiz?.name || 'none'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn variant="ghost" size="sm" icon={Eye} onClick={() => onPreview(dep)} aria-label="Preview deployment">Preview</Btn>
              <Btn variant="secondary" size="sm" icon={Edit3} onClick={() => onOpen(dep)} aria-label="Edit deployment">Edit</Btn>
              <IconBtn icon={dep.status === 'live' ? PowerOff : Power} onClick={() => onToggleStatus(dep.id)} aria-label={dep.status === 'live' ? 'Unpublish deployment' : 'Publish deployment'} />
              <IconBtn icon={Trash2} onClick={() => onDelete(dep.id)} style={{ color: T.danger }} aria-label="Delete deployment" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// SECTION EDITOR MODAL
// ============================================================================
const SectionEditorModal = ({ open, section, onClose, onSave, onDelete }) => {
  const [draft, setDraft] = useState(section || null)
  const [tab, setTab] = useState('manual')
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [aiResult, setAiResult] = useState(null)

  useEffect(() => {
    if (section) {
      setDraft(JSON.parse(JSON.stringify(section)))
      setAiInstruction(''); setAiResult(null); setAiError(null); setTab('manual')
    }
  }, [section?.id])

  if (!open || !section) return null

  const workingDraft = draft || section
  const c = (workingDraft && workingDraft.copy) || {}
  const meta = SECTION_TYPE_META[section.type] || { name: section.type, icon: Layers, desc: '' }
  const MetaIcon = meta.icon

  const updateCopy = (patch) => setDraft((d) => ({ ...(d || section), copy: { ...((d || section).copy || {}), ...patch } }))
  const updateArrayItem = (key, idx, patch) => {
    const arr = [...(c[key] || [])]
    arr[idx] = typeof arr[idx] === 'object' ? { ...arr[idx], ...patch } : patch
    updateCopy({ [key]: arr })
  }
  const addArrayItem = (key, blank) => updateCopy({ [key]: [...(c[key] || []), blank] })
  const removeArrayItem = (key, idx) => updateCopy({ [key]: (c[key] || []).filter((_, i) => i !== idx) })

  const runAI = async () => {
    if (!aiInstruction.trim()) return
    setAiBusy(true); setAiError(null); setAiResult(null)
    try {
      const res = await aiRewriteSection({ sectionType: section.type, currentCopy: c, instruction: aiInstruction })
      if (!res.ok) throw new Error(res.error)
      setAiResult(res.copy)
    } catch (err) {
      setAiError(err.message || 'AI rewrite failed.')
    } finally {
      setAiBusy(false)
    }
  }

  const acceptAI = () => { if (!aiResult) return; updateCopy(aiResult); setAiResult(null); setAiInstruction(''); setTab('manual') }

  const renderManualEditor = () => {
    const fields = []
    const pushString = (key, label, multiline) =>
      fields.push(
        <div key={key}>
          <Label>{label}</Label>
          {multiline ? <Textarea rows={3} value={c[key] || ''} onChange={(e) => updateCopy({ [key]: e.target.value })} /> : <Input value={c[key] || ''} onChange={(e) => updateCopy({ [key]: e.target.value })} />}
        </div>,
      )
    const renderStringList = (key, label) => (
      <div key={key}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>{label} {'·'} {(c[key] || []).length}</Label>
          <Btn variant="ghost" size="xs" icon={Plus} onClick={() => addArrayItem(key, '')}>Add</Btn>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(c[key] || []).map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: 6 }}>
              <Input value={v} onChange={(e) => updateArrayItem(key, i, e.target.value)} />
              <IconBtn icon={X} onClick={() => removeArrayItem(key, i)} />
            </div>
          ))}
        </div>
      </div>
    )
    const renderObjectList = (key, label, blank, itemRender) => (
      <div key={key}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>{label} {'·'} {(c[key] || []).length}</Label>
          <Btn variant="ghost" size="xs" icon={Plus} onClick={() => addArrayItem(key, blank)}>Add</Btn>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(c[key] || []).map((it, i) => (
            <div key={i} style={{ padding: 12, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: T.textMute, fontFamily: '"JetBrains Mono", monospace' }}>#{i + 1}</div>
                <IconBtn icon={Trash2} onClick={() => removeArrayItem(key, i)} style={{ color: T.danger }} />
              </div>
              {itemRender(it || {}, (patch) => updateArrayItem(key, i, patch))}
            </div>
          ))}
        </div>
      </div>
    )

    switch (section.type) {
      case 'header':
        pushString('logoText', 'Logo text'); pushString('ctaLabel', 'Call button label'); break
      case 'hero':
        pushString('eyebrow', 'Eyebrow'); pushString('headline', 'Headline', true); pushString('accent_phrase', 'Accent phrase (must be inside headline)'); pushString('subheadline', 'Subheadline', true)
        ;['1', '2', '3'].forEach((n) =>
          fields.push(
            <div key={`stat${n}`} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
              <div><Label>Stat {n} num</Label><Input value={c[`stat${n}_num`] || ''} onChange={(e) => updateCopy({ [`stat${n}_num`]: e.target.value })} /></div>
              <div><Label>Stat {n} label</Label><Input value={c[`stat${n}_label`] || ''} onChange={(e) => updateCopy({ [`stat${n}_label`]: e.target.value })} /></div>
            </div>,
          ),
        )
        pushString('trust_line', 'Trust line'); break
      case 'ticker':
        pushString('eyebrow', 'Eyebrow')
        fields.push(renderObjectList('items', 'Recovery items', { location: '', amount: '' }, (it, upd) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 8 }}>
            <Input placeholder="Case type and state" value={it.location || ''} onChange={(e) => upd({ location: e.target.value })} />
            <Input mono placeholder="$XXX,XXX" value={it.amount || ''} onChange={(e) => upd({ amount: e.target.value })} />
          </div>
        ))); break
      case 'authority':
        pushString('eyebrow', 'Eyebrow'); pushString('headline', 'Headline'); pushString('subhead', 'Subhead paragraph', true)
        fields.push(renderStringList('badges', 'Trust badges')); break
      case 'story':
        pushString('eyebrow', 'Eyebrow'); pushString('headline', 'Headline', true)
        fields.push(
          <div key="paragraphs">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Label>Paragraphs {'·'} {(c.paragraphs || []).length}</Label>
              <Btn variant="ghost" size="xs" icon={Plus} onClick={() => addArrayItem('paragraphs', '')}>Add</Btn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(c.paragraphs || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 6 }}>
                  <Textarea rows={3} value={p} onChange={(e) => updateArrayItem('paragraphs', i, e.target.value)} />
                  <IconBtn icon={X} onClick={() => removeArrayItem('paragraphs', i)} />
                </div>
              ))}
            </div>
          </div>,
        ); break
      case 'eligibility':
        pushString('eyebrow', 'Eyebrow'); pushString('headline', 'Headline'); fields.push(renderStringList('criteria', 'Criteria')); break
      case 'how_it_works':
        pushString('eyebrow', 'Eyebrow'); pushString('headline', 'Headline')
        fields.push(renderObjectList('steps', 'Steps', { title: '', desc: '' }, (it, upd) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Input placeholder="Step title" value={it.title || ''} onChange={(e) => upd({ title: e.target.value })} />
            <Textarea rows={2} placeholder="Step description" value={it.desc || ''} onChange={(e) => upd({ desc: e.target.value })} />
          </div>
        ))); break
      case 'settlements':
        pushString('eyebrow', 'Eyebrow'); pushString('headline', 'Headline')
        fields.push(renderObjectList('items', 'Settlement items', { case_type: '', amount: '', location: '' }, (it, upd) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Input placeholder="Case type" value={it.case_type || ''} onChange={(e) => upd({ case_type: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <Input mono placeholder="$XXX,XXX" value={it.amount || ''} onChange={(e) => upd({ amount: e.target.value })} />
              <Input placeholder="City, ST" value={it.location || ''} onChange={(e) => upd({ location: e.target.value })} />
            </div>
          </div>
        ))); break
      case 'testimonials':
        pushString('eyebrow', 'Eyebrow'); pushString('headline', 'Headline')
        fields.push(renderObjectList('items', 'Testimonials', { quote: '', author: '', location: '' }, (it, upd) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Textarea rows={3} placeholder="Quote" value={it.quote || ''} onChange={(e) => upd({ quote: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <Input placeholder="Author" value={it.author || ''} onChange={(e) => upd({ author: e.target.value })} />
              <Input placeholder="Location" value={it.location || ''} onChange={(e) => upd({ location: e.target.value })} />
            </div>
          </div>
        ))); break
      case 'guarantee':
        pushString('headline', 'Headline'); pushString('subhead', 'Subhead', true); fields.push(renderStringList('lines', 'Lines')); break
      case 'faq':
        pushString('eyebrow', 'Eyebrow'); pushString('headline', 'Headline')
        fields.push(renderObjectList('items', 'FAQ items', { q: '', a: '' }, (it, upd) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Input placeholder="Question" value={it.q || ''} onChange={(e) => upd({ q: e.target.value })} />
            <Textarea rows={3} placeholder="Answer" value={it.a || ''} onChange={(e) => upd({ a: e.target.value })} />
          </div>
        ))); break
      case 'final_cta':
        pushString('headline', 'Headline', true); pushString('cta_label', 'CTA button label'); pushString('secondary_line', 'Secondary line'); break
      case 'footer':
        pushString('tagline', 'Tagline'); fields.push(renderStringList('links', 'Links')); pushString('tcpa_text', 'TCPA / legal text', true); break
      default:
        fields.push(<div key="unknown" style={{ color: T.textMute, fontSize: 12 }}>No editor for this section type yet.</div>)
    }
    return fields
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 120, backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: 22, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          {MetaIcon && <MetaIcon size={18} color={T.primary} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>{meta.name}</div>
            <div style={{ fontSize: 11.5, color: T.textMute, marginTop: 2 }}>{meta.desc}</div>
          </div>
          <IconBtn icon={X} onClick={onClose} />
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '12px 22px 0', borderBottom: `1px solid ${T.border}` }}>
          {[{ id: 'manual', label: 'Manual edit', icon: Edit3 }, { id: 'ai', label: 'Edit with Claude', icon: Sparkles }].map((t) => {
            const TabIcon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: 'none', borderBottom: tab === t.id ? `2px solid ${T.primary}` : '2px solid transparent', color: tab === t.id ? T.text : T.textMute, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: -1, fontFamily: '"Inter", system-ui, sans-serif' }}>
                <TabIcon size={12} /> {t.label}
              </button>
            )
          })}
        </div>

        <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
          {tab === 'manual' && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{renderManualEditor()}</div>}
          {tab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <Label>Tell Claude what to change</Label>
                <Textarea rows={4} value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} placeholder="eg Make the headline more urgent and lean into truck accidents specifically. Keep stats the same." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn variant="primary" size="md" icon={aiBusy ? Loader2 : Sparkles} onClick={runAI} disabled={aiBusy || !aiInstruction.trim()}>{aiBusy ? 'Rewriting...' : 'Rewrite with Claude'}</Btn>
              </div>
              {aiError && <div style={{ padding: 10, backgroundColor: `${T.danger}11`, border: `1px solid ${T.danger}66`, borderRadius: 6, fontSize: 12, color: T.danger }}>{aiError}</div>}
              {aiResult && (
                <div style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.purple}`, borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Sparkles size={13} color={T.purple} />
                    <span style={{ fontSize: 12, color: T.purple, fontWeight: 600 }}>Proposed copy</span>
                  </div>
                  <pre style={{ fontSize: 11, color: T.textDim, backgroundColor: T.bg, padding: 10, borderRadius: 6, maxHeight: 260, overflowY: 'auto', fontFamily: '"JetBrains Mono", monospace', margin: 0 }}>{JSON.stringify(aiResult, null, 2)}</pre>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                    <Btn variant="ghost" size="sm" onClick={() => setAiResult(null)}>Discard</Btn>
                    <Btn variant="success" size="sm" icon={Check} onClick={acceptAI}>Accept changes</Btn>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <Btn variant="danger" size="md" icon={Trash2} onClick={() => { onDelete?.(section.id); onClose() }}>Delete Section</Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="md" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" size="md" icon={Save} onClick={() => { onSave(workingDraft); onClose() }}>Save</Btn>
          </div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

// ============================================================================
// ADD SECTION MODAL
// ============================================================================
const AddSectionModal = ({ open, onClose, onAdd, existingTypes }) => {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 110, backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, maxHeight: '88vh', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 22, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>Add a section</div>
            <div style={{ fontSize: 11.5, color: T.textMute, marginTop: 2 }}>Pick a section type to insert into the page.</div>
          </div>
          <IconBtn icon={X} onClick={onClose} />
        </div>
        <div style={{ padding: 20, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {SECTION_TYPES.map((s) => {
            const Icon = s.icon || Layers
            const used = existingTypes.includes(s.id)
            return (
              <button key={s.id} onClick={() => { onAdd(s.id); onClose() }} style={{ textAlign: 'left', padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={T.primary} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.name}</span>
                    {used && <Pill color={T.warning}>USED</Pill>}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMute, marginTop: 3, lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TEMPLATE GALLERY MODAL
// ============================================================================
const TemplateGalleryModal = ({ open, onClose, onPick, currentTemplateId }) => {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 110, backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 920, maxHeight: '88vh', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 22, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Pick a template</div>
            <div style={{ fontSize: 11.5, color: T.textMute, marginTop: 2 }}>Templates control layout, typography, and canvas. Brand colors fill in via deployments.</div>
          </div>
          <IconBtn icon={X} onClick={onClose} />
        </div>
        <div style={{ padding: 22, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {TEMPLATES.map((t) => {
            const isCurrent = t.id === currentTemplateId
            return (
              <button key={t.id} onClick={() => { onPick(t.id); onClose() }} style={{ textAlign: 'left', padding: 0, backgroundColor: T.bgElev, border: `2px solid ${isCurrent ? T.primary : T.border}`, borderRadius: 10, cursor: 'pointer', overflow: 'hidden' }}>
                <div style={{ height: 120, background: t.tokens.heroBg, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 10, color: t.tokens.textMute, fontFamily: t.tokens.bodyFont, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Free case review</div>
                  <div style={{ fontFamily: t.tokens.headlineFont, fontWeight: t.tokens.headlineWeight, fontSize: 18, color: t.tokens.text, lineHeight: 1.15 }}>{t.hookExample}</div>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t.name}</span>
                    {isCurrent && <Pill color={T.primary}>CURRENT</Pill>}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMute, marginTop: 6, lineHeight: 1.5 }}>{t.blurb}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// AI NEW LP WIZARD
// ============================================================================
const AINewLPWizard = ({ open, onClose, onCreate }) => {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('bold_modern')
  const [angle, setAngle] = useState('pain')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { if (open) { setStep(1); setName(''); setTemplateId('bold_modern'); setAngle('pain'); setNotes(''); setBusy(false); setError(null) } }, [open])
  if (!open) return null

  const generate = async () => {
    setBusy(true); setError(null)
    try {
      const res = await generateLPCopy({ angle, templateId, notes })
      if (!res.ok) throw new Error(res.error)
      const parsed = res.copy || {}
      const sections = buildSeedSections().map((s) => (parsed[s.type] ? { ...s, copy: { ...s.copy, ...parsed[s.type] } } : s))
      const newLP = {
        id: genId('lp'),
        name: name || `${ANGLES.find((a) => a.id === angle)?.label} LP`,
        slug: (name || 'new-lp').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        templateId, angle, sections,
        isPublished: false, createdAt: Date.now(), updatedAt: Date.now(),
      }
      onCreate(newLP)
      onClose()
    } catch (err) {
      setError(err.message || 'Generation failed.')
    } finally {
      setBusy(false)
    }
  }

  const stepCount = 4
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 110, backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: 22, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} color={T.purple} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>New landing page with Claude</div>
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>Step {step} of {stepCount}</div>
            </div>
          </div>
          <IconBtn icon={X} onClick={onClose} />
        </div>
        <div style={{ padding: 22, minHeight: 280 }}>
          {step === 1 && (
            <div>
              <Label>Page name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="MVA Truck Urgency" autoFocus />
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 10 }}>This page will be brandless. You attach brands when you deploy it.</div>
            </div>
          )}
          {step === 2 && (
            <div>
              <Label>Angle</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {ANGLES.map((a) => (
                  <button key={a.id} onClick={() => setAngle(a.id)} style={{ textAlign: 'left', padding: 14, backgroundColor: T.bgElev, border: `2px solid ${angle === a.id ? T.primary : T.border}`, borderRadius: 10, cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: T.textMute, marginTop: 4, lineHeight: 1.45 }}>{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <Label>Template</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setTemplateId(t.id)} style={{ textAlign: 'left', padding: 0, backgroundColor: T.bgElev, border: `2px solid ${templateId === t.id ? T.primary : T.border}`, borderRadius: 10, cursor: 'pointer', overflow: 'hidden' }}>
                    <div style={{ height: 50, background: t.tokens.heroBg }} />
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: T.textMute, marginTop: 3, lineHeight: 1.4 }}>{t.blurb.slice(0, 60)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <Label>Operator notes (optional)</Label>
              <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="eg Focus on truck accidents specifically. Mention statute of limitations. Lead with $2M+ truck case settlement." />
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 10 }}>Claude will generate hero, story, eligibility, how-it-works, guarantee, FAQ, and final CTA copy from your notes. The rest seeds with defaults.</div>
              {error && <div style={{ marginTop: 12, padding: 10, backgroundColor: `${T.danger}11`, border: `1px solid ${T.danger}66`, borderRadius: 6, fontSize: 12, color: T.danger }}>{error}</div>}
            </div>
          )}
        </div>
        <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <Btn variant="ghost" size="md" onClick={() => (step > 1 ? setStep(step - 1) : onClose())}>{step > 1 ? 'Back' : 'Cancel'}</Btn>
          {step < stepCount ? (
            <Btn variant="primary" size="md" onClick={() => setStep(step + 1)} disabled={step === 1 && !name.trim()}>Next {'→'}</Btn>
          ) : (
            <Btn variant="primary" size="md" icon={busy ? Loader2 : Sparkles} onClick={generate} disabled={busy}>{busy ? 'Generating...' : 'Generate with Claude'}</Btn>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LANDING PAGE BUILDER (3-pane)
// ============================================================================
const LandingPageBuilder = ({ landingPage, brands, quizDeployments, quizzes, onBack, onUpdate, onTogglePublish, onSetTemplate, onPreview }) => {
  const [editingSectionId, setEditingSectionId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [previewBrandId, setPreviewBrandId] = useState(brands[0]?.id || null)
  const previewBrand = brands.find((b) => b.id === previewBrandId) || PREVIEW_BRAND_DEFAULT
  const matchingQuizDeps = quizDeployments.filter((qd) => qd.brandId === previewBrandId)
  const [previewQuizDepId, setPreviewQuizDepId] = useState(matchingQuizDeps[0]?.id || null)
  useEffect(() => {
    const dep = quizDeployments.find((q) => q.id === previewQuizDepId)
    if (!dep || dep.brandId !== previewBrandId) {
      const next = quizDeployments.find((q) => q.brandId === previewBrandId)
      setPreviewQuizDepId(next?.id || null)
    }
  }, [previewBrandId, quizDeployments, previewQuizDepId])

  const editingSection = landingPage.sections.find((s) => s.id === editingSectionId)
  const previewQuizDep = quizDeployments.find((q) => q.id === previewQuizDepId)
  const previewQuiz = quizzes.find((q) => q.id === previewQuizDep?.quizId)
  const quizDepLabel = previewQuiz?.name

  const setSections = (newSecs) => onUpdate({ ...landingPage, sections: newSecs, updatedAt: Date.now() })

  const moveSection = (id, dir) => {
    const idx = landingPage.sections.findIndex((s) => s.id === id)
    if (idx === -1) return
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= landingPage.sections.length) return
    const arr = [...landingPage.sections]
    ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
    setSections(arr)
  }

  const toggleVisible = (id) => setSections(landingPage.sections.map((s) => (s.id === id ? { ...s, isVisible: !(s.isVisible !== false) } : s)))
  const deleteSection = (id) => setSections(landingPage.sections.filter((s) => s.id !== id))
  const updateSection = (newSec) => setSections(landingPage.sections.map((s) => (s.id === newSec.id ? newSec : s)))
  const addSection = (type) => {
    const newSec = { id: genId('sec'), type, isVisible: true, copy: JSON.parse(JSON.stringify(SEED_SECTION_COPY[type] || {})) }
    setSections([...landingPage.sections, newSec])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar
        crumbs={`ADMIN / FUNNELS / LANDING PAGES`}
        title={landingPage.name}
        isPublished={landingPage.isPublished}
        onBack={onBack}
        onPreview={onPreview}
        onPublish={() => onTogglePublish(landingPage.id)}
        actions={<Btn variant="ghost" size="sm" icon={Palette} onClick={() => setGalleryOpen(true)}>Template: {TEMPLATES.find((t) => t.id === landingPage.templateId)?.name}</Btn>}
      />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 320px', overflow: 'hidden' }}>
        <div style={{ borderRight: `1px solid ${T.border}`, overflowY: 'auto', backgroundColor: T.bg, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Label>Sections {'·'} {landingPage.sections.length}</Label>
            <Btn variant="primary" size="xs" icon={Plus} onClick={() => setAddOpen(true)}>Add</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {landingPage.sections.map((s) => {
              const meta = SECTION_TYPE_META[s.type] || { name: s.type, icon: Layers }
              const SecIcon = meta.icon
              const hidden = s.isVisible === false
              return (
                <div key={s.id} style={{ padding: '8px 10px', backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 7, opacity: hidden ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SecIcon size={13} color={T.textMute} />
                  <button onClick={() => setEditingSectionId(s.id)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, fontWeight: 500, color: T.text, fontFamily: '"Inter", system-ui, sans-serif', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.name}</button>
                  <IconBtn icon={MoveUp} onClick={() => moveSection(s.id, 'up')} style={{ padding: 3 }} />
                  <IconBtn icon={MoveDown} onClick={() => moveSection(s.id, 'down')} style={{ padding: 3 }} />
                  <IconBtn icon={hidden ? EyeOff : Eye} onClick={() => toggleVisible(s.id)} style={{ padding: 3 }} />
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ overflowY: 'auto', backgroundColor: '#0c1118', padding: 24 }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <LivePreview landingPage={landingPage} brand={previewBrand} quizDepLabel={quizDepLabel} quiz={previewQuiz} onEditSection={setEditingSectionId} />
          </div>
        </div>

        <div style={{ borderLeft: `1px solid ${T.border}`, overflowY: 'auto', backgroundColor: T.bg, padding: 18 }}>
          <Label>Page settings</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
            <div><Label>Name</Label><Input value={landingPage.name} onChange={(e) => onUpdate({ ...landingPage, name: e.target.value })} /></div>
            <div><Label>Slug</Label><Input mono value={landingPage.slug} onChange={(e) => onUpdate({ ...landingPage, slug: e.target.value })} /></div>
            <div>
              <Label>Angle</Label>
              <Select value={landingPage.angle} onChange={(e) => onUpdate({ ...landingPage, angle: e.target.value })}>
                {ANGLES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>Template</Label>
              <Btn variant="secondary" size="sm" icon={Palette} onClick={() => setGalleryOpen(true)} style={{ width: '100%', justifyContent: 'space-between' }}>
                {TEMPLATES.find((t) => t.id === landingPage.templateId)?.name || 'Pick'}
                <ChevronRight size={12} />
              </Btn>
            </div>
          </div>

          <div style={{ padding: 12, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 18 }}>
            <Label style={{ marginBottom: 8 }}>Preview as</Label>
            <Select value={previewBrandId || ''} onChange={(e) => setPreviewBrandId(e.target.value || null)}>
              <option value="">No brand (placeholders)</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.displayName}</option>)}
            </Select>
            <div style={{ fontSize: 10.5, color: T.textMute, marginTop: 6, lineHeight: 1.5 }}>The page is brandless. Pick a brand here just to see how it will render. Brand and domain attach at deploy time.</div>
            {previewBrandId && (
              <div style={{ marginTop: 10 }}>
                <Label style={{ marginBottom: 6 }}>Quiz deployment (preview)</Label>
                <Select value={previewQuizDepId || ''} onChange={(e) => setPreviewQuizDepId(e.target.value || null)}>
                  <option value="">None</option>
                  {matchingQuizDeps.map((q) => {
                    const qz = quizzes.find((z) => z.id === q.quizId)
                    return <option key={q.id} value={q.id}>{qz?.name || q.id}</option>
                  })}
                </Select>
                {matchingQuizDeps.length === 0 && <div style={{ fontSize: 10.5, color: T.warning, marginTop: 6 }}>This brand has no quiz deployments yet. Create one in Funnels {'›'} Quizzes.</div>}
              </div>
            )}
          </div>

          <div style={{ paddingTop: 14, borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.textMute }}>
            <div style={{ marginBottom: 6, fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textLow }}>Placeholders</div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, lineHeight: 1.7, color: T.textDim }}>
              {`{{brand.logoText}}`}<br />{`{{brand.logoMark}}`}<br />{`{{brand.logoUrl}}`}<br />{`{{brand.faviconUrl}}`}<br />{`{{brand.displayName}}`}<br />{`{{brand.callNumber}}`}<br />{`{{brand.primary}}`}<br />{`{{brand.copyright}}`}<br />{`{{brand.disclaimer}}`}
            </div>
            <div style={{ marginTop: 8, lineHeight: 1.55 }}>Use these in section copy. They get substituted at preview and deploy time.</div>
          </div>
        </div>
      </div>

      <SectionEditorModal open={!!editingSection} section={editingSection} onClose={() => setEditingSectionId(null)} onSave={updateSection} onDelete={deleteSection} />
      <AddSectionModal open={addOpen} existingTypes={landingPage.sections.map((s) => s.type)} onClose={() => setAddOpen(false)} onAdd={addSection} />
      <TemplateGalleryModal open={galleryOpen} currentTemplateId={landingPage.templateId} onClose={() => setGalleryOpen(false)} onPick={(tplId) => onSetTemplate(landingPage.id, tplId)} />
    </div>
  )
}

// ============================================================================
// LP DEPLOYMENT EDITOR
// ============================================================================
const LPDeploymentEditor = ({ deployment, landingPages, brands, domains, quizDeployments, quizzes, onSave, onDelete, onCancel, onToast, onPreview }) => {
  const [draft, setDraft] = useState(deployment)
  useEffect(() => { setDraft(deployment) }, [deployment?.id])
  if (!draft) return null

  const brandDomains = domains.filter((d) => d.brandId === draft.brandId)
  const brandQuizDeps = quizDeployments.filter((qd) => qd.brandId === draft.brandId)
  const previewURL = `https://preview.legenex.com/lp/${draft.id || 'new'}`
  const finalURL = draft.domain ? `https://${draft.domain}${draft.path || ''}` : previewURL

  const handleSave = () => {
    if (!draft.landingPageId) { onToast?.({ message: 'Pick a landing page first.', type: 'error' }); return }
    if (!draft.brandId) { onToast?.({ message: 'Pick a brand first.', type: 'error' }); return }
    const next = { ...draft, id: draft.id || genId('ldep'), status: draft.status || 'draft', path: draft.path || '' }
    onSave(next)
    onToast?.({ message: draft.domain ? 'Deployment saved.' : 'Deployment saved as preview URL.', type: 'success' })
  }

  const lp = landingPages.find((p) => p.id === draft.landingPageId)
  const tplName = TEMPLATES.find((t) => t.id === lp?.templateId)?.name
  const angleName = ANGLES.find((a) => a.id === lp?.angle)?.label

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar
        crumbs={`ADMIN / FUNNELS / LANDING PAGES / DEPLOYMENT`}
        title={draft.name || lp?.name || 'New deployment'}
        onBack={onCancel}
        actions={
          <>
            {draft.id && <Btn variant="ghost" size="sm" icon={Eye} onClick={() => onPreview?.(draft)}>Preview</Btn>}
            {draft.id && <Btn variant="danger" size="sm" icon={Trash2} onClick={() => onDelete(draft.id)}>Delete</Btn>}
            <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>
            <Btn variant="primary" size="sm" icon={Save} onClick={handleSave}>Save Deployment</Btn>
          </>
        }
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Deployment</h1>
          <div style={{ fontSize: 13, color: T.textMute, marginTop: 4, marginBottom: 24 }}>Map a landing page to a brand domain and path. This is what visitors will actually see.</div>
          <div style={{ padding: 20, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>Deployment name</Label>
              <Input value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="eg CMC Pain First / Truck Campaign" />
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 6 }}>An internal label so you can tell deployments apart in the list. Defaults to the LP + brand if blank.</div>
            </div>
            <div>
              <Label>Landing page</Label>
              <Select value={draft.landingPageId || ''} onChange={(e) => setDraft({ ...draft, landingPageId: e.target.value })}>
                <option value="">Pick a landing page</option>
                {landingPages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Brand</Label>
              <Select value={draft.brandId || ''} onChange={(e) => setDraft({ ...draft, brandId: e.target.value, domain: '', quizDeploymentId: '' })}>
                <option value="">Pick a brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.displayName}</option>)}
              </Select>
            </div>
            <div>
              <Label>Domain</Label>
              <Select value={draft.domain || ''} onChange={(e) => setDraft({ ...draft, domain: e.target.value })} disabled={!draft.brandId}>
                <option value="">{brandDomains.length === 0 ? 'No domains for this brand (preview URL will be used)' : 'No domain attached (use preview URL)'}</option>
                {brandDomains.map((d) => <option key={d.id} value={d.domain}>{d.domain}{d.isPrimary ? ' (primary)' : ''}</option>)}
              </Select>
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 6, lineHeight: 1.55 }}>Domains come from the brand. Manage them in <span style={{ color: T.text }}>Brands {'›'} Domains</span>.</div>
            </div>
            <div>
              <Label>Path</Label>
              <Input mono value={draft.path || ''} onChange={(e) => setDraft({ ...draft, path: e.target.value })} placeholder="/c/your-path" />
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 6 }}>
                Final URL: <span style={{ color: draft.domain ? T.text : T.warning, fontFamily: '"JetBrains Mono", monospace' }}>{finalURL}</span>
                {!draft.domain && <Pill color={T.info} style={{ marginLeft: 8 }}>PREVIEW URL</Pill>}
              </div>
            </div>
            <div>
              <Label>Quiz deployment</Label>
              <Select value={draft.quizDeploymentId || ''} onChange={(e) => setDraft({ ...draft, quizDeploymentId: e.target.value })} disabled={!draft.brandId}>
                <option value="">None (use the LP&apos;s default)</option>
                {brandQuizDeps.map((qd) => {
                  const qz = quizzes.find((q) => q.id === qd.quizId)
                  return <option key={qd.id} value={qd.id}>{qz?.name || qd.id} {'·'} {qd.path}</option>
                })}
              </Select>
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 6 }}>
                {brandQuizDeps.length === 0 && draft.brandId ? <span style={{ color: T.warning }}>This brand has no quiz deployments yet. Create one in Funnels {'›'} Quizzes.</span> : 'Override the quiz embedded in this specific deployment. Filtered to quizzes deployed under the selected brand.'}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={draft.status || 'draft'} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="live">Live</option>
                <option value="paused">Paused</option>
              </Select>
            </div>
          </div>
          {lp && (
            <div style={{ marginTop: 16, padding: 18, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <Label style={{ marginBottom: 10 }}>Page reference</Label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Pill color={T.purple}>{tplName}</Pill>
                <Pill color={T.info}>{angleName}</Pill>
                <Pill color={T.textMute}>{lp.sections.length} sections</Pill>
                <Pill color={lp.isPublished ? T.success : T.warning}>{lp.isPublished ? 'Published' : 'Draft'}</Pill>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LP PREVIEW MODAL
// ============================================================================
const LPPreviewModal = ({ previewState, landingPages, brands, lpDeployments, quizzes, quizDeployments, onClose }) => {
  const [brandOverride, setBrandOverride] = useState(null)
  useEffect(() => { setBrandOverride(null) }, [previewState?.lpId, previewState?.deploymentId])
  if (!previewState) return null

  const lp = landingPages.find((p) => p.id === (previewState.lpId || lpDeployments.find((d) => d.id === previewState.deploymentId)?.landingPageId))
  if (!lp) return null

  const deployment = previewState.deploymentId ? lpDeployments.find((d) => d.id === previewState.deploymentId) : null
  const lockedBrandId = deployment?.brandId
  const selectedBrandId = lockedBrandId || brandOverride || brands[0]?.id
  const brand = brands.find((b) => b.id === selectedBrandId)

  let quizDep = deployment?.quizDeploymentId ? quizDeployments.find((qd) => qd.id === deployment.quizDeploymentId) : null
  if (!quizDep && brand) quizDep = quizDeployments.find((qd) => qd.brandId === brand.id)
  const quiz = quizDep ? quizzes.find((q) => q.id === quizDep.quizId) : null

  const url = deployment ? (deployment.domain ? `https://${deployment.domain}${deployment.path || ''}` : `https://preview.legenex.com/lp/${deployment.id}`) : `https://preview.legenex.com/lp/${lp.id}`

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 56, flexShrink: 0, padding: '0 20px', backgroundColor: T.bg, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={15} color={T.primary} />
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Preview: {lp.name}</span>
          {deployment && <Pill color={T.info}>DEPLOYMENT</Pill>}
        </div>
        <div style={{ width: 1, height: 26, backgroundColor: T.border }} />
        <div style={{ fontSize: 12, color: T.textMute, fontFamily: '"JetBrains Mono", monospace' }}>{url}</div>
        <div style={{ flex: 1 }} />
        {!deployment && brands.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preview as</span>
            <Select value={brandOverride || brands[0]?.id || ''} onChange={(e) => setBrandOverride(e.target.value)} style={{ width: 200 }}>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.displayName || b.name}</option>)}
            </Select>
          </div>
        )}
        <Btn variant="primary" size="sm" icon={X} onClick={onClose}>Close</Btn>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0c1118', padding: 24 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <LivePreview landingPage={lp} brand={brand} quiz={quiz} quizDepLabel={quiz?.name} onEditSection={() => {}} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================
export function LandingPagesApp({ initialLandingPages, initialDeployments, brands, domains, quizzes = [], quizDeployments = [] }) {
  const router = useRouter()
  const [landingPages, setLandingPages] = useState(initialLandingPages)
  const [lpDeployments, setLpDeployments] = useState(initialDeployments)
  const [subView, setSubView] = useState('lp_list')
  const [editingLPId, setEditingLPId] = useState(null)
  const [editingDeployment, setEditingDeployment] = useState(null)
  const [lpTab, setLpTab] = useState('pages')
  const [previewState, setPreviewState] = useState(null)
  const [aiWizardOpen, setAiWizardOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const saveTimer = useRef(null)

  // Only resync from the server when sitting on the list (avoids clobbering an open builder).
  useEffect(() => {
    if (subView === 'lp_list') {
      setLandingPages(initialLandingPages)
      setLpDeployments(initialDeployments)
    }
  }, [initialLandingPages, initialDeployments, subView])

  const lpPatch = (lp) => ({
    name: lp.name, slug: lp.slug, template_id: lp.templateId, angle: lp.angle,
    is_published: lp.isPublished, sections: lp.sections,
  })

  // Builder edits update local state immediately and debounce a server save.
  const updateLP = (lp) => {
    setLandingPages((arr) => arr.map((p) => (p.id === lp.id ? lp : p)))
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { saveLP({ id: lp.id, patch: lpPatch(lp) }) }, 450)
  }

  const togglePublishLP = (id) => {
    setLandingPages((arr) => arr.map((p) => (p.id === id ? { ...p, isPublished: !p.isPublished } : p)))
    const lp = landingPages.find((p) => p.id === id)
    if (lp) saveLP({ id, patch: { is_published: !lp.isPublished } }).then(() => router.refresh())
  }

  const setTemplate = (lpId, tplId) => {
    setLandingPages((arr) => arr.map((p) => (p.id === lpId ? { ...p, templateId: tplId } : p)))
    saveLP({ id: lpId, patch: { template_id: tplId } })
  }

  const cloneLPHandler = (lp) => {
    cloneLP({ id: lp.id }).then((res) => { if (res.ok) router.refresh(); else setToast({ message: res.error, type: 'error' }) })
  }

  const deleteLPHandler = (id) => {
    setConfirm({
      title: 'Delete landing page?',
      message: 'This also removes all deployments that reference it.',
      onConfirm: () => {
        deleteLP({ id }).then((res) => {
          if (!res.ok) { setToast({ message: res.error, type: 'error' }); setConfirm(null); return }
          setLandingPages((arr) => arr.filter((p) => p.id !== id))
          setLpDeployments((arr) => arr.filter((d) => d.landingPageId !== id))
          setConfirm(null)
          router.refresh()
        })
      },
    })
  }

  const createBlankLP = () => {
    const tpl = TEMPLATES[0]
    const lp = {
      name: 'Untitled LP',
      slug: `untitled-${Date.now().toString(36).slice(-4)}`,
      templateId: tpl.id, angle: tpl.angleDefault,
      sections: buildSeedSections(), isPublished: false,
    }
    createLP({ lp }).then((res) => {
      if (!res.ok) { setToast({ message: res.error, type: 'error' }); return }
      setLandingPages((arr) => [...arr, { ...lp, id: res.id }])
      setEditingLPId(res.id)
      setSubView('lp_builder')
    })
  }

  const createFromWizard = (lp) => {
    createLP({ lp }).then((res) => {
      if (!res.ok) { setToast({ message: res.error, type: 'error' }); return }
      setLandingPages((arr) => [...arr, { ...lp, id: res.id }])
      setEditingLPId(res.id)
      setSubView('lp_builder')
    })
  }

  const persistDeployment = (dep) => {
    saveDeployment({ deployment: dep }).then((res) => {
      if (!res.ok) { setToast({ message: res.error, type: 'error' }); return }
      setSubView('lp_list'); setLpTab('deployments'); setEditingDeployment(null)
      router.refresh()
    })
  }

  const deleteDeploymentHandler = (id) => {
    setConfirm({
      title: 'Delete deployment?',
      message: 'The landing page itself remains. Only this deployment goes away.',
      onConfirm: () => {
        deleteDeployment({ id }).then((res) => {
          if (!res.ok) { setToast({ message: res.error, type: 'error' }); setConfirm(null); return }
          setLpDeployments((arr) => arr.filter((d) => d.id !== id))
          setConfirm(null); setSubView('lp_list'); setLpTab('deployments')
          router.refresh()
        })
      },
    })
  }

  const toggleDepStatus = (id) => {
    const dep = lpDeployments.find((d) => d.id === id)
    if (!dep) return
    const status = dep.status === 'live' ? 'paused' : 'live'
    setLpDeployments((arr) => arr.map((d) => (d.id === id ? { ...d, status } : d)))
    saveDeployment({ deployment: { ...dep, status } }).then(() => router.refresh())
  }

  const renameLP = (id, name) => {
    setLandingPages((arr) => arr.map((p) => (p.id === id ? { ...p, name } : p)))
    saveLP({ id, patch: { name } })
  }
  const renameDeployment = (id, name) => {
    setLpDeployments((arr) => arr.map((d) => (d.id === id ? { ...d, name } : d)))
    const dep = lpDeployments.find((d) => d.id === id)
    if (dep) saveDeployment({ deployment: { ...dep, name } })
  }

  const editingLP = landingPages.find((p) => p.id === editingLPId)

  let body
  if (subView === 'lp_builder' && editingLP) {
    body = (
      <LandingPageBuilder
        landingPage={editingLP}
        brands={brands}
        quizDeployments={quizDeployments}
        quizzes={quizzes}
        onBack={() => { clearTimeout(saveTimer.current); if (editingLP) saveLP({ id: editingLP.id, patch: lpPatch(editingLP) }).then(() => router.refresh()); setSubView('lp_list'); setEditingLPId(null) }}
        onUpdate={updateLP}
        onTogglePublish={togglePublishLP}
        onSetTemplate={setTemplate}
        onPreview={() => setPreviewState({ kind: 'lp', lpId: editingLP.id })}
      />
    )
  } else if (subView === 'lp_deployment_edit') {
    body = (
      <LPDeploymentEditor
        deployment={editingDeployment}
        landingPages={landingPages}
        brands={brands}
        domains={domains}
        quizDeployments={quizDeployments}
        quizzes={quizzes}
        onSave={persistDeployment}
        onDelete={deleteDeploymentHandler}
        onCancel={() => { setSubView('lp_list'); setEditingDeployment(null); setLpTab('deployments') }}
        onToast={setToast}
        onPreview={(dep) => setPreviewState({ kind: 'deployment', deploymentId: dep.id })}
      />
    )
  } else {
    body = (
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        <PageHeader
          title="Landing Pages"
          subtitle="Brandless pages with placeholders. Deploy each page to one or more brand domains."
          primaryAction={
            lpTab === 'pages'
              ? <Btn variant="primary" size="md" icon={Sparkles} onClick={() => setAiWizardOpen(true)}>New with Claude</Btn>
              : <Btn variant="primary" size="md" icon={Plus} onClick={() => { setEditingDeployment({ id: '', landingPageId: '', brandId: '', domain: '', path: '/c/', quizDeploymentId: '', status: 'draft' }); setSubView('lp_deployment_edit') }}>New Deployment</Btn>
          }
          secondaryAction={lpTab === 'pages' ? <Btn variant="secondary" size="md" icon={Plus} onClick={createBlankLP}>Blank LP</Btn> : null}
        />
        <TabBar active={lpTab} onChange={setLpTab} tabs={[{ id: 'pages', label: 'Pages', count: landingPages.length }, { id: 'deployments', label: 'Deployments', count: lpDeployments.length }]} />
        <div style={{ marginTop: 18 }}>
          {lpTab === 'pages' && (
            <LandingPagesListView
              landingPages={landingPages}
              lpDeployments={lpDeployments}
              onOpen={(id) => { setEditingLPId(id); setSubView('lp_builder') }}
              onClone={cloneLPHandler}
              onDelete={deleteLPHandler}
              onTogglePublish={togglePublishLP}
              onPreview={(id) => setPreviewState({ kind: 'lp', lpId: id })}
              onRename={renameLP}
            />
          )}
          {lpTab === 'deployments' && (
            <LPDeploymentListView
              deployments={lpDeployments}
              landingPages={landingPages}
              brands={brands}
              quizDeployments={quizDeployments}
              quizzes={quizzes}
              domains={domains}
              onOpen={(dep) => { setEditingDeployment(dep); setSubView('lp_deployment_edit') }}
              onDelete={deleteDeploymentHandler}
              onToggleStatus={toggleDepStatus}
              onPreview={(dep) => setPreviewState({ kind: 'deployment', deploymentId: dep.id })}
              onRename={renameDeployment}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: T.bg, color: T.text, fontFamily: '"Inter", system-ui, sans-serif', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700&display=swap');`}</style>
      {body}

      <AINewLPWizard open={aiWizardOpen} onClose={() => setAiWizardOpen(false)} onCreate={createFromWizard} />
      <LPPreviewModal previewState={previewState} landingPages={landingPages} brands={brands} lpDeployments={lpDeployments} quizzes={quizzes} quizDeployments={quizDeployments} onClose={() => setPreviewState(null)} />
      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} confirmText="Delete" onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}

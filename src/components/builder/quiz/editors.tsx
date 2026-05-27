// @ts-nocheck
/* eslint-disable */
'use client'

// Ported verbatim: the quiz builder editors - FieldPicker, WebhookTester,
// WebhookEditor, DynamicContentEditor, AIEditor, NodeEditorModal,
// CustomFieldEditModal, SettingsModal, AddStepModal. The per-node AI test is
// routed through a server action; the webhook tester keeps its client fetch.

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Hash, Search, PlayCircle, ChevronUp, ChevronDown, Send, Loader2, Plus, X, Trash2,
  Save, Eye, EyeOff, Zap, Sparkles, Edit3, Copy, Globe, Mail, Phone, ShieldCheck, Code2,
} from 'lucide-react'
import { T, Btn, Input, Textarea, Select, Label, Pill, IconBtn, ConfirmDialog } from '../ui'
import { NODE_CATEGORIES, findNodeTypeMeta, FIELD_TYPES, OPERATORS, HTTP_METHODS } from './config'
import { VISIBLE_BY_DEFAULT, tierIsShared, isNodeVisible, genId, mkA, SEED_CUSTOM_FIELDS } from './seed-data'
import { aiTestPrompt } from '@/app/(app)/admin/(top)/quizzes/actions'

export const FieldPicker = ({ customFields, onInsert, anchor = 'top-right' }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  const filtered = search ? customFields.filter((cf) => cf.key.toLowerCase().includes(search.toLowerCase()) || cf.label.toLowerCase().includes(search.toLowerCase())) : customFields
  return <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
    <button onClick={() => setOpen(!open)} title="Insert custom field" style={{ background: T.bgElev2, border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 7px', color: T.textDim, cursor: 'pointer', fontSize: 10, fontFamily: '"JetBrains Mono", monospace', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Hash size={10} /> insert field
    </button>
    {open && <div style={{ position: 'absolute', [anchor.includes('right') ? 'right' : 'left']: 0, [anchor.includes('top') ? 'top' : 'bottom']: '100%', marginTop: anchor.includes('top') ? 0 : 6, marginBottom: anchor.includes('top') ? 6 : 0, zIndex: 250, width: 260, backgroundColor: T.bg, border: `1px solid ${T.borderHover}`, borderRadius: 8, boxShadow: '0 12px 28px -8px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search fields..." autoFocus style={{ fontSize: 11, padding: '5px 8px' }} />
      </div>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {filtered.length === 0 ? <div style={{ padding: 12, fontSize: 11, color: T.textMute, textAlign: 'center' }}>No fields</div> :
          filtered.map((cf) => <button key={cf.id} onClick={() => { onInsert(`{{${cf.key}}}`); setOpen(false); setSearch('') }} style={{ width: '100%', padding: '7px 10px', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 11.5, cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', color: T.text }}>{`{{${cf.key}}}`}</span>
            <span style={{ fontSize: 10, color: T.textMute }}>{cf.label}</span>
          </button>)}
      </div>
    </div>}
  </div>
}

export const WebhookTester = ({ method, url, headers, payload, customFields }) => {
  const [open, setOpen] = useState(false)
  const [testValues, setTestValues] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const interpolate = (str) => str.replace(/\{\{(\w+)\}\}/g, (_, k) => testValues[k] || `{{${k}}}`)
  const usedKeys = useMemo(() => {
    const all = [url, payload, ...headers.map((h) => h.value)].join(' ')
    const matches = all.matchAll(/\{\{(\w+)\}\}/g)
    return Array.from(new Set(Array.from(matches, (m) => m[1])))
  }, [url, payload, headers])

  const runTest = async () => {
    setBusy(true); setResult(null)
    try {
      const finalUrl = interpolate(url)
      const finalHeaders = {}
      headers.forEach((h) => { if (h.key) finalHeaders[h.key] = interpolate(h.value) })
      const opts = { method, headers: finalHeaders }
      if (['POST', 'PUT', 'PATCH'].includes(method) && payload) opts.body = interpolate(payload)
      const t0 = performance.now()
      const res = await fetch(finalUrl, opts)
      const text = await res.text()
      let parsed; try { parsed = JSON.parse(text) } catch { parsed = text }
      setResult({ ok: res.ok, status: res.status, time: Math.round(performance.now() - t0), body: parsed })
    } catch (err) {
      setResult({ ok: false, error: err.message })
    } finally { setBusy(false) }
  }

  return <div style={{ border: `1px solid ${T.border}`, backgroundColor: T.bgElev, borderRadius: 8, padding: 12 }}>
    <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <PlayCircle size={14} color={T.success} />
      <span style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>Test Webhook</span>
      <div style={{ flex: 1 }} />
      {open ? <ChevronUp size={14} color={T.textMute} /> : <ChevronDown size={14} color={T.textMute} />}
    </div>
    {open && <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {usedKeys.length > 0 && <div>
        <Label>Test values for {usedKeys.length} field{usedKeys.length === 1 ? '' : 's'}</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {usedKeys.map((k) => <div key={k} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 10.5, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap' }}>{k}</span>
            <Input value={testValues[k] || ''} onChange={(e) => setTestValues({ ...testValues, [k]: e.target.value })} placeholder="test value" style={{ fontSize: 11, padding: '4px 7px' }} />
          </div>)}
        </div>
      </div>}
      <Btn variant="success" size="md" icon={busy ? Loader2 : Send} onClick={runTest} disabled={busy} style={busy ? { opacity: 0.7 } : {}}>{busy ? 'Sending...' : 'Run Test'}</Btn>
      {result && <div style={{ padding: 10, backgroundColor: T.bg, border: `1px solid ${result.ok ? T.success : T.danger}`, borderRadius: 6, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <Pill color={result.ok ? T.success : T.danger}>{result.status || 'ERROR'}</Pill>
          {result.time != null && <span style={{ color: T.textMute }}>{result.time}ms</span>}
        </div>
        {result.error ? <div style={{ color: T.danger }}>{result.error}</div> :
          <pre style={{ margin: 0, color: T.textDim, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflow: 'auto' }}>{typeof result.body === 'string' ? result.body : JSON.stringify(result.body, null, 2)}</pre>}
      </div>}
    </div>}
  </div>
}

export const WebhookEditor = ({ draft, update, customFields }) => {
  const urlRef = useRef(null)
  const bodyRef = useRef(null)
  const headerValueRefs = useRef({})

  const insertAt = (input, text) => {
    if (!input) return
    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0
    const current = input.value
    const newValue = current.slice(0, start) + text + current.slice(end)
    input.value = newValue
    input.focus()
    input.setSelectionRange(start + text.length, start + text.length)
    return newValue
  }

  const headers = draft.webhookHeaders || []
  const responseMappings = draft.responseMappings || []
  const method = draft.webhookMethod || 'POST'
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method)

  const addHeader = () => update({ webhookHeaders: [...headers, { id: genId('h'), key: '', value: '' }] })
  const updHeader = (id, patch) => update({ webhookHeaders: headers.map((h) => h.id === id ? { ...h, ...patch } : h) })
  const rmHeader = (id) => update({ webhookHeaders: headers.filter((h) => h.id !== id) })
  const addMapping = () => update({ responseMappings: [...responseMappings, { id: genId('rm'), jsonPath: '', fieldKey: '' }] })
  const updMapping = (id, patch) => update({ responseMappings: responseMappings.map((m) => m.id === id ? { ...m, ...patch } : m) })
  const rmMapping = (id) => update({ responseMappings: responseMappings.filter((m) => m.id !== id) })

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Label style={{ marginBottom: 0 }}>Method & URL</Label>
        <FieldPicker customFields={customFields} onInsert={(text) => { const newVal = insertAt(urlRef.current, text); if (newVal != null) update({ webhookUrl: newVal }) }} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Select value={method} onChange={(e) => update({ webhookMethod: e.target.value })} style={{ width: 110, flexShrink: 0, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
          {HTTP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Input ref={urlRef} mono value={draft.webhookUrl || ''} onChange={(e) => update({ webhookUrl: e.target.value })} placeholder="https://api.example.com/endpoint" style={{ flex: 1 }} />
      </div>
    </div>

    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Label style={{ marginBottom: 0 }}>Headers · {headers.length}</Label>
        <Btn variant="ghost" size="xs" icon={Plus} onClick={addHeader}>Add Header</Btn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {headers.length === 0 && <div style={{ fontSize: 10.5, color: T.textLow, padding: '8px 10px', border: `1px dashed ${T.border}`, borderRadius: 5, textAlign: 'center' }}>No headers set</div>}
        {headers.map((h) => <div key={h.id} style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
          <Input mono value={h.key} onChange={(e) => updHeader(h.id, { key: e.target.value })} placeholder="Content-Type" style={{ flex: 1, fontSize: 11 }} />
          <div style={{ flex: 1.5, position: 'relative' }}>
            <Input ref={(el) => headerValueRefs.current[h.id] = el} value={h.value} onChange={(e) => updHeader(h.id, { value: e.target.value })} placeholder="application/json" style={{ fontSize: 11, paddingRight: 90, fontFamily: '"JetBrains Mono", monospace' }} />
            <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}>
              <FieldPicker customFields={customFields} onInsert={(text) => { const newVal = insertAt(headerValueRefs.current[h.id], text); if (newVal != null) updHeader(h.id, { value: newVal }) }} />
            </div>
          </div>
          <IconBtn icon={X} onClick={() => rmHeader(h.id)} />
        </div>)}
      </div>
    </div>

    {hasBody && <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Label style={{ marginBottom: 0 }}>JSON Body</Label>
        <FieldPicker customFields={customFields} onInsert={(text) => { const newVal = insertAt(bodyRef.current, text); if (newVal != null) update({ webhookPayload: newVal }) }} />
      </div>
      <Textarea ref={bodyRef} value={draft.webhookPayload || ''} onChange={(e) => update({ webhookPayload: e.target.value })}
        placeholder={'{\n  "mobile": "{{mobile}}",\n  "email": "{{email}}"\n}'}
        style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, minHeight: 140 }} />
    </div>}

    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Label style={{ marginBottom: 0 }}>Response Field Mappings · {responseMappings.length}</Label>
        <Btn variant="ghost" size="xs" icon={Plus} onClick={addMapping}>Add Mapping</Btn>
      </div>
      <div style={{ fontSize: 10.5, color: T.textLow, marginBottom: 8 }}>
        Extract values from the JSON response into custom fields. Use dot notation for nested values (e.g. <code style={{ fontFamily: '"JetBrains Mono", monospace', color: T.textDim }}>data.user.tier</code>).
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {responseMappings.length === 0 && <div style={{ fontSize: 10.5, color: T.textLow, padding: '8px 10px', border: `1px dashed ${T.border}`, borderRadius: 5, textAlign: 'center' }}>No response mappings set</div>}
        {responseMappings.map((m) => <div key={m.id} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <Input mono value={m.jsonPath} onChange={(e) => updMapping(m.id, { jsonPath: e.target.value })} placeholder="data.tier" style={{ flex: 1, fontSize: 11 }} />
          <span style={{ color: T.textLow, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>{'->'}</span>
          <Select value={m.fieldKey} onChange={(e) => updMapping(m.id, { fieldKey: e.target.value })} style={{ flex: 1, fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}>
            <option value="">- pick field -</option>
            {customFields.map((cf) => <option key={cf.id} value={cf.key}>{cf.key}</option>)}
          </Select>
          <IconBtn icon={X} onClick={() => rmMapping(m.id)} />
        </div>)}
      </div>
    </div>

    <WebhookTester method={method} url={draft.webhookUrl || ''} headers={headers} payload={draft.webhookPayload || ''} customFields={customFields} />
  </div>
}

export const DynamicContentEditor = ({ rules, customFields, onChange }) => {
  const safe = rules || []
  const addRule = () => onChange([...safe, { id: genId('dc'), ifField: '', ifOperator: 'eq', ifValue: '', overrides: { headline: '', tagline: '', question: '', subheadline: '' } }])
  const updRule = (id, p) => onChange(safe.map((r) => r.id === id ? { ...r, ...p } : r))
  const updOverride = (id, k, v) => onChange(safe.map((r) => r.id === id ? { ...r, overrides: { ...r.overrides, [k]: v } } : r))
  const rmRule = (id) => onChange(safe.filter((r) => r.id !== id))
  const moveRule = (idx, dir) => { const a = [...safe]; const ni = idx + dir; if (ni < 0 || ni >= a.length) return;[a[idx], a[ni]] = [a[ni], a[idx]]; onChange(a) }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ fontSize: 11.5, color: T.textMute, lineHeight: 1.5 }}>
      Rules evaluate top-to-bottom in preview and at runtime. First match wins. Use this to swap the headline/question/tagline based on UTM-captured fields like <code style={{ fontFamily: '"JetBrains Mono", monospace', color: T.textDim }}>ad_label</code>.
    </div>
    {safe.length === 0 && <div style={{ fontSize: 11, color: T.textLow, padding: '12px 10px', border: `1px dashed ${T.border}`, borderRadius: 6, textAlign: 'center' }}>No dynamic rules. The static content above will always render.</div>}
    {safe.map((rule, i) => <div key={rule.id} style={{ backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Pill color={T.purple}>RULE #{i + 1}</Pill>
        <div style={{ flex: 1 }} />
        <IconBtn icon={ChevronUp} onClick={() => moveRule(i, -1)} />
        <IconBtn icon={ChevronDown} onClick={() => moveRule(i, 1)} />
        <IconBtn icon={Trash2} onClick={() => rmRule(rule.id)} style={{ color: T.danger }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
        <Select value={rule.ifField} onChange={(e) => updRule(rule.id, { ifField: e.target.value })}>
          <option value="">- if field -</option>
          {customFields.map((cf) => <option key={cf.id} value={cf.key}>{cf.key}</option>)}
        </Select>
        <Select value={rule.ifOperator} onChange={(e) => updRule(rule.id, { ifOperator: e.target.value })}>
          {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
        </Select>
        <Input value={rule.ifValue} onChange={(e) => updRule(rule.id, { ifValue: e.target.value })} placeholder="value" disabled={['is_empty', 'is_not_empty'].includes(rule.ifOperator)} />
      </div>
      <div style={{ fontSize: 10, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>OVERRIDES (leave blank to keep static value)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {['tagline', 'headline', 'question', 'subheadline'].map((field) => <div key={field} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', width: 80, flexShrink: 0 }}>{field}</span>
          <Input value={rule.overrides[field] || ''} onChange={(e) => updOverride(rule.id, field, e.target.value)} placeholder={`Override ${field}...`} style={{ flex: 1, fontSize: 12 }} />
        </div>)}
      </div>
    </div>)}
    <Btn variant="secondary" size="md" icon={Plus} onClick={addRule}>Add Rule</Btn>
  </div>
}

export const AIEditor = ({ draft, customFields, update }) => {
  const ai = draft.ai || { enabled: false, prompt: '', outputField: '', model: 'claude-sonnet-4-6', sourceField: '' }
  const updAi = (p) => update({ ai: { ...ai, ...p } })
  const [busy, setBusy] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [testInput, setTestInput] = useState('')

  const runTest = async () => {
    setBusy(true); setTestResult(null)
    try {
      const interpolatedPrompt = (ai.prompt || '').replace(/\{\{(\w+)\}\}/g, (_, k) => k === ai.sourceField ? testInput : `{{${k}}}`)
      const res = await aiTestPrompt({ prompt: interpolatedPrompt, model: ai.model })
      if (res.ok) setTestResult({ ok: true, text: res.text })
      else setTestResult({ ok: false, error: res.error })
    } catch (err) { setTestResult({ ok: false, error: err.message }) } finally { setBusy(false) }
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ padding: 12, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: ai.enabled ? `${T.purple}22` : T.bgElev2, color: ai.enabled ? T.purple : T.textMute, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>AI Processing on Submit</div>
        <div style={{ fontSize: 11.5, color: T.textMute, marginTop: 2 }}>When user submits this node, run an AI prompt against their answer and write the result to a custom field</div>
      </div>
      <button onClick={() => updAi({ enabled: !ai.enabled })} style={{ padding: '7px 12px', borderRadius: 6, backgroundColor: ai.enabled ? `${T.purple}22` : T.bgElev2, border: `1px solid ${ai.enabled ? T.purple : T.border}`, color: ai.enabled ? T.purple : T.textMute, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>{ai.enabled ? 'ON' : 'OFF'}</button>
    </div>
    {ai.enabled && <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><Label>Source Field (the input to analyze)</Label><Select value={ai.sourceField} onChange={(e) => updAi({ sourceField: e.target.value })}><option value="">- pick source -</option>{customFields.map((cf) => <option key={cf.id} value={cf.key}>{cf.key}</option>)}</Select></div>
        <div><Label>Output Field (where the result is written)</Label><Select value={ai.outputField} onChange={(e) => updAi({ outputField: e.target.value })}><option value="">- pick output -</option>{customFields.map((cf) => <option key={cf.id} value={cf.key}>{cf.key}</option>)}</Select></div>
      </div>
      <div><Label>Model</Label><Select value={ai.model} onChange={(e) => updAi({ model: e.target.value })}><option value="claude-sonnet-4-6">Claude Sonnet 4.6 (fast)</option><option value="claude-opus-4-7">Claude Opus 4.7 (most capable)</option><option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (cheapest)</option></Select></div>
      <div>
        <Label>Prompt Template</Label>
        <Textarea value={ai.prompt || ''} onChange={(e) => updAi({ prompt: e.target.value })} placeholder={`e.g. Score the severity of this accident description from 1-10. Return only the number.\n\nDescription: {{accident_details}}\n\nScore:`} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, minHeight: 140 }} />
        <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 6 }}>Use {`{{field_key}}`} to interpolate any captured field value. Output is trimmed and saved to the output field.</div>
      </div>
      <div style={{ padding: 12, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
        <Label>Test the Prompt</Label>
        <Input value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder={`Sample value for ${ai.sourceField || 'source field'}`} style={{ marginBottom: 8 }} />
        <Btn variant="success" size="md" icon={busy ? Loader2 : Send} onClick={runTest} disabled={busy || !ai.prompt}>{busy ? 'Running...' : 'Run Test'}</Btn>
        {testResult && <div style={{ marginTop: 10, padding: 10, backgroundColor: T.bg, border: `1px solid ${testResult.ok ? T.success : T.danger}`, borderRadius: 6, fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, color: T.textDim, whiteSpace: 'pre-wrap', maxHeight: 240, overflow: 'auto' }}>{testResult.ok ? testResult.text : testResult.error}</div>}
      </div>
    </>}
  </div>
}

export const NodeEditorModal = ({ node, quiz, customFields, onSave, onClose, onDelete, onRenameStep }) => {
  const [draft, setDraft] = useState(node)
  const [tab, setTab] = useState('content')
  const [dirty, setDirty] = useState(false)
  const [closeReq, setCloseReq] = useState(false)
  const [deleteReq, setDeleteReq] = useState(false)
  const [stepLabelDraft, setStepLabelDraft] = useState('')

  useEffect(() => { setDraft(node); setDirty(false); const s = quiz.steps.find((x) => x.key === node.stepKey); setStepLabelDraft(s?.label || '') }, [node])

  const update = (p) => { setDraft((d) => ({ ...d, ...p })); setDirty(true) }
  const updateAns = (aid, p) => { setDraft((d) => ({ ...d, answers: d.answers.map((a) => a.id === aid ? { ...a, ...p } : a) })); setDirty(true) }
  const addAns = () => update({ answers: [...draft.answers, mkA('New answer')] })
  const delAns = (aid) => update({ answers: draft.answers.filter((a) => a.id !== aid) })
  const addFM = (aid) => { const a = draft.answers.find((x) => x.id === aid); updateAns(aid, { fieldMappings: [...a.fieldMappings, { key: customFields[0]?.key || '', value: '' }] }) }
  const updFM = (aid, i, p) => { const a = draft.answers.find((x) => x.id === aid); updateAns(aid, { fieldMappings: a.fieldMappings.map((m, idx) => idx === i ? { ...m, ...p } : m) }) }
  const rmFM = (aid, i) => { const a = draft.answers.find((x) => x.id === aid); updateAns(aid, { fieldMappings: a.fieldMappings.filter((_, idx) => idx !== i) }) }
  const toggleTier = (tid) => update({ tiers: draft.tiers.includes(tid) ? draft.tiers.filter((t) => t !== tid) : [...draft.tiers, tid] })
  const addFF = () => update({ formFields: [...(draft.formFields || []), { key: 'new_field', label: 'New Field', type: 'text', placeholder: '', required: false }] })
  const updFF = (i, p) => update({ formFields: draft.formFields.map((f, idx) => idx === i ? { ...f, ...p } : f) })
  const rmFF = (i) => update({ formFields: draft.formFields.filter((_, idx) => idx !== i) })
  const moveFF = (i, dir) => { const a = [...draft.formFields]; const ni = i + dir; if (ni < 0 || ni >= a.length) return;[a[i], a[ni]] = [a[ni], a[i]]; update({ formFields: a }) }
  const addCond = () => update({ conditions: [...(draft.conditions || []), { id: genId('c'), field: '', operator: 'eq', value: '', nextStepKey: '' }] })
  const updCond = (cid, p) => update({ conditions: draft.conditions.map((c) => c.id === cid ? { ...c, ...p } : c) })
  const rmCond = (cid) => update({ conditions: draft.conditions.filter((c) => c.id !== cid) })

  const stepLabelChanged = stepLabelDraft !== (quiz.steps.find((s) => s.key === draft.stepKey)?.label || '')
  const handleClose = () => { if (dirty || stepLabelChanged) setCloseReq(true); else onClose() }
  const persist = () => { if (stepLabelDraft && stepLabelChanged) onRenameStep(draft.stepKey, stepLabelDraft); onSave(draft); setDirty(false) }
  const handleSave = () => persist()
  const handleSaveAndExit = () => { persist(); onClose() }

  const step = quiz.steps.find((s) => s.key === draft.stepKey)
  const meta = findNodeTypeMeta(draft.questionType)
  const isQ = draft.type === 'question'
  const isForm = draft.type === 'form'
  const isDec = draft.type === 'decision'
  const isWH = draft.type === 'webhook' || draft.type === 'verification'
  const isEndpoint = draft.type === 'endpoint'
  const visibleByDefault = VISIBLE_BY_DEFAULT[draft.type]
  const effectiveVisible = isNodeVisible(draft)
  const redirect = draft.redirect || { mode: 'none', url: '', buttonText: 'Continue' }

  const tabs = [
    { id: 'content', label: 'Content', show: true },
    { id: 'dynamic', label: `Dynamic · ${(draft.dynamicContent || []).length}`, show: !isWH && !isDec },
    { id: 'answers', label: `Answers · ${draft.answers.length}`, show: isQ },
    { id: 'formfields', label: `Form Fields · ${(draft.formFields || []).length}`, show: isForm },
    { id: 'conditions', label: `Conditions · ${(draft.conditions || []).length}`, show: isDec },
    { id: 'webhook', label: 'Webhook', show: isWH },
    { id: 'redirect', label: 'Redirect', show: isEndpoint },
    { id: 'visibility', label: 'Visibility & Tiers', show: true },
    { id: 'behavior', label: 'Behavior', show: !isWH && !isDec },
    { id: 'scripts', label: 'Scripts', show: true },
    { id: 'ai', label: `AI${draft.ai?.enabled ? ' *' : ''}`, show: !isWH && !isDec },
  ].filter((t) => t.show)

  return <>
    <div onClick={handleClose} style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 20px 20px', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 880, minHeight: 560, backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Editing · {draft.id} · step: {step?.label}</div>
            <div style={{ fontSize: 17, color: T.text, fontWeight: 600, letterSpacing: '-0.015em', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              {draft.fieldName} <span style={{ color: T.textMute, fontWeight: 400, fontSize: 13 }}>· {meta?.name || draft.questionType}</span>
              {!effectiveVisible && <Pill color={T.textMute}><EyeOff size={9} style={{ verticalAlign: '-1px', marginRight: 3 }} />HIDDEN</Pill>}
            </div>
          </div>
          {dirty && <Pill color={T.warning}>UNSAVED</Pill>}
          <IconBtn icon={X} onClick={handleClose} />
        </div>
        <div style={{ padding: '0 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 0 }}>
          {tabs.map((t) => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '11px 12px', backgroundColor: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? T.text : 'transparent'}`, color: tab === t.id ? T.text : T.textMute, fontSize: 12, fontWeight: 500, fontFamily: '"Inter", sans-serif', cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap' }}>{t.label}</button>)}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: 22 }}>
          {tab === 'content' && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label>Step Name (visible in left panel + grid)</Label>
              <Input value={stepLabelDraft} onChange={(e) => { setStepLabelDraft(e.target.value); setDirty(true) }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>Node Type</Label>
                <div style={{ padding: '7px 10px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12.5, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: meta?.categoryColor }}>{'●'}</span> {meta?.categoryName || draft.type}
                </div>
              </div>
              <div>
                <Label>Question Type</Label>
                <div style={{ padding: '7px 10px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12.5, color: T.text }}>{meta?.name || draft.questionType}</div>
              </div>
            </div>
            <div><Label>Field Name (variable that captures answer)</Label><Input mono value={draft.fieldName} onChange={(e) => update({ fieldName: e.target.value })} /></div>
            {!isWH && !isDec && <>
              <div><Label>Tagline (small text above headline, optional)</Label><Input value={draft.tagline || ''} onChange={(e) => update({ tagline: e.target.value })} placeholder="e.g. Take the 30 Second Quiz to..." /></div>
              <div><Label>Headline (large bold)</Label><Input value={draft.headline || ''} onChange={(e) => update({ headline: e.target.value })} /></div>
              <div><Label>Question</Label><Input value={draft.question || ''} onChange={(e) => update({ question: e.target.value })} /></div>
              <div><Label>Subheadline</Label><Input value={draft.subheadline || ''} onChange={(e) => update({ subheadline: e.target.value })} /></div>
            </>}
            {(isWH || isDec) && <>
              <div><Label>Internal Name (for builder reference only - not shown to users)</Label><Input value={draft.headline || ''} onChange={(e) => update({ headline: e.target.value })} placeholder="e.g. Tier Lookup, HLR Verify" /></div>
              <div><Label>Notes (internal documentation)</Label><Input value={draft.subheadline || ''} onChange={(e) => update({ subheadline: e.target.value })} placeholder="What this node does" /></div>
            </>}
            {draft.questionType === 'dropdown' && <div>
              <Label>Dropdown Source (custom field)</Label>
              <Select value={draft.dropdownField || ''} onChange={(e) => update({ dropdownField: e.target.value })}>
                <option value="">- pick a custom field -</option>
                {customFields.filter((cf) => cf.type === 'dropdown').map((cf) => <option key={cf.id} value={cf.key}>{cf.label} ({cf.options.length} options)</option>)}
              </Select>
              <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 6 }}>Manage options under Settings {'>'} Custom Fields</div>
            </div>}
            {isForm && <div style={{ padding: 12, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <Label>Spam Protection</Label>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                <button onClick={() => update({ honeypot: !draft.honeypot })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: draft.honeypot ? `${T.success}22` : T.bgElev2, border: `1px solid ${draft.honeypot ? T.success : T.border}`, color: draft.honeypot ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{draft.honeypot ? 'ON HONEYPOT' : 'OFF HONEYPOT'}</button>
                <button onClick={() => update({ recaptcha: !draft.recaptcha })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: draft.recaptcha ? `${T.success}22` : T.bgElev2, border: `1px solid ${draft.recaptcha ? T.success : T.border}`, color: draft.recaptcha ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{draft.recaptcha ? 'ON RECAPTCHA' : 'OFF RECAPTCHA'}</button>
              </div>
              <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 8 }}>Honeypot adds an invisible field that bots fill in. ReCaptcha keys configured in Quiz Settings.</div>
            </div>}
          </div>}

          {tab === 'dynamic' && <DynamicContentEditor rules={draft.dynamicContent} customFields={customFields} onChange={(rules) => update({ dynamicContent: rules })} />}

          {tab === 'answers' && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {draft.answers.map((answer, ai) => <div key={answer.id} style={{ border: `1px solid ${T.border}`, backgroundColor: T.bgElev, borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Pill color={T.textLow}>#{ai + 1}</Pill>
                <Input value={answer.label} onChange={(e) => updateAns(answer.id, { label: e.target.value })} style={{ flex: 1 }} />
                <button onClick={() => updateAns(answer.id, { isDQ: !answer.isDQ })} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, backgroundColor: answer.isDQ ? T.primarySoft : T.bgElev2, border: `1px solid ${answer.isDQ ? T.danger : T.border}`, color: answer.isDQ ? T.danger : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>DQ</button>
                <IconBtn icon={Trash2} onClick={() => delAns(answer.id)} />
              </div>
              <div style={{ marginTop: 10, padding: 10, backgroundColor: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Label style={{ marginBottom: 0 }}>Custom Field Mappings</Label>
                  <Btn variant="ghost" size="xs" icon={Plus} onClick={() => addFM(answer.id)}>Add Field</Btn>
                </div>
                {answer.fieldMappings.length === 0 ? <div style={{ fontSize: 10.5, color: T.textLow, padding: '6px 8px', border: `1px dashed ${T.border}`, borderRadius: 5 }}>No fields set when this answer is selected</div> :
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {answer.fieldMappings.map((m, mi) => <div key={mi} style={{ display: 'flex', gap: 5 }}>
                      <Select value={m.key} onChange={(e) => updFM(answer.id, mi, { key: e.target.value })} style={{ flex: 1, fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}>
                        <option value="">- field -</option>
                        {customFields.map((cf) => <option key={cf.id} value={cf.key}>{cf.key}</option>)}
                      </Select>
                      <span style={{ color: T.textLow, alignSelf: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>=</span>
                      <Input value={m.value} onChange={(e) => updFM(answer.id, mi, { value: e.target.value })} placeholder="value" style={{ flex: 1, fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }} />
                      <IconBtn icon={X} onClick={() => rmFM(answer.id, mi)} />
                    </div>)}
                  </div>}
              </div>
              <div style={{ marginTop: 8, padding: 10, backgroundColor: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>
                <Label style={{ marginBottom: 6 }}>Routing</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: T.textMute, marginBottom: 4 }}>Next Step</div>
                    <Select value={answer.nextStepKey || ''} onChange={(e) => updateAns(answer.id, { nextStepKey: e.target.value })} style={{ fontSize: 11.5 }}>
                      <option value="">Continue (follow step order)</option>
                      {quiz.steps.filter((s) => s.key !== draft.stepKey).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: T.textMute, marginBottom: 4 }}>Set Tier</div>
                    <Select value={answer.setTier || ''} onChange={(e) => updateAns(answer.id, { setTier: e.target.value })} style={{ fontSize: 11.5 }}>
                      <option value="">Keep current tier</option>
                      {quiz.tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                  </div>
                </div>
              </div>
            </div>)}
            <button onClick={addAns} style={{ padding: 10, backgroundColor: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 8, color: T.textMute, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Plus size={13} /> Add Answer</button>
          </div>}

          {tab === 'formfields' && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11.5, color: T.textMute }}>Configure which fields this form collects. Field keys map to custom fields.</div>
            {(draft.formFields || []).map((field, i) => <div key={i} style={{ border: `1px solid ${T.border}`, backgroundColor: T.bgElev, borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Pill color={T.textLow}>#{i + 1}</Pill><div style={{ flex: 1 }} />
                <IconBtn icon={ChevronUp} onClick={() => moveFF(i, -1)} />
                <IconBtn icon={ChevronDown} onClick={() => moveFF(i, 1)} />
                <button onClick={() => updFF(i, { required: !field.required })} style={{ padding: '5px 9px', borderRadius: 6, fontSize: 10, fontWeight: 600, backgroundColor: field.required ? T.primarySoft : T.bgElev2, border: `1px solid ${field.required ? T.primary : T.border}`, color: field.required ? T.primary : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>REQ</button>
                <IconBtn icon={Trash2} onClick={() => rmFF(i)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 10, color: T.textMute, marginBottom: 4, fontFamily: '"JetBrains Mono", monospace' }}>KEY</div><Input mono value={field.key} onChange={(e) => updFF(i, { key: e.target.value })} /></div>
                <div><div style={{ fontSize: 10, color: T.textMute, marginBottom: 4, fontFamily: '"JetBrains Mono", monospace' }}>LABEL</div><Input value={field.label} onChange={(e) => updFF(i, { label: e.target.value })} /></div>
                <div><div style={{ fontSize: 10, color: T.textMute, marginBottom: 4, fontFamily: '"JetBrains Mono", monospace' }}>TYPE</div><Select value={field.type} onChange={(e) => updFF(i, { type: e.target.value })}>{FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}</Select></div>
              </div>
              <Input value={field.placeholder || ''} onChange={(e) => updFF(i, { placeholder: e.target.value })} placeholder="Placeholder text..." />
            </div>)}
            <button onClick={addFF} style={{ padding: 10, backgroundColor: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 8, color: T.textMute, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Plus size={13} /> Add Form Field</button>
          </div>}

          {tab === 'conditions' && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11.5, color: T.textMute }}>Conditions evaluate top-to-bottom. First match wins. If none match, the default route is used.</div>
            {(draft.conditions || []).map((cond, ci) => <div key={cond.id} style={{ border: `1px solid ${T.border}`, backgroundColor: T.bgElev, borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Pill color={T.textLow}>IF #{ci + 1}</Pill><div style={{ flex: 1 }} />
                <IconBtn icon={Trash2} onClick={() => rmCond(cond.id)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                <Select value={cond.field} onChange={(e) => updCond(cond.id, { field: e.target.value })}>
                  <option value="">- field -</option>
                  {customFields.map((cf) => <option key={cf.id} value={cf.key}>{cf.key}</option>)}
                </Select>
                <Select value={cond.operator} onChange={(e) => updCond(cond.id, { operator: e.target.value })}>
                  {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                </Select>
                <Input value={cond.value} onChange={(e) => updCond(cond.id, { value: e.target.value })} placeholder="value" disabled={['is_empty', 'is_not_empty'].includes(cond.operator)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: T.textMute, fontFamily: '"JetBrains Mono", monospace' }}>THEN {'->'}</span>
                <Select value={cond.nextStepKey} onChange={(e) => updCond(cond.id, { nextStepKey: e.target.value })} style={{ flex: 1 }}>
                  <option value="">- pick step -</option>
                  {quiz.steps.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </Select>
              </div>
            </div>)}
            <button onClick={addCond} style={{ padding: 10, backgroundColor: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 8, color: T.textMute, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Plus size={13} /> Add Condition</button>
            <div style={{ marginTop: 6, padding: 10, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <Label>DEFAULT (if no condition matches)</Label>
              <Select value={draft.defaultNextStepKey || ''} onChange={(e) => update({ defaultNextStepKey: e.target.value })}>
                <option value="">Continue (follow step order)</option>
                {quiz.steps.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </Select>
            </div>
          </div>}

          {tab === 'webhook' && <WebhookEditor draft={draft} update={update} customFields={customFields} />}

          {tab === 'redirect' && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 11.5, color: T.textMute, lineHeight: 1.5 }}>Endpoint nodes can redirect the user to an external URL. Choose how the redirect should happen.</div>
            <div>
              <Label>Redirect Mode</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[{ id: 'none', label: 'No redirect (default thank you)' }, { id: 'button', label: 'Button linked to URL' }, { id: 'immediate', label: 'Immediate redirect on enter' }].map((m) => {
                  const active = redirect.mode === m.id
                  return <button key={m.id} onClick={() => update({ redirect: { ...redirect, mode: m.id } })} style={{ padding: 12, textAlign: 'left', backgroundColor: active ? T.bgElev2 : T.bgElev, border: `1px solid ${active ? T.primary : T.border}`, borderRadius: 6, cursor: 'pointer', color: T.text, fontSize: 13, fontFamily: '"Inter", sans-serif' }}>
                    <div style={{ fontWeight: 600 }}>{m.label}</div>
                  </button>
                })}
              </div>
            </div>
            {redirect.mode !== 'none' && <div><Label>Redirect URL</Label><Input mono value={redirect.url || ''} onChange={(e) => update({ redirect: { ...redirect, url: e.target.value } })} placeholder="https://partner.com/success?lead_id={{lead_id}}" /></div>}
            {redirect.mode === 'button' && <div><Label>Button Text</Label><Input value={redirect.buttonText || 'Continue'} onChange={(e) => update({ redirect: { ...redirect, buttonText: e.target.value } })} /></div>}
            {redirect.mode === 'immediate' && <div style={{ padding: 10, backgroundColor: `${T.warning}11`, border: `1px solid ${T.warning}66`, borderRadius: 6, fontSize: 11.5, color: T.warning }}>The user will be redirected immediately when they reach this node. Use {`{{field_key}}`} to interpolate captured field values into the URL.</div>}
          </div>}

          {tab === 'visibility' && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: effectiveVisible ? `${T.success}22` : T.bgElev2, color: effectiveVisible ? T.success : T.textMute, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {effectiveVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{effectiveVisible ? 'Visible to user' : 'Hidden · auto-advance'}</div>
                  <div style={{ fontSize: 11.5, color: T.textMute, marginTop: 2 }}>
                    {effectiveVisible ? 'This node renders as a step in the live quiz' : 'This node executes in the background then auto-advances. Webhooks fire, decisions route, verifications run.'}
                  </div>
                </div>
                <button onClick={() => update({ isVisible: !effectiveVisible })} style={{ padding: '8px 14px', borderRadius: 6, backgroundColor: effectiveVisible ? T.primarySoft : T.bgElev2, border: `1px solid ${effectiveVisible ? T.primary : T.border}`, color: effectiveVisible ? T.primary : T.textMute, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>{effectiveVisible ? 'HIDE' : 'SHOW'}</button>
              </div>
              <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>Default for {draft.type} nodes: {visibleByDefault ? 'visible' : 'hidden'}</div>
            </div>
            <div>
              <Label>Active Tiers (which tiers see this variant)</Label>
              <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                <button onClick={() => update({ tiers: [] })} style={{ flex: '1 1 auto', minWidth: 100, padding: 10, borderRadius: 6, backgroundColor: tierIsShared(draft) ? `${T.purple}22` : T.bg, border: `1px solid ${tierIsShared(draft) ? T.purple : T.border}`, color: tierIsShared(draft) ? T.purple : T.textMute, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.06em' }}>SHARED</button>
                {quiz.tiers.map((t) => {
                  const active = draft.tiers.includes(t.id)
                  return <button key={t.id} onClick={() => toggleTier(t.id)} style={{ flex: '1 1 auto', minWidth: 80, padding: 10, borderRadius: 6, backgroundColor: active ? `${t.color}22` : T.bg, border: `1px solid ${active ? t.color : T.border}`, color: active ? t.color : T.textMute, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.06em' }}>{t.name.toUpperCase()}</button>
                })}
              </div>
            </div>
          </div>}

          {tab === 'behavior' && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 11.5, color: T.textMute, lineHeight: 1.5 }}>Control how this node behaves in the live quiz.</div>
            <div style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: (draft.autoAdvance !== false) ? `${T.success}22` : T.bgElev2, color: (draft.autoAdvance !== false) ? T.success : T.textMute, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={13} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>Auto-advance on selection</div>
                  <div style={{ fontSize: 11.5, color: T.textMute, marginTop: 2 }}>Single-select/button-grid/dropdown nodes advance immediately on tap. Disable to require Next button (good for dropdowns to prevent fat-finger).</div>
                </div>
                <button onClick={() => update({ autoAdvance: !(draft.autoAdvance !== false) })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: (draft.autoAdvance !== false) ? `${T.success}22` : T.bgElev2, border: `1px solid ${(draft.autoAdvance !== false) ? T.success : T.border}`, color: (draft.autoAdvance !== false) ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{(draft.autoAdvance !== false) ? 'ON' : 'OFF'}</button>
              </div>
            </div>
            {isQ && <div>
              <Label>Answer Columns (grid layout)</Label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const active = (draft.answerColumns || (draft.questionType === 'button_grid' ? 2 : 1)) === n
                  return <button key={n} onClick={() => update({ answerColumns: n })} style={{ flex: 1, padding: '10px 0', borderRadius: 6, backgroundColor: active ? T.primarySoft : T.bgElev, border: `1px solid ${active ? T.primary : T.border}`, color: active ? T.primary : T.textMute, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>{n}</button>
                })}
              </div>
              <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 6 }}>Defaults: 2 columns for button grids, 1 for multiple choice. Mobile collapses to 1-2 columns automatically.</div>
            </div>}
            <div style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <Label>Navigation Buttons</Label>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <button onClick={() => update({ showBackButton: !(draft.showBackButton !== false) })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: (draft.showBackButton !== false) ? `${T.success}22` : T.bgElev2, border: `1px solid ${(draft.showBackButton !== false) ? T.success : T.border}`, color: (draft.showBackButton !== false) ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{(draft.showBackButton !== false) ? 'ON BACK BUTTON' : 'OFF BACK BUTTON'}</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><div style={{ fontSize: 10.5, color: T.textMute, marginBottom: 4, fontFamily: '"JetBrains Mono", monospace' }}>BACK BUTTON TEXT</div><Input value={draft.backButtonText || ''} onChange={(e) => update({ backButtonText: e.target.value })} placeholder="Back" /></div>
                <div><div style={{ fontSize: 10.5, color: T.textMute, marginBottom: 4, fontFamily: '"JetBrains Mono", monospace' }}>NEXT BUTTON TEXT</div><Input value={draft.nextButtonText || ''} onChange={(e) => update({ nextButtonText: e.target.value })} placeholder="Next" /></div>
              </div>
            </div>
          </div>}

          {tab === 'scripts' && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><Label>Enter Script (runs when node is shown)</Label><Textarea value={draft.enterScript || ''} onChange={(e) => update({ enterScript: e.target.value })} placeholder={'// runs on enter'} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, minHeight: 100 }} /></div>
            <div><Label>Exit Script (runs when answer is submitted)</Label><Textarea value={draft.exitScript || ''} onChange={(e) => update({ exitScript: e.target.value })} placeholder={'// runs on exit'} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, minHeight: 100 }} /></div>
          </div>}

          {tab === 'ai' && <AIEditor draft={draft} customFields={customFields} update={update} />}
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn variant="danger" size="md" icon={Trash2} onClick={() => setDeleteReq(true)}>Delete Variant</Btn>
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" size="md" onClick={handleClose}>Cancel</Btn>
          <Btn variant="secondary" size="md" icon={Save} onClick={handleSave} style={{ opacity: dirty ? 1 : 0.6 }}>Save</Btn>
          <Btn variant="primary" size="md" icon={Save} onClick={handleSaveAndExit} style={{ opacity: dirty ? 1 : 0.7 }}>Save & Exit</Btn>
        </div>
      </div>
    </div>
    <ConfirmDialog open={closeReq} title="Discard unsaved changes?" message="You have unsaved changes to this variant. Closing will lose them." confirmText="Discard" cancelText="Keep editing" tertiaryText="Save & Exit" onConfirm={() => { setCloseReq(false); onClose() }} onCancel={() => setCloseReq(false)} onTertiary={() => { setCloseReq(false); handleSaveAndExit() }} />
    <ConfirmDialog open={deleteReq} title={`Delete variant "${draft.fieldName}"?`} message="This will permanently remove this variant. Other variants at the same step are not affected." confirmText="Delete variant" onConfirm={() => { setDeleteReq(false); onDelete(node.id); onClose() }} onCancel={() => setDeleteReq(false)} />
  </>
}

export const CustomFieldEditModal = ({ field, onSave, onClose }) => {
  const [draft, setDraft] = useState(field)
  const [dirty, setDirty] = useState(false)
  const [discardReq, setDiscardReq] = useState(false)
  const update = (p) => { setDraft((d) => ({ ...d, ...p })); setDirty(true) }
  const addOpt = () => update({ options: [...(draft.options || []), { value: '', label: '' }] })
  const updOpt = (i, p) => update({ options: draft.options.map((o, idx) => idx === i ? { ...o, ...p } : o) })
  const rmOpt = (i) => update({ options: draft.options.filter((_, idx) => idx !== i) })
  const tryClose = () => { if (dirty) setDiscardReq(true); else onClose() }

  return <>
    <div onClick={tryClose} style={{ position: 'fixed', inset: 0, zIndex: 140, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, color: T.text, fontWeight: 600 }}>Edit Custom Field</div>
            <div style={{ fontSize: 12, color: T.textMute, marginTop: 2, fontFamily: '"JetBrains Mono", monospace' }}>{draft.key}</div>
          </div>
          <div style={{ flex: 1 }} />
          {dirty && <Pill color={T.warning} style={{ marginRight: 8 }}>UNSAVED</Pill>}
          <IconBtn icon={X} onClick={tryClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div><Label>Key</Label><Input mono value={draft.key} onChange={(e) => update({ key: e.target.value })} /></div>
            <div><Label>Label</Label><Input value={draft.label} onChange={(e) => update({ label: e.target.value })} /></div>
            <div><Label>Type</Label><Select value={draft.type} onChange={(e) => update({ type: e.target.value })}>{FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}</Select></div>
          </div>
          <div style={{ padding: 12, backgroundColor: `${T.info}11`, border: `1px solid ${T.info}55`, borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Globe size={14} color={T.info} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11.5, color: T.textDim, lineHeight: 1.5 }}>This field auto-captures from URL params named <code style={{ fontFamily: '"JetBrains Mono", monospace', color: T.info }}>?{draft.key}=value</code> when the quiz loads. No setup needed.</div>
          </div>
          {draft.type === 'dropdown' && <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Label style={{ marginBottom: 0 }}>Options · {(draft.options || []).length}</Label>
              <Btn variant="ghost" size="xs" icon={Plus} onClick={addOpt}>Add Option</Btn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6, maxHeight: 360, overflowY: 'auto' }}>
              {(draft.options || []).map((opt, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 60px 28px', gap: 6, alignItems: 'center' }}>
                <Input mono value={opt.value} onChange={(e) => updOpt(i, { value: e.target.value })} placeholder="value" style={{ fontSize: 11 }} />
                <Input value={opt.label} onChange={(e) => updOpt(i, { label: e.target.value })} placeholder="label" style={{ fontSize: 11 }} />
                <button onClick={() => updOpt(i, { isDQ: !opt.isDQ })} style={{ padding: '5px 6px', borderRadius: 4, fontSize: 9.5, fontWeight: 600, backgroundColor: opt.isDQ ? T.primarySoft : T.bgElev2, border: `1px solid ${opt.isDQ ? T.danger : T.border}`, color: opt.isDQ ? T.danger : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>DQ</button>
                <IconBtn icon={X} onClick={() => rmOpt(i)} />
              </div>)}
            </div>
          </div>}
        </div>
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" size="md" onClick={tryClose}>Cancel</Btn>
          <Btn variant="primary" size="md" icon={Save} onClick={() => { onSave(draft); onClose() }}>Save Field</Btn>
        </div>
      </div>
    </div>
    <ConfirmDialog open={discardReq} title="Discard changes?" message="You have unsaved changes to this field." confirmText="Discard" cancelText="Keep editing" onConfirm={() => { setDiscardReq(false); onClose() }} onCancel={() => setDiscardReq(false)} />
  </>
}

export const AddStepModal = ({ open, onClose, onPick }) => {
  const [activeCat, setActiveCat] = useState(NODE_CATEGORIES[0].key)
  if (!open) return null
  const cat = NODE_CATEGORIES.find((c) => c.key === activeCat)
  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 820, maxHeight: '85vh', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, display: 'flex', overflow: 'hidden', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)' }}>
      <div style={{ width: 220, backgroundColor: T.bgElev, borderRight: `1px solid ${T.border}`, padding: 14, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12, padding: '0 6px' }}>Categories</div>
        {NODE_CATEGORIES.map((c) => {
          const Icon = c.icon
          const active = activeCat === c.key
          return <button key={c.key} onClick={() => setActiveCat(c.key)} style={{ width: '100%', padding: '8px 10px', backgroundColor: active ? T.bgElev2 : 'transparent', border: 'none', borderRadius: 6, color: active ? T.text : T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, fontSize: 12, fontFamily: '"Inter", sans-serif', textAlign: 'left' }}>
            <Icon size={13} color={c.color} /> {c.name}
          </button>
        })}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, color: T.text, fontWeight: 600, letterSpacing: '-0.01em' }}>{cat.name}</div>
            <div style={{ fontSize: 11.5, color: T.textMute, marginTop: 3 }}>Pick a node type to add a new step</div>
          </div>
          <div style={{ flex: 1 }} />
          <IconBtn icon={X} onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {cat.types.map((t) => {
            const Icon = t.icon
            return <button key={t.id} onClick={() => onPick(t)} style={{ backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, textAlign: 'left', cursor: 'pointer', color: T.text, display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.backgroundColor = T.bgElev2 }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.backgroundColor = T.bgElev }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: `${cat.color}22`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={13} /></div>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em' }}>{t.name}</span>
              </div>
              <span style={{ fontSize: 11.5, color: T.textMute, lineHeight: 1.4 }}>{t.desc}</span>
            </button>
          })}
        </div>
      </div>
    </div>
  </div>
}

export const SettingsModal = ({ quiz, onClose, onSave }) => {
  const [draft, setDraft] = useState(quiz)
  const [tab, setTab] = useState('basics')
  const [dirty, setDirty] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [pendingFieldDelete, setPendingFieldDelete] = useState(null)
  useEffect(() => { setDraft(quiz); setDirty(false) }, [quiz])
  const update = (p) => { setDraft((d) => ({ ...d, ...p })); setDirty(true) }
  const updIntegrations = (p) => update({ integrations: { ...(draft.integrations || {}), ...p } })
  const updScripts = (p) => update({ nodeScripts: { ...(draft.nodeScripts || {}), ...p } })
  const updSpam = (p) => update({ spam: { ...(draft.spam || {}), ...p } })
  const customFields = draft.customFields || SEED_CUSTOM_FIELDS

  const saveField = (field) => update({ customFields: customFields.map((cf) => cf.id === field.id ? field : cf) })
  const duplicateField = (cf) => update({ customFields: [...customFields, { ...cf, id: genId('cf'), key: `${cf.key}_copy`, label: `${cf.label} (copy)` }] })
  const newField = () => { const f = { id: genId('cf'), key: `field_${customFields.length}`, label: 'New Field', type: 'text', options: [] }; update({ customFields: [...customFields, f] }); setEditingField(f) }
  const confirmFieldDelete = () => { if (pendingFieldDelete) update({ customFields: customFields.filter((cf) => cf.id !== pendingFieldDelete) }); setPendingFieldDelete(null) }

  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 880, maxHeight: '90vh', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 16, color: T.text, fontWeight: 600 }}>Quiz Settings</div>
        <div style={{ flex: 1 }} />
        {dirty && <Pill color={T.warning} style={{ marginRight: 8 }}>UNSAVED</Pill>}
        <IconBtn icon={X} onClick={onClose} />
      </div>
      <div style={{ padding: '0 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 0 }}>
        {[['basics', 'Basics'], ['tiers', `Tiers · ${draft.tiers.length}`], ['fields', `Custom Fields · ${customFields.length}`], ['integrations', 'Integrations'], ['scripts', 'Node Scripts'], ['spam', 'Spam Protection']].map(([id, lbl]) => <button key={id} onClick={() => setTab(id)} style={{ padding: '11px 12px', backgroundColor: 'transparent', border: 'none', borderBottom: `2px solid ${tab === id ? T.text : 'transparent'}`, color: tab === id ? T.text : T.textMute, fontSize: 12, fontWeight: 500, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap' }}>{lbl}</button>)}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, minHeight: 0 }}>
        {tab === 'basics' && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><Label>Quiz Name</Label><Input value={draft.name} onChange={(e) => update({ name: e.target.value })} /></div>
          <div><Label>Slug</Label><Input mono value={draft.slug} onChange={(e) => update({ slug: e.target.value })} /></div>
        </div>}

        {tab === 'tiers' && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {draft.tiers.map((t, i) => <div key={t.id} style={{ padding: 10, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="color" value={t.color} onChange={(e) => { const a = [...draft.tiers]; a[i] = { ...t, color: e.target.value }; update({ tiers: a }) }} style={{ width: 28, height: 28, padding: 1, borderRadius: 4, border: `1px solid ${T.border}`, backgroundColor: T.bg }} />
            <Input value={t.name} onChange={(e) => { const a = [...draft.tiers]; a[i] = { ...t, name: e.target.value }; update({ tiers: a }) }} style={{ flex: 1 }} />
            <Input mono value={t.id} disabled style={{ width: 90, opacity: 0.6 }} />
            <IconBtn icon={Trash2} onClick={() => update({ tiers: draft.tiers.filter((x) => x.id !== t.id) })} />
          </div>)}
          <Btn variant="secondary" size="md" icon={Plus} onClick={() => update({ tiers: [...draft.tiers, { id: genId('t'), name: `Tier ${draft.tiers.length + 1}`, color: '#a78bfa' }] })}>Add Tier</Btn>
        </div>}

        {tab === 'fields' && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11.5, color: T.textMute, marginBottom: 4 }}>Click a field to edit. Use the buttons for duplicate, delete.</div>
          {customFields.map((cf) => <div key={cf.id} onClick={() => setEditingField(cf)} style={{ padding: '10px 12px', backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 7, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.backgroundColor = T.bgElev2 }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.backgroundColor = T.bgElev }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>{cf.key}</span>
                <Pill color={T.textMute}>{cf.type}</Pill>
                {cf.type === 'dropdown' && <Pill color={T.info}>{cf.options?.length || 0} opts</Pill>}
              </div>
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 3 }}>{cf.label}</div>
            </div>
            <Btn variant="ghost" size="xs" icon={Edit3} onClick={(e) => { e.stopPropagation(); setEditingField(cf) }}>Edit</Btn>
            <Btn variant="ghost" size="xs" icon={Copy} onClick={(e) => { e.stopPropagation(); duplicateField(cf) }}>Duplicate</Btn>
            <IconBtn icon={Trash2} onClick={(e) => { e.stopPropagation(); setPendingFieldDelete(cf.id) }} style={{ color: T.danger }} />
          </div>)}
          <Btn variant="secondary" size="md" icon={Plus} onClick={newField} style={{ marginTop: 6 }}>Add Custom Field</Btn>
        </div>}

        {tab === 'integrations' && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11.5, color: T.textMute, marginBottom: 4 }}>Third-party services used during quiz flow.</div>
          {[
            { id: 'email', icon: Mail, label: 'Email Verification', desc: 'Verify email deliverability (BriteVerify, ZeroBounce, NeverBounce)', fields: [['provider', 'Provider (briteverify/zerobounce/neverbounce)'], ['apiKey', 'API Key']] },
            { id: 'phone', icon: Phone, label: 'Phone HLR Lookup (Twilio)', desc: 'Validates mobile numbers and captures carrier info', fields: [['accountSid', 'Twilio Account SID'], ['authToken', 'Twilio Auth Token']] },
            { id: 'address', icon: Globe, label: 'Address Autocomplete (Google Maps)', desc: 'Google Places API for address validation', fields: [['mapsApiKey', 'Google Maps API Key']] },
            { id: 'recaptcha', icon: ShieldCheck, label: 'reCAPTCHA / Turnstile', desc: 'Bot protection on form submissions', fields: [['provider', 'Provider (recaptcha/turnstile)'], ['siteKey', 'Site Key'], ['secretKey', 'Secret Key']] },
          ].map((int) => {
            const cfg = (draft.integrations || {})[int.id] || { enabled: false }
            const Icon = int.icon
            return <div key={int.id} style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cfg.enabled ? 12 : 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: cfg.enabled ? `${T.success}22` : T.bgElev2, color: cfg.enabled ? T.success : T.textMute, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{int.label}</div>
                  <div style={{ fontSize: 11, color: T.textMute }}>{int.desc}</div>
                </div>
                <button onClick={() => updIntegrations({ [int.id]: { ...cfg, enabled: !cfg.enabled } })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: cfg.enabled ? `${T.success}22` : T.bgElev2, border: `1px solid ${cfg.enabled ? T.success : T.border}`, color: cfg.enabled ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{cfg.enabled ? 'ENABLED' : 'DISABLED'}</button>
              </div>
              {cfg.enabled && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {int.fields.map(([fkey, flabel]) => <div key={fkey}><Label>{flabel}</Label><Input mono value={cfg[fkey] || ''} onChange={(e) => updIntegrations({ [int.id]: { ...cfg, [fkey]: e.target.value } })} /></div>)}
              </div>}
            </div>
          })}
        </div>}

        {tab === 'scripts' && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11.5, color: T.textMute, marginBottom: 4 }}>Scripts injected on standalone deployments. Embed deployments inherit from host page.</div>
          {[
            { id: 'trustedform', label: 'TrustedForm', desc: 'ActiveProspect consent capture' },
            { id: 'clarity', label: 'Microsoft Clarity', desc: 'Session recording and heatmaps' },
            { id: 'hotjar', label: 'Hotjar', desc: 'Heatmaps and visitor recordings' },
            { id: 'jornaya', label: 'Jornaya / LeadiD', desc: 'Lead origin certification' },
            { id: 'custom', label: 'Custom Script', desc: 'Any additional tracking script' },
          ].map((s) => {
            const cfg = (draft.nodeScripts || {})[s.id] || { enabled: false, code: '' }
            return <div key={s.id} style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cfg.enabled ? 10 : 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: cfg.enabled ? `${T.purple}22` : T.bgElev2, color: cfg.enabled ? T.purple : T.textMute, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Code2 size={14} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: T.textMute }}>{s.desc}</div>
                </div>
                <button onClick={() => updScripts({ [s.id]: { ...cfg, enabled: !cfg.enabled } })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: cfg.enabled ? `${T.success}22` : T.bgElev2, border: `1px solid ${cfg.enabled ? T.success : T.border}`, color: cfg.enabled ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{cfg.enabled ? 'ENABLED' : 'DISABLED'}</button>
              </div>
              {cfg.enabled && <Textarea value={cfg.code || ''} onChange={(e) => updScripts({ [s.id]: { ...cfg, code: e.target.value } })} placeholder="<script>...</script>" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, minHeight: 80 }} />}
            </div>
          })}
        </div>}

        {tab === 'spam' && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11.5, color: T.textMute, marginBottom: 4 }}>Bot and spam protection. Per-node honeypot toggled in node editor; reCAPTCHA keys in Integrations.</div>
          {[
            { id: 'honeypotEnabled', label: 'Global Honeypot Default', desc: 'New form nodes default to honeypot enabled', toggle: true },
            { id: 'blockDisposableEmail', label: 'Block Disposable Email Domains', desc: 'Reject temp-mail, mailinator, etc.', toggle: true },
            { id: 'minTimeToSubmit', label: 'Minimum Time to Submit (seconds)', desc: 'Reject submissions completed faster than possible', input: true, defaultValue: 5 },
            { id: 'maxAttemptsPerIP', label: 'Max Submissions per IP per Hour', desc: 'Rate limit by source IP', input: true, defaultValue: 3 },
            { id: 'blockedKeywords', label: 'Blocked Keywords (comma-separated)', desc: 'Reject submissions containing these in text fields', textarea: true },
            { id: 'enableAILastNodeCheck', label: 'AI Spam Check on Last Node', desc: 'Quietly score submissions via Claude before posting. Runs after submit so it does not slow the user.', toggle: true },
          ].map((s) => {
            const cfg = (draft.spam || {})
            return <div key={s.id} style={{ padding: 14, backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: (s.input || s.textarea) ? 10 : 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: cfg[s.id] ? `${T.warning}22` : T.bgElev2, color: cfg[s.id] ? T.warning : T.textMute, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={14} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: T.textMute }}>{s.desc}</div>
                </div>
                {s.toggle && <button onClick={() => updSpam({ [s.id]: !cfg[s.id] })} style={{ padding: '6px 11px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, backgroundColor: cfg[s.id] ? `${T.success}22` : T.bgElev2, border: `1px solid ${cfg[s.id] ? T.success : T.border}`, color: cfg[s.id] ? T.success : T.textMute, cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}>{cfg[s.id] ? 'ON' : 'OFF'}</button>}
              </div>
              {s.input && <Input type="number" value={cfg[s.id] || s.defaultValue} onChange={(e) => updSpam({ [s.id]: parseInt(e.target.value) || s.defaultValue })} />}
              {s.textarea && <Textarea value={cfg[s.id] || ''} onChange={(e) => updSpam({ [s.id]: e.target.value })} placeholder="viagra, crypto, lottery, win money" style={{ minHeight: 60 }} />}
            </div>
          })}
        </div>}
      </div>
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
        <Btn variant="ghost" size="md" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" size="md" icon={Save} onClick={() => { onSave(draft) }}>Save Settings</Btn>
      </div>
    </div>
    {editingField && <CustomFieldEditModal field={editingField} onSave={saveField} onClose={() => setEditingField(null)} />}
    <ConfirmDialog open={!!pendingFieldDelete} title="Delete custom field?" message="This cannot be undone." confirmText="Delete" onConfirm={confirmFieldDelete} onCancel={() => setPendingFieldDelete(null)} />
  </div>
}

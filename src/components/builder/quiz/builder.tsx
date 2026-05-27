// @ts-nocheck
/* eslint-disable */
'use client'

// Ported verbatim: the quiz builder panels - the step list (StepListPanel +
// StepRow) and the tier x step grid (TierGridPanel + VariantCard + EmptyCell).

import { useState, useEffect, useMemo, useRef } from 'react'
import { GripVertical, ChevronDown, ChevronRight, Pencil, Trash2, EyeOff, Eye, Edit3, Plus, Search, GitBranch } from 'lucide-react'
import { T, Btn, Input, Pill } from '../ui'
import { findNodeTypeMeta } from './config'
import { tierIsShared, nodesForStep, isNodeVisible } from './seed-data'

const StepRow = ({ step, idx, isFirst, isSelected, isExpanded, isDragSrc, quiz, variants, selectedNodeId, onSelectStep, onToggleExpand, onRename, onSelectNode, onPreviewNode, onAddVariant, onDeleteStep, setDragSrc, onDrop }) => {
  const [editing, setEditing] = useState(false)
  const [labelDraft, setLabelDraft] = useState(step.label)
  const inputRef = useRef(null)
  useEffect(() => { setLabelDraft(step.label) }, [step.label])
  useEffect(() => { if (editing && inputRef.current) inputRef.current.select() }, [editing])

  const tierBadges = useMemo(() => {
    const ts = new Set()
    variants.forEach((v) => { if (tierIsShared(v)) ts.add('SHARED'); else v.tiers.forEach((t) => ts.add(t)) })
    return Array.from(ts)
  }, [variants])

  const hasHidden = variants.some((v) => !isNodeVisible(v))
  const commitRename = () => { if (labelDraft.trim() && labelDraft !== step.label) onRename(labelDraft.trim()); setEditing(false) }

  return <div draggable={!editing} onDragStart={() => setDragSrc(idx)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onDrop(idx) }} style={{ opacity: isDragSrc ? 0.5 : 1 }}>
    <div onClick={() => { if (!editing) { onSelectStep(step.key); onToggleExpand(step.key) } }} style={{ backgroundColor: isSelected ? T.bgElev2 : T.bgElev, border: `1px solid ${isSelected ? T.borderHover : T.border}`, borderRadius: 7, padding: '9px 10px', display: 'flex', alignItems: 'center', gap: 8, cursor: editing ? 'default' : 'pointer' }}>
      <GripVertical size={13} color={T.textLow} style={{ cursor: 'grab', flexShrink: 0 }} />
      <button onClick={(e) => { e.stopPropagation(); onToggleExpand(step.key) }} style={{ background: 'none', border: 'none', padding: 0, color: T.textMute, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>{isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isFirst && <Pill color={T.success}>START</Pill>}
          <span style={{ fontSize: 9.5, color: T.textLow, fontFamily: '"JetBrains Mono", monospace' }}>#{idx + 1}</span>
          {editing ? <input ref={inputRef} value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)} onBlur={commitRename} onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setLabelDraft(step.label); setEditing(false) } }} onClick={(e) => e.stopPropagation()} style={{ flex: 1, background: T.bg, border: `1px solid ${T.borderHover}`, borderRadius: 4, padding: '2px 6px', color: T.text, fontSize: 12, outline: 'none', fontFamily: '"Inter", sans-serif' }} /> :
            <span style={{ fontSize: 12.5, color: T.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.label}</span>}
          {hasHidden && <EyeOff size={10} color={T.textLow} style={{ marginLeft: 'auto', flexShrink: 0 }} aria-label="Has hidden nodes" />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
          {tierBadges.length === 0 && <Pill color={T.textLow}>empty</Pill>}
          {tierBadges.map((t) => {
            if (t === 'SHARED') return <Pill key={t} color={T.purple}>SH</Pill>
            const tier = quiz.tiers.find((tr) => tr.id === t)
            return tier ? <Pill key={t} color={tier.color}>{tier.name.replace('Tier ', 'T')}</Pill> : null
          })}
        </div>
      </div>
      {!editing && <>
        <button onClick={(e) => { e.stopPropagation(); setEditing(true) }} title="Rename step" style={{ background: 'none', border: 'none', padding: 4, color: T.textLow, cursor: 'pointer' }}><Pencil size={10} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDeleteStep(step.key) }} title="Delete step" style={{ background: 'none', border: 'none', padding: 4, color: T.textLow, cursor: 'pointer' }}><Trash2 size={11} /></button>
      </>}
    </div>
    {isExpanded && <div style={{ marginTop: 4, marginLeft: 22, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {variants.map((v) => {
        const meta = findNodeTypeMeta(v.questionType)
        const Icon = meta?.icon || GitBranch
        const isSel = selectedNodeId === v.id
        const hidden = !isNodeVisible(v)
        return <div key={v.id} style={{ backgroundColor: isSel ? T.bgElev2 : 'transparent', border: `1px solid ${isSel ? T.borderHover : T.border}`, borderRadius: 5, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6, opacity: hidden ? 0.7 : 1 }}>
          <Icon size={10} color={meta?.categoryColor || T.textMute} />
          <span onClick={() => onSelectNode(v.id)} style={{ fontSize: 10.5, color: T.textDim, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>{tierIsShared(v) ? 'Shared' : v.tiers.map((t) => quiz.tiers.find((tr) => tr.id === t)?.name.replace('Tier ', 'T') || t).join(' + ')}</span>
          {hidden && <EyeOff size={9} color={T.textLow} />}
          <button onClick={() => onPreviewNode(v.id)} title="Preview" style={{ background: 'none', border: 'none', padding: 3, color: T.textMute, cursor: 'pointer' }}><Eye size={10} /></button>
          <button onClick={() => onSelectNode(v.id)} title="Edit" style={{ background: 'none', border: 'none', padding: 3, color: T.textMute, cursor: 'pointer' }}><Edit3 size={10} /></button>
        </div>
      })}
      <button onClick={() => onAddVariant(step.key)} style={{ backgroundColor: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 5, padding: '5px 8px', color: T.textMute, cursor: 'pointer', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}><Plus size={10} /> Add variant</button>
    </div>}
  </div>
}

export const StepListPanel = ({ quiz, selectedStepKey, selectedNodeId, onSelectStep, onSelectNode, onUpdateStepOrder, onAddStepClick, onDeleteStepRequest, onAddVariant, onRenameStep, onPreviewNode }) => {
  const [dragSrc, setDragSrc] = useState(null)
  const [expanded, setExpanded] = useState(() => new Set([selectedStepKey].filter(Boolean)))
  const [search, setSearch] = useState('')
  useEffect(() => { if (selectedStepKey) setExpanded((prev) => new Set([...prev, selectedStepKey])) }, [selectedStepKey])
  const toggleExpand = (k) => setExpanded((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  const filtered = search ? quiz.steps.filter((s) => s.label.toLowerCase().includes(search.toLowerCase())) : quiz.steps
  const moveStep = (from, to) => { const order = quiz.steps.map((s) => s.key); const [m] = order.splice(from, 1); order.splice(to, 0, m); onUpdateStepOrder(order) }

  return <div style={{ width: 340, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: T.bg, borderRight: `1px solid ${T.border}` }}>
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 600, letterSpacing: '-0.01em' }}>Steps</div>
          <div style={{ fontSize: 10, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>{quiz.steps.length} steps · drag to reorder</div>
        </div>
        <Btn variant="primary" size="sm" icon={Plus} onClick={onAddStepClick}>Add</Btn>
      </div>
      <div style={{ position: 'relative' }}>
        <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: T.textLow }} />
        <Input placeholder="Search steps..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 28, fontSize: 11.5 }} />
      </div>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
      {filtered.map((step) => {
        const idx = quiz.steps.findIndex((s) => s.key === step.key)
        return <StepRow key={step.key} step={step} idx={idx} isFirst={idx === 0} isSelected={selectedStepKey === step.key} isExpanded={expanded.has(step.key)} isDragSrc={dragSrc === idx} quiz={quiz} variants={nodesForStep(quiz, step.key)} selectedNodeId={selectedNodeId} onSelectStep={onSelectStep} onToggleExpand={toggleExpand} onRename={(nl) => onRenameStep(step.key, nl)} onSelectNode={onSelectNode} onPreviewNode={onPreviewNode} onAddVariant={onAddVariant} onDeleteStep={onDeleteStepRequest} setDragSrc={setDragSrc} onDrop={(i) => { if (dragSrc !== null && dragSrc !== i) moveStep(dragSrc, i); setDragSrc(null) }} />
      })}
    </div>
  </div>
}

const VariantCard = ({ node, isSelected, color, onSelect }) => {
  const meta = findNodeTypeMeta(node.questionType)
  const Icon = meta?.icon || GitBranch
  const dqCount = node.answers.filter((a) => a.isDQ).length
  const routedCount = node.answers.filter((a) => a.nextStepKey || a.setTier).length
  const hidden = !isNodeVisible(node)
  return <div onClick={() => onSelect(node.id)} style={{ backgroundColor: T.bgElev, border: `1px solid ${isSelected ? color : T.border}`, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: '8px 10px', cursor: 'pointer', boxShadow: isSelected ? `0 0 0 1px ${color}, 0 6px 18px -8px ${color}66` : 'none', transition: 'all 0.15s', minHeight: 70, opacity: hidden ? 0.75 : 1 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
      <Icon size={10} color={meta?.categoryColor || T.textMute} />
      <span style={{ fontSize: 9, color: T.textLow, fontFamily: '"JetBrains Mono", monospace' }}>{node.fieldName}</span>
      {hidden && <EyeOff size={9} color={T.textLow} style={{ marginLeft: 'auto' }} />}
      {dqCount > 0 && <Pill color={T.danger} style={{ marginLeft: hidden ? 4 : 'auto', fontSize: 8.5 }}>{dqCount} DQ</Pill>}
      {routedCount > 0 && <Pill color={T.info} style={{ fontSize: 8.5 }}>R{routedCount}</Pill>}
    </div>
    <div style={{ fontSize: 11, color: T.text, lineHeight: 1.3, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{node.headline || 'Untitled'}</div>
    {node.answers.length > 0 && <div style={{ fontSize: 9.5, color: T.textMute, marginTop: 5, fontFamily: '"JetBrains Mono", monospace' }}>{node.answers.length} answer{node.answers.length === 1 ? '' : 's'}</div>}
    {hidden && <div style={{ fontSize: 9, color: T.textLow, marginTop: 3, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>hidden · auto-advance</div>}
  </div>
}

const EmptyCell = ({ onAdd }) => <button onClick={onAdd} style={{ backgroundColor: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 6, minHeight: 70, color: T.textLow, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 10.5 }}><Plus size={11} /> Add</button>

export const TierGridPanel = ({ quiz, selectedNodeId, onSelectNode, onAddVariantToCell }) => {
  const COL = 190
  const SH = { id: 'shared', name: 'SHARED', color: T.purple }
  const cols = [SH, ...quiz.tiers]
  return <div style={{ flex: 1, overflow: 'auto', backgroundColor: T.bg, position: 'relative' }}>
    <div style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: 'rgba(37,46,57,0.95)', backdropFilter: 'blur(8px)', padding: '10px 18px', borderBottom: `1px solid ${T.border}`, fontSize: 10.5, color: T.textMute }}>
      Rows = steps in execution order · Columns = tiers · Webhook/Decision/Verification nodes are hidden from the live quiz (auto-fire)
    </div>
    <div style={{ padding: 16, minWidth: 'max-content' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `42px ${cols.map(() => `${COL}px`).join(' ')}`, gap: 10, marginBottom: 10, position: 'sticky', top: 40, zIndex: 4, backgroundColor: T.bg, paddingTop: 6, paddingBottom: 6 }}>
        <div />
        {cols.map((col) => <div key={col.id} style={{ padding: '8px 10px', backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderLeft: `3px solid ${col.color}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, color: col.color, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em' }}>{col.name}</span>
        </div>)}
      </div>
      {quiz.steps.map((step, si) => {
        const variants = nodesForStep(quiz, step.key)
        const shared = variants.find((v) => tierIsShared(v))
        return <div key={step.key} style={{ display: 'grid', gridTemplateColumns: `42px ${cols.map(() => `${COL}px`).join(' ')}`, gap: 10, marginBottom: 10, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6, fontSize: 10, color: T.textLow, fontFamily: '"JetBrains Mono", monospace' }}>#{si + 1}</div>
          {cols.map((col) => {
            if (col.id === 'shared') {
              if (shared) return <VariantCard key={col.id} node={shared} isSelected={selectedNodeId === shared.id} color={col.color} onSelect={onSelectNode} />
              return <EmptyCell key={col.id} onAdd={() => onAddVariantToCell(step.key, [])} />
            }
            if (shared) return <div key={col.id} style={{ backgroundColor: 'rgba(167, 139, 250, 0.04)', border: `1px dashed ${T.border}`, borderRadius: 6, minHeight: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textLow, fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}>shared</div>
            const v = variants.find((x) => x.tiers.includes(col.id))
            if (v) return <VariantCard key={col.id} node={v} isSelected={selectedNodeId === v.id} color={col.color} onSelect={onSelectNode} />
            return <EmptyCell key={col.id} onAdd={() => onAddVariantToCell(step.key, [col.id])} />
          })}
        </div>
      })}
    </div>
  </div>
}

// @ts-nocheck
/* eslint-disable */
'use client'

// The quiz flow canvas: one unified grid where each row is a step and the
// columns are SHARED + one per tier.
//
// This replaced a split layout (a step list panel on the left, a tier grid on
// the right) whose two independent scroll containers and differing row heights
// meant the question on the left drifted out of line with its nodes on the
// right. The fix is structural rather than cosmetic: the step cell and its
// variant cells are now siblings in the SAME CSS grid row, so they cannot
// disagree about vertical position no matter what either side renders. The step
// column is sticky-left so it stays readable while scrolling wide tier sets.
//
// Row reordering is offered as explicit up/down buttons as well as drag, since
// dragging inside a horizontally scrollable canvas is awkward. All structural
// mutations delegate to src/lib/quiz-graph.ts.

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  GripVertical, Pencil, Trash2, EyeOff, Eye, Edit3, Plus, Search, GitBranch, Copy,
  ChevronUp, ChevronDown, AlertTriangle, SkipForward,
} from 'lucide-react'
import { T, Btn, Input, Pill } from '../ui'
import { findNodeTypeMeta } from './config'
import { tierIsShared, nodesForStep, isNodeVisible } from './seed-data'
import { freeSlotsForStep, isRoutedOnly } from '@/lib/quiz-graph'

const STEP_COL = 304
const TIER_COL = 190
const GAP = 10
const SHARED_COL = { id: 'shared', name: 'SHARED', color: T.purple }

const columnTemplate = (tierCount) =>
  `${STEP_COL}px ${Array.from({ length: tierCount + 1 }, () => `${TIER_COL}px`).join(' ')}`

/** Sticky-left cell styling, shared by the header corner and every step cell. */
const stickyLeft = (z) => ({
  position: 'sticky',
  left: 0,
  zIndex: z,
  backgroundColor: T.bg,
  // Covers the grid gap so cards scrolling underneath do not peek through.
  paddingRight: GAP,
  marginRight: -GAP,
})

// ---------------------------------------------------------------------------
// Variant card
// ---------------------------------------------------------------------------

const VariantCard = ({ node, isSelected, color, onSelect, onPreview, onDuplicate, canDuplicate }) => {
  const meta = findNodeTypeMeta(node.questionType)
  const Icon = meta?.icon || GitBranch
  const answers = node.answers || []
  const dqCount = answers.filter((a) => a.isDQ).length
  const routedCount = answers.filter((a) => a.nextStepKey || a.setTier).length
  const hidden = !isNodeVisible(node)
  const optional = isRoutedOnly(node)

  return <div
    onClick={() => onSelect(node.id)}
    style={{
      backgroundColor: T.bgElev,
      border: `1px solid ${isSelected ? color : T.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 6,
      padding: '8px 10px',
      cursor: 'pointer',
      boxShadow: isSelected ? `0 0 0 1px ${color}, 0 6px 18px -8px ${color}66` : 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      minHeight: 78,
      opacity: hidden ? 0.75 : 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <Icon size={10} color={meta?.categoryColor || T.textMute} />
      <span style={{ fontSize: 9, color: T.textLow, fontFamily: '"JetBrains Mono", monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.fieldName}</span>
      <div style={{ flex: 1 }} />
      {hidden && <EyeOff size={9} color={T.textLow} />}
      {optional && <Pill color={T.warning} style={{ fontSize: 8.5 }}>OPT</Pill>}
      {dqCount > 0 && <Pill color={T.danger} style={{ fontSize: 8.5 }}>{dqCount} DQ</Pill>}
      {routedCount > 0 && <Pill color={T.info} style={{ fontSize: 8.5 }}>R{routedCount}</Pill>}
    </div>
    <div style={{ fontSize: 11, color: T.text, lineHeight: 1.3, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
      {node.headline || 'Untitled'}
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {answers.length > 0 && <span style={{ fontSize: 9.5, color: T.textMute, fontFamily: '"JetBrains Mono", monospace' }}>{answers.length} answer{answers.length === 1 ? '' : 's'}</span>}
      {hidden && <span style={{ fontSize: 9, color: T.textLow, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>auto</span>}
      <div style={{ flex: 1 }} />
      <button
        onClick={(e) => { e.stopPropagation(); onPreview(node.id) }}
        title="Preview this variant"
        style={{ background: 'none', border: 'none', padding: 2, color: T.textMute, cursor: 'pointer', display: 'flex' }}
      ><Eye size={11} /></button>
      <button
        onClick={(e) => { e.stopPropagation(); if (canDuplicate) onDuplicate(node.id) }}
        disabled={!canDuplicate}
        title={canDuplicate ? 'Duplicate this variant into the next free cell on this row' : 'This row is full: every tier and the SHARED cell already have a variant'}
        style={{ background: 'none', border: 'none', padding: 2, color: canDuplicate ? T.textMute : T.textLow, cursor: canDuplicate ? 'pointer' : 'not-allowed', opacity: canDuplicate ? 1 : 0.4, display: 'flex' }}
      ><Copy size={11} /></button>
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(node.id) }}
        title="Edit this variant"
        style={{ background: 'none', border: 'none', padding: 2, color: T.textMute, cursor: 'pointer', display: 'flex' }}
      ><Edit3 size={11} /></button>
    </div>
  </div>
}

const EmptyCell = ({ onAdd }) => <button
  onClick={onAdd}
  style={{ backgroundColor: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 6, minHeight: 78, color: T.textLow, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 10.5 }}
><Plus size={11} /> Add</button>

/** A tier column blanked out because a SHARED variant covers the whole row. */
const CoveredBySharedCell = () => <div
  style={{ backgroundColor: 'rgba(167, 139, 250, 0.04)', border: `1px dashed ${T.border}`, borderRadius: 6, minHeight: 78, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textLow, fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}
>shared</div>

// ---------------------------------------------------------------------------
// Step (row header) cell
// ---------------------------------------------------------------------------

const StepCell = ({
  step, idx, total, isFirst, isSelected, isDragSrc, quiz, variants, reorderEnabled,
  onSelectStep, onRename, onMove, onDuplicate, onDelete, onAddVariant, setDragSrc, onDrop,
}) => {
  const [editing, setEditing] = useState(false)
  const [labelDraft, setLabelDraft] = useState(step.label)
  const inputRef = useRef(null)
  useEffect(() => { setLabelDraft(step.label) }, [step.label])
  useEffect(() => { if (editing && inputRef.current) inputRef.current.select() }, [editing])

  const commitRename = () => {
    if (labelDraft.trim() && labelDraft !== step.label) onRename(labelDraft.trim())
    setEditing(false)
  }

  const tierBadges = useMemo(() => {
    const ts = []
    const seen = new Set()
    for (const v of variants) {
      const key = tierIsShared(v) ? 'SHARED' : null
      if (key) { if (!seen.has(key)) { seen.add(key); ts.push(key) }; continue }
      for (const t of v.tiers) if (!seen.has(t)) { seen.add(t); ts.push(t) }
    }
    return ts
  }, [variants])

  const hasHidden = variants.some((v) => !isNodeVisible(v))
  const allOptional = variants.length > 0 && variants.every(isRoutedOnly)
  const someOptional = !allOptional && variants.some(isRoutedOnly)

  return <div
    style={stickyLeft(5)}
    draggable={reorderEnabled && !editing}
    onDragStart={() => reorderEnabled && setDragSrc(idx)}
    onDragOver={(e) => { if (reorderEnabled) e.preventDefault() }}
    onDrop={(e) => { if (!reorderEnabled) return; e.preventDefault(); onDrop(idx) }}
  >
    <div
      onClick={() => { if (!editing) onSelectStep(step.key) }}
      style={{
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: isSelected ? T.bgElev2 : T.bgElev,
        border: `1px solid ${isSelected ? T.borderHover : T.border}`,
        borderRadius: 7,
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        cursor: editing ? 'default' : 'pointer',
        opacity: isDragSrc ? 0.5 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <GripVertical
          size={13}
          color={reorderEnabled ? T.textLow : T.border}
          style={{ cursor: reorderEnabled ? 'grab' : 'not-allowed', flexShrink: 0 }}
        />
        <span style={{ fontSize: 9.5, color: T.textLow, fontFamily: '"JetBrains Mono", monospace', flexShrink: 0 }}>#{idx + 1}</span>
        {isFirst && <Pill color={T.success}>START</Pill>}
        {editing ? <input
          ref={inputRef}
          value={labelDraft}
          onChange={(e) => setLabelDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setLabelDraft(step.label); setEditing(false) } }}
          onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, minWidth: 0, background: T.bg, border: `1px solid ${T.borderHover}`, borderRadius: 4, padding: '2px 6px', color: T.text, fontSize: 12, outline: 'none', fontFamily: '"Inter", sans-serif' }}
        /> : <span
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
          style={{ fontSize: 12.5, color: T.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}
          title={`${step.label} (double-click to rename)`}
        >{step.label}</span>}
        {hasHidden && <EyeOff size={10} color={T.textLow} style={{ flexShrink: 0 }} aria-label="Row has hidden nodes" />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {tierBadges.length === 0 && <Pill color={T.textLow}>empty</Pill>}
        {tierBadges.map((t) => {
          if (t === 'SHARED') return <Pill key={t} color={T.purple}>SH</Pill>
          const tier = quiz.tiers.find((tr) => tr.id === t)
          return tier ? <Pill key={t} color={tier.color}>{tier.name.replace(/^Tier\s+/i, 'T')}</Pill> : null
        })}
        {allOptional && <Pill color={T.warning}><SkipForward size={8} style={{ verticalAlign: '-1px', marginRight: 3 }} />OPTIONAL</Pill>}
        {someOptional && <Pill color={T.warning}>PARTLY OPT</Pill>}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onMove(-1) }}
          disabled={!reorderEnabled || idx === 0}
          title={reorderEnabled ? 'Move step up' : 'Clear the search filter to reorder'}
          style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 4px', color: T.textMute, cursor: (!reorderEnabled || idx === 0) ? 'not-allowed' : 'pointer', opacity: (!reorderEnabled || idx === 0) ? 0.35 : 1, display: 'flex' }}
        ><ChevronUp size={11} /></button>
        <button
          onClick={(e) => { e.stopPropagation(); onMove(1) }}
          disabled={!reorderEnabled || idx === total - 1}
          title={reorderEnabled ? 'Move step down' : 'Clear the search filter to reorder'}
          style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 4px', color: T.textMute, cursor: (!reorderEnabled || idx === total - 1) ? 'not-allowed' : 'pointer', opacity: (!reorderEnabled || idx === total - 1) ? 0.35 : 1, display: 'flex' }}
        ><ChevronDown size={11} /></button>
        <div style={{ flex: 1 }} />
        <button onClick={(e) => { e.stopPropagation(); setEditing(true) }} title="Rename step" style={{ background: 'none', border: 'none', padding: 3, color: T.textLow, cursor: 'pointer', display: 'flex' }}><Pencil size={10} /></button>
        <button onClick={(e) => { e.stopPropagation(); onAddVariant(step.key) }} title="Add a variant to this step" style={{ background: 'none', border: 'none', padding: 3, color: T.textLow, cursor: 'pointer', display: 'flex' }}><Plus size={11} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(step.key) }} title="Duplicate this step and all of its variants" style={{ background: 'none', border: 'none', padding: 3, color: T.textLow, cursor: 'pointer', display: 'flex' }}><Copy size={10} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(step.key) }} title="Delete step" style={{ background: 'none', border: 'none', padding: 3, color: T.textLow, cursor: 'pointer', display: 'flex' }}><Trash2 size={11} /></button>
      </div>
    </div>
  </div>
}

// ---------------------------------------------------------------------------
// Issues strip
// ---------------------------------------------------------------------------

const IssuesStrip = ({ issues, onJumpToStep }) => {
  const [open, setOpen] = useState(false)
  if (!issues || issues.length === 0) return null
  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')
  const tone = errors.length > 0 ? T.danger : T.warning

  return <div style={{ margin: '0 16px 10px', border: `1px solid ${tone}55`, backgroundColor: `${tone}11`, borderRadius: 7 }}>
    <div onClick={() => setOpen(!open)} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <AlertTriangle size={13} color={tone} />
      <span style={{ fontSize: 11.5, color: T.text, fontWeight: 600 }}>
        Flow check: {errors.length} error{errors.length === 1 ? '' : 's'}, {warnings.length} warning{warnings.length === 1 ? '' : 's'}
      </span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 10.5, color: T.textMute }}>{open ? 'hide' : 'show'}</span>
    </div>
    {open && <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {issues.map((issue, i) => <div
        key={i}
        onClick={() => issue.stepKey && onJumpToStep(issue.stepKey)}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: T.textDim, cursor: issue.stepKey ? 'pointer' : 'default', lineHeight: 1.45 }}
      >
        <span style={{ color: issue.level === 'error' ? T.danger : T.warning, flexShrink: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, marginTop: 2 }}>
          {issue.level === 'error' ? 'ERR' : 'WARN'}
        </span>
        <span>{issue.message}</span>
      </div>)}
    </div>}
  </div>
}

// ---------------------------------------------------------------------------
// The canvas
// ---------------------------------------------------------------------------

export const QuizFlowGrid = ({
  quiz, selectedStepKey, selectedNodeId, issues,
  onSelectStep, onSelectNode, onPreviewNode, onAddVariantToCell, onAddStepClick,
  onMoveStep, onDuplicateStep, onDeleteStepRequest, onRenameStep, onDuplicateNode,
}) => {
  const [dragSrc, setDragSrc] = useState(null)
  const [search, setSearch] = useState('')
  const scrollRef = useRef(null)
  const rowRefs = useRef({})

  const cols = useMemo(() => [SHARED_COL, ...quiz.tiers], [quiz.tiers])
  const template = useMemo(() => columnTemplate(quiz.tiers.length), [quiz.tiers.length])

  const query = search.trim().toLowerCase()
  // Reordering while a filter hides rows would move a step past rows the user
  // cannot see, so it is disabled rather than silently doing something else.
  const reorderEnabled = query.length === 0
  const visibleSteps = query
    ? quiz.steps.filter((s) => {
      if (s.label.toLowerCase().includes(query)) return true
      return nodesForStep(quiz, s.key).some((n) =>
        (n.headline || '').toLowerCase().includes(query) || (n.fieldName || '').toLowerCase().includes(query))
    })
    : quiz.steps

  const jumpToStep = (stepKey) => {
    setSearch('')
    onSelectStep(stepKey)
    // Defer so the row exists after the filter clears.
    requestAnimationFrame(() => rowRefs.current[stepKey]?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  }

  return <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', backgroundColor: T.bg, overflow: 'hidden' }}>
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 600, letterSpacing: '-0.01em' }}>Flow</div>
        <div style={{ fontSize: 10, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>
          {quiz.steps.length} step{quiz.steps.length === 1 ? '' : 's'} · {quiz.nodes.length} variant{quiz.nodes.length === 1 ? '' : 's'} · {quiz.tiers.length} tier{quiz.tiers.length === 1 ? '' : 's'}
        </div>
      </div>
      <div style={{ position: 'relative', width: 260 }}>
        <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: T.textLow }} />
        <Input placeholder="Filter steps, headlines, fields..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 28, fontSize: 11.5 }} />
      </div>
      {!reorderEnabled && <span style={{ fontSize: 10.5, color: T.warning, fontFamily: '"JetBrains Mono", monospace' }}>reorder off while filtering</span>}
      <div style={{ flex: 1 }} />
      <Btn variant="primary" size="sm" icon={Plus} onClick={onAddStepClick}>Add Step</Btn>
    </div>

    <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 8, backgroundColor: 'rgba(37,46,57,0.95)', backdropFilter: 'blur(8px)', padding: '9px 16px', borderBottom: `1px solid ${T.border}`, fontSize: 10.5, color: T.textMute }}>
        Rows are steps in execution order · columns are tiers · a SHARED variant covers every tier · webhook, decision and verification nodes are hidden from the live quiz and auto-fire
      </div>

      <div style={{ paddingTop: 10 }}>
        <IssuesStrip issues={issues} onJumpToStep={jumpToStep} />
      </div>

      <div style={{ padding: '0 16px 16px', minWidth: 'max-content' }}>
        {/* Column headers. The step-column cell is sticky in both axes so it
            pins as the corner while scrolling either way. */}
        <div style={{ display: 'grid', gridTemplateColumns: template, gap: GAP, marginBottom: GAP, position: 'sticky', top: 38, zIndex: 7, backgroundColor: T.bg, paddingTop: 6, paddingBottom: 6 }}>
          <div style={{ ...stickyLeft(9), display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Step / Question</span>
          </div>
          {cols.map((col) => <div key={col.id} style={{ padding: '8px 10px', backgroundColor: T.bgElev, border: `1px solid ${T.border}`, borderLeft: `3px solid ${col.color}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10.5, color: col.color, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</span>
          </div>)}
        </div>

        {visibleSteps.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: T.textMute, fontSize: 12, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
          {query ? 'No steps match that filter.' : 'No steps yet. Add one to start building the flow.'}
        </div>}

        {visibleSteps.map((step) => {
          const idx = quiz.steps.findIndex((s) => s.key === step.key)
          const variants = nodesForStep(quiz, step.key)
          const shared = variants.find(tierIsShared)
          const { sharedFree, freeTierIds } = freeSlotsForStep(quiz, step.key)
          const rowHasFreeSlot = sharedFree || freeTierIds.length > 0

          return <div
            key={step.key}
            ref={(el) => { rowRefs.current[step.key] = el }}
            style={{ display: 'grid', gridTemplateColumns: template, gap: GAP, marginBottom: GAP, alignItems: 'stretch' }}
          >
            <StepCell
              step={step}
              idx={idx}
              total={quiz.steps.length}
              isFirst={idx === 0}
              isSelected={selectedStepKey === step.key}
              isDragSrc={dragSrc === idx}
              quiz={quiz}
              variants={variants}
              reorderEnabled={reorderEnabled}
              onSelectStep={onSelectStep}
              onRename={(label) => onRenameStep(step.key, label)}
              onMove={(delta) => onMoveStep(step.key, delta)}
              onDuplicate={onDuplicateStep}
              onDelete={onDeleteStepRequest}
              onAddVariant={(k) => onAddVariantToCell(k, sharedFree ? [] : freeTierIds.length ? [freeTierIds[0]] : [])}
              setDragSrc={setDragSrc}
              onDrop={(target) => { if (dragSrc !== null && dragSrc !== target) onMoveStep(quiz.steps[dragSrc].key, target - dragSrc); setDragSrc(null) }}
            />

            {cols.map((col) => {
              if (col.id === 'shared') {
                if (shared) return <VariantCard
                  key={col.id}
                  node={shared}
                  isSelected={selectedNodeId === shared.id}
                  color={col.color}
                  onSelect={onSelectNode}
                  onPreview={onPreviewNode}
                  onDuplicate={onDuplicateNode}
                  canDuplicate={rowHasFreeSlot}
                />
                return <EmptyCell key={col.id} onAdd={() => onAddVariantToCell(step.key, [])} />
              }
              if (shared) return <CoveredBySharedCell key={col.id} />
              const v = variants.find((x) => x.tiers.includes(col.id))
              if (v) return <VariantCard
                key={col.id}
                node={v}
                isSelected={selectedNodeId === v.id}
                color={col.color}
                onSelect={onSelectNode}
                onPreview={onPreviewNode}
                onDuplicate={onDuplicateNode}
                canDuplicate={rowHasFreeSlot}
              />
              return <EmptyCell key={col.id} onAdd={() => onAddVariantToCell(step.key, [col.id])} />
            })}
          </div>
        })}
      </div>
    </div>
  </div>
}

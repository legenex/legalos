// @ts-nocheck
'use client'

/**
 * The page as a tree: sections, and inside each of them the elements.
 *
 * This is the surface the whole node change was for. The old panel listed
 * thirteen sections and offered exactly three verbs on each - move, hide,
 * delete - because a section was the smallest thing the page knew about. Every
 * node in here has its own id, so the same three verbs now reach the third
 * step, the second button, one line of a checklist.
 *
 * Two levels and no more, which is why this is a list with indentation rather
 * than a recursive tree component. A split section puts its second column in
 * the same flat list and tags those rows, so the order you see here is the
 * order stored, and there is no hidden container to reason about.
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, MoveDown, MoveUp, Plus, Trash2 } from 'lucide-react'
import { T, IconBtn, Label, Btn } from '../ui'
import {
  ELEMENT_SPECS, elementLabel, elementSpec, sectionLabel, sectionSpec,
} from '@/lib/lp-nodes/model'
import { treeIcon } from './nodes/icons'

const ROW = {
  display: 'flex', alignItems: 'center', gap: 5, borderRadius: 6,
  border: `1px solid ${T.border}`, backgroundColor: T.bgElev,
}

const AddElementMenu = ({ section, onAdd, onClose }) => {
  const spec = sectionSpec(section.type)
  const suggested = spec?.suggests ?? []
  const rest = Object.keys(ELEMENT_SPECS).filter((t) => !suggested.includes(t))
  const render = (types, title) => (
    <div>
      <div style={{ fontSize: 9.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: T.textLow, fontFamily: '"JetBrains Mono", monospace', margin: '10px 0 6px' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {types.map((t) => {
          const s = ELEMENT_SPECS[t]
          const Icon = treeIcon(s.icon)
          return (
            <button
              key={t}
              onClick={() => { onAdd(section.id, t); onClose() }}
              title={s.desc}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: 11.5, cursor: 'pointer', textAlign: 'left', fontFamily: '"Inter", system-ui, sans-serif' }}
            >
              <Icon size={12} color={T.textMute} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
  return (
    <div style={{ padding: '4px 8px 10px 18px' }}>
      {suggested.length > 0 ? render(suggested, `Usual in a ${spec?.name?.toLowerCase() || 'section'}`) : null}
      {render(rest, 'Everything else')}
    </div>
  )
}

export const NodeTree = ({
  sections,
  selectedId,
  onSelect,
  onMoveSection,
  onToggleSection,
  onDeleteSection,
  onMoveElement,
  onToggleElement,
  onDeleteElement,
  onAddElement,
  onAddSection,
}) => {
  const [collapsed, setCollapsed] = useState({})
  const [addingIn, setAddingIn] = useState(null)
  const elementCount = sections.reduce((n, s) => n + s.elements.length, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Label>{sections.length} sections {'·'} {elementCount} elements</Label>
        <Btn variant="primary" size="xs" icon={Plus} onClick={onAddSection}>Section</Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sections.map((section, si) => {
          const spec = sectionSpec(section.type)
          const SecIcon = treeIcon(spec?.icon, ChevronRight)
          const hidden = section.isVisible === false
          const isOpen = !collapsed[section.id]
          const selected = selectedId === section.id
          return (
            <div key={section.id}>
              <div style={{ ...ROW, padding: '7px 8px', opacity: hidden ? 0.45 : 1, borderColor: selected ? T.primary : T.border, boxShadow: selected ? `0 0 0 1px ${T.primary}` : 'none' }}>
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [section.id]: isOpen }))}
                  aria-label={isOpen ? 'Collapse section' : 'Expand section'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: T.textMute }}
                >
                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <SecIcon size={13} color={selected ? T.primary : T.textMute} />
                <button
                  onClick={() => onSelect(section.id)}
                  style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, fontWeight: 600, color: T.text, fontFamily: '"Inter", system-ui, sans-serif', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {sectionLabel(section)}
                </button>
                <IconBtn icon={MoveUp} onClick={() => onMoveSection(section.id, -1)} style={{ padding: 3 }} aria-label="Move section up" />
                <IconBtn icon={MoveDown} onClick={() => onMoveSection(section.id, 1)} style={{ padding: 3 }} aria-label="Move section down" />
                <IconBtn icon={hidden ? EyeOff : Eye} onClick={() => onToggleSection(section.id)} style={{ padding: 3 }} aria-label={hidden ? 'Show section' : 'Hide section'} />
                <IconBtn icon={Trash2} onClick={() => onDeleteSection(section.id)} style={{ padding: 3, color: T.danger }} aria-label="Delete section" />
              </div>

              {isOpen ? (
                <div style={{ paddingLeft: 14, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3, borderLeft: `1px solid ${T.border}`, marginLeft: 7 }}>
                  {section.elements.map((el, ei) => {
                    const espec = elementSpec(el.type)
                    const ElIcon = treeIcon(espec?.icon)
                    const elHidden = el.isVisible === false
                    const elSelected = selectedId === el.id
                    return (
                      <div key={el.id} style={{ ...ROW, padding: '5px 7px', marginLeft: 4, opacity: elHidden ? 0.45 : 1, borderColor: elSelected ? T.primary : 'transparent', backgroundColor: elSelected ? T.primarySoft : 'transparent' }}>
                        <ElIcon size={11} color={elSelected ? T.primary : T.textLow} />
                        <button
                          onClick={() => onSelect(el.id)}
                          style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 11.5, color: elSelected ? T.text : T.textDim, fontFamily: '"Inter", system-ui, sans-serif', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {elementLabel(el)}
                        </button>
                        {el.slot === 'aside' ? (
                          <span title="Second column" style={{ fontSize: 8.5, letterSpacing: '0.06em', color: T.textLow, border: `1px solid ${T.border}`, borderRadius: 3, padding: '1px 4px', fontFamily: '"JetBrains Mono", monospace' }}>2ND</span>
                        ) : null}
                        <IconBtn icon={MoveUp} onClick={() => onMoveElement(section.id, el.id, -1)} style={{ padding: 2 }} aria-label="Move element up" />
                        <IconBtn icon={MoveDown} onClick={() => onMoveElement(section.id, el.id, 1)} style={{ padding: 2 }} aria-label="Move element down" />
                        <IconBtn icon={elHidden ? EyeOff : Eye} onClick={() => onToggleElement(section.id, el.id)} style={{ padding: 2 }} aria-label={elHidden ? 'Show element' : 'Hide element'} />
                        <IconBtn icon={Trash2} onClick={() => onDeleteElement(section.id, el.id)} style={{ padding: 2, color: T.danger }} aria-label="Delete element" />
                      </div>
                    )
                  })}

                  {addingIn === section.id ? (
                    <AddElementMenu section={section} onAdd={onAddElement} onClose={() => setAddingIn(null)} />
                  ) : (
                    <button
                      onClick={() => setAddingIn(section.id)}
                      style={{ marginLeft: 4, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px dashed ${T.border}`, borderRadius: 6, padding: '5px 8px', color: T.textMute, fontSize: 11, cursor: 'pointer', fontFamily: '"Inter", system-ui, sans-serif' }}
                    >
                      <Plus size={11} /> Element
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

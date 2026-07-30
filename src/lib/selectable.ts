/**
 * What may appear in an admin picker, and what must never silently vanish from
 * one.
 *
 * Two rules, and the second is the one that matters.
 *
 *   1. A picker offers published and draft records. It never offers archived
 *      ones. Archiving something is a decision to stop using it, and a retired
 *      quiz appearing in the deployment dropdown is how it gets deployed again
 *      by accident.
 *
 *   2. If a record is ALREADY REFERENCED by the thing being edited and has
 *      since been archived, it is still returned, flagged. It is never dropped.
 *      Dropping it makes the select fall back to its first option or to blank,
 *      which silently repoints a live deployment at a different quiz - or at
 *      nothing - the next time somebody saves an unrelated field. The reference
 *      has to stay visible and disabled so the operator sees what happened and
 *      chooses.
 *
 * Pure: it filters and labels a list that was already fetched. Nothing here
 * queries, so a picker cannot accidentally become a database round trip inside
 * a render.
 */

export type SelectableRecord = {
  id: string
  label: string
  /** 'archived' is returned only when the record is currently referenced. */
  status?: 'published' | 'draft' | 'archived' | string
  /** Extra grouping key, e.g. a domain's purpose or a quiz's vertical. */
  group?: string
  /** Anything the caller needs to render the option. Passed through untouched. */
  meta?: Record<string, unknown>
}

export type SelectableOption = SelectableRecord & {
  /** True when this option only exists because it is the saved value. */
  archived: boolean
  /** True when the option cannot be chosen, only kept. */
  disabled: boolean
}

export type SelectableInput<T> = {
  /** Everything fetched, before filtering. */
  records: T[]
  /** The value currently saved on the record being edited, if any. */
  selectedId?: string | null
  /** Maps a raw record onto the shape the picker needs. */
  toRecord: (record: T) => SelectableRecord
  /** Optional extra filter, e.g. same brand, or SSL active. */
  isEligible?: (record: SelectableRecord, raw: T) => boolean
}

const isArchived = (status?: string): boolean => status === 'archived'

export function selectableOptions<T>({
  records,
  selectedId,
  toRecord,
  isEligible,
}: SelectableInput<T>): SelectableOption[] {
  const out: SelectableOption[] = []
  let selectedSeen = false

  for (const raw of records) {
    const rec = toRecord(raw)
    const isSelected = Boolean(selectedId) && rec.id === selectedId
    const archived = isArchived(rec.status)
    const eligible = isEligible ? isEligible(rec, raw) : true

    if (archived && !isSelected) continue
    if (!eligible && !isSelected) continue

    // The saved value is always offered, even when it would not otherwise
    // qualify, and it is disabled so it can be seen but not re-chosen.
    const keepOnly = isSelected && (archived || !eligible)
    out.push({ ...rec, archived, disabled: keepOnly })
    if (isSelected) selectedSeen = true
  }

  // A saved reference to a record that no longer exists at all. Still surfaced,
  // because a dangling id shown as "missing" is debuggable and an empty select
  // is not.
  if (selectedId && !selectedSeen) {
    out.push({
      id: selectedId,
      label: 'Missing record',
      status: 'archived',
      archived: true,
      disabled: true,
    })
  }

  return out
}

/** Label suffix for an option kept only because it is the saved value. */
export const KEPT_REASON = 'Archived. Restore it or choose another.'

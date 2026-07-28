/**
 * Pure, isomorphic graph operations for funnel quizzes.
 *
 * Why this module exists: the quiz "graph" (steps x tiers -> nodes) was only
 * manipulated inline inside the builder components, and resolved a second time
 * inside the preview runtime. Two implementations of the same rules drift, and
 * the drift shows up as a live quiz that routes differently from what the
 * builder drew. Every structural mutation and every routing decision now lives
 * here, so the builder, the preview, and the public runtime cannot disagree.
 *
 * Rules that make wrong states unreachable rather than merely unlikely:
 *  - Every op is immutable: it returns a new quiz, never mutates its argument.
 *  - Duplicating a node only ever targets a FREE cell, so a node can never be
 *    created into a grid slot where it would be invisible.
 *  - Deleting a tier deletes the variants that existed only for that tier
 *    instead of silently downgrading them to SHARED (which would show a
 *    tier-specific question to every user).
 *  - Deleting a step clears every inbound reference to it, so no answer can
 *    route to a step that no longer exists.
 *  - Sequential advance skips steps that resolve to nothing, so a builder
 *    mistake degrades to "next question" instead of a dead-ended live quiz.
 *
 * No React, no server-only imports: safe in a client component, a server
 * action, or a route handler.
 */

// ---------------------------------------------------------------------------
// Types. The ported artifact node shape is loose, so the known fields are typed
// and the rest is passed through untouched.
// ---------------------------------------------------------------------------

export type Tier = { id: string; name: string; color: string }

export type Step = { key: string; label: string }

export type FieldMapping = { key: string; value: string }

export type Answer = {
  id: string
  label: string
  isDQ?: boolean
  fieldMappings?: FieldMapping[]
  nextStepKey?: string
  setTier?: string
  [k: string]: unknown
}

export type Condition = {
  id: string
  field: string
  operator: string
  value: string
  nextStepKey?: string
  [k: string]: unknown
}

export type QuizNode = {
  id: string
  stepKey: string
  /** Empty array means SHARED: the variant applies to every tier. */
  tiers: string[]
  type: string
  questionType: string
  fieldName?: string
  headline?: string
  answers?: Answer[]
  conditions?: Condition[]
  defaultNextStepKey?: string
  webhookHeaders?: Array<{ id: string; [k: string]: unknown }>
  responseMappings?: Array<{ id: string; [k: string]: unknown }>
  dynamicContent?: Array<{ id: string; [k: string]: unknown }>
  isVisible?: boolean
  /**
   * "Optional question": the step is skipped during normal sequential advance
   * and is only entered when something explicitly routes to it (an answer's
   * nextStepKey, a decision condition, or a decision default).
   */
  routedOnly?: boolean
  [k: string]: unknown
}

export type CustomFieldOption = { value: string; label: string; isDQ?: boolean }

export type CustomField = {
  id: string
  key: string
  label: string
  type: string
  options?: CustomFieldOption[]
  [k: string]: unknown
}

export type Quiz = {
  id?: string
  name?: string
  slug?: string
  isPublished?: boolean
  isArchived?: boolean
  tiers: Tier[]
  steps: Step[]
  nodes: QuizNode[]
  customFields?: CustomField[]
  [k: string]: unknown
}

/** Injectable id factory so callers (and tests) can control id generation. */
export type IdGen = (prefix: string) => string

export const defaultIdGen: IdGen = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const clone = <T,>(v: T): T => structuredClone(v)

/** Nodes carry no tiers to mean SHARED. Mirrors tierIsShared in seed-data. */
export const isShared = (node: Pick<QuizNode, 'tiers'>): boolean =>
  !node.tiers || node.tiers.length === 0

export const isRoutedOnly = (node: Pick<QuizNode, 'routedOnly'> | null | undefined): boolean =>
  !!node && node.routedOnly === true

export const nodesForStep = (quiz: Quiz, stepKey: string): QuizNode[] =>
  quiz.nodes.filter((n) => n.stepKey === stepKey)

/**
 * Which node a given tier actually sees at a step. SHARED wins over a
 * tier-specific variant, matching the grid (a shared cell blanks the tier
 * columns) and the preview runtime.
 */
export const resolveNodeForStep = (
  quiz: Quiz,
  stepKey: string,
  tier: string | null | undefined,
): QuizNode | null => {
  const variants = nodesForStep(quiz, stepKey)
  const shared = variants.find(isShared)
  if (shared) return shared
  if (tier) return variants.find((v) => v.tiers.includes(tier)) ?? null
  return variants[0] ?? null
}

// ---------------------------------------------------------------------------
// Step ordering
// ---------------------------------------------------------------------------

/**
 * Move a step to a new index. Out-of-range or no-op moves return the quiz
 * unchanged (same reference) so callers can skip a save.
 */
export const moveStep = (quiz: Quiz, fromIndex: number, toIndex: number): Quiz => {
  const len = quiz.steps.length
  if (fromIndex < 0 || fromIndex >= len) return quiz
  if (toIndex < 0 || toIndex >= len) return quiz
  if (fromIndex === toIndex) return quiz
  const steps = [...quiz.steps]
  const [moved] = steps.splice(fromIndex, 1)
  steps.splice(toIndex, 0, moved)
  return { ...quiz, steps }
}

/** Convenience for the row up/down buttons. */
export const moveStepBy = (quiz: Quiz, stepKey: string, delta: number): Quiz => {
  const from = quiz.steps.findIndex((s) => s.key === stepKey)
  if (from < 0) return quiz
  return moveStep(quiz, from, from + delta)
}

// ---------------------------------------------------------------------------
// Cell occupancy. The grid renders one cell per (step, tier) plus one SHARED
// cell; a node whose slot is already taken would never be visible, so every
// creation path resolves a free slot up front.
// ---------------------------------------------------------------------------

export type FreeSlots = { sharedFree: boolean; freeTierIds: string[] }

export const freeSlotsForStep = (quiz: Quiz, stepKey: string, excludeNodeId?: string): FreeSlots => {
  const variants = nodesForStep(quiz, stepKey).filter((n) => n.id !== excludeNodeId)
  const sharedFree = !variants.some(isShared)
  const taken = new Set<string>()
  for (const v of variants) for (const t of v.tiers) taken.add(t)
  return { sharedFree, freeTierIds: quiz.tiers.map((t) => t.id).filter((id) => !taken.has(id)) }
}

export const hasFreeSlot = (quiz: Quiz, stepKey: string): boolean => {
  const { sharedFree, freeTierIds } = freeSlotsForStep(quiz, stepKey)
  return sharedFree || freeTierIds.length > 0
}

// ---------------------------------------------------------------------------
// Cloning
// ---------------------------------------------------------------------------

/**
 * Deep-clone a node with every id regenerated. Nested ids (answers, headers,
 * response mappings, conditions, dynamic rules) are React keys and update
 * addresses, so a copy that reused them would have both nodes edit in lockstep.
 */
export const cloneNode = (node: QuizNode, idGen: IdGen = defaultIdGen): QuizNode => {
  const copy = clone(node)
  copy.id = idGen('n')
  if (Array.isArray(copy.answers)) copy.answers = copy.answers.map((a) => ({ ...a, id: idGen('a') }))
  if (Array.isArray(copy.conditions)) copy.conditions = copy.conditions.map((c) => ({ ...c, id: idGen('c') }))
  if (Array.isArray(copy.webhookHeaders)) copy.webhookHeaders = copy.webhookHeaders.map((h) => ({ ...h, id: idGen('h') }))
  if (Array.isArray(copy.responseMappings)) copy.responseMappings = copy.responseMappings.map((m) => ({ ...m, id: idGen('rm') }))
  if (Array.isArray(copy.dynamicContent)) copy.dynamicContent = copy.dynamicContent.map((d) => ({ ...d, id: idGen('dc') }))
  return copy
}

export type DuplicateNodeResult =
  | { ok: true; quiz: Quiz; newNodeId: string; assignedTiers: string[] }
  | { ok: false; reason: 'not_found' | 'no_free_slot' }

/**
 * Duplicate a single variant into the same step, into the first free cell:
 * SHARED if available, otherwise the first tier with no variant. When the step
 * is full the caller gets `no_free_slot` and should keep its button disabled -
 * creating the copy anyway would produce a node no grid cell can show.
 */
export const duplicateNode = (
  quiz: Quiz,
  nodeId: string,
  idGen: IdGen = defaultIdGen,
): DuplicateNodeResult => {
  const node = quiz.nodes.find((n) => n.id === nodeId)
  if (!node) return { ok: false, reason: 'not_found' }
  const { sharedFree, freeTierIds } = freeSlotsForStep(quiz, node.stepKey)
  let assignedTiers: string[] | null = null
  if (sharedFree) assignedTiers = []
  else if (freeTierIds.length > 0) assignedTiers = [freeTierIds[0]]
  if (assignedTiers === null) return { ok: false, reason: 'no_free_slot' }

  const copy = cloneNode(node, idGen)
  copy.tiers = assignedTiers
  const at = quiz.nodes.findIndex((n) => n.id === nodeId)
  const nodes = [...quiz.nodes]
  nodes.splice(at + 1, 0, copy)
  return { ok: true, quiz: { ...quiz, nodes }, newNodeId: copy.id, assignedTiers }
}

export type DuplicateStepResult = {
  quiz: Quiz
  newStepKey: string
  clonedNodeIds: string[]
}

/**
 * Duplicate a whole step: the row plus every tier variant on it, inserted
 * directly below the original. Cloned answers keep their `nextStepKey` targets
 * (those steps still exist, so the copy routes like the original did) and keep
 * their `fieldName` - a copy that silently renamed the captured field would
 * break downstream mappings without saying so.
 */
export const duplicateStep = (
  quiz: Quiz,
  stepKey: string,
  idGen: IdGen = defaultIdGen,
): DuplicateStepResult | null => {
  const index = quiz.steps.findIndex((s) => s.key === stepKey)
  if (index < 0) return null
  const source = quiz.steps[index]
  const newStepKey = idGen('step')
  const steps = [...quiz.steps]
  steps.splice(index + 1, 0, { ...source, key: newStepKey, label: `${source.label} (copy)` })

  const clones = nodesForStep(quiz, stepKey).map((n) => {
    const copy = cloneNode(n, idGen)
    copy.stepKey = newStepKey
    return copy
  })

  // Keep clones adjacent to their originals so the nodes array stays readable.
  const lastOriginalAt = quiz.nodes.reduce((acc, n, i) => (n.stepKey === stepKey ? i : acc), -1)
  const nodes = [...quiz.nodes]
  nodes.splice(lastOriginalAt + 1, 0, ...clones)

  return { quiz: { ...quiz, steps, nodes }, newStepKey, clonedNodeIds: clones.map((c) => c.id) }
}

// ---------------------------------------------------------------------------
// Deleting a step
// ---------------------------------------------------------------------------

export type DeleteStepResult = {
  quiz: Quiz
  deletedNodeIds: string[]
  /** Inbound routes that pointed at the deleted step and were cleared. */
  clearedRefs: number
}

/**
 * Remove a step, its variants, and every inbound reference to it. Leaving a
 * dangling `nextStepKey` behind would fall through to "next step in order" at
 * runtime, which looks like working routing while going somewhere else.
 */
export const deleteStep = (quiz: Quiz, stepKey: string): DeleteStepResult => {
  const deletedNodeIds = nodesForStep(quiz, stepKey).map((n) => n.id)
  let clearedRefs = 0

  const nodes = quiz.nodes
    .filter((n) => n.stepKey !== stepKey)
    .map((n) => {
      let next = n
      if (Array.isArray(n.answers) && n.answers.some((a) => a.nextStepKey === stepKey)) {
        next = {
          ...next,
          answers: n.answers.map((a) => {
            if (a.nextStepKey !== stepKey) return a
            clearedRefs += 1
            return { ...a, nextStepKey: '' }
          }),
        }
      }
      if (Array.isArray(n.conditions) && n.conditions.some((c) => c.nextStepKey === stepKey)) {
        next = {
          ...next,
          conditions: next.conditions!.map((c) => {
            if (c.nextStepKey !== stepKey) return c
            clearedRefs += 1
            return { ...c, nextStepKey: '' }
          }),
        }
      }
      if (next.defaultNextStepKey === stepKey) {
        clearedRefs += 1
        next = { ...next, defaultNextStepKey: '' }
      }
      return next
    })

  return {
    quiz: { ...quiz, steps: quiz.steps.filter((s) => s.key !== stepKey), nodes },
    deletedNodeIds,
    clearedRefs,
  }
}

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

const DEFAULT_TIER_NAME = /^\s*tier\s+\d+\s*$/i

const TIER_PALETTE = ['#10b981', '#0ea5e9', '#f59e0b', '#f43f5e', '#a78bfa', '#06b6d4', '#ec4899', '#84cc16']

/**
 * Re-sequence auto-generated tier names so the labels never show gaps after a
 * delete (the "T4 and T3 remained" case). Names the user typed themselves are
 * left alone - only the `Tier N` default pattern is re-numbered. Ids are never
 * touched, because every node references its tiers by id.
 */
export const renumberTiers = (tiers: Tier[]): Tier[] =>
  tiers.map((t, i) => (DEFAULT_TIER_NAME.test(t.name ?? '') ? { ...t, name: `Tier ${i + 1}` } : t))

/** First palette color not already in use, so a new tier is visually distinct. */
export const nextTierColor = (tiers: Tier[]): string => {
  const used = new Set(tiers.map((t) => (t.color ?? '').toLowerCase()))
  return TIER_PALETTE.find((c) => !used.has(c)) ?? TIER_PALETTE[tiers.length % TIER_PALETTE.length]
}

export const addTier = (quiz: Quiz, idGen: IdGen = defaultIdGen): Quiz => {
  const tiers = renumberTiers([
    ...quiz.tiers,
    { id: idGen('t'), name: `Tier ${quiz.tiers.length + 1}`, color: nextTierColor(quiz.tiers) },
  ])
  return { ...quiz, tiers }
}

export type TierDeleteImpact = {
  /** Variants that exist ONLY for this tier and would be orphaned. */
  orphanedNodeIds: string[]
  /** Variants that also serve other tiers and merely lose this one. */
  narrowedNodeIds: string[]
  /** Answers whose "set tier" pointed at this tier. */
  clearedSetTier: number
}

/**
 * What deleting a tier would cost, so the confirm dialog can state it before
 * the user commits. Computed with the same walk the delete uses.
 */
export const tierDeleteImpact = (quiz: Quiz, tierId: string): TierDeleteImpact => {
  const orphanedNodeIds: string[] = []
  const narrowedNodeIds: string[] = []
  let clearedSetTier = 0
  for (const n of quiz.nodes) {
    if (n.tiers?.includes(tierId)) {
      if (n.tiers.filter((t) => t !== tierId).length === 0) orphanedNodeIds.push(n.id)
      else narrowedNodeIds.push(n.id)
    }
    for (const a of n.answers ?? []) if (a.setTier === tierId) clearedSetTier += 1
  }
  return { orphanedNodeIds, narrowedNodeIds, clearedSetTier }
}

export type DeleteTierResult = { quiz: Quiz; impact: TierDeleteImpact }

/**
 * Delete a tier and repair every reference to it.
 *
 * The load-bearing decision: a variant scoped to only this tier is DELETED, not
 * stripped to `tiers: []`. Stripping would make it SHARED, and a question
 * written for Tier 3 would start showing to every visitor - a silent behavior
 * change with real lead-quality consequences. Variants that also serve other
 * tiers just lose this one.
 */
export const deleteTier = (quiz: Quiz, tierId: string): DeleteTierResult => {
  const impact = tierDeleteImpact(quiz, tierId)
  const orphaned = new Set(impact.orphanedNodeIds)

  const nodes = quiz.nodes
    .filter((n) => !orphaned.has(n.id))
    .map((n) => {
      const next: QuizNode = n.tiers?.includes(tierId)
        ? { ...n, tiers: n.tiers.filter((t) => t !== tierId) }
        : n
      if (!Array.isArray(next.answers) || !next.answers.some((a) => a.setTier === tierId)) return next
      return {
        ...next,
        answers: next.answers.map((a) => (a.setTier === tierId ? { ...a, setTier: '' } : a)),
      }
    })

  return {
    quiz: { ...quiz, tiers: renumberTiers(quiz.tiers.filter((t) => t.id !== tierId)), nodes },
    impact,
  }
}

// ---------------------------------------------------------------------------
// Sequencing (item: "optional question", skipped unless routed to)
// ---------------------------------------------------------------------------

/**
 * The next step index reached by falling through in order, for a given tier.
 *
 * Skips:
 *  - steps whose resolved variant is `routedOnly` (optional questions are only
 *    reachable by an explicit route), and
 *  - steps that resolve to no variant at all for this tier, so a half-built row
 *    degrades to "next question" instead of dead-ending the live quiz.
 *
 * Returns -1 when the quiz has run out of steps. Tier-aware by design: Tier 1
 * can see an optional question that Tier 3 skips, because each tier resolves a
 * different variant on the same row.
 */
export const nextSequentialStepIndex = (
  quiz: Quiz,
  fromIndex: number,
  tier: string | null | undefined,
): number => {
  for (let i = Math.max(fromIndex, -1) + 1; i < quiz.steps.length; i += 1) {
    const node = resolveNodeForStep(quiz, quiz.steps[i].key, tier)
    if (!node) continue
    if (isRoutedOnly(node)) continue
    return i
  }
  return -1
}

/**
 * The index an explicit route lands on. Explicit routing IGNORES `routedOnly` -
 * that is the whole point of an optional question - but still refuses a step
 * key that does not exist, so the caller can fall back to sequential order.
 */
export const explicitStepIndex = (quiz: Quiz, stepKey: string | null | undefined): number => {
  if (!stepKey) return -1
  return quiz.steps.findIndex((s) => s.key === stepKey)
}

/** The first step a visitor should land on (same skip rules as advancing). */
export const entryStepIndex = (quiz: Quiz, tier: string | null | undefined): number =>
  nextSequentialStepIndex(quiz, -1, tier)

// ---------------------------------------------------------------------------
// Custom fields
// ---------------------------------------------------------------------------

export type UpsertFieldResult =
  | { ok: true; quiz: Quiz; field: CustomField }
  | { ok: false; error: string }

const FIELD_KEY = /^[a-z][a-z0-9_]*$/

/**
 * Add or replace a custom field. Keys are the addressing mechanism for
 * mappings, `{{interpolation}}`, and URL capture, so a duplicate or malformed
 * key is rejected rather than written and left to fail silently later.
 */
export const upsertCustomField = (quiz: Quiz, field: CustomField): UpsertFieldResult => {
  const fields = quiz.customFields ?? []
  const key = (field.key ?? '').trim()
  if (!key) return { ok: false, error: 'Field key is required.' }
  if (!FIELD_KEY.test(key)) {
    return { ok: false, error: 'Key must be lowercase letters, numbers and underscores, starting with a letter.' }
  }
  if (fields.some((f) => f.key === key && f.id !== field.id)) {
    return { ok: false, error: `A field with the key "${key}" already exists.` }
  }
  const normalized: CustomField = {
    ...field,
    key,
    label: (field.label ?? '').trim() || key,
    options: field.options ?? [],
  }
  const at = fields.findIndex((f) => f.id === field.id)
  const customFields = at >= 0
    ? fields.map((f) => (f.id === field.id ? normalized : f))
    : [...fields, normalized]
  return { ok: true, quiz: { ...quiz, customFields }, field: normalized }
}

/**
 * A field draft with a guaranteed-free key. Built field-by-field rather than by
 * spreading `seed`, because a seed carrying explicit `undefined` values (very
 * easy to produce from optional UI state) would otherwise overwrite the
 * defaults with undefined.
 */
export const newCustomField = (quiz: Quiz, seed: Partial<CustomField> = {}, idGen: IdGen = defaultIdGen): CustomField => {
  const fields = quiz.customFields ?? []
  let key = (seed.key ?? '').trim()
  if (!key) {
    let n = fields.length + 1
    key = `field_${n}`
    while (fields.some((f) => f.key === key)) {
      n += 1
      key = `field_${n}`
    }
  }
  return {
    id: idGen('cf'),
    key,
    label: (seed.label ?? '').trim() || key,
    type: seed.type ?? 'text',
    options: seed.options ?? [],
  }
}

// ---------------------------------------------------------------------------
// Graph lint. Surfaces the wrong states these features make possible, instead
// of letting them ship looking fine.
// ---------------------------------------------------------------------------

export type GraphIssue = {
  level: 'error' | 'warning'
  code:
    | 'dangling_route'
    | 'unreachable_optional'
    | 'empty_step'
    | 'tier_without_variant'
    | 'duplicate_field_key'
    | 'no_steps'
  message: string
  stepKey?: string
  nodeId?: string
}

/** Every step key that something explicitly routes to. */
const inboundRoutedStepKeys = (quiz: Quiz): Set<string> => {
  const keys = new Set<string>()
  for (const n of quiz.nodes) {
    for (const a of n.answers ?? []) if (a.nextStepKey) keys.add(a.nextStepKey)
    for (const c of n.conditions ?? []) if (c.nextStepKey) keys.add(c.nextStepKey)
    if (n.defaultNextStepKey) keys.add(n.defaultNextStepKey)
  }
  return keys
}

export const lintQuizGraph = (quiz: Quiz): GraphIssue[] => {
  const issues: GraphIssue[] = []
  const stepKeys = new Set(quiz.steps.map((s) => s.key))
  const label = (key: string) => quiz.steps.find((s) => s.key === key)?.label ?? key

  if (quiz.steps.length === 0) {
    issues.push({ level: 'error', code: 'no_steps', message: 'This quiz has no steps.' })
  }

  // Routes pointing at steps that do not exist.
  for (const n of quiz.nodes) {
    const report = (target: string, what: string) => {
      if (target && !stepKeys.has(target)) {
        issues.push({
          level: 'error',
          code: 'dangling_route',
          message: `"${label(n.stepKey)}" has ${what} routing to a step that no longer exists.`,
          stepKey: n.stepKey,
          nodeId: n.id,
        })
      }
    }
    for (const a of n.answers ?? []) report(a.nextStepKey ?? '', `answer "${a.label}"`)
    for (const c of n.conditions ?? []) report(c.nextStepKey ?? '', 'a condition')
    report(n.defaultNextStepKey ?? '', 'a default route')
  }

  const inbound = inboundRoutedStepKeys(quiz)
  for (const step of quiz.steps) {
    const variants = nodesForStep(quiz, step.key)
    if (variants.length === 0) {
      issues.push({
        level: 'warning',
        code: 'empty_step',
        message: `"${step.label}" has no variants and is skipped at runtime.`,
        stepKey: step.key,
      })
      continue
    }
    // An optional question nothing routes to can never be reached.
    if (variants.every(isRoutedOnly) && !inbound.has(step.key)) {
      issues.push({
        level: 'warning',
        code: 'unreachable_optional',
        message: `"${step.label}" is optional but nothing routes to it, so it never shows.`,
        stepKey: step.key,
      })
    }
    // A tier with no variant on a row where SHARED is absent sees nothing here.
    if (!variants.some(isShared)) {
      const { freeTierIds } = freeSlotsForStep(quiz, step.key)
      if (freeTierIds.length > 0 && quiz.tiers.length > 0) {
        const names = freeTierIds
          .map((id) => quiz.tiers.find((t) => t.id === id)?.name ?? id)
          .join(', ')
        issues.push({
          level: 'warning',
          code: 'tier_without_variant',
          message: `"${step.label}" has no variant for ${names}; those tiers skip this step.`,
          stepKey: step.key,
        })
      }
    }
  }

  const seen = new Map<string, number>()
  for (const f of quiz.customFields ?? []) seen.set(f.key, (seen.get(f.key) ?? 0) + 1)
  for (const [key, count] of seen) {
    if (count > 1) {
      issues.push({
        level: 'error',
        code: 'duplicate_field_key',
        message: `Custom field key "${key}" is defined ${count} times.`,
      })
    }
  }

  return issues
}

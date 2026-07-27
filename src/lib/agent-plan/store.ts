import { promises as fs } from 'fs'
import path from 'path'
import { AGENT_NAMES } from './plan'

/**
 * Runtime status store for the Agent Plan board (/admin/plan).
 *
 * Design notes:
 * - One JSON file per agent under `data/agent-status/`. Per-agent files mean many
 *   agents can POST status concurrently without a read-modify-write race on a
 *   single shared document.
 * - Writes are atomic (write temp file, then rename) so a poll never reads a
 *   half-written file.
 * - The directory is a runtime artifact (gitignored). It is created lazily on
 *   first write; reads tolerate its absence and return an empty map.
 * - This is intentionally NOT a Payload collection: the board is a dev/ops
 *   surface, and a collection would add a schema migration + CMS surface for no
 *   tenant benefit.
 */

export type AgentState = 'idle' | 'running' | 'done' | 'error'

export type AgentStatus = {
  agent: string
  state: AgentState
  /** Finding id the agent is currently working (e.g. "F007"). */
  currentFindingId?: string | null
  /** Free-text of what the agent is doing right now. */
  currentTask?: string | null
  /** Last human-readable status line. */
  message?: string | null
  /** Finding ids the agent has completed. */
  completed: string[]
  startedAt?: string | null
  updatedAt: string
}

export type AgentStatusPatch = {
  state?: AgentState
  currentFindingId?: string | null
  currentTask?: string | null
  message?: string | null
  /** Finding ids to union into `completed`. */
  completed?: string[]
  /** Convenience: a single finding id to mark completed. */
  completedFindingId?: string
}

const STATUS_DIR = path.join(process.cwd(), 'data', 'agent-status')

const isKnownAgent = (agent: string): boolean => AGENT_NAMES.includes(agent)

// Guard against path traversal via a crafted agent name: only known,
// well-formed slugs ever become file paths.
const fileFor = (agent: string): string => {
  if (!/^[a-z0-9-]+$/.test(agent)) throw new Error('invalid agent name')
  return path.join(STATUS_DIR, `${agent}.json`)
}

const nowIso = (): string => new Date().toISOString()

const emptyStatus = (agent: string): AgentStatus => ({
  agent,
  state: 'idle',
  currentFindingId: null,
  currentTask: null,
  message: null,
  completed: [],
  startedAt: null,
  updatedAt: nowIso(),
})

async function readOne(agent: string): Promise<AgentStatus | null> {
  try {
    const raw = await fs.readFile(fileFor(agent), 'utf8')
    const parsed = JSON.parse(raw) as Partial<AgentStatus>
    return {
      agent,
      state: (parsed.state as AgentState) ?? 'idle',
      currentFindingId: parsed.currentFindingId ?? null,
      currentTask: parsed.currentTask ?? null,
      message: parsed.message ?? null,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      startedAt: parsed.startedAt ?? null,
      updatedAt: parsed.updatedAt ?? nowIso(),
    }
  } catch {
    // Missing file or unparseable content → treat as no status yet.
    return null
  }
}

/** Every agent's current status, keyed by agent name. Absent agents omitted. */
export async function readAllStatus(): Promise<Record<string, AgentStatus>> {
  const out: Record<string, AgentStatus> = {}
  await Promise.all(
    AGENT_NAMES.map(async (agent) => {
      const s = await readOne(agent)
      if (s) out[agent] = s
    }),
  )
  return out
}

/** Merge a patch into an agent's status and persist it atomically. */
export async function writeAgentStatus(agent: string, patch: AgentStatusPatch): Promise<AgentStatus> {
  if (!isKnownAgent(agent)) throw new Error(`unknown agent: ${agent}`)

  const prev = (await readOne(agent)) ?? emptyStatus(agent)

  const completedSet = new Set(prev.completed)
  for (const id of patch.completed ?? []) completedSet.add(id)
  if (patch.completedFindingId) completedSet.add(patch.completedFindingId)

  const nextState = patch.state ?? prev.state
  const next: AgentStatus = {
    agent,
    state: nextState,
    currentFindingId:
      patch.currentFindingId !== undefined ? patch.currentFindingId : prev.currentFindingId ?? null,
    currentTask: patch.currentTask !== undefined ? patch.currentTask : prev.currentTask ?? null,
    message: patch.message !== undefined ? patch.message : prev.message ?? null,
    completed: [...completedSet],
    // Stamp startedAt the first time an agent leaves idle.
    startedAt: prev.startedAt ?? (nextState !== 'idle' ? nowIso() : null),
    updatedAt: nowIso(),
  }

  await fs.mkdir(STATUS_DIR, { recursive: true })
  const target = fileFor(agent)
  const tmp = `${target}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8')
  await fs.rename(tmp, target)
  return next
}

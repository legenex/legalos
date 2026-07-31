import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Where captured build-log screenshots live.
 *
 * On disk under `data/`, NOT under `public/`. These are photographs of the
 * admin taken while signed in, so a capture of the leads table is a capture of
 * real people's contact details. Anything in `public/` is served to anyone who
 * guesses the filename, which for this content would be a data leak with no
 * authentication step to fail. They are served instead through a route that
 * checks the session.
 *
 * The manifest is a sidecar JSON per evidence id rather than one shared file,
 * so a capture run that fails halfway leaves every already-captured shot intact
 * and no two writers ever race on the same file. Writes are atomic - temp file
 * then rename - so a page load never reads a half-written record.
 *
 * Nothing here is committed: `data/` is gitignored, and a screenshot of one
 * server's admin is not a fact about the codebase.
 *
 * Deliberately NOT marked `server-only`, unlike most modules that touch the
 * filesystem. The capture script writes through this same module under plain
 * node, where that marker does not resolve - it is an alias Next supplies to
 * its own build. The `node:fs` import already makes a client bundle fail, so
 * the guarantee is kept; only the friendlier error message is given up.
 */

const CAPTURE_DIR = path.join(process.cwd(), 'data', 'buildlog-captures')

export type BuildLogCapture = {
  /** The evidence id this shows, from `buildLogEvidenceId`. */
  id: string
  /** ISO timestamp of the capture. */
  capturedAt: string
  /** Route that was open when the shot was taken. */
  path: string
  /** Steps that were actually driven, in order. */
  steps: string[]
  /**
   * What the capture job asserted was on screen before it saved.
   *
   * A screenshot of the wrong screen is worse than no screenshot, so nothing is
   * filed unless the job could confirm it arrived. This records what that
   * confirmation was.
   */
  confirmedBy: string
  width: number
  height: number
}

/** Filesystem-safe id. Evidence ids come from slugged titles, but be strict. */
const safeId = (id: string): string | null => (/^[a-z0-9][a-z0-9-]{0,180}$/i.test(id) ? id : null)

const jsonPath = (id: string) => path.join(CAPTURE_DIR, `${id}.json`)
const imagePath = (id: string) => path.join(CAPTURE_DIR, `${id}.png`)

/** Write a capture and its image together. Neither is visible until both land. */
export const writeCapture = async (capture: BuildLogCapture, png: Buffer): Promise<void> => {
  const id = safeId(capture.id)
  if (!id) throw new Error(`refusing to write a capture under an unsafe id: ${capture.id}`)

  await fs.mkdir(CAPTURE_DIR, { recursive: true })

  // Image first: a manifest pointing at a missing image would render a broken
  // frame, where an image with no manifest is simply not shown yet.
  const tmpPng = `${imagePath(id)}.${process.pid}.tmp`
  await fs.writeFile(tmpPng, png)
  await fs.rename(tmpPng, imagePath(id))

  const tmpJson = `${jsonPath(id)}.${process.pid}.tmp`
  await fs.writeFile(tmpJson, JSON.stringify(capture, null, 2), 'utf8')
  await fs.rename(tmpJson, jsonPath(id))
}

/** Every capture on disk, by evidence id. Missing directory means none yet. */
export const readCaptures = async (): Promise<Record<string, BuildLogCapture>> => {
  let names: string[]
  try {
    names = await fs.readdir(CAPTURE_DIR)
  } catch {
    return {}
  }

  const out: Record<string, BuildLogCapture> = {}
  await Promise.all(
    names
      .filter((n) => n.endsWith('.json'))
      .map(async (n) => {
        try {
          const raw = await fs.readFile(path.join(CAPTURE_DIR, n), 'utf8')
          const parsed = JSON.parse(raw) as BuildLogCapture
          // A manifest whose image has gone is not a capture. Checked rather
          // than assumed, because the two files are written separately.
          if (parsed?.id && safeId(parsed.id)) {
            await fs.access(imagePath(parsed.id))
            out[parsed.id] = parsed
          }
        } catch {
          // A corrupt or orphaned record is skipped, never thrown: one bad file
          // must not take down the whole board.
        }
      }),
  )
  return out
}

/** Read one capture's PNG bytes, or null. Used by the authenticated route. */
export const readCaptureImage = async (id: string): Promise<Buffer | null> => {
  const safe = safeId(id)
  if (!safe) return null
  try {
    return await fs.readFile(imagePath(safe))
  } catch {
    return null
  }
}

/**
 * Capture the build-log evidence screenshots.
 *
 *   BUILDLOG_CAPTURE_EMAIL=... BUILDLOG_CAPTURE_PASSWORD=... \
 *     node --experimental-strip-types scripts/capture-buildlog.ts [baseUrl]
 *
 * Each evidence recipe names a route and the clicks that get from there to the
 * thing it is evidence for. Most of what ships lives behind an interaction -
 * the redirect editor is a tab inside a modal inside the quiz builder - so a
 * job that just photographed the route would file a picture of the quizzes
 * list as evidence for a screen it does not show.
 *
 * The governing rule is therefore: NOTHING IS FILED THAT CANNOT BE CONFIRMED.
 * Every recipe ends by asserting its target is on screen, and a recipe that
 * cannot be driven is reported as a failure rather than saved as a plausible
 * looking screenshot of somewhere else. A wrong screenshot is worse than none,
 * because it is believed.
 */
import { chromium, type Page, type Locator } from 'playwright'
import { ENTRIES, buildLogEvidenceId, type BuildLogEvidence } from '../src/lib/buildlog.ts'
import { writeCapture } from '../src/lib/buildlog/captures.ts'

const BASE = (process.argv[2] || process.env.NEXT_PUBLIC_SERVER_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const EMAIL = process.env.BUILDLOG_CAPTURE_EMAIL || ''
const PASSWORD = process.env.BUILDLOG_CAPTURE_PASSWORD || ''
const VIEWPORT = { width: 1440, height: 900 }

if (!EMAIL || !PASSWORD) {
  console.error('Set BUILDLOG_CAPTURE_EMAIL and BUILDLOG_CAPTURE_PASSWORD to an admin account.')
  process.exit(1)
}

type Recipe = { id: string; entry: string; item: string; evidence: BuildLogEvidence }

/** Every evidence recipe on the board, flattened with its stable id. */
const recipes: Recipe[] = ENTRIES.flatMap((entry) =>
  entry.items.flatMap((item) =>
    (item.evidence || []).map((evidence) => ({
      id: buildLogEvidenceId(entry, item, evidence),
      entry: entry.title,
      item: item.title,
      evidence,
    })),
  ),
)

/**
 * Split a prose step into atomic instructions.
 *
 * Recipes are written for a human first - "Basics tab, Quiz field" - because
 * they have to stay useful when nobody is running this job. The comma is the
 * only structure they carry, and it always means "then".
 */
const atoms = (steps: string[]): string[] =>
  steps.flatMap((s) => s.split(',').map((part) => part.trim())).filter(Boolean)

/** The visible thing an instruction refers to, with its decoration removed. */
const targetOf = (instruction: string): string =>
  instruction
    .replace(/\s+(tab|field|button|section|card)$/i, '')
    .replace(/^(open|click|the)\s+/i, '')
    .trim()

/** First visible match for a piece of UI text, or null. */
const findVisible = async (page: Page, text: string): Promise<Locator | null> => {
  const candidates = [
    page.getByRole('tab', { name: text, exact: false }),
    page.getByRole('button', { name: text, exact: false }),
    page.getByRole('link', { name: text, exact: false }),
    page.getByText(text, { exact: false }),
  ]
  for (const c of candidates) {
    const first = c.first()
    if (await first.isVisible().catch(() => false)) return first
  }
  return null
}

/**
 * Drive one instruction.
 *
 * A "field" is located, not clicked: clicking a form field can open a picker
 * and change what the screenshot shows. An "open" instruction means enter the
 * first record in whatever list is on screen.
 */
const drive = async (page: Page, instruction: string): Promise<Locator | null> => {
  const text = targetOf(instruction)

  if (/^open\b/i.test(instruction)) {
    // Enter the first row of the list. Rows are rendered as buttons or links in
    // this admin, so both are tried before giving up.
    for (const row of [page.getByRole('row').nth(1), page.getByRole('link').filter({ hasNotText: /^$/ }).nth(0)]) {
      if (await row.isVisible().catch(() => false)) {
        await row.click({ timeout: 5000 }).catch(() => {})
        await page.waitForTimeout(700)
        return null
      }
    }
    throw new Error(`nothing to open for "${instruction}"`)
  }

  const found = await findVisible(page, text)
  if (!found) throw new Error(`could not find "${text}" for step "${instruction}"`)

  if (/\bfield\b/i.test(instruction)) {
    await found.scrollIntoViewIfNeeded().catch(() => {})
    return found
  }

  await found.click({ timeout: 5000 })
  await page.waitForTimeout(600)
  return null
}

/** Ring the thing the recipe is about, so the screenshot points at itself. */
const highlight = async (page: Page, target: Locator): Promise<void> => {
  await target
    .evaluate((el: Element) => {
      const node = el as HTMLElement
      node.style.outline = '3px solid #f59e0b'
      node.style.outlineOffset = '3px'
      node.style.borderRadius = '6px'
    })
    .catch(() => {})
}

const signIn = async (page: Page): Promise<void> => {
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle', timeout: 30_000 })
  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes('/sign-in'), { timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ])
}

const main = async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
  const page = await context.newPage()

  let captured = 0
  const failures: Array<{ id: string; why: string }> = []

  try {
    await signIn(page)
    console.log(`signed in as ${EMAIL} at ${BASE}\n`)

    for (const recipe of recipes) {
      const { id, evidence } = recipe
      const steps = atoms(evidence.steps || [])
      try {
        await page.goto(`${BASE}${evidence.path}`, { waitUntil: 'networkidle', timeout: 30_000 })
        await page.waitForTimeout(500)

        let anchor: Locator | null = null
        for (const instruction of steps) anchor = (await drive(page, instruction)) ?? anchor

        // Confirm arrival. With no steps the route IS the thing, so the check
        // is that the route rendered rather than bounced to sign-in.
        const finalTarget = steps.length ? targetOf(steps[steps.length - 1]) : ''
        let confirmedBy: string
        if (finalTarget) {
          anchor = anchor ?? (await findVisible(page, finalTarget))
          if (!anchor) throw new Error(`arrived, but "${finalTarget}" was not on screen`)
          confirmedBy = `"${finalTarget}" visible on the page`
          await highlight(page, anchor)
        } else {
          if (page.url().includes('/sign-in')) throw new Error('bounced to sign-in')
          confirmedBy = `${evidence.path} rendered while signed in`
        }

        const png = await page.screenshot({ type: 'png' })
        await writeCapture(
          {
            id,
            capturedAt: new Date().toISOString(),
            path: evidence.path,
            steps,
            confirmedBy,
            width: VIEWPORT.width,
            height: VIEWPORT.height,
          },
          png,
        )
        captured += 1
        console.log(`  captured  ${evidence.label} -> ${confirmedBy}`)
      } catch (err) {
        const why = err instanceof Error ? err.message : String(err)
        failures.push({ id, why })
        console.log(`  SKIPPED   ${evidence.label}: ${why}`)
      }
    }
  } finally {
    await browser.close()
  }

  console.log(`\n${captured} captured, ${failures.length} skipped of ${recipes.length} recipes`)
  if (failures.length) {
    console.log('\nSkipped recipes are not failures of the board, they are recipes this job could not')
    console.log('confirm it reached. Nothing was filed for them, because a screenshot of the wrong')
    console.log('screen is worse than none.')
  }
}

await main()

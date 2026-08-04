/**
 * Report days that shipped code but never reached the build log.
 *
 *   node --experimental-strip-types scripts/check-buildlog-coverage.ts [sinceISO]
 *
 * The board went four days without an entry while three commits shipped, and
 * the gap was found by someone asking rather than by the board. Nothing
 * connected "code changed" to "it was written up", so silence looked exactly
 * like nothing having happened.
 *
 * This compares the two. It reports rather than fails by default, because a day
 * of commits genuinely not worth an entry is a real thing - a revert, a typo in
 * a comment - and a check that cries wolf gets ignored, which would leave the
 * board worse off than an honest report nobody has to argue with. Pass --strict
 * to exit non-zero, for a hook or a release step.
 *
 * Only commits touching shipped code count. A day spent editing the board
 * itself does not need an entry about editing the board.
 */
import { execFileSync } from 'node:child_process'
import { ENTRIES } from '../src/lib/buildlog.ts'

const SINCE = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? '2026-07-27'
const STRICT = process.argv.includes('--strict')

/** Paths whose changes are shipped behaviour rather than bookkeeping. */
const SHIPPED = /^(src\/|scripts\/|next\.config|package\.json|tailwind|payload\.config)/
/** The board and its own tooling. Editing these is the write-up, not the work. */
const BOOKKEEPING = /^(src\/lib\/buildlog|src\/lib\/handbook|src\/app\/\(app\)\/admin\/\(top\)\/(buildlog|handbook)\/|scripts\/check-(buildlog|handbook))/

const git = (...args: string[]): string =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })

// One line per commit: "<date> <sha>", newest first.
const commits = git('log', `--since=${SINCE}`, '--format=%ad %H', '--date=short')
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [date, sha] = line.split(' ')
    return { date, sha }
  })

const shippedByDay = new Map<string, number>()
for (const { date, sha } of commits) {
  const files = git('diff-tree', '--no-commit-id', '--name-only', '-r', sha).split('\n').filter(Boolean)
  // A commit counts only if it changed something a user could notice.
  const substantive = files.filter((f) => SHIPPED.test(f) && !BOOKKEEPING.test(f))
  if (substantive.length) shippedByDay.set(date, (shippedByDay.get(date) ?? 0) + 1)
}

const logged = new Set(ENTRIES.map((e) => e.date))
const gaps = [...shippedByDay.entries()].filter(([date]) => !logged.has(date)).sort()

for (const [date, count] of gaps) {
  console.log(`  ${date}: ${count} commit${count === 1 ? '' : 's'} touched shipped code, no build-log entry`)
}

const covered = shippedByDay.size - gaps.length
console.log(
  `\n${shippedByDay.size} day${shippedByDay.size === 1 ? '' : 's'} shipped code since ${SINCE}, ` +
    `${covered} written up, ${gaps.length} missing`,
)

if (gaps.length && STRICT) process.exit(1)

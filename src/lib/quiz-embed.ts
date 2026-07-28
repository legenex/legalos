/**
 * Builds the third-party embed snippet for a quiz deployment.
 *
 * One implementation, used by both places the builder shows embed code, so the
 * two can never hand out different snippets for the same deployment.
 *
 * The snippet carries the full destination in `data-src`. That is what makes
 * the loader (served at /q.js from the same host) work with no API call, no
 * CORS preflight, and no knowledge of our routing - it reads the attribute and
 * creates the iframe.
 *
 * When the deployment has no domain or path yet there is no valid snippet to
 * give, so this returns null rather than a snippet containing a placeholder
 * host. Handing someone code that looks complete and silently fails is the
 * exact failure this replaced.
 */

export type QuizEmbedTarget = {
  deploymentId: string
  /** Host the deployment is bound to, e.g. 'qualify.checkmyclaim.co'. */
  domain: string
  /** Path on that host, e.g. '/s/mva'. */
  path: string
}

export const buildQuizEmbedSnippet = ({ deploymentId, domain, path }: QuizEmbedTarget): string | null => {
  const host = (domain || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  const rawPath = (path || '').trim()
  if (!host || !rawPath || !deploymentId) return null

  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const mountId = `legalos-quiz-${deploymentId}`
  const origin = `https://${host}`

  return [
    `<div id="${mountId}"></div>`,
    `<script async`,
    `  src="${origin}/q.js"`,
    `  data-deployment="${deploymentId}"`,
    `  data-src="${origin}${normalizedPath}"`,
    `  data-target="${mountId}"></script>`,
  ].join('\n')
}

/** Message shown in place of the snippet when the deployment is not addressable yet. */
export const QUIZ_EMBED_INCOMPLETE =
  'Set a domain and a path on the Basics tab, then save. The embed code needs a real address to point at.'

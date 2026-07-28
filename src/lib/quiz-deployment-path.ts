/**
 * Path normalization for quiz deployments.
 *
 * Split out from quiz-deployment.ts so the rule has no server dependencies: the
 * public router, the builder, and a test harness all need it, and only one of
 * those can import Payload. A second copy of "how do we compare paths" is
 * exactly how a deployment starts 404ing on the trailing slash a customer
 * pasted into an ad.
 */

/** '/s/mva/' and '  s/mva  ' both normalize to '/s/mva'. Root stays '/'. */
export const normalizeDeploymentPath = (raw: string | null | undefined): string => {
  const s = (raw ?? '').trim()
  if (!s || s === '/') return '/'
  const withLead = s.startsWith('/') ? s : `/${s}`
  const noTrail = withLead.length > 1 ? withLead.replace(/\/+$/, '') : withLead
  return noTrail || '/'
}

/**
 * System health checks. Each function returns a SystemCheck row.
 *
 * Checks are independent and run in parallel from `runAllChecks`. Each check
 * catches its own errors and returns a CheckStatus rather than throwing, so
 * one failing check never breaks the whole page render.
 */
import fs from 'fs/promises'
import path from 'path'
import tls from 'tls'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkInfra } from '@/lib/infra-check'
import { pleskIsConfigured, pleskGet } from '@/lib/plesk/client'

const exec = promisify(execFile)

export type CheckStatus = 'ok' | 'warn' | 'error' | 'info'
export type Category = 'deploy' | 'runtime' | 'database' | 'integrations' | 'dns'

export type SystemCheck = {
  id: string
  label: string
  category: Category
  status: CheckStatus
  message: string
  detail?: Record<string, string | number | boolean | null>
  duration_ms?: number
}

const time = async <T>(fn: () => Promise<T>): Promise<{ value: T; duration_ms: number }> => {
  const started = Date.now()
  const value = await fn()
  return { value, duration_ms: Date.now() - started }
}

/* -------------------------------------------------------------------------- */
/*                                Deploy                                       */
/* -------------------------------------------------------------------------- */

export const checkDeployInfo = async (): Promise<SystemCheck> => {
  const detail: Record<string, string> = {
    node_version: process.version,
    next_version: process.env.NEXT_RUNTIME ?? 'edge/node',
    pid: String(process.pid),
    hostname: require('os').hostname(),
  }

  // Try .git-sha file first (written by scripts/deploy.sh in production), then
  // fall back to running git in the project root (works in local dev).
  let sha: string | null = null
  let source: 'git-sha-file' | 'git-cli' | 'unknown' = 'unknown'
  try {
    const buf = await fs.readFile(path.resolve(process.cwd(), '.git-sha'), 'utf8')
    sha = buf.trim().slice(0, 12)
    source = 'git-sha-file'
  } catch {
    try {
      const { stdout } = await exec('git', ['rev-parse', '--short=12', 'HEAD'])
      sha = stdout.trim()
      source = 'git-cli'
    } catch {
      sha = null
    }
  }
  detail.commit_sha = sha ?? 'unknown'
  detail.sha_source = source

  // Bonus: attempt to read the commit message + date if git is available.
  if (source !== 'unknown') {
    try {
      const { stdout: msg } = await exec('git', ['log', '-1', '--format=%s'])
      detail.commit_message = msg.trim().slice(0, 120)
      const { stdout: date } = await exec('git', ['log', '-1', '--format=%ai'])
      detail.commit_date = date.trim()
    } catch {
      // best-effort, swallow
    }
  }

  return {
    id: 'deploy.commit',
    label: 'Last commit',
    category: 'deploy',
    status: sha ? 'ok' : 'warn',
    message: sha ? `${sha}` : 'commit SHA unknown — deploy.sh did not write .git-sha and git CLI is unavailable',
    detail,
  }
}

/* -------------------------------------------------------------------------- */
/*                                Runtime                                      */
/* -------------------------------------------------------------------------- */

const formatBytes = (b: number): string => {
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${(b / 1024 ** 3).toFixed(2)} GB`
}

const formatUptime = (seconds: number): string => {
  if (seconds < 60) return `${Math.floor(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

export const checkRuntime = async (): Promise<SystemCheck> => {
  const mem = process.memoryUsage()
  const detail: Record<string, string | number> = {
    uptime: formatUptime(process.uptime()),
    rss: formatBytes(mem.rss),
    heap_used: formatBytes(mem.heapUsed),
    heap_total: formatBytes(mem.heapTotal),
    external: formatBytes(mem.external),
    platform: process.platform,
    arch: process.arch,
  }
  // Warn if RSS > 1GB (a hint we should investigate memory)
  const status: CheckStatus = mem.rss > 1024 * 1024 * 1024 ? 'warn' : 'ok'
  return {
    id: 'runtime.process',
    label: 'Node process',
    category: 'runtime',
    status,
    message: `up ${formatUptime(process.uptime())}, RSS ${formatBytes(mem.rss)}`,
    detail,
  }
}

/* -------------------------------------------------------------------------- */
/*                              Database                                       */
/* -------------------------------------------------------------------------- */

export const checkPostgres = async (): Promise<SystemCheck> => {
  try {
    const { value, duration_ms } = await time(async () => {
      const payload = await getPayload({ config })
      const sites = await payload.count({ collection: 'sites', overrideAccess: true })
      return sites.totalDocs
    })
    const status: CheckStatus = duration_ms > 1000 ? 'warn' : 'ok'
    return {
      id: 'db.postgres',
      label: 'PostgreSQL',
      category: 'database',
      status,
      message: `reachable, ${duration_ms}ms`,
      detail: { sites_count: value, query_ms: duration_ms, conn_string: maskDbUrl(process.env.DATABASE_URI ?? '') },
      duration_ms,
    }
  } catch (err) {
    return {
      id: 'db.postgres',
      label: 'PostgreSQL',
      category: 'database',
      status: 'error',
      message: err instanceof Error ? err.message : 'connection failed',
      detail: { conn_string: maskDbUrl(process.env.DATABASE_URI ?? '') },
    }
  }
}

const maskDbUrl = (url: string): string => {
  if (!url) return '(unset)'
  return url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@')
}

/* -------------------------------------------------------------------------- */
/*                                Redis                                        */
/* -------------------------------------------------------------------------- */

export const checkRedis = async (): Promise<SystemCheck> => {
  const url = process.env.REDIS_URL
  if (!url) {
    return {
      id: 'db.redis',
      label: 'Redis',
      category: 'database',
      status: 'info',
      message: 'REDIS_URL not set (background jobs disabled)',
    }
  }
  try {
    // Dynamic import so production doesn't pay the cost if Redis isn't used.
    const { default: Redis } = await import('ioredis')
    const client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true, connectTimeout: 2000 })
    const { value, duration_ms } = await time(async () => {
      await client.connect()
      const pong = await client.ping()
      await client.quit()
      return pong
    })
    return {
      id: 'db.redis',
      label: 'Redis',
      category: 'database',
      status: 'ok',
      message: `${value}, ${duration_ms}ms`,
      duration_ms,
    }
  } catch (err) {
    return {
      id: 'db.redis',
      label: 'Redis',
      category: 'database',
      status: 'error',
      message: err instanceof Error ? err.message : 'connection failed',
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                Plesk                                        */
/* -------------------------------------------------------------------------- */

export const checkPlesk = async (): Promise<SystemCheck> => {
  if (!pleskIsConfigured()) {
    return {
      id: 'integrations.plesk',
      label: 'Plesk REST API',
      category: 'integrations',
      status: 'warn',
      message: 'PLESK_API_URL / PLESK_API_KEY not set — tenant domains cannot be auto-provisioned',
    }
  }
  try {
    const { value, duration_ms } = await time(async () => {
      // /api/v2/server returns basic Plesk info if API key is valid
      return pleskGet<{ hostname?: string; version?: string }>('/api/v2/server')
    })
    if (!value.ok) {
      return {
        id: 'integrations.plesk',
        label: 'Plesk REST API',
        category: 'integrations',
        status: 'error',
        message: value.error,
        detail: { url: process.env.PLESK_API_URL ?? '' },
        duration_ms,
      }
    }
    const detail: Record<string, string | number> = {
      url: process.env.PLESK_API_URL ?? '',
      query_ms: duration_ms,
    }
    if (value.data.hostname) detail.hostname = String(value.data.hostname)
    if (value.data.version) detail.plesk_version = String(value.data.version)
    return {
      id: 'integrations.plesk',
      label: 'Plesk REST API',
      category: 'integrations',
      status: 'ok',
      message: `reachable, ${duration_ms}ms`,
      detail,
      duration_ms,
    }
  } catch (err) {
    return {
      id: 'integrations.plesk',
      label: 'Plesk REST API',
      category: 'integrations',
      status: 'error',
      message: err instanceof Error ? err.message : 'unknown',
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                              Anthropic                                      */
/* -------------------------------------------------------------------------- */

export const checkAnthropic = async (): Promise<SystemCheck> => {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return {
      id: 'integrations.anthropic',
      label: 'Anthropic SDK',
      category: 'integrations',
      status: 'warn',
      message: 'ANTHROPIC_API_KEY not set — AI generators (Site Template, Brand AI, blog humanizer) will fail',
    }
  }
  return {
    id: 'integrations.anthropic',
    label: 'Anthropic SDK',
    category: 'integrations',
    status: 'ok',
    message: 'API key configured',
    detail: { key_prefix: key.slice(0, 12) + '…' },
  }
}

/* -------------------------------------------------------------------------- */
/*                              DNS infra                                      */
/* -------------------------------------------------------------------------- */

export const checkDnsInfra = async (): Promise<SystemCheck[]> => {
  const result = await checkInfra()
  const checks: SystemCheck[] = []

  checks.push({
    id: 'dns.cname_target',
    label: `CNAME target: ${result.cname_target.host ?? '(unset)'}`,
    category: 'dns',
    status: result.cname_target.resolves ? 'ok' : 'error',
    message: result.cname_target.resolves
      ? 'resolves'
      : result.cname_target.error ?? 'does not resolve — tenants who connect domains will get verified but the page will not load',
    detail: { host: result.cname_target.host ?? '(unset)' },
  })

  checks.push({
    id: 'dns.preview_wildcard',
    label: `Preview wildcard: *.${process.env.LEGALOS_PREVIEW_DOMAIN ?? '(unset)'}`,
    category: 'dns',
    status: result.preview_wildcard.resolves ? 'ok' : 'error',
    message: result.preview_wildcard.resolves
      ? 'resolves'
      : result.preview_wildcard.error ?? 'wildcard does not resolve — preview URLs will be dead',
    detail: { sample_host: result.preview_wildcard.sample_host ?? '(unset)' },
  })

  return checks
}

/* -------------------------------------------------------------------------- */
/*                          SSL cert for self-host                             */
/* -------------------------------------------------------------------------- */

const fetchTlsCertExpiry = (host: string): Promise<{ valid_to: string; days_remaining: number; issuer: string }> => {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host, port: 443, servername: host, timeout: 5000 },
      () => {
        const cert = socket.getPeerCertificate()
        socket.end()
        if (!cert || !cert.valid_to) {
          reject(new Error('no certificate returned'))
          return
        }
        const validTo = new Date(cert.valid_to)
        const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        const issuer = cert.issuer ? `${cert.issuer.O ?? ''} ${cert.issuer.CN ?? ''}`.trim() : 'unknown'
        resolve({ valid_to: cert.valid_to, days_remaining: daysRemaining, issuer })
      },
    )
    socket.on('error', reject)
    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('TLS connection timeout'))
    })
  })
}

export const checkSelfSslCert = async (): Promise<SystemCheck | null> => {
  const host = process.env.LEGALOS_FALLBACK_HOST
  if (!host || host === 'localhost') {
    return {
      id: 'dns.self_ssl',
      label: 'Admin SSL cert',
      category: 'dns',
      status: 'info',
      message: 'localhost — SSL not applicable',
    }
  }
  try {
    const { valid_to, days_remaining, issuer } = await fetchTlsCertExpiry(host)
    let status: CheckStatus = 'ok'
    if (days_remaining <= 7) status = 'error'
    else if (days_remaining <= 30) status = 'warn'
    return {
      id: 'dns.self_ssl',
      label: `Admin SSL cert (${host})`,
      category: 'dns',
      status,
      message: `valid for ${days_remaining} days, issued by ${issuer}`,
      detail: { host, valid_to, days_remaining, issuer },
    }
  } catch (err) {
    return {
      id: 'dns.self_ssl',
      label: `Admin SSL cert (${host})`,
      category: 'dns',
      status: 'error',
      message: err instanceof Error ? err.message : 'cert lookup failed',
      detail: { host },
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                            App stats                                        */
/* -------------------------------------------------------------------------- */

export const checkStats = async (): Promise<SystemCheck> => {
  try {
    const payload = await getPayload({ config })
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [sites, sitesActive, domains, domainsActive, leads24h, leads30d, pages] = await Promise.all([
      payload.count({ collection: 'sites', overrideAccess: true }),
      payload.count({ collection: 'sites', where: { status: { equals: 'active' } }, overrideAccess: true }),
      payload.count({ collection: 'domains', overrideAccess: true }),
      payload.count({ collection: 'domains', where: { status: { equals: 'active' } }, overrideAccess: true }),
      payload.count({ collection: 'leads', where: { createdAt: { greater_than: since24h } }, overrideAccess: true }),
      payload.count({ collection: 'leads', where: { createdAt: { greater_than: since30d } }, overrideAccess: true }),
      payload.count({ collection: 'pages', overrideAccess: true }),
    ])
    return {
      id: 'runtime.stats',
      label: 'App data',
      category: 'runtime',
      status: 'info',
      message: `${sites.totalDocs} sites, ${pages.totalDocs} pages, ${leads30d.totalDocs} leads in 30d`,
      detail: {
        sites_total: sites.totalDocs,
        sites_active: sitesActive.totalDocs,
        domains_total: domains.totalDocs,
        domains_active: domainsActive.totalDocs,
        leads_24h: leads24h.totalDocs,
        leads_30d: leads30d.totalDocs,
        pages_total: pages.totalDocs,
      },
    }
  } catch (err) {
    return {
      id: 'runtime.stats',
      label: 'App data',
      category: 'runtime',
      status: 'error',
      message: err instanceof Error ? err.message : 'stats query failed',
    }
  }
}

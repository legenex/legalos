'use server'

import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { invalidateHostCache } from '@/lib/site-resolver'
import { checkDomainDns } from '@/lib/dns-check'
import { pollDomainSslStatus } from '@/lib/ssl-poll'
import { provisionDomainInPlesk, unprovisionDomainInPlesk } from '@/lib/plesk/provision-domain'
import { pleskIsConfigured } from '@/lib/plesk/client'

const randomToken = (len = 24): string => crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len)

const normalizeHost = (raw: string): string =>
  raw.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '')

const dnsRecordsFor = (host: string, token: string): Array<{ type: string; name: string; value: string; note?: string }> => {
  const cnameTarget = process.env.LEGALOS_CNAME_TARGET ?? 'cname.legenex.com'
  const aTarget = process.env.LEGALOS_A_TARGET
  const records: Array<{ type: string; name: string; value: string; note?: string }> = [
    {
      type: 'CNAME',
      name: host,
      value: cnameTarget,
      note: 'Subdomains and www. Preferred. Apex domains may need an A record instead.',
    },
    {
      type: 'TXT',
      name: `_legalos.${host}`,
      value: `legalos-verify=${token}`,
      note: 'Always-accepted fallback. Use this if your DNS provider does not support CNAME at apex.',
    },
  ]
  if (aTarget) {
    records.splice(1, 0, {
      type: 'A',
      name: host,
      value: aTarget,
      note: 'Apex / root domain. Required if you cannot CNAME.',
    })
  }
  return records
}

/* ------------------------------ Add custom domain ----------------------------- */

export async function addCustomDomain(args: { siteId: number; siteSlug: string; host: string }): Promise<
  | { ok: true; domain_id: number; verification_token: string; dns_records: Array<{ type: string; name: string; value: string; note?: string }> }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const host = normalizeHost(args.host)
  if (!host || !host.includes('.')) return { ok: false, error: 'invalid host' }

  const payload = await getPayload({ config })
  const conflict = await payload.find({
    collection: 'domains',
    where: { host: { equals: host } },
    limit: 1,
    overrideAccess: true,
  })
  if (conflict.docs[0]) return { ok: false, error: `host ${host} is already mapped to a Site` }

  const token = randomToken(24)
  const records = dnsRecordsFor(host, token)

  try {
    const created = (await payload.create({
      collection: 'domains',
      data: {
        site: args.siteId,
        host,
        kind: 'custom',
        primary: false,
        status: 'pending',
        ssl_status: 'pending',
        verification_token: token,
        dns_records: records,
      } as never,
      user: user as never,
      overrideAccess: false,
    })) as { id: number }
    invalidateHostCache()
    revalidatePath(`/admin/sites/${args.siteSlug}/settings/domains`)
    return { ok: true, domain_id: Number(created.id), verification_token: token, dns_records: records }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'create failed' }
  }
}

/* --------------------------------- Verify -------------------------------------- */

type VerifyResult =
  | {
      ok: true
      verified: true
      provisioned: boolean
      plesk_error?: string
      auto_promoted: boolean
      dns: Awaited<ReturnType<typeof checkDomainDns>>
    }
  | {
      ok: true
      verified: false
      dns: Awaited<ReturnType<typeof checkDomainDns>>
    }
  | { ok: false; error: string }

export async function verifyAndPromoteDomain(args: {
  domainId: number
  siteSlug: string
  skipDns?: boolean
}): Promise<VerifyResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  const domain = await payload.findByID({ collection: 'domains', id: args.domainId, overrideAccess: true })
  if (!domain) return { ok: false, error: 'domain not found' }
  if (domain.kind !== 'custom') return { ok: false, error: 'preview domains do not require verification' }

  const skipAllowed = (process.env.LEGALOS_DEV_SKIP_DNS ?? 'false').toLowerCase() === 'true'
  let dnsResult: Awaited<ReturnType<typeof checkDomainDns>>

  if (args.skipDns && skipAllowed) {
    dnsResult = {
      ok: true,
      matched: 'txt',
      observed: { cname: [], a: [], txt: ['(skipped in dev)'] },
      expected: {
        cname_target: process.env.LEGALOS_CNAME_TARGET ?? null,
        a_target: process.env.LEGALOS_A_TARGET ?? null,
        txt_token_at: `_legalos.${domain.host}`,
      },
    }
  } else {
    dnsResult = await checkDomainDns({
      host: domain.host,
      cnameTarget: process.env.LEGALOS_CNAME_TARGET ?? null,
      aTarget: process.env.LEGALOS_A_TARGET ?? null,
      verificationToken: domain.verification_token ?? null,
    })
  }

  if (!dnsResult.ok) {
    await payload.update({
      collection: 'domains',
      id: args.domainId,
      data: { last_checked_at: new Date().toISOString() } as never,
      user: user as never,
      overrideAccess: false,
    })
    revalidatePath(`/admin/sites/${args.siteSlug}/settings/domains`)
    return { ok: true, verified: false, dns: dnsResult }
  }

  // DNS verified. Move into "provisioning" while Plesk creates the domain + cert.
  await payload.update({
    collection: 'domains',
    id: args.domainId,
    data: {
      status: 'provisioning',
      ssl_status: 'pending',
      last_checked_at: new Date().toISOString(),
      provisioning_error: null,
    } as never,
    user: user as never,
    overrideAccess: false,
  })

  // Provision in Plesk if it's wired up. If not, fall through and just mark active.
  let pleskOk = true
  let pleskDomainId: string | null = null
  let pleskError: string | undefined
  if (pleskIsConfigured() && !args.skipDns) {
    const prov = await provisionDomainInPlesk({ host: domain.host })
    pleskOk = prov.ok
    pleskDomainId = prov.plesk_domain_id
    pleskError = prov.error
  } else if (!pleskIsConfigured()) {
    pleskError = 'PLESK_API_URL / PLESK_API_KEY not set — domain marked active but you must add it to Plesk manually'
    pleskOk = false
  }

  // DNS is verified and Plesk has (maybe) provisioned. We DO NOT flip primary
  // yet — the existing primary (typically the preview subdomain) keeps serving
  // until the self-check poller confirms the new domain actually returns our
  // app for this site. Otherwise a Plesk default page, misconfigured proxy, or
  // missing vhost would silently knock the preview offline.
  //
  // If Plesk failed, mark the row 'error' immediately instead of 'provisioning'.
  // The auto-verify poller filters on `pending|error`, so the row stays in the
  // retry pool — once the underlying issue is fixed (e.g. PLESK_API_URL env
  // corrected) the next tick will re-run the full pipeline and self-heal.
  const siteId = typeof domain.site === 'object' ? domain.site.id : domain.site
  const finalStatus = pleskOk ? 'provisioning' : 'error'
  await payload.update({
    collection: 'domains',
    id: args.domainId,
    data: {
      status: finalStatus,
      ssl_status: 'pending',
      plesk_domain_id: pleskDomainId,
      provisioning_error: pleskError ?? null,
      last_checked_at: new Date().toISOString(),
    } as never,
    user: user as never,
    overrideAccess: false,
  })
  invalidateHostCache()

  // Fire-and-forget end-to-end verification. Walks for up to ~6 minutes hitting
  // https://<host>/api/legalos/self-check, confirms the JSON response carries
  // the right site_id, and only then flips status/ssl_status to 'active'.
  // On timeout it sets status='error' with the last failure reason in
  // provisioning_error. Skip when Plesk failed — there's no vhost to hit, so
  // the poller would just hammer a default page for 6 min before giving up.
  if (pleskOk) {
    void pollDomainSslStatus({ domainId: args.domainId, host: domain.host, siteId }).catch(() => {})
  }

  revalidatePath(`/admin/sites/${args.siteSlug}/settings/domains`)
  return {
    ok: true,
    verified: true,
    provisioned: pleskOk,
    plesk_error: pleskError,
    auto_promoted: pleskOk,
    dns: dnsResult,
  }
}

/* --------------------------------- Re-check (no auto-promote) ------------------ */

type RecheckResult =
  | {
      ok: true
      verified: boolean
      status: string
      last_checked_at: string
      dns: Awaited<ReturnType<typeof checkDomainDns>>
    }
  | { ok: false; error: string }

/**
 * Background-poller friendly variant of verifyAndPromoteDomain.
 *
 * For a pending/error row, runs the full verify + promote + provision pipeline so
 * a connected domain becomes reachable hands-off. For a row already past 'verified'
 * (verified, provisioning, active), it just stamps `last_checked_at` and exits —
 * the poller will drop it on the next tick.
 */
export async function recheckDomainDns(args: {
  domainId: number
  siteSlug: string
}): Promise<RecheckResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  const domain = await payload.findByID({ collection: 'domains', id: args.domainId, overrideAccess: true })
  if (!domain) return { ok: false, error: 'domain not found' }
  if (domain.kind !== 'custom') return { ok: false, error: 'preview domains do not require verification' }

  const currentStatus = (domain.status ?? 'pending') as string

  if (currentStatus === 'pending' || currentStatus === 'error') {
    const result = await verifyAndPromoteDomain({ domainId: args.domainId, siteSlug: args.siteSlug })
    if (!result.ok) return { ok: false, error: result.error }
    const reloaded = await payload.findByID({ collection: 'domains', id: args.domainId, overrideAccess: true })
    return {
      ok: true,
      verified: result.verified,
      status: (reloaded.status ?? currentStatus) as string,
      last_checked_at: reloaded.last_checked_at ?? new Date().toISOString(),
      dns: result.dns,
    }
  }

  const now = new Date().toISOString()
  await payload.update({
    collection: 'domains',
    id: args.domainId,
    data: { last_checked_at: now } as never,
    user: user as never,
    overrideAccess: false,
  })
  return {
    ok: true,
    verified: true,
    status: currentStatus,
    last_checked_at: now,
    dns: {
      ok: true,
      matched: null,
      observed: { cname: [], a: [], txt: [] },
      expected: {
        cname_target: process.env.LEGALOS_CNAME_TARGET ?? null,
        a_target: process.env.LEGALOS_A_TARGET ?? null,
        txt_token_at: `_legalos.${domain.host}`,
      },
    },
  }
}

/* --------------------------------- Promote toggle ------------------------------ */

export async function setPrimary(args: { domainId: number; siteId: number; siteSlug: string }): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  const target = await payload.findByID({ collection: 'domains', id: args.domainId, overrideAccess: true })
  if (!target) return { ok: false, error: 'domain not found' }
  if (target.kind === 'custom' && target.status !== 'active' && target.status !== 'verified') {
    return { ok: false, error: 'domain must be verified before it can be primary' }
  }
  const others = await payload.find({
    collection: 'domains',
    where: { and: [{ site: { equals: args.siteId } }, { primary: { equals: true } }, { id: { not_equals: args.domainId } }] },
    overrideAccess: true,
  })
  for (const d of others.docs) {
    await payload.update({
      collection: 'domains',
      id: d.id,
      data: { primary: false } as never,
      overrideAccess: true,
    })
  }
  await payload.update({
    collection: 'domains',
    id: args.domainId,
    data: { primary: true } as never,
    user: user as never,
    overrideAccess: false,
  })
  invalidateHostCache()
  revalidatePath(`/admin/sites/${args.siteSlug}/settings/domains`)
  return { ok: true }
}

/* --------------------------------- Remove -------------------------------------- */

export async function removeDomain(args: { domainId: number; siteSlug: string }): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  const domain = await payload.findByID({ collection: 'domains', id: args.domainId, overrideAccess: true })
  if (!domain) return { ok: false, error: 'domain not found' }
  if (domain.kind === 'preview') return { ok: false, error: 'preview domain cannot be removed' }
  if (domain.primary) {
    // Promote another domain (preferred: the preview) to primary first.
    const siteId = typeof domain.site === 'object' ? domain.site.id : domain.site
    const others = await payload.find({
      collection: 'domains',
      where: { and: [{ site: { equals: siteId } }, { id: { not_equals: args.domainId } }] },
      sort: 'kind',
      overrideAccess: true,
    })
    const fallback = others.docs.find((d) => d.kind === 'preview') ?? others.docs[0]
    if (fallback) {
      await payload.update({
        collection: 'domains',
        id: fallback.id,
        data: { primary: true } as never,
        overrideAccess: true,
      })
    }
  }
  // If the domain was provisioned in Plesk, unregister it there too. Best effort:
  // if Plesk fails (network, license, etc.) the local row still gets deleted.
  const pleskId = domain.plesk_domain_id
  if (pleskId && pleskIsConfigured()) {
    void unprovisionDomainInPlesk({ pleskDomainId: String(pleskId) }).catch(() => {})
  }
  await payload.delete({ collection: 'domains', id: args.domainId, user: user as never, overrideAccess: false })
  invalidateHostCache()
  revalidatePath(`/admin/sites/${args.siteSlug}/settings/domains`)
  return { ok: true }
}

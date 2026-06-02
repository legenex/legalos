'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { invalidateHostCache } from '@/lib/site-resolver'
import { checkDomainDns } from '@/lib/dns-check'
import { pollDomainSslStatus } from '@/lib/ssl-poll'
import { provisionDomainInPlesk, unprovisionDomainInPlesk, pleskIsConfigured } from '@/lib/plesk/provision-domain'

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
  if (!domain.site) return { ok: false, error: 'domain is unassigned — attach to a brand before verifying' }
  if (domain.kind !== 'custom') return { ok: false, error: 'preview domains do not require verification' }

  // Dev-only escape hatch. Hard-gated on NODE_ENV so a stray LEGALOS_DEV_SKIP_DNS
  // in a production .env can never bypass DNS or optimistically mark a domain.
  const skipAllowed =
    process.env.NODE_ENV !== 'production' &&
    (process.env.LEGALOS_DEV_SKIP_DNS ?? 'false').toLowerCase() === 'true'
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
    if (skipAllowed) {
      // Local dev escape hatch: no Plesk here, but skip-allowed env says
      // "we're in dev, take the optimistic path." DNS already verified above,
      // so accept the domain as active without trying to provision a vhost.
      pleskOk = true
    } else {
      pleskError = 'PLESK_API_URL / PLESK_API_KEY not set — domain marked active but you must add it to Plesk manually'
      pleskOk = false
    }
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
  const localDevShortcut = !pleskIsConfigured() && skipAllowed
  const finalStatus = localDevShortcut ? 'active' : pleskOk ? 'provisioning' : 'error'
  // Never assume SSL. `ssl_status='active'` is reserved for the poller after a
  // real HTTPS handshake (CLAUDE.md hard rule). The dev shortcut has no public
  // app to handshake against and runs no poller, so it stays 'unknown'; the real
  // provisioning path is 'pending' until the poller confirms.
  const finalSslStatus = localDevShortcut ? 'unknown' : 'pending'
  await payload.update({
    collection: 'domains',
    id: args.domainId,
    data: {
      status: finalStatus,
      ssl_status: finalSslStatus,
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
  // Skipped when (a) Plesk failed — no vhost to hit, or (b) we took the local
  // dev shortcut — no public app on this machine for the poller to reach.
  if (pleskOk && !localDevShortcut) {
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

  if (currentStatus === 'provisioning' && domain.site) {
    // The SSL self-check poller is a detached promise that dies on every server
    // restart/deploy, which would otherwise leave the row stuck in
    // 'provisioning' forever (recheck previously only re-drove pending|error).
    // Re-launch it so a manual re-check drives the row to 'active'.
    const siteId = typeof domain.site === 'object' ? domain.site.id : domain.site
    void pollDomainSslStatus({ domainId: args.domainId, host: domain.host, siteId }).catch(() => {})
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
  if (domain.primary && domain.site) {
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

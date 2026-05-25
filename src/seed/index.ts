/**
 * Seed script. Run with: pnpm seed
 *
 * Idempotent: if a record already exists (matched by unique key) it is updated rather than
 * duplicated. Safe to re-run on every deploy.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { TEMPLATE_BODIES } from './templates'
import { SEED_SITES, DEFAULT_LEGAL_PAGES } from './sites'
import { HOME_BLOCKS_BY_SLUG } from './home-blocks'

const log = (msg: string): void => {
  process.stdout.write(`[seed] ${msg}\n`)
}

const upsertTemplate = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  tpl: (typeof TEMPLATE_BODIES)[number],
): Promise<void> => {
  const existing = await payload.find({
    collection: 'shared-legal-templates',
    where: { template_key: { equals: tpl.template_key } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    await payload.update({
      collection: 'shared-legal-templates',
      id: existing.docs[0].id,
      data: {
        body_markdown_with_vars: tpl.body_markdown_with_vars,
        default_meta_title: tpl.default_meta_title,
        default_meta_description: tpl.default_meta_description,
        last_reviewed_at: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    log(`updated template: ${tpl.template_key}`)
  } else {
    await payload.create({
      collection: 'shared-legal-templates',
      data: {
        template_key: tpl.template_key,
        body_markdown_with_vars: tpl.body_markdown_with_vars,
        default_meta_title: tpl.default_meta_title,
        default_meta_description: tpl.default_meta_description,
        last_reviewed_at: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    log(`created template: ${tpl.template_key}`)
  }
}

const ensureSuperAdmin = async (payload: Awaited<ReturnType<typeof getPayload>>) => {
  const email = process.env.SUPER_ADMIN_EMAIL
  const password = process.env.SUPER_ADMIN_PASSWORD
  if (!email || !password) {
    log('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD missing; skipping super admin creation')
    return null
  }
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    log(`super admin already exists: ${email}`)
    return existing.docs[0]
  }
  const user = await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      name: 'LegalOS Super Admin',
      super_admin: true,
      status: 'active',
    },
    overrideAccess: true,
  })
  log(`created super admin: ${email}`)
  return user
}

const upsertSite = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  spec: (typeof SEED_SITES)[number],
): Promise<number> => {
  const existing = await payload.find({
    collection: 'sites',
    where: { slug: { equals: spec.slug } },
    limit: 1,
    overrideAccess: true,
  })
  const data = {
    name: spec.name,
    slug: spec.slug,
    status: 'active' as const,
    vertical: spec.vertical,
    tagline: spec.tagline,
    default_phone: spec.default_phone,
    default_phone_tel: spec.default_phone_tel,
    org_name: spec.org_name,
    support_email: spec.support_email,
    brand: {
      primary: spec.brand.primary,
      accent: spec.brand.accent,
      surface: spec.brand.surface,
      ink: spec.brand.ink,
      muted: '#5C6470',
      success: '#1F9D55',
      warning: '#E8B14B',
      danger: '#C03A2B',
      font_heading: 'Inter',
      font_body: 'Inter',
    },
    default_tone: 'empathetic' as const,
  }
  if (existing.docs[0]) {
    await payload.update({ collection: 'sites', id: existing.docs[0].id, data, overrideAccess: true })
    log(`updated site: ${spec.slug}`)
    return Number(existing.docs[0].id)
  }
  const created = await payload.create({ collection: 'sites', data, overrideAccess: true })
  log(`created site: ${spec.slug}`)
  return Number(created.id)
}

const upsertDomain = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  siteId: number,
  host: string,
  primary: boolean,
  status: 'pending' | 'verified' | 'active',
  kind: 'preview' | 'custom' = 'custom',
) => {
  const normalized = host.toLowerCase().trim()
  const existing = await payload.find({
    collection: 'domains',
    where: { host: { equals: normalized } },
    limit: 1,
    overrideAccess: true,
  })
  const data = { site: siteId, host: normalized, primary, status, kind }
  if (existing.docs[0]) {
    await payload.update({ collection: 'domains', id: existing.docs[0].id, data, overrideAccess: true })
    log(`updated domain: ${normalized}`)
  } else {
    await payload.create({ collection: 'domains', data, overrideAccess: true })
    log(`created domain: ${normalized}`)
  }
}

/**
 * Remove any Domain rows on this Site whose host is NOT in the keep list.
 * Used so the seed can converge on the canonical "one primary URL per Site" state.
 */
const pruneDomainsExcept = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  siteId: number,
  keepHosts: string[],
) => {
  const existing = await payload.find({
    collection: 'domains',
    where: { site: { equals: siteId } },
    limit: 200,
    overrideAccess: true,
  })
  const keep = new Set(keepHosts.map((h) => h.toLowerCase()))
  for (const d of existing.docs) {
    if (!keep.has(d.host.toLowerCase())) {
      await payload.delete({ collection: 'domains', id: d.id, overrideAccess: true })
      log(`pruned domain: ${d.host}`)
    }
  }
}

const upsertPage = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  siteId: number,
  siteSlug: string,
  page: (typeof DEFAULT_LEGAL_PAGES)[number],
) => {
  const existing = await payload.find({
    collection: 'pages',
    where: { and: [{ site: { equals: siteId } }, { slug: { equals: page.slug } }] },
    limit: 1,
    overrideAccess: true,
  })
  // For the home page, attach real body_blocks. Legal pages stay shared-template.
  const isHome = page.slug === '/'
  const homeBlocks = isHome ? HOME_BLOCKS_BY_SLUG[siteSlug] : undefined
  const data: Record<string, unknown> = {
    site: siteId,
    title: page.title,
    slug: page.slug,
    status: 'published' as const,
    template_key: page.template_key,
    uses_shared_template: page.uses_shared_template,
    published_at: new Date().toISOString(),
  }
  if (homeBlocks) data.body_blocks = homeBlocks
  if (existing.docs[0]) {
    await payload.update({ collection: 'pages', id: existing.docs[0].id, data: data as never, overrideAccess: true })
  } else {
    await payload.create({ collection: 'pages', data: data as never, overrideAccess: true })
    log(`created page: ${page.slug}${isHome ? ' (with body_blocks)' : ''}`)
  }
}

const upsertTrackingConfig = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  siteId: number,
) => {
  const existing = await payload.find({
    collection: 'tracking-configs',
    where: { site: { equals: siteId } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) return
  await payload.create({
    collection: 'tracking-configs',
    data: { site: siteId },
    overrideAccess: true,
  })
  log(`created tracking-config for site ${siteId}`)
}

const run = async () => {
  const payload = await getPayload({ config: await config })

  log('seeding shared legal templates...')
  for (const t of TEMPLATE_BODIES) await upsertTemplate(payload, t)

  log('seeding super admin...')
  const superAdmin = await ensureSuperAdmin(payload)

  log('seeding sites...')
  const siteIds: Array<{ slug: string; id: number }> = []
  for (const spec of SEED_SITES) {
    const siteId = await upsertSite(payload, spec)
    siteIds.push({ slug: spec.slug, id: siteId })

    // Each Site gets a preview subdomain (always live, never primary unless no custom)
    // plus its custom primary domain. Custom is primary when verified/active; otherwise
    // the preview subdomain is the primary so the Site has a working URL out of the box.
    const previewBase = process.env.LEGALOS_PREVIEW_DOMAIN ?? 'preview.legenex.com'
    const previewHost = `${spec.slug}.${previewBase}`
    const customIsActive = spec.primary_status === 'active'

    await upsertDomain(payload, siteId, previewHost, !customIsActive, 'active', 'preview')
    await upsertDomain(payload, siteId, spec.primary_host, customIsActive, spec.primary_status, 'custom')
    await pruneDomainsExcept(payload, siteId, [previewHost, spec.primary_host])

    for (const page of DEFAULT_LEGAL_PAGES) await upsertPage(payload, siteId, spec.slug, page)
    await upsertTrackingConfig(payload, siteId)
  }

  if (superAdmin) {
    log('binding super admin to all sites...')
    await payload.update({
      collection: 'users',
      id: superAdmin.id,
      data: {
        siteBindings: siteIds.map((s) => ({ site: s.id, role: 'admin' as const, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString() })),
      },
      overrideAccess: true,
    })
  }

  log('done.')
  process.exit(0)
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed:', err)
  process.exit(1)
})

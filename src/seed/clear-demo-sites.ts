/**
 * One-off cleanup: removes the 3 demo Sites (check-a-case, check-my-claim, claim-checker)
 * and every row that references them. Run with: pnpm tsx src/seed/clear-demo-sites.ts
 *
 * Idempotent. Safe to re-run — if the demos are already gone it's a no-op.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

const DEMO_SLUGS = ['check-a-case', 'check-my-claim', 'claim-checker']

const log = (msg: string): void => {
  process.stdout.write(`[clear-demo-sites] ${msg}\n`)
}

const run = async () => {
  const payload = await getPayload({ config: await config })

  for (const slug of DEMO_SLUGS) {
    const sites = await payload.find({
      collection: 'sites',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
    const site = sites.docs[0]
    if (!site) {
      log(`skip: no Site with slug=${slug}`)
      continue
    }
    const siteId = site.id
    log(`removing Site ${slug} (id=${siteId})`)

    // 1. Prune any user's siteBindings that point at this Site BEFORE deleting it.
    // The users_site_bindings table has NOT NULL on site_id, so the FK's SET-NULL
    // cascade fails; we have to remove those array rows ourselves.
    const usersBoundToSite = await payload.find({
      collection: 'users',
      where: { 'siteBindings.site': { equals: siteId } },
      limit: 500,
      overrideAccess: true,
    })
    for (const u of usersBoundToSite.docs) {
      const bindings = (u.siteBindings ?? []) as Array<{ site: string | number | { id: string | number } }>
      const remaining = bindings.filter((b) => {
        const sid = typeof b.site === 'object' ? b.site.id : b.site
        return String(sid) !== String(siteId)
      })
      await payload.update({
        collection: 'users',
        id: u.id,
        data: { siteBindings: remaining as never },
        overrideAccess: true,
      })
      log(`  unbound user ${u.email} from Site`)
    }

    const dependentCollections = [
      'pages',
      'domains',
      'tracking-configs',
      'numbers',
      'leads',
      'quizzes',
      'landing-pages',
      'blog-posts',
      'audit-log',
    ] as const

    for (const collection of dependentCollections) {
      const res = await payload.delete({
        collection,
        where: { site: { equals: siteId } },
        overrideAccess: true,
      })
      const count = res.docs?.length ?? 0
      if (count > 0) log(`  deleted ${count} ${collection}`)
    }

    await payload.delete({ collection: 'sites', id: siteId, overrideAccess: true })
    log(`  deleted Site ${slug}`)
  }

  log('done.')
  process.exit(0)
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[clear-demo-sites] failed:', err)
  process.exit(1)
})

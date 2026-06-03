import type { CollectionBeforeDeleteHook } from 'payload'

// Collections that carry a `site` relationship. The generated foreign keys are
// all `ON DELETE SET NULL`, but the `required` ones (pages, leads, quizzes,
// landing_pages, blog_posts, numbers, tracking_configs) are NOT NULL columns —
// so Postgres' SET NULL violates the NOT NULL constraint and the whole
// `delete from sites` aborts ("Failed query: delete from sites ..."). Deleting
// the children first means SET NULL has nothing left to touch and the Site
// delete succeeds. Nullable children (domains, media, funnel deployments) are
// removed too so a deleted brand leaves nothing dangling.
//
// NOTE: this also deletes the Site's Leads. A permanently-deleted brand cannot
// keep leads (the column is NOT NULL), so export them first if you need to
// retain lead/consent records for compliance.
const SITE_CHILD_COLLECTIONS = [
  'pages',
  'landing-pages',
  'quizzes',
  'blog-posts',
  'numbers',
  'tracking-configs',
  'leads',
  'media',
  'domains',
  'funnel-advertorial-deployments',
  'funnel-lp-deployments',
  'funnel-quiz-deployments',
] as const

/**
 * beforeDelete hook on the Sites collection: cascade-removes every row that
 * references the Site so the delete doesn't fail the NOT NULL / SET NULL FK
 * conflict. Runs for ALL delete paths (custom admin, raw /cms, REST/local API).
 */
export const cascadeDeleteSiteChildren: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const payload = req.payload

  for (const collection of SITE_CHILD_COLLECTIONS) {
    try {
      await payload.delete({
        // funnel-* slugs aren't in the committed payload-types union yet.
        collection: collection as never,
        where: { site: { equals: id } },
        overrideAccess: true,
        req,
      })
    } catch (err) {
      payload.logger.error({ msg: `site cascade: delete failed for ${collection}`, err })
    }
  }

  // siteBindings is an array relationship (its join-table FK is SET NULL on a
  // nullable column, so it won't block the delete) — but strip the bindings so
  // users aren't left pointing at a Site that no longer exists.
  try {
    const users = await payload.find({
      collection: 'users',
      where: { 'siteBindings.site': { equals: id } },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
      req,
    })
    for (const u of users.docs) {
      const bindings = ((u as { siteBindings?: Array<{ site: unknown; role: string }> }).siteBindings ?? []).filter((b) => {
        const sid = b.site && typeof b.site === 'object' ? (b.site as { id: unknown }).id : b.site
        return Number(sid) !== Number(id)
      })
      await payload.update({
        collection: 'users',
        id: u.id,
        data: { siteBindings: bindings } as never,
        overrideAccess: true,
        req,
      })
    }
  } catch (err) {
    payload.logger.error({ msg: 'site cascade: stripping siteBindings failed', err })
  }
}

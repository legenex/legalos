// @ts-nocheck -- funnel-* collection slugs are not in committed payload-types yet;
// run `pnpm generate:types` on the server to restore typing for this module.
/**
 * One-time auto-seed of the sample funnel content (landing pages, quizzes, and
 * their deployments) so the builders open populated with REAL, editable records
 * the first time they are visited, matching the artifact's out-of-the-box state
 * without a manual `pnpm seed` step.
 *
 * Guarded by the `funnel_samples_seeded` flag on the integration-config global:
 * it runs exactly once, ever. After that, deleting a sample never re-creates it,
 * so the samples behave like any record the user authored.
 *
 * Idempotent and defensive: every create is existence-checked, and the whole
 * routine is wrapped so a failure can never break the page that calls it.
 */
import type { Payload } from 'payload'
import {
  SAMPLE_LANDING_PAGES,
  SAMPLE_LP_DEPLOYMENTS,
  buildSeedSections,
} from '@/components/builder/lp/section-copy'
import { buildSeedQuiz } from '@/components/builder/quiz/seed-data'
import { advBuildSeedAdvertorials } from '@/components/builder/advertorial/seed-data'

const primaryDomainId = async (payload: Payload, siteId: number): Promise<number | null> => {
  const dom = await payload.find({
    collection: 'domains',
    where: { and: [{ site: { equals: siteId } }, { primary: { equals: true } }] },
    limit: 1,
    overrideAccess: true,
  })
  return dom.docs[0] ? Number(dom.docs[0].id) : null
}

let inFlight: Promise<void> | null = null

// Sample landing pages + quizzes (the "base" group, guarded by funnel_samples_seeded).
const seedBase = async (payload: Payload, sites: number[]): Promise<void> => {
  // 1) Sample landing pages (brandless), matched by slug so re-entry is safe.
  const lpIdBySlug: Record<string, number | null> = {}
  for (const spec of SAMPLE_LANDING_PAGES) {
    const existing = await payload.find({
      collection: 'funnel-landing-pages',
      where: { slug: { equals: spec.slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      lpIdBySlug[spec.slug] = Number(existing.docs[0].id)
      continue
    }
    const created = await payload.create({
      collection: 'funnel-landing-pages',
      data: {
        name: spec.name,
        slug: spec.slug,
        template_id: spec.template_id,
        angle: spec.angle,
        is_published: spec.is_published,
        sections: buildSeedSections(),
      },
      overrideAccess: true,
    })
    lpIdBySlug[spec.slug] = Number(created.id)
  }

  // 2) Sample LP deployments, bound to whichever sites exist (by index).
  for (const dep of SAMPLE_LP_DEPLOYMENTS) {
    const lpId = lpIdBySlug[dep.lpSlug] ?? null
    const siteId = sites[Math.min(dep.siteIndex, sites.length - 1)] ?? null
    if (!lpId || siteId == null) continue
    const existing = await payload.find({
      collection: 'funnel-lp-deployments',
      where: { and: [{ landing_page: { equals: lpId } }, { path: { equals: dep.path } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) continue
    await payload.create({
      collection: 'funnel-lp-deployments',
      data: {
        name: dep.name,
        landing_page: lpId,
        site: siteId,
        domain: await primaryDomainId(payload, siteId),
        path: dep.path,
        status: dep.status,
        quiz_deployment_id: '',
      },
      overrideAccess: true,
    })
  }

  // 3) Sample MVA Tiered Quiz, matched by slug.
  let quizId: number | null = null
  const existingQuiz = await payload.find({ collection: 'funnel-quizzes', where: { slug: { equals: 'mva' } }, limit: 1, overrideAccess: true })
  if (existingQuiz.docs[0]) {
    quizId = Number(existingQuiz.docs[0].id)
  } else {
    const q = buildSeedQuiz()
    const created = await payload.create({
      collection: 'funnel-quizzes',
      data: { name: q.name, slug: q.slug, is_published: q.isPublished, tiers: q.tiers, steps: q.steps, nodes: q.nodes, custom_fields: q.customFields },
      overrideAccess: true,
    })
    quizId = Number(created.id)
  }

  // 4) Sample quiz deployment bound to the first site.
  const qSiteId = sites[0] ?? null
  let quizDeploymentId: string | null = null
  if (quizId != null && qSiteId != null) {
    const existingDep = await payload.find({
      collection: 'funnel-quiz-deployments',
      where: { and: [{ quiz: { equals: quizId } }, { path: { equals: '/s/mva' } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (existingDep.docs[0]) {
      quizDeploymentId = String(existingDep.docs[0].id)
    } else {
      const dep = await payload.create({
        collection: 'funnel-quiz-deployments',
        data: {
          name: 'MVA Tiered Quiz',
          quiz: quizId,
          site: qSiteId,
          domain: await primaryDomainId(payload, qSiteId),
          path: '/s/mva',
          render_mode: 'standalone',
          template_id: 'default',
          status: 'live',
          header_config: { logoEnabled: true, ctaButton: { enabled: true, text: 'CLICK HERE TO CALL', url: 'tel:', fontSize: 11 } },
          footer_config: { logoEnabled: true, logoSize: 32, showCopyright: true, fontSize: 12 },
          body_section_overrides: null,
          embed_preview_bg: '#0a1a3a',
          utm: {},
          pixels: {},
        },
        overrideAccess: true,
      })
      quizDeploymentId = String(dep.id)
    }
  }

}

// Sample advertorials (the "advertorial" group, guarded separately).
const seedAdvertorials = async (payload: Payload, sites: number[]): Promise<void> => {
  const brandSiteId = sites[0] ?? null
  const defaultBrandId = brandSiteId != null ? `site_${brandSiteId}` : ''
  let firstAdId: number | null = null
  let firstAdSlug = ''
  for (const a of advBuildSeedAdvertorials()) {
    const existing = await payload.find({ collection: 'funnel-advertorials', where: { slug: { equals: a.slug } }, limit: 1, overrideAccess: true })
    let adId: number
    if (existing.docs[0]) {
      adId = Number(existing.docs[0].id)
    } else {
      const created = await payload.create({
        collection: 'funnel-advertorials',
        data: { title: a.title, slug: a.slug, template_id: a.templateId, default_brand_id: defaultBrandId, status: a.status, sections: a.sections },
        overrideAccess: true,
      })
      adId = Number(created.id)
    }
    if (firstAdId == null) { firstAdId = adId; firstAdSlug = a.slug }
  }

  if (firstAdId != null && brandSiteId != null) {
    // Link the sample deployment to the MVA quiz deployment if one exists.
    const qd = await payload.find({ collection: 'funnel-quiz-deployments', where: { path: { equals: '/s/mva' } }, limit: 1, overrideAccess: true })
    const quizDeploymentId = qd.docs[0] ? String(qd.docs[0].id) : ''
    const path = `/a/${firstAdSlug}`
    const existingAdDep = await payload.find({
      collection: 'funnel-advertorial-deployments',
      where: { and: [{ advertorial: { equals: firstAdId } }, { path: { equals: path } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (!existingAdDep.docs[0]) {
      await payload.create({
        collection: 'funnel-advertorial-deployments',
        data: {
          name: 'Personal Story · sample',
          advertorial: firstAdId,
          site: brandSiteId,
          domain: await primaryDomainId(payload, brandSiteId),
          path,
          quiz_deployment_id: quizDeploymentId,
          cta_mode: 'button',
          status: 'live',
          utm: { source: 'facebook', medium: 'cpc', campaign: 'mva_advertorial' },
          pixels: { metaPixelId: '', tiktokPixelId: '', ga4MeasurementId: '' },
        },
        overrideAccess: true,
      })
    }
  }
}

const seedOnce = async (payload: Payload): Promise<void> => {
  const cfg = await payload.findGlobal({ slug: 'integration-config', overrideAccess: true })
  const needBase = !cfg?.funnel_samples_seeded
  const needAdv = !cfg?.funnel_advertorial_samples_seeded
  if (!needBase && !needAdv) return

  // Brands == Sites. Deployments need a real Site; quizzes/LPs/ads are brandless.
  const sitesRes = await payload.find({ collection: 'sites', limit: 500, sort: 'name', overrideAccess: true })
  const sites = sitesRes.docs.map((s) => Number(s.id))

  if (needBase) await seedBase(payload, sites)
  if (needAdv) await seedAdvertorials(payload, sites)

  // Flip the one-time markers last, so a partial failure retries next load.
  const data: Record<string, unknown> = {}
  if (needBase) data.funnel_samples_seeded = true
  if (needAdv) data.funnel_advertorial_samples_seeded = true
  await payload.updateGlobal({ slug: 'integration-config', data, overrideAccess: true })
}

/**
 * Ensure the sample funnel content exists (runs at most once, ever).
 * Never throws: on error it logs and returns so the calling page still renders.
 * Concurrent callers on a cold first load share a single in-flight run.
 */
export const ensureFunnelSamples = async (payload: Payload): Promise<void> => {
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      await seedOnce(payload)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[funnel-samples] auto-seed failed (page still renders):', err)
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

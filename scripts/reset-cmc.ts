/**
 * Reset Check My Claim site:
 *  1. Update brand tokens to match the real checkmyclaim.co (white surface, dark navy ink, blue accent).
 *  2. DELETE every Page belonging to this Site.
 *  3. CREATE just one Page: slug "/", title "Home", template_key "home".
 *
 * The 'home' template_key triggers the dedicated <CheckMyClaimHome /> React layout
 * (see src/app/(public)/[[...slug]]/page.tsx → RenderPage). body_blocks is left empty
 * — the layout is fully rendered by the component.
 *
 * Run: pnpm tsx scripts/reset-cmc.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const SLUG = 'check-my-claim'

async function main() {
  const payload = await getPayload({ config })

  const sites = await payload.find({
    collection: 'sites',
    where: { slug: { equals: SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  const site = sites.docs[0]
  if (!site) {
    console.error(`Site ${SLUG} not found`)
    process.exit(1)
  }
  console.log(`[reset] Site: ${site.name} (${site.id})`)

  // 1. Brand tokens
  await payload.update({
    collection: 'sites',
    id: site.id,
    data: {
      brand: {
        ...(site.brand ?? {}),
        primary: '#0285E9',
        accent: '#0486E9',
        surface: '#FFFFFF',
        ink: '#111E30',
        muted: '#595E64',
        success: '#16a34a',
        warning: '#E8B14B',
        danger: '#ef4444',
      },
    },
    overrideAccess: true,
  })
  console.log('[reset] Brand tokens updated.')

  // 2. Delete every page on this Site
  const all = await payload.find({
    collection: 'pages',
    where: { site: { equals: site.id } },
    limit: 200,
    overrideAccess: true,
  })
  for (const p of all.docs) {
    await payload.delete({ collection: 'pages', id: p.id, overrideAccess: true })
    console.log(`[reset]   deleted page: ${p.slug} (${p.id})`)
  }
  console.log(`[reset] Deleted ${all.docs.length} pages.`)

  // 3. Create the single Home page
  const home = await payload.create({
    collection: 'pages',
    data: {
      site: site.id,
      title: 'Home',
      slug: '/',
      status: 'published',
      template_key: 'home',
      uses_shared_template: false,
      body_blocks: [],
      meta_title: 'Check My Claim — Free AI-Powered Claim Check',
      meta_description: 'Check your claim, get what you deserve. Free AI-powered eligibility check. Matched with vetted no-win-no-fee attorneys nationwide. Takes less than 2 minutes.',
      published_at: new Date().toISOString(),
    },
    overrideAccess: true,
  })
  console.log(`[reset] Created Home page: ${home.slug} (${home.id})`)
  console.log('[reset] Done.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

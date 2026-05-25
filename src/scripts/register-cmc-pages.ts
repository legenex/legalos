/**
 * Upsert Page records for the 9 hand-built CheckMyClaim custom routes so they
 * appear in the admin Pages list. The actual rendering is handled by the
 * public catch-all router (src/app/(public)/[[...slug]]/page.tsx), which
 * short-circuits these paths to React components BEFORE consulting the Pages
 * collection. These rows exist purely for admin visibility.
 *
 * Run: pnpm tsx src/scripts/register-cmc-pages.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const CMC_SITE_SLUG = 'check-my-claim'

const CMC_CUSTOM_PAGES: Array<{ slug: string; title: string; meta_title: string; meta_description: string }> = [
  { slug: '/Survey', title: 'Survey (Quiz)', meta_title: 'Check My Claim — Free Claim Quiz', meta_description: 'Take the 30-second quiz to see how much your accident claim could be worth.' },
  { slug: '/Submitted', title: 'Submitted (Qualified Lead)', meta_title: 'Thank you — We will call you', meta_description: 'Your claim details have been received. An advisor will call you shortly.' },
  { slug: '/Thanks', title: 'Thanks (DQ Lead)', meta_title: 'Thank you', meta_description: 'Thank you for your interest.' },
  { slug: '/Sorry', title: 'Sorry (Disqualified)', meta_title: 'Sorry — We are unable to help', meta_description: 'Based on your answers, we are unable to assist with your claim.' },
  { slug: '/PartnerList', title: 'Partner List', meta_title: 'Our Partners', meta_description: 'Our affiliated partners and sponsors.' },
  { slug: '/sb-37-list', title: 'SB-37 Participants', meta_title: 'Affiliated Participants', meta_description: 'Affiliated participants for advertising disclosure compliance.' },
  { slug: '/PrivacyPolicy', title: 'Privacy Policy', meta_title: 'Privacy Policy', meta_description: 'Privacy policy for the Check My Claim website.' },
  { slug: '/TermsOfService', title: 'Terms of Service', meta_title: 'Terms of Service', meta_description: 'Terms and conditions for using the Check My Claim website.' },
  { slug: '/AdvertisingDisclosure', title: 'Advertising Disclosure', meta_title: 'Advertising Disclosure', meta_description: 'Legal advertising disclosures, including state-specific disclosures.' },
]

async function main() {
  const payload = await getPayload({ config })

  const sites = await payload.find({
    collection: 'sites',
    where: { slug: { equals: CMC_SITE_SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  const site = sites.docs[0]
  if (!site) {
    console.error(`Site with slug "${CMC_SITE_SLUG}" not found.`)
    process.exit(1)
  }
  const siteId = site.id
  console.log(`Found site: ${site.name} (id=${siteId})`)

  for (const p of CMC_CUSTOM_PAGES) {
    const existing = await payload.find({
      collection: 'pages',
      where: { and: [{ site: { equals: siteId } }, { slug: { equals: p.slug } }] },
      limit: 1,
      overrideAccess: true,
    })

    // Note: title carries a "[code]" prefix so the admin list makes clear these
    // are rendered by React components, not by editable body_blocks.
    const data = {
      site: siteId,
      title: `[code] ${p.title}`,
      slug: p.slug,
      status: 'published' as const,
      template_key: 'custom' as const,
      uses_shared_template: false,
      meta_title: p.meta_title,
      meta_description: p.meta_description,
      published_at: new Date().toISOString(),
    }

    if (existing.docs[0]) {
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data: data as never,
        overrideAccess: true,
      })
      console.log(`updated: ${p.slug}`)
    } else {
      await payload.create({ collection: 'pages', data: data as never, overrideAccess: true })
      console.log(`created: ${p.slug}`)
    }
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

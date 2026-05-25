import { Placeholder } from '@/components/app/Placeholder'
type Props = { params: Promise<{ slug: string }> }
export default async function Page({ params }: Props) {
  const { slug } = await params
  return <Placeholder title="SEO" sub="Site-wide SEO defaults, schema generators, and OG image defaults" deepLink={{ href: `/admin/sites/${slug}/settings/general`, label: 'For now, edit per-page SEO in the Pages list' }} />
}

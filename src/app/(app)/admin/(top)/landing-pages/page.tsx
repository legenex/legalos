import { Rocket } from 'lucide-react'
import { Placeholder } from '@/components/app/Placeholder'

export default function LandingPagesPage() {
  return (
    <Placeholder
      title="Landing Pages"
      sub="All landing pages across every site."
      icon={Rocket}
      deepLink={{ href: '/cms/collections/landing-pages', label: 'Manage landing pages in raw Payload admin' }}
    />
  )
}

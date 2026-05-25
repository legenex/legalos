import { Inbox } from 'lucide-react'
import { Placeholder } from '@/components/app/Placeholder'

export default function LeadsPage() {
  return (
    <Placeholder
      title="Leads"
      sub="Cross-site leads with mandatory site filter."
      icon={Inbox}
      deepLink={{ href: '/cms/collections/leads', label: 'Manage leads in raw Payload admin' }}
    />
  )
}

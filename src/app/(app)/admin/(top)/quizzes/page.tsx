import { HelpCircle } from 'lucide-react'
import { Placeholder } from '@/components/app/Placeholder'

export default function QuizzesPage() {
  return (
    <Placeholder
      title="Quizzes"
      sub="All quizzes across every site."
      icon={HelpCircle}
      deepLink={{ href: '/cms/collections/quizzes', label: 'Manage quizzes in raw Payload admin' }}
    />
  )
}

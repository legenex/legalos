import { Placeholder } from '@/components/app/Placeholder'
export default function Page() {
  return <Placeholder title="Quizzes" sub="All quizzes across every Site" deepLink={{ href: '/cms/collections/quizzes', label: 'Manage quizzes in raw admin' }} />
}

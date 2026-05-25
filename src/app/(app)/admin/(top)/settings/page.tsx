import { Placeholder } from '@/components/app/Placeholder'
export default function Page() {
  return <Placeholder title="Settings" sub="LegalOS-wide settings: SMTP, Slack, GitHub, legal template library" deepLink={{ href: '/cms/globals/integration-config', label: 'Open IntegrationConfig in raw admin' }} />
}

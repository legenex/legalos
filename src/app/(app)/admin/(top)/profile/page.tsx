import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ProfileForm } from './ProfileForm'

export const dynamic = 'force-dynamic'

type UserExtra = {
  avatar_url?: string | null
  bio?: string | null
  title?: string | null
  timezone?: string | null
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirect=/admin/profile')
  const extra = user as unknown as UserExtra

  return (
    <div className="px-10 py-8">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-[24px] font-semibold text-white mb-1">Profile</h1>
        <p className="text-[14px] text-[var(--color-ink-muted)]">
          Your personal account settings. These changes apply only to your own login.
        </p>
      </header>
      <ProfileForm
        initial={{
          name: user.name ?? '',
          email: user.email ?? '',
          avatar_url: extra.avatar_url ?? '',
          bio: extra.bio ?? '',
          title: extra.title ?? '',
          timezone: extra.timezone ?? '',
        }}
      />
    </div>
  )
}

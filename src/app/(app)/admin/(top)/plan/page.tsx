import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { PLAN_AGENTS, PLAN_FINDINGS } from '@/lib/agent-plan/plan'
import { readAllStatus } from '@/lib/agent-plan/store'
import { PlanBoard } from './PlanBoard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PlanPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/sign-in?next=/admin/plan')

  if (!me.super_admin) {
    return (
      <div className="p-10 max-w-[1100px]">
        <header className="mb-6">
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Agent Plan</h1>
          <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">
            Live board of what every review/fix agent is working on.
          </p>
        </header>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-10 text-center card-edge">
          <ShieldAlert className="w-10 h-10 mx-auto text-[var(--color-ink-muted)] mb-3" />
          <h2 className="text-[18px] font-semibold text-white">Super admin only</h2>
          <p className="text-[14px] text-[var(--color-ink-muted)] mt-2">
            The Agent Plan board exposes internal engineering state and requires LegalOS super admin permissions.
          </p>
        </div>
      </div>
    )
  }

  const status = await readAllStatus()

  return (
    <div className="p-10 max-w-[1200px]">
      <PlanBoard agents={PLAN_AGENTS} findings={PLAN_FINDINGS} initialStatus={status} />
    </div>
  )
}

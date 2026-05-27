// Suspense fallback for every (top) admin route. Shown instantly inside <main>
// (the sidebar stays mounted) while the destination page's server work runs.
// A content-shaped skeleton reads as "content arriving" far better than a bare
// spinner, so navigation feels fast. The thin top bar marks that work is in
// flight. There are no real inputs here, so the page is inert while loading.
const SkeletonRow = ({ titleW }: { titleW: string }) => (
  <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4">
    <div className="skeleton h-11 w-11 shrink-0 rounded-lg" />
    <div className="flex-1 space-y-2">
      <div className={`skeleton h-4 ${titleW}`} />
      <div className="skeleton h-3 w-24" />
    </div>
    <div className="skeleton h-8 w-16 rounded-md" />
    <div className="skeleton h-8 w-16 rounded-md" />
  </div>
)

export default function TopLoading() {
  const widths = ['w-1/3', 'w-2/5', 'w-1/4', 'w-1/2', 'w-1/3', 'w-2/5']
  return (
    <div className="relative min-h-screen" aria-busy="true" aria-live="polite">
      <div className="route-bar" />
      <span className="sr-only">Loading</span>
      <div className="route-fade max-w-[1400px] px-10 py-8">
        {/* Page header: title + subtitle + primary action */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="skeleton h-7 w-56" />
            <div className="skeleton h-4 w-80" />
          </div>
          <div className="skeleton h-9 w-32 rounded-md" />
        </div>

        {/* Filter / action row */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="skeleton h-9 w-64 rounded-md" />
          <div className="skeleton h-9 w-36 rounded-md" />
          <div className="skeleton h-9 w-36 rounded-md" />
        </div>

        {/* List of content rows */}
        <div className="space-y-3">
          {widths.map((w, i) => (
            <SkeletonRow key={i} titleW={w} />
          ))}
        </div>
      </div>
    </div>
  )
}

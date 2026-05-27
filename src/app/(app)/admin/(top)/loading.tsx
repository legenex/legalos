// Shown instantly inside <main> (sidebar stays put) while a destination page's
// server work runs — a thin animated top bar plus a soft centered spinner, so
// switching pages reads as "loading" instead of feeling dead.
export default function TopLoading() {
  return (
    <div className="route-bar-host relative min-h-screen">
      <div className="route-bar" />
      <div className="route-fade flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="route-spinner" />
        <div className="text-[13px] tracking-wide text-[var(--color-ink-muted)]">Loading</div>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'

// A `template` (unlike a `layout`) re-mounts on every navigation, so this
// wrapper re-runs its fade-in each time a new admin page renders. That gives
// navigation a sense of life instead of the content snapping in. Opacity-only
// (see globals.css `.route-enter`) so it never creates a containing block that
// would trap the builders' position:fixed modals.
export default function TopTemplate({ children }: { children: ReactNode }) {
  return <div className="route-enter">{children}</div>
}

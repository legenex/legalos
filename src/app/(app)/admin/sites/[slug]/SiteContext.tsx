'use client'

import { createContext, useContext, type ReactNode } from 'react'

type SiteContextValue = {
  id: number
  slug: string
  name: string
  primaryHost: string | null
  primaryStatus: string | null
  livePreviewUrl: string
}

const Ctx = createContext<SiteContextValue | null>(null)

export function SiteContextProvider({ value, children }: { value: SiteContextValue; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSiteCtx(): SiteContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSiteCtx must be used inside <SiteContextProvider>')
  return v
}

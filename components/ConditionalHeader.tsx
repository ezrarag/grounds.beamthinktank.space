'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import type { NGOConfig } from '@/lib/ngoConfig'

// The landing page is a full-screen showcase with no chrome. Every other route
// keeps the global header.
export function ConditionalHeader({ config }: { config: NGOConfig }) {
  const pathname = usePathname()
  if (pathname === '/') return null
  return <AppHeader config={config} />
}
